// import { MatchingCompare } from "./battle/matchingCompare";

import { MatchingCompare } from "./battle/matchingCompare";

const rooms = {};

export interface BattleUser {
  name: string;
  picture: string;
  id: string;
}

export interface Submission {
  roomCode: string;
  isHost: boolean;
  submission: {
    userId: string;
    code: string;
    targetURL: string;
  };
}

export const battleSocket = (io, socket) => {
  socket.on("battle-create_room", ({ user, battleNo }, callback) => {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    rooms[roomCode] = {
      host: {
        socketId: socket.id,
        id: user.userId,
        name: user.name,
        picture: user.picture,
        battleNo: battleNo,
        score: user.css.score,
      },
    };

    socket.join(roomCode);
    callback({ roomCode });
  });

  // Join room
  socket.on("battle-join_room", ({ roomCode, user }, callback) => {
    const room = rooms[roomCode];
    if (!room) return callback({ error: "Room not found" });
    if (room?.guest?.id) return callback({ error: "Room already full" });
    socket.join(roomCode);
    room.guest = {
      socketId: socket.id,
      id: user.userId,
      name: user.name,
      picture: user.picture,
      battleNo: room.host.battleNo,
      score: user.css.score,
    };

    io.to(roomCode).emit("battle-user_joined", {
      host: room.host,
      guest: {
        socketId: socket.id,
        id: user.userId,
        name: user.name,
        picture: user.picture,
        battleNo: room.host.battleNo,
        score: user.css.score,
      },
    });

    callback({ success: true });
  });

  // Send submission
  socket.on(
    "battle-send_submission",
    async ({ roomCode, submission, isHost }: Submission) => {
      const room = rooms[roomCode];
      if (!room) return;

      // const {accuracy, renderedURL} = submission

      const { matched, renderedURL } = await MatchingCompare(
        submission.targetURL,
        submission.code
      );

      const result = {
        matched,
        renderedURL,
        userId: submission.userId,
        isHost: isHost,
        player: isHost ? room.host : room.guest,
        isWinner: matched === 100,
      };

      // Store submission in room for time-end comparison
      if (isHost) {
        room.hostSubmission = result;
      } else {
        room.guestSubmission = result;
      }

      // If matched === 100, emit battle winner immediately
      if (matched === 100) {
        io.to(roomCode).emit("battle-winner", {
          ...result,
          reason: "perfect_match",
        });
        // Clear timer when winner found
        if (room.timer) clearTimeout(room.timer);
        if (room.timerInterval) clearInterval(room.timerInterval);
      }

      io.to(roomCode).emit("battle-receive_submission", {
        sender: submission.userId,
        submission: result,
      });
    }
  );

  // Handle user disconnect
  socket.on("disconnect", () => {
    for (const code in rooms) {
      const room = rooms[code];
      if (room.timer) clearTimeout(room.timer);
      if (room.timerInterval) clearInterval(room.timerInterval);

      if (
        room.host?.socketId === socket.id ||
        room.guest?.socketId === socket.id
      ) {
        // Determine winner (the user who didn't disconnect)
        const disconnectedIsHost = room.host?.socketId === socket.id;
        const winner = disconnectedIsHost ? room.guest : room.host;

        // Notify remaining user about disconnection and winner
        if (winner) {
          io.to(code).emit("battle-user_disconnected", {
            disconnectedUser: disconnectedIsHost ? room.host : room.guest,
            winner,
          });

          // Emit winner event
          io.to(code).emit("battle-winner", {
            matched: 100,
            renderedURL: "",
            userId: winner.id,
            isHost: !disconnectedIsHost,
            player: winner,
            isWinner: true,
            reason: "opponent_disconnected",
          });
        }

        Reflect.deleteProperty(rooms, code);
      }
    }
  });

  socket.on("battle-start", ({ roomCode, matchTime = 5, battleNo }) => {
    const room = rooms[roomCode];
    if (!room) return;

    const duration = matchTime * 60 * 1000;
    const endTime = Date.now() + duration;
    room.endTime = endTime;
    room.matchTime = matchTime;
    room.hostSubmission = { matched: 0, renderedURL: "" };
    room.guestSubmission = { matched: 0, renderedURL: "" };

    // Notify clients that battle started
    io.to(roomCode).emit("battle-started", { endTime, battleNo });

    // Send timer updates every second
    const timerInterval = setInterval(() => {
      const timeRemaining = Math.max(0, room.endTime - Date.now());
      const secondsRemaining = Math.ceil(timeRemaining / 1000);

      io.to(roomCode).emit("battle-timer_update", {
        timeRemaining,
        secondsRemaining,
      });

      // Stop timer updates when time runs out
      if (timeRemaining <= 0) {
        clearInterval(timerInterval);
      }
    }, 1000);

    room.timerInterval = timerInterval;

    // Schedule backend-controlled ending
    room.timer = setTimeout(() => {
      clearInterval(timerInterval);

      // Determine winner based on matched percentage
      const hostMatched = room.hostSubmission?.matched || 0;
      const guestMatched = room.guestSubmission?.matched || 0;

      let winner = null;
      let reason = "time_ended";

      if (hostMatched > guestMatched) {
        winner = room.host;
      } else if (guestMatched > hostMatched) {
        winner = room.guest;
      } else {
        // If tied, no winner declared (optional: you can handle ties differently)
        reason = "tie";
      }

      // Emit battle ended with winner
      io.to(roomCode).emit("battle-ended", {
        reason,
        winner,
        hostMatched,
        guestMatched,
      });

      // Delete room after battle ends
      Reflect.deleteProperty(rooms, roomCode);
    }, duration);
  });

  // Handle explicit room cleanup
  socket.on("battle-end_room", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;

    if (room.timer) clearTimeout(room.timer);
    if (room.timerInterval) clearInterval(room.timerInterval);

    Reflect.deleteProperty(rooms, roomCode);
  });
};
