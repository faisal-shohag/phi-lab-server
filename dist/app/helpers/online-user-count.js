"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onlineUserCount = void 0;
const onlineUsers = new Map();
const broadcastOnlineCount = (io) => {
    const count = onlineUsers.size;
    io.emit("onlineUsersCount", { count });
};
const onlineUserCount = (io, socket) => {
    var _a;
    const userId = (_a = socket.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
    }
    const userSockets = onlineUsers.get(userId);
    if (userSockets) {
        userSockets.add(socket.id);
    }
    // console.log(`User ${userId} connected (socket: ${socket.id}). Total online: ${onlineUsers.size}`);
    broadcastOnlineCount(io);
    socket.on("disconnect", () => {
        const userSet = onlineUsers.get(userId);
        if (userSet) {
            userSet.delete(socket.id);
            if (userSet.size === 0) {
                onlineUsers.delete(userId);
            }
        }
        // console.log(`User ${userId} disconnected (socket: ${socket.id}). Reason: ${reason}. Remaining online: ${onlineUsers.size}`);
        broadcastOnlineCount(io);
    });
};
exports.onlineUserCount = onlineUserCount;
