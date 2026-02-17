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
exports.battleSocketRedis = exports.deleteRoom = exports.getRoom = void 0;
const redis_adapter_1 = require("@socket.io/redis-adapter");
const redis_emitter_1 = require("@socket.io/redis-emitter");
const redis_1 = require("../config/redis");
const scoring_queue_1 = require("./queue/scoring.queue");
const ROOM_PREFIX = "battle:room:";
const getRoom = (roomCode) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield redis_1.redis.hgetall(`${ROOM_PREFIX}${roomCode}`);
    if (!data || !data.host)
        return null;
    return {
        roomCode,
        host: JSON.parse(data.host),
        guest: data.guest ? JSON.parse(data.guest) : null,
        hostSubmission: data.hostSubmission ? JSON.parse(data.hostSubmission) : null,
        guestSubmission: data.guestSubmission ? JSON.parse(data.guestSubmission) : null,
        endTime: data.endTime ? Number(data.endTime) : null,
    };
});
exports.getRoom = getRoom;
const deleteRoom = (roomCode) => redis_1.redis.del(`${ROOM_PREFIX}${roomCode}`);
exports.deleteRoom = deleteRoom;
const battleSocketRedis = (io) => {
    // Use Redis adapter for scaling across instances
    io.adapter((0, redis_adapter_1.createAdapter)(redis_1.redis, redis_1.redis.duplicate()));
    const socketEmitter = new redis_emitter_1.Emitter(redis_1.redis);
    io.on("connection", (socket) => {
        // create room
        socket.on("battle-create_room", (_a, callback_1) => __awaiter(void 0, [_a, callback_1], void 0, function* ({ user, battleNo }, callback) {
            const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            yield redis_1.redis.hset(`${ROOM_PREFIX}${roomCode}`, {
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
            callback === null || callback === void 0 ? void 0 : callback({ roomCode });
        }));
        // join room
        socket.on("battle-join_room", (_a, callback_1) => __awaiter(void 0, [_a, callback_1], void 0, function* ({ roomCode, user }, callback) {
            const room = yield (0, exports.getRoom)(roomCode);
            if (!room)
                return callback === null || callback === void 0 ? void 0 : callback({ error: "Room not found" });
            if (room.guest)
                return callback === null || callback === void 0 ? void 0 : callback({ error: "Room already full" });
            yield redis_1.redis.hset(`${ROOM_PREFIX}${roomCode}`, {
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
            // emit current participants
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
            callback === null || callback === void 0 ? void 0 : callback({ success: true });
        }));
        // submit (enqueues job). Multiple submissions allowed.
        socket.on("battle-send_submission", (_a, callback_1) => __awaiter(void 0, [_a, callback_1], void 0, function* ({ roomCode, submission, isHost }, callback) {
            const room = yield (0, exports.getRoom)(roomCode);
            if (!room)
                return callback === null || callback === void 0 ? void 0 : callback({ error: "Room not found" });
            yield scoring_queue_1.queue.add("compare", { roomCode, submission, isHost }, {
                attempts: 3,
                backoff: { type: "exponential", delay: 2000 },
                removeOnComplete: true,
                removeOnFail: false,
            });
            socket.emit("battle-submission_received", { status: "queued" });
            callback === null || callback === void 0 ? void 0 : callback({ queued: true });
        }));
        // start battle
        socket.on("battle-start", (_a, callback_1) => __awaiter(void 0, [_a, callback_1], void 0, function* ({ roomCode, matchTime = 5, battleNo }, callback) {
            const duration = matchTime * 60 * 1000;
            const endTime = Date.now() + duration;
            yield redis_1.redis.hset(`${ROOM_PREFIX}${roomCode}`, {
                endTime: String(endTime),
                matchTime: String(matchTime),
                hostSubmission: JSON.stringify({ matched: 0, renderedURL: "" }),
                guestSubmission: JSON.stringify({ matched: 0, renderedURL: "" }),
            });
            io.to(roomCode).emit("battle-started", { endTime, battleNo });
            const timerKey = `timer:${roomCode}`;
            const interval = setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
                const timeLeft = Math.max(0, endTime - Date.now());
                socketEmitter.to(roomCode).emit("battle-timer_update", {
                    timeRemaining: timeLeft,
                    secondsRemaining: Math.ceil(timeLeft / 1000),
                });
                if (timeLeft <= 0) {
                    clearInterval(interval);
                    yield redis_1.redis.del(timerKey);
                    // prune queued jobs so we don't compare submissions after time ended
                    yield (0, scoring_queue_1.pruneRoomJobs)(roomCode);
                    yield handleBattleEnd(roomCode, socketEmitter);
                }
            }), 1000);
            yield redis_1.redis.set(timerKey, "running");
            callback === null || callback === void 0 ? void 0 : callback({ started: true, endTime });
        }));
        // disconnect handling: determine if host or guest disconnected and finish
        socket.on("disconnect", () => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            const keys = yield redis_1.redis.keys(`${ROOM_PREFIX}*`);
            for (const key of keys) {
                const roomCode = key.replace(ROOM_PREFIX, "");
                const room = yield (0, exports.getRoom)(roomCode);
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
                // prune pending jobs for the room to avoid further comparisons after disconnection
                yield (0, scoring_queue_1.pruneRoomJobs)(roomCode);
                yield (0, exports.deleteRoom)(roomCode);
            }
        }));
    });
};
exports.battleSocketRedis = battleSocketRedis;
// handleBattleEnd implemented outside so we can reuse it elsewhere (for worker-triggered endings)
function handleBattleEnd(roomCode, emitter) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const room = yield (0, exports.getRoom)(roomCode);
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
        emitter.to(roomCode).emit("battle-ended", {
            reason,
            winner,
            hostMatched: hostScore,
            guestMatched: guestScore,
        });
        yield (0, exports.deleteRoom)(roomCode);
    });
}
