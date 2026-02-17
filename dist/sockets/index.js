"use strict";
// import { MatchingCompare } from "./battle/matchingCompare";
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
exports.battleSocket = void 0;
const matchingCompare_1 = require("./battle/matchingCompare");
const rooms = {};
const battleSocket = (io, socket) => {
    socket.on("battle-create_room", ({ user, battleNo }, callback) => {
        const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        rooms[roomCode] = {
            host: {
                socketId: socket.id,
                id: user.userId,
                name: user.name,
                picture: user.picture,
                battleNo: battleNo,
                score: user.css.score,
            },
        };
        socket.join(roomCode);
        callback({ roomCode });
    });
    // Join room
    socket.on("battle-join_room", ({ roomCode, user }, callback) => {
        var _a;
        const room = rooms[roomCode];
        if (!room)
            return callback({ error: "Room not found" });
        if ((_a = room === null || room === void 0 ? void 0 : room.guest) === null || _a === void 0 ? void 0 : _a.id)
            return callback({ error: "Room already full" });
        socket.join(roomCode);
        room.guest = {
            socketId: socket.id,
            id: user.userId,
            name: user.name,
            picture: user.picture,
            battleNo: room.host.battleNo,
            score: user.css.score,
        };
        io.to(roomCode).emit("battle-user_joined", {
            host: room.host,
            guest: {
                socketId: socket.id,
                id: user.userId,
                name: user.name,
                picture: user.picture,
                battleNo: room.host.battleNo,
                score: user.css.score,
            },
        });
        callback({ success: true });
    });
    // Send submission
    socket.on("battle-send_submission", (_a) => __awaiter(void 0, [_a], void 0, function* ({ roomCode, submission, isHost }) {
        const room = rooms[roomCode];
        if (!room)
            return;
        // const {accuracy, renderedURL} = submission
        const { matched, renderedURL } = yield (0, matchingCompare_1.MatchingCompare)(submission.targetURL, submission.code);
        const result = {
            matched,
            renderedURL,
            userId: submission.userId,
            isHost: isHost,
            player: isHost ? room.host : room.guest,
            isWinner: matched === 100,
        };
        // Store submission in room for time-end comparison
        if (isHost) {
            room.hostSubmission = result;
        }
        else {
            room.guestSubmission = result;
        }
        // If matched === 100, emit battle winner immediately
        if (matched === 100) {
            io.to(roomCode).emit("battle-winner", Object.assign(Object.assign({}, result), { reason: "perfect_match" }));
            // Clear timer when winner found
            if (room.timer)
                clearTimeout(room.timer);
            if (room.timerInterval)
                clearInterval(room.timerInterval);
        }
        io.to(roomCode).emit("battle-receive_submission", {
            sender: submission.userId,
            submission: result,
        });
    }));
    // Handle user disconnect
    socket.on("disconnect", () => {
        var _a, _b, _c;
        for (const code in rooms) {
            const room = rooms[code];
            if (room.timer)
                clearTimeout(room.timer);
            if (room.timerInterval)
                clearInterval(room.timerInterval);
            if (((_a = room.host) === null || _a === void 0 ? void 0 : _a.socketId) === socket.id ||
                ((_b = room.guest) === null || _b === void 0 ? void 0 : _b.socketId) === socket.id) {
                // Determine winner (the user who didn't disconnect)
                const disconnectedIsHost = ((_c = room.host) === null || _c === void 0 ? void 0 : _c.socketId) === socket.id;
                const winner = disconnectedIsHost ? room.guest : room.host;
                // Notify remaining user about disconnection and winner
                if (winner) {
                    io.to(code).emit("battle-user_disconnected", {
                        disconnectedUser: disconnectedIsHost ? room.host : room.guest,
                        winner,
                    });
                    // Emit winner event
                    io.to(code).emit("battle-winner", {
                        matched: 100,
                        renderedURL: "",
                        userId: winner.id,
                        isHost: !disconnectedIsHost,
                        player: winner,
                        isWinner: true,
                        reason: "opponent_disconnected",
                    });
                }
                Reflect.deleteProperty(rooms, code);
            }
        }
    });
    socket.on("battle-start", ({ roomCode, matchTime = 5, battleNo }) => {
        const room = rooms[roomCode];
        if (!room)
            return;
        const duration = matchTime * 60 * 1000;
        const endTime = Date.now() + duration;
        room.endTime = endTime;
        room.matchTime = matchTime;
        room.hostSubmission = { matched: 0, renderedURL: "" };
        room.guestSubmission = { matched: 0, renderedURL: "" };
        // Notify clients that battle started
        io.to(roomCode).emit("battle-started", { endTime, battleNo });
        // Send timer updates every second
        const timerInterval = setInterval(() => {
            const timeRemaining = Math.max(0, room.endTime - Date.now());
            const secondsRemaining = Math.ceil(timeRemaining / 1000);
            io.to(roomCode).emit("battle-timer_update", {
                timeRemaining,
                secondsRemaining,
            });
            // Stop timer updates when time runs out
            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
            }
        }, 1000);
        room.timerInterval = timerInterval;
        // Schedule backend-controlled ending
        room.timer = setTimeout(() => {
            var _a, _b;
            clearInterval(timerInterval);
            // Determine winner based on matched percentage
            const hostMatched = ((_a = room.hostSubmission) === null || _a === void 0 ? void 0 : _a.matched) || 0;
            const guestMatched = ((_b = room.guestSubmission) === null || _b === void 0 ? void 0 : _b.matched) || 0;
            let winner = null;
            let reason = "time_ended";
            if (hostMatched > guestMatched) {
                winner = room.host;
            }
            else if (guestMatched > hostMatched) {
                winner = room.guest;
            }
            else {
                // If tied, no winner declared (optional: you can handle ties differently)
                reason = "tie";
            }
            // Emit battle ended with winner
            io.to(roomCode).emit("battle-ended", {
                reason,
                winner,
                hostMatched,
                guestMatched,
            });
            // Delete room after battle ends
            Reflect.deleteProperty(rooms, roomCode);
        }, duration);
    });
    // Handle explicit room cleanup
    socket.on("battle-end_room", ({ roomCode }) => {
        const room = rooms[roomCode];
        if (!room)
            return;
        if (room.timer)
            clearTimeout(room.timer);
        if (room.timerInterval)
            clearInterval(room.timerInterval);
        Reflect.deleteProperty(rooms, roomCode);
    });
};
exports.battleSocket = battleSocket;
