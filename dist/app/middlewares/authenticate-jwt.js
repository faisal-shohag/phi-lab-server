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
exports.authenticateJWT = void 0;
// import jwt from "jsonwebtoken";
// import { envVars } from "../config/env";
const auth_service_1 = require("../api/auth/auth.service");
const app_error_1 = __importDefault(require("../helpers/app-error"));
// import { AuthRequest } from "../utils/extends";
// export const  authenticateJWT = (req:any, res: Response, next: NextFunction) => {
//   const auth = req.headers.authorization;
//   if (!auth) return res.status(401).json({ error: "Missing Authorization header" });
//   const token = auth.split(" ")[1];
//   try {
//     const payload = jwt.verify(token, envVars.JWT_ACCESS_SECRET as string) as any;
//     req.user = { sub: payload.sub, email: payload.email };
//     next();
//   } catch (err) {
//     return res.status(401).json({ error: "Invalid or expired token", err});
//   }
// }
const authenticateJWT = (...authRoles) => (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.lab_token;
        if (!token) {
            throw new app_error_1.default(401, "No token provided!");
        }
        // Verify access token
        const payload = (0, auth_service_1.verifyAccessToken)(token);
        if (!authRoles.includes(payload === null || payload === void 0 ? void 0 : payload.role)) {
            throw new app_error_1.default(403, "You are not permitted to access this route!");
        }
        if (payload) {
            req.user = payload;
            return next();
        }
        // const refreshToken = req.cookies.lab_refresh;
        // if (!refreshToken) {
        //   throw new AppError(401, "Token expired, please login again");
        // }
        // try {
        //   const result = await refreshAccessToken(refreshToken, res);
        //   req.user = {
        //     sub: result.user.id,
        //     email: result.user.email,
        //     role: result.user.role,
        //     id: result.user.id,
        //   };
        //   return next();
        // } catch (error) {
        //   console.log(error);
        //   throw new AppError(401, "Invalid refresh token");
        // }
    }
    catch (error) {
        console.log(error);
        next(error);
    }
});
exports.authenticateJWT = authenticateJWT;
