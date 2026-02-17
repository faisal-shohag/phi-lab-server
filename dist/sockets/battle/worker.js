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
const bullmq_1 = require("bullmq");
const matchingCompare_1 = require("./matchingCompare"); // Keep your existing function
const ioredis_1 = __importDefault(require("ioredis"));
const redis_emitter_1 = require("@socket.io/redis-emitter");
const env_1 = require("../../app/config/env");
const ROOM_PREFIX = "battle:room:";
const redis = new ioredis_1.default(env_1.envVars.REDIS_URL, {
    maxRetriesPerRequest: null,
});
const deleteRoom = (roomCode) => {
    redis.del(`${ROOM_PREFIX}${roomCode}`);
    redis.del(`timer:${roomCode}`);
};
const emitter = new redis_emitter_1.Emitter(redis);
const queue = new bullmq_1.Queue("css-battle-comparison", { connection: redis });
if (require.main === module) {
    console.log("Starting CSS Battle Comparison Worker...");
    new bullmq_1.Worker("css-battle-comparison", (job) => __awaiter(void 0, void 0, void 0, function* () {
        const { roomCode, submission, isHost } = job.data;
        const roomKey = `${ROOM_PREFIX}${roomCode}`;
        // ⛔ IMPORTANT: Ignore late submissions AFTER battle ends
        const isFinished = yield redis.hget(roomKey, "finished");
        if (isFinished === "true") {
            console.log(`Skipping late job for room ${roomCode}`);
            return;
        }
        try {
            const { matched, renderedURL } = yield (0, matchingCompare_1.MatchingCompare)(submission.targetURL, submission.code);
            const result = {
                matched,
                renderedURL,
                userId: submission.userId,
                isHost,
                isWinner: matched === 100,
            };
            // Save result
            yield redis.hset(roomKey, isHost ? "hostSubmission" : "guestSubmission", JSON.stringify(result));
            // Emit event
            emitter.to(roomCode).emit("battle-receive_submission", {
                sender: submission.userId,
                submission: result,
            });
            // Perfect match
            if (matched === 100) {
                const playerJson = yield redis.hget(roomKey, isHost ? "host" : "guest");
                const player = playerJson ? JSON.parse(playerJson) : null;
                emitter.to(roomCode).emit("battle-winner", Object.assign(Object.assign({}, result), { player, reason: "perfect_match" }));
                // Set finished flag
                yield redis.hset(roomKey, "finished", "true");
                yield redis.expire(roomKey, 5);
                yield deleteRoom(roomCode);
                return;
            }
            return result;
        }
        catch (error) {
            console.error("Job failed:", error);
            throw new Error(`Comparison failed: ${error.message}`);
        }
    }), {
        connection: redis,
        concurrency: 4,
    });
    process.on("SIGTERM", () => __awaiter(void 0, void 0, void 0, function* () {
        yield queue.close();
        process.exit(0);
    }));
}
