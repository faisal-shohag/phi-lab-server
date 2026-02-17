// src/sockets/battleSocket.ts
import { Server, Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { Emitter } from "@socket.io/redis-emitter";
import { redis } from "../config/redis";
import { pruneRoomJobs, queue } from "./queue/scoring.queue";


const ROOM_PREFIX = "battle:room:";

export const getRoom = async (roomCode: string) => {
  const data = await redis.hgetall(`${ROOM_PREFIX}${roomCode}`);
  if (!data || !data.host) return null;
  return {
    roomCode,
    host: JSON.parse(data.host),
    guest: data.guest ? JSON.parse(data.guest) : null,
    hostSubmission: data.hostSubmission ? JSON.parse(data.hostSubmission) : null,
    guestSubmission: data.guestSubmission ? JSON.parse(data.guestSubmission) : null,
    endTime: data.endTime ? Number(data.endTime) : null,
  };
};

export const deleteRoom = (roomCode: string) => redis.del(`${ROOM_PREFIX}${roomCode}`);

export const battleSocketRedis = (io: Server) => {
  // Use Redis adapter for scaling across instances
  io.adapter(createAdapter(redis, redis.duplicate()));
  const socketEmitter = new Emitter(redis);

  io.on("connection", (socket: Socket) => {
    // create room
    socket.on("battle-create_room", async ({ user, battleNo }, callback) => {
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      await redis.hset(`${ROOM_PREFIX}${roomCode}`, {
        host: JSON.stringify({
          socketId: socket.id,
          id: user.userId,
          name: user.name,
          picture: user.picture,
          battleNo,
          score: user.css.score || 0,
        }),
      });

      socket.join(roomCode);
      callback?.({ roomCode });
    });

    // join room
    socket.on("battle-join_room", async ({ roomCode, user }, callback) => {
      const room = await getRoom(roomCode);
      if (!room) return callback?.({ error: "Room not found" });
      if (room.guest) return callback?.({ error: "Room already full" });

      await redis.hset(`${ROOM_PREFIX}${roomCode}`, {
        guest: JSON.stringify({
          socketId: socket.id,
          id: user.userId,
          name: user.name,
          picture: user.picture,
          battleNo: room.host.battleNo,
          score: user.css.score || 0,
        }),
      });

      socket.join(roomCode);

      // emit current participants
      io.to(roomCode).emit("battle-user_joined", {
        host: room.host,
        guest: {
          id: user.userId,
          name: user.name,
          picture: user.picture,
          battleNo: room.host.battleNo,
          score: user.css.score || 0,
        },
      });

      callback?.({ success: true });
    });

    // submit (enqueues job). Multiple submissions allowed.
    socket.on("battle-send_submission", async ({ roomCode, submission, isHost }, callback) => {
      const room = await getRoom(roomCode);
      if (!room) return callback?.({ error: "Room not found" });

      await queue.add(
        "compare",
        { roomCode, submission, isHost },
        {
          attempts: 3,
          backoff: { type: "exponential", delay: 2000 },
          removeOnComplete: true,
          removeOnFail: false,
        }
      );

      socket.emit("battle-submission_received", { status: "queued" });
      callback?.({ queued: true });
    });

    // start battle
    socket.on("battle-start", async ({ roomCode, matchTime = 5, battleNo }, callback) => {
      const duration = matchTime * 60 * 1000;
      const endTime = Date.now() + duration;

      await redis.hset(`${ROOM_PREFIX}${roomCode}`, {
        endTime: String(endTime),
        matchTime: String(matchTime),
        hostSubmission: JSON.stringify({ matched: 0, renderedURL: "" }),
        guestSubmission: JSON.stringify({ matched: 0, renderedURL: "" }),
      });

      io.to(roomCode).emit("battle-started", { endTime, battleNo });

      const timerKey = `timer:${roomCode}`;
      const interval = setInterval(async () => {
        const timeLeft = Math.max(0, endTime - Date.now());
        socketEmitter.to(roomCode).emit("battle-timer_update", {
          timeRemaining: timeLeft,
          secondsRemaining: Math.ceil(timeLeft / 1000),
        });

        if (timeLeft <= 0) {
          clearInterval(interval);
          await redis.del(timerKey);
          // prune queued jobs so we don't compare submissions after time ended
          await pruneRoomJobs(roomCode);
          await handleBattleEnd(roomCode, socketEmitter);
        }
      }, 1000);

      await redis.set(timerKey, "running");
      callback?.({ started: true, endTime });
    });

    // disconnect handling: determine if host or guest disconnected and finish
    socket.on("disconnect", async () => {
      const keys = await redis.keys(`${ROOM_PREFIX}*`);
      for (const key of keys) {
        const roomCode = key.replace(ROOM_PREFIX, "");
        const room = await getRoom(roomCode);
        if (!room) continue;

        const isHost = room.host?.socketId === socket.id;
        const isGuest = room.guest?.socketId === socket.id;
        if (!isHost && !isGuest) continue;

        const winner = isHost ? room.guest : room.host;
        const loser = isHost ? room.host : room.guest;

        if (winner) {
          socketEmitter.to(roomCode).emit("battle-user_disconnected", {
            disconnectedUser: loser,
            winner,
          });

          socketEmitter.to(roomCode).emit("battle-winner", {
            userId: winner.id,
            isHost: !isHost,
            player: winner,
            matched: 100,
            renderedURL: "",
            reason: "opponent_disconnected",
          });
        }

        // prune pending jobs for the room to avoid further comparisons after disconnection
        await pruneRoomJobs(roomCode);
        await deleteRoom(roomCode);
      }
    });
  });
};

// handleBattleEnd implemented outside so we can reuse it elsewhere (for worker-triggered endings)
async function handleBattleEnd(roomCode: string, emitter: Emitter) {
  const room = await getRoom(roomCode);
  if (!room) return;

  const hostScore = room.hostSubmission?.matched || 0;
  const guestScore = room.guestSubmission?.matched || 0;

  let winner = null;
  let reason = "time_ended";

  if (hostScore > guestScore) winner = room.host;
  else if (guestScore > hostScore) winner = room.guest;
  else reason = "tie";

  emitter.to(roomCode).emit("battle-ended", {
    reason,
    winner,
    hostMatched: hostScore,
    guestMatched: guestScore,
  });

  await deleteRoom(roomCode);
}
