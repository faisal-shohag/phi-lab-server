// src/redis.ts
import { Redis } from "ioredis";
import { envVars } from "./env";
import { createAdapter } from "@socket.io/redis-adapter";
import type { Server } from "socket.io";

export const redis = new Redis({
  host: envVars.REDIS_HOST || "127.0.0.1",
  port: parseInt(envVars.REDIS_PORT || "6379"),
  password: envVars.REDIS_PASSWORD || undefined,
  db: 0,
  // Optional: retry strategy for production
  // retryStrategy: (times) => Math.min(times * 50, 2000),
  maxRetriesPerRequest: null,
});



export const setupRedisAdapter = (io: Server) => {
  const pubClient = redis.duplicate();
  const subClient = pubClient.duplicate();

  io.adapter(createAdapter(pubClient, subClient));
};