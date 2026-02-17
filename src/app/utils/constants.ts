import { envVars } from "../config/env";

export const SALT = Number(envVars.BCRYPT_SALT_ROUNDS || 12);
export const maxAge = 1 * 365 * 24 * 60 * 60 * 1000;