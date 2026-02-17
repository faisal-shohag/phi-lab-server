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
Object.defineProperty(exports, "__esModule", { value: true });
exports.battleSocketRedis = void 0;
const redis_adapter_1 = require("@socket.io/redis-adapter");
const redis_emitter_1 = require("@socket.io/redis-emitter");
const ioredis_1 = require("ioredis");
const bullmq_1 = require("bullmq");
// ============================
// Redis Setup
// ============================
const redis = new ioredis_1.Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
});
const queue = new bullmq_1.Queue("css-battle-comparison", { connection: redis });
const socketEmitter = new redis_emitter_1.Emitter(redis);
const ROOM_PREFIX = "battle:room:";
// Helper: Room management via Redis
const getRoom = (roomCode) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield redis.hgetall(`${ROOM_PREFIX}${roomCode}`);
    if (!data.host)
        return null;
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
});
const deleteRoom = (roomCode) => {
    redis.del(`${ROOM_PREFIX}${roomCode}`);
    redis.del(`timer:${roomCode}`);
};
// ============================
// Socket.IO Handler (Scalable)
// ============================
const battleSocketRedis = (io, socket) => {
    // Use Redis Adapter (required for multi-instance)
    io.adapter((0, redis_adapter_1.createAdapter)(redis, redis.duplicate()));
    socket.on("battle-create_room", (_a, callback_1) => __awaiter(void 0, [_a, callback_1], void 0, function* ({ user, battleNo }, callback) {
        const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        yield redis.hset(`${ROOM_PREFIX}${roomCode}`, {
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
    }));
    socket.on("battle-join_room", (_a, callback_1) => __awaiter(void 0, [_a, callback_1], void 0, function* ({ roomCode, user }, callback) {
        const room = yield getRoom(roomCode);
        if (!room)
            return callback({ error: "Room not found" });
        if (room.guest)
            return callback({ error: "Room already full" });
        yield redis.hset(`${ROOM_PREFIX}${roomCode}`, {
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
    }));
    socket.on("battle-send_submission", (_a) => __awaiter(void 0, [_a], void 0, function* ({ roomCode, submission, isHost }) {
        const room = yield getRoom(roomCode);
        if (!room)
            return;
        // Offload heavy screenshot + comparison to BullMQ
        yield queue.add("compare", { roomCode, submission, isHost }, {
            attempts: 3,
            backoff: { type: "exponential", delay: 2000 },
            removeOnComplete: true,
            removeOnFail: false,
        });
        socket.emit("battle-submission_received", { status: "queued" });
    }));
    socket.on("battle-start", (_a) => __awaiter(void 0, [_a], void 0, function* ({ roomCode, matchTime = 5, battleNo }) {
        const duration = matchTime * 60 * 1000;
        const endTime = Date.now() + duration;
        yield redis.hset(`${ROOM_PREFIX}${roomCode}`, {
            endTime,
            matchTime,
            hostSubmission: JSON.stringify({ matched: 0, renderedURL: "" }),
            guestSubmission: JSON.stringify({ matched: 0, renderedURL: "" }),
        });
        io.to(roomCode).emit("battle-started", { endTime, battleNo });
        // Timer broadcast every second
        const timerKey = `timer:${roomCode}`;
        const interval = setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
            const timeLeft = Math.max(0, endTime - Date.now());
            socketEmitter.to(roomCode).emit("battle-timer_update", {
                timeRemaining: timeLeft,
                secondsRemaining: Math.ceil(timeLeft / 1000),
            });
            if (timeLeft <= 0) {
                clearInterval(interval);
                yield handleBattleEnd(roomCode);
            }
        }), 1000);
        redis.set(timerKey, "running");
    }));
    socket.on("disconnect", () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const keys = yield redis.keys(`${ROOM_PREFIX}*`);
        for (const key of keys) {
            const roomCode = key.replace(ROOM_PREFIX, "");
            const room = yield getRoom(roomCode);
            if (!room)
                continue;
            const isHost = ((_a = room.host) === null || _a === void 0 ? void 0 : _a.socketId) === socket.id;
            const isGuest = ((_b = room.guest) === null || _b === void 0 ? void 0 : _b.socketId) === socket.id;
            if (!isHost && !isGuest)
                continue;
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
            yield deleteRoom(roomCode);
        }
    }));
};
exports.battleSocketRedis = battleSocketRedis;
// ============================
// Battle End Handler
// ============================
function handleBattleEnd(roomCode) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const room = yield getRoom(roomCode);
        if (!room)
            return;
        const hostScore = ((_a = room.hostSubmission) === null || _a === void 0 ? void 0 : _a.matched) || 0;
        const guestScore = ((_b = room.guestSubmission) === null || _b === void 0 ? void 0 : _b.matched) || 0;
        let winner = null;
        let reason = "time_ended";
        if (hostScore > guestScore)
            winner = room.host;
        else if (guestScore > hostScore)
            winner = room.guest;
        else
            reason = "tie";
        socketEmitter.to(roomCode).emit("battle-ended", {
            reason,
            winner,
            hostMatched: hostScore,
            guestMatched: guestScore,
        });
        yield deleteRoom(roomCode);
    });
}
