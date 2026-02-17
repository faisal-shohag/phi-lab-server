"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateSocket = void 0;
const auth_service_1 = require("../api/auth/auth.service");
const app_error_1 = __importDefault(require("../helpers/app-error"));
const authenticateSocket = (io) => {
    io.use((socket, next) => {
        var _a, _b;
        const token = (_b = (_a = socket.handshake.headers.cookie) === null || _a === void 0 ? void 0 : _a.split(";").find((c) => c.trim().startsWith("lab_token="))) === null || _b === void 0 ? void 0 : _b.split("=")[1];
        if (!token) {
            return next(new app_error_1.default(401, "No token provided"));
        }
        try {
            const payload = (0, auth_service_1.verifyAccessToken)(token);
            // Attach user to socket for use in battleSocket
            socket.user = payload;
            // Optional: check role if needed globally
            // if (!authRoles.includes(payload.role)) {
            //   return next(new AppError(403, "Forbidden"));
            // }
            next();
        }
        catch (error) {
            console.log(error);
            next(new app_error_1.default(401, "Invalid or expired token"));
        }
    });
};
exports.authenticateSocket = authenticateSocket;
