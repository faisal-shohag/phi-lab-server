import { envVars } from "../config/env";
import { maxAge } from "./constants";
import { generateAccessToken, generateRefreshToken } from "./generate-token";

export const saveToken = (res, user) => {
      const access = generateAccessToken({ sub: user.id, id: user.id, email: user.email, role: user.role });
      const refresh = generateRefreshToken({ sub: user.id, id: user.id, email: user.email, role: user.role });
    
      // Set access token cookie
      res.cookie("lab_token", access, {
        httpOnly: true,
        maxAge: maxAge * 1000,
        sameSite: envVars.NODE_ENV === "development" ? "strict" : "none",
        secure: envVars.NODE_ENV !== "development",
      });
    
      res.cookie("lab_refesh", refresh, {
        httpOnly: true,
        maxAge: maxAge * 1000,
        sameSite: envVars.NODE_ENV === "development" ? "strict" : "none",
        secure: envVars.NODE_ENV !== "development",
      });
}