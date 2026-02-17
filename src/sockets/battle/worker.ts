import {  Worker, Job, Queue } from "bullmq";
import { MatchingCompare } from "./matchingCompare"; // Keep your existing function
import Redis from "ioredis";
import { Emitter } from "@socket.io/redis-emitter";
import { envVars } from "../../app/config/env";

const ROOM_PREFIX = "battle:room:";
const redis = new Redis(envVars.REDIS_URL as string, {
  maxRetriesPerRequest: null,
});
const deleteRoom = (roomCode: string) =>{ 
  redis.del(`${ROOM_PREFIX}${roomCode}`)
  redis.del(`timer:${roomCode}`)

};

const emitter = new Emitter(redis);
const queue = new Queue("css-battle-comparison", { connection: redis });
if (require.main === module) {
  console.log("Starting CSS Battle Comparison Worker...");

  new Worker(
  "css-battle-comparison",
  async (job: Job) => {
    const { roomCode, submission, isHost } = job.data;
    const roomKey = `${ROOM_PREFIX}${roomCode}`;

    // ⛔ IMPORTANT: Ignore late submissions AFTER battle ends
    const isFinished = await redis.hget(roomKey, "finished");
    if (isFinished === "true") {
      console.log(`Skipping late job for room ${roomCode}`);
      return;
    }

    try {
      const { matched, renderedURL } = await MatchingCompare(
        submission.targetURL,
        submission.code
      );

      const result = {
        matched,
        renderedURL,
        userId: submission.userId,
        isHost,
        isWinner: matched === 100,
      };

      // Save result
      await redis.hset(roomKey,
        isHost ? "hostSubmission" : "guestSubmission",
        JSON.stringify(result)
      );

      // Emit event
      emitter.to(roomCode).emit("battle-receive_submission", {
        sender: submission.userId,
        submission: result,
      });

      // Perfect match
      if (matched === 100) {
        const playerJson = await redis.hget(roomKey, isHost ? "host" : "guest");
        const player = playerJson ? JSON.parse(playerJson) : null;

        emitter.to(roomCode).emit("battle-winner", {
          ...result,
          player,
          reason: "perfect_match",
        });

        // Set finished flag
        await redis.hset(roomKey, "finished", "true");
        await redis.expire(roomKey, 5);
        await deleteRoom(roomCode);
        return;
      }

      return result;
    } catch (error: any) {
      console.error("Job failed:", error);
      throw new Error(`Comparison failed: ${error.message}`);
    }
  },
  {
    connection: redis,
    concurrency: 4,
  }
);






  process.on("SIGTERM", async () => {
    await queue.close();
    process.exit(0);
  });
}



