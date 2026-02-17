"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRedisAdapter = exports.redis = void 0;
// src/redis.ts
const ioredis_1 = require("ioredis");
const env_1 = require("./env");
const redis_adapter_1 = require("@socket.io/redis-adapter");
exports.redis = new ioredis_1.Redis({
    host: env_1.envVars.REDIS_HOST || "127.0.0.1",
    port: parseInt(env_1.envVars.REDIS_PORT || "6379"),
    password: env_1.envVars.REDIS_PASSWORD || undefined,
    db: 0,
    // Optional: retry strategy for production
    // retryStrategy: (times) => Math.min(times * 50, 2000),
    maxRetriesPerRequest: null,
});
const setupRedisAdapter = (io) => {
    const pubClient = exports.redis.duplicate();
    const subClient = pubClient.duplicate();
    io.adapter((0, redis_adapter_1.createAdapter)(pubClient, subClient));
};
exports.setupRedisAdapter = setupRedisAdapter;
