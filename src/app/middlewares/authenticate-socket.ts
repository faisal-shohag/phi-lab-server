import { Socket } from "socket.io";
import { verifyAccessToken } from "../api/auth/auth.service";
import AppError from "../helpers/app-error";
import { TokenPayload } from "../api/auth/auth.interface";

export const authenticateSocket = (io ) => {
    io.use((socket: Socket, next) => {
      const token = socket.handshake.headers.cookie
    ?.split(";")
    .find((c: string) => c.trim().startsWith("lab_token="))
    ?.split("=")[1];

      if (!token) {
        return next(new AppError(401, "No token provided"));
      }

      try {
        const payload = verifyAccessToken(token) as TokenPayload;

        // Attach user to socket for use in battleSocket
        (socket as any).user = payload;

        // Optional: check role if needed globally
        // if (!authRoles.includes(payload.role)) {
        //   return next(new AppError(403, "Forbidden"));
        // }

        next();
      } catch (error: any) {
        console.log(error)
        next(new AppError(401, "Invalid or expired token"));
      }
    });
}