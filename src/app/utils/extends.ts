import { Request } from "express";
import { TokenPayload } from "../api/auth/auth.interface";

export interface AuthRequest extends Request {
  user?: TokenPayload;
}
