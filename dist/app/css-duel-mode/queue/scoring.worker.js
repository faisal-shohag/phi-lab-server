"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startWorker = startWorker;
// src/worker/compareWorker.ts
const bullmq_1 = require("bullmq");
const redis_emitter_1 = require("@socket.io/redis-emitter");
const matchingCompare_1 = require("../../../sockets/battle/matchingCompare");
const scoring_queue_1 = require("./scoring.queue");
const env_1 = require("../../config/env");
const ioredis_1 = __importDefault(require("ioredis"));
const redis = new ioredis_1.default(env_1.envVars.REDIS_URL, {
    maxRetriesPerRequest: null,
});
const QUEUE_NAME = "css-battle-comparison";
const ROOM_PREFIX = "battle:room:";
const emitter = new redis_emitter_1.Emitter(redis);
function startWorker() {
    console.log("Starting CSS Battle Comparison Worker...");
    const worker = new bullmq_1.Worker(QUEUE_NAME, (job) => __awaiter(this, void 0, void 0, function* () {
        const { roomCode, submission, isHost } = job.data;
        try {
            const { matched, renderedURL } = yield (0, matchingCompare_1.MatchingCompare)(submission.targetURL, submission.code);
            const result = {
                matched,
                renderedURL,
                userId: submission.userId,
                isHost,
                isWinner: matched === 100,
            };
            // Save to Redis so the socket server can read aggregated result
            yield redis.hset(`${ROOM_PREFIX}${roomCode}`, isHost ? "hostSubmission" : "guestSubmission", JSON.stringify(result));
            // Broadcast result to participants
            emitter.to(roomCode).emit("battle-receive_submission", {
                sender: submission.userId,
                submission: result,
            });
            if (matched === 100) {
                // instant perfect match -> announce winner and prune pending jobs
                const playerJson = yield redis.hget(`${ROOM_PREFIX}${roomCode}`, isHost ? "host" : "guest");
                const player = playerJson ? JSON.parse(playerJson) : null;
                emitter.to(roomCode).emit("battle-winner", Object.assign(Object.assign({}, result), { player, reason: "perfect_match" }));
                // Optional: remove any pending jobs for this room (others' submissions)
                yield (0, scoring_queue_1.pruneRoomJobs)(roomCode);
            }
            return result;
        }
        catch (err) {
            console.error("Comparison job failed:", err);
            // rethrow to allow attempts/backoff defined when adding job
            throw err;
        }
    }), {
        connection: redis,
        concurrency: 4,
    });
    const shutdown = () => __awaiter(this, void 0, void 0, function* () {
        console.log("Shutting down worker...");
        yield worker.close();
        yield redis.quit();
        process.exit(0);
    });
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
    worker.on("failed", (job, err) => {
        console.warn("Job failed:", job === null || job === void 0 ? void 0 : job.id, (err === null || err === void 0 ? void 0 : err.message) || err);
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
