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
exports.queue = void 0;
exports.pruneRoomJobs = pruneRoomJobs;
// src/lib/queue.ts
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("../../config/env");
const redis = new ioredis_1.default(env_1.envVars.REDIS_URL, {
    maxRetriesPerRequest: null,
});
const QUEUE_NAME = "css-battle-comparison";
exports.queue = new bullmq_1.Queue(QUEUE_NAME, { connection: redis });
// Remove queued jobs for a given roomCode (safe to call when battle ends or a winner detected)
function pruneRoomJobs(roomCode) {
    return __awaiter(this, void 0, void 0, function* () {
        // check common states and remove matching jobs
        const states = [
            "waiting",
            "delayed",
            "active",
            "paused",
        ];
        // fetch jobs in states (returns limited amount by default) - better than nothing
        const jobs = yield exports.queue.getJobs(states, 0, 1000);
        const removals = [];
        for (const job of jobs) {
            try {
                const data = job.data;
                if ((data === null || data === void 0 ? void 0 : data.roomCode) === roomCode) {
                    removals.push(job.remove());
                }
            }
            catch (err) {
                // ignore single-job failures
                console.warn("Failed to inspect/remove job", job.id, err);
            }
        }
        yield Promise.all(removals);
    });
}
