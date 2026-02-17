"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
const http_1 = require("http");
const app_1 = __importDefault(require("./app"));
const env_1 = require("./app/config/env");
const socket_io_1 = require("socket.io");
const sockets_1 = require("./sockets");
// import { authenticateSocket } from "./app/middlewares/authenticate-socket";
// import { onlineUserCount } from "./app/helpers/online-user-count";
let server;
let io;
const startServer = () => {
    try {
        server = (0, http_1.createServer)(app_1.default);
        io = new socket_io_1.Server(server, {
            cors: {
                origin: "*",
                // credentials: true,
                methods: ["GET", "POST"],
            },
        });
        // authenticateSocket(io)
        io.on("connection", (socket) => {
            // onlineUserCount(io,socket)
            (0, sockets_1.battleSocket)(io, socket);
        });
        server.listen(env_1.envVars.PORT, () => {
            console.log(`Server started on port ${env_1.envVars.PORT}`);
        });
    }
    catch (error) {
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
