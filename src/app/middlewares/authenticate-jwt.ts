import { NextFunction, Response } from "express";
// import jwt from "jsonwebtoken";
// import { envVars } from "../config/env";
import {
  verifyAccessToken,
} from "../api/auth/auth.service";
import AppError from "../helpers/app-error";
import { TokenPayload } from "../api/auth/auth.interface";
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

export const authenticateJWT =
  (...authRoles: string[]) =>
  async (req:any, res: Response, next: NextFunction) => {
    try {
      const token = req.cookies.lab_token;

      if (!token) {
        throw new AppError(401, "No token provided!");
      }

      // Verify access token
      const payload: TokenPayload = verifyAccessToken(token) as TokenPayload;

      if (!authRoles.includes(payload?.role)) {
        throw new AppError(403, "You are not permitted to access this route!");
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
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
