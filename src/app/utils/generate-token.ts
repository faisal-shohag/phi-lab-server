import jwt from 'jsonwebtoken'
import { envVars } from '../config/env';
export function generateAccessToken(payload: object) {
  return jwt.sign(payload, envVars.JWT_ACCESS_SECRET as string, { expiresIn: "1y" });
}
export function generateRefreshToken(payload: object) {
  return jwt.sign(payload, envVars.JWT_REFRESH_SECRET as string, { expiresIn: "1y" });
}