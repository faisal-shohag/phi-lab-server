// src/lib/queue.ts
import { Queue } from "bullmq";
import Redis from "ioredis";
import { envVars } from "../../config/env";

const redis = new Redis(envVars.REDIS_URL as string, {
  maxRetriesPerRequest: null,
});
const QUEUE_NAME = "css-battle-comparison";

export const queue = new Queue(QUEUE_NAME, { connection: redis });

// Remove queued jobs for a given roomCode (safe to call when battle ends or a winner detected)
export async function pruneRoomJobs(roomCode: string) {
  // check common states and remove matching jobs
  const states = [
    "waiting",
    "delayed",
    "active",
    "paused",
  ];

  // fetch jobs in states (returns limited amount by default) - better than nothing
  const jobs = await queue.getJobs(states as any, 0, 1000);
  const removals: Promise<void>[] = [];

  for (const job of jobs) {
    try {
      const data = job.data as any;
      if (data?.roomCode === roomCode) {
        removals.push(job.remove());
      }
    } catch (err) {
      // ignore single-job failures
      console.warn("Failed to inspect/remove job", job.id, err);
    }
  }

  await Promise.all(removals);
}
