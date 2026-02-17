// src/worker/compareWorker.ts
import { Worker, Job } from "bullmq";
import { Emitter } from "@socket.io/redis-emitter";

import { MatchingCompare } from "../../../sockets/battle/matchingCompare";
import { pruneRoomJobs } from "./scoring.queue";
import { envVars } from "../../config/env";
import Redis from "ioredis";

const redis = new Redis(envVars.REDIS_URL as string, {
  maxRetriesPerRequest: null,
});
const QUEUE_NAME = "css-battle-comparison";
const ROOM_PREFIX = "battle:room:";

const emitter = new Emitter(redis);

function startWorker() {
  console.log("Starting CSS Battle Comparison Worker...");

  const worker = new Worker(
    QUEUE_NAME,
    async (job: Job) => {
      const { roomCode, submission, isHost } = job.data as {
        roomCode: string;
        submission: any;
        isHost: boolean;
      };

      try {
        const { matched, renderedURL } = await MatchingCompare(submission.targetURL, submission.code);

        const result = {
          matched,
          renderedURL,
          userId: submission.userId,
          isHost,
          isWinner: matched === 100,
        };

        // Save to Redis so the socket server can read aggregated result
        await redis.hset(
          `${ROOM_PREFIX}${roomCode}`,
          isHost ? "hostSubmission" : "guestSubmission",
          JSON.stringify(result)
        );

        // Broadcast result to participants
        emitter.to(roomCode).emit("battle-receive_submission", {
          sender: submission.userId,
          submission: result,
        });

        if (matched === 100) {
          // instant perfect match -> announce winner and prune pending jobs
          const playerJson = await redis.hget(`${ROOM_PREFIX}${roomCode}`, isHost ? "host" : "guest");
          const player = playerJson ? JSON.parse(playerJson) : null;

          emitter.to(roomCode).emit("battle-winner", {
            ...result,
            player,
            reason: "perfect_match",
          });

          // Optional: remove any pending jobs for this room (others' submissions)
          await pruneRoomJobs(roomCode);
        }

        return result;
      } catch (err: any) {
        console.error("Comparison job failed:", err);
        // rethrow to allow attempts/backoff defined when adding job
        throw err;
      }
    },
    {
      connection: redis,
      concurrency: 4,
    }
  );

  const shutdown = async () => {
    console.log("Shutting down worker...");
    await worker.close();
    await redis.quit();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  worker.on("failed", (job, err) => {
    console.warn("Job failed:", job?.id, err?.message || err);
  });

  worker.on("completed", (job) => {
    // optional: log
    console.log("Job completed:", job.id);
  });

  return worker;
}

// If run directly (node dist/worker/compareWorker.js) start the worker
if (require.main === module) {
  startWorker();
}

// export for programmatic start (if you want to start inside a process)
export { startWorker };
