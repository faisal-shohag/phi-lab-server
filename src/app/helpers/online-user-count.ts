
const  onlineUsers = new Map<string, Set<string>>();

const broadcastOnlineCount = (io) => {
  const count = onlineUsers.size; 
  io.emit("onlineUsersCount", { count });
};

export const  onlineUserCount = (io, socket) => {
    const userId = (socket as any).user?.id;
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

}