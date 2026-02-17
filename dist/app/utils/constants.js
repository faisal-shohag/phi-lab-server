"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maxAge = exports.SALT = void 0;
const env_1 = require("../config/env");
exports.SALT = Number(env_1.envVars.BCRYPT_SALT_ROUNDS || 12);
exports.maxAge = 1 * 365 * 24 * 60 * 60 * 1000;
