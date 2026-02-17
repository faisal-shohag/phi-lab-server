import { Role } from "../../../generated/prisma/enums";

export interface TokenPayload {
  sub?: string;
  email?: string;
  iat?: number;
  exp?: number;
  id: string,
  role: Role
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: Role
  };
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: Role
}
