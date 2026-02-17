/* eslint-disable no-console */
import { createServer, Server as HttpServer } from "http";
import app from "./app";
import { envVars } from "./app/config/env";
import { Server as SocketIOServer } from "socket.io";
import { battleSocket } from "./sockets";
// import { authenticateSocket } from "./app/middlewares/authenticate-socket";
// import { onlineUserCount } from "./app/helpers/online-user-count";
let server: HttpServer;
let io: SocketIOServer;

const startServer = () => {
  try {
    server = createServer(app);
    io = new SocketIOServer(server, {
      cors: {
        origin: "*",
        // credentials: true,
        methods: ["GET", "POST"],
      },
    });
      // authenticateSocket(io)

    io.on("connection", (socket: any) => {
      // onlineUserCount(io,socket)
      battleSocket(io, socket);
    });

    server.listen(envVars.PORT, () => {
      console.log(`Server started on port ${envVars.PORT}`);
    });
  } catch (error) {
    console.log(error);
  }
};

startServer();

/* -------------------------------------------
   Handle shutdown & crashes
-------------------------------------------- */

process.on("SIGTERM", () => {
  console.log("SIGTERM received — shutting down...");

  if (server) {
    server.close(() => process.exit(1));
  }
});

process.on("SIGINT", () => {
  console.log("SIGINT received — shutting down...");

  if (server) {
    server.close(() => process.exit(1));
  }
});

process.on("unhandledRejection", (err) => {
  console.log("Unhandled Rejection — shutting down...", err);

  if (server) {
    server.close(() => process.exit(1));
  }
});

process.on("uncaughtException", (err) => {
  console.log("Uncaught Exception — shutting down...", err);

  if (server) {
    server.close(() => process.exit(1));
  }
});

// Unhandler rejection error
// Promise.reject(new Error("I forgot to catch this promise"))

// Uncaught Exception Error
// throw new Error("I forgot to handle this local erro")

/**
 * unhandled rejection error
 * uncaught rejection error
 * signal termination sigterm
 */

// async function main() {
//   await prisma.$executeRawUnsafe(`
//     CREATE INDEX IF NOT EXISTS idx_battle_sub_user ON "BattleSubmission"("userId");
//   `);
// }

// main().finally(() => prisma.$disconnect());
