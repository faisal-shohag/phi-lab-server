// battleSocketProduction.ts
import { Server, Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { Emitter } from "@socket.io/redis-emitter";
import { Redis } from "ioredis";
import { Queue } from "bullmq";


// ============================
// Redis Setup
// ============================
const redis = new Redis(process.env.REDIS_URL as string, {
  maxRetriesPerRequest: null,
});

const queue = new Queue("css-battle-comparison", { connection: redis });

const socketEmitter = new Emitter(redis);

const ROOM_PREFIX = "battle:room:";

// Helper: Room management via Redis
const getRoom = async (roomCode: string) => {
  const data = await redis.hgetall(`${ROOM_PREFIX}${roomCode}`);
  if (!data.host) return null;
  return {
    roomCode,
    host: JSON.parse(data.host || "{}"),
    guest: data.guest ? JSON.parse(data.guest) : null,
    hostSubmission: data.hostSubmission
      ? JSON.parse(data.hostSubmission)
      : null,
    guestSubmission: data.guestSubmission
      ? JSON.parse(data.guestSubmission)
      : null,
    endTime: data.endTime ? Number(data.endTime) : null,
  };
};

const deleteRoom = (roomCode: string) =>{ 
  redis.del(`${ROOM_PREFIX}${roomCode}`)
   redis.del(`timer:${roomCode}`);
};

// ============================
// Socket.IO Handler (Scalable)
// ============================
export const battleSocketRedis = (io: Server, socket: Socket) => {
  // Use Redis Adapter (required for multi-instance)
  io.adapter(createAdapter(redis, redis.duplicate()));

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
    callback({ roomCode });
  });

  socket.on("battle-join_room", async ({ roomCode, user }, callback) => {
    const room = await getRoom(roomCode);
    if (!room) return callback({ error: "Room not found" });
    if (room.guest) return callback({ error: "Room already full" });

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

    callback({ success: true });
  });

  socket.on(
    "battle-send_submission",
    async ({ roomCode, submission, isHost }) => {
      const room = await getRoom(roomCode);
      if (!room) return;

      // Offload heavy screenshot + comparison to BullMQ
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
    }
  );

  socket.on("battle-start", async ({ roomCode, matchTime = 5, battleNo }) => {
    const duration = matchTime * 60 * 1000;
    const endTime = Date.now() + duration;

    await redis.hset(`${ROOM_PREFIX}${roomCode}`, {
      endTime,
      matchTime,
      hostSubmission: JSON.stringify({ matched: 0, renderedURL: "" }),
      guestSubmission: JSON.stringify({ matched: 0, renderedURL: "" }),
    });

    io.to(roomCode).emit("battle-started", { endTime, battleNo });

    // Timer broadcast every second
    const timerKey = `timer:${roomCode}`;
    const interval = setInterval(async () => {
      const timeLeft = Math.max(0, endTime - Date.now());
      socketEmitter.to(roomCode).emit("battle-timer_update", {
        timeRemaining: timeLeft,
        secondsRemaining: Math.ceil(timeLeft / 1000),
      });

      if (timeLeft <= 0) {
        clearInterval(interval);
        await handleBattleEnd(roomCode);
      }
    }, 1000);

    redis.set(timerKey, "running");
  });

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

      await deleteRoom(roomCode);
    }
  });
};

// ============================
// Battle End Handler
// ============================
async function handleBattleEnd(roomCode: string) {
  const room = await getRoom(roomCode);
  if (!room) return;

  const hostScore = room.hostSubmission?.matched || 0;
  const guestScore = room.guestSubmission?.matched || 0;

  let winner = null;
  let reason = "time_ended";

  if (hostScore > guestScore) winner = room.host;
  else if (guestScore > hostScore) winner = room.guest;
  else reason = "tie";

  socketEmitter.to(roomCode).emit("battle-ended", {
    reason,
    winner,
    hostMatched: hostScore,
    guestMatched: guestScore,
  });

  await deleteRoom(roomCode);
}
