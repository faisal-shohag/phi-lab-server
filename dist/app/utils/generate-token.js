"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccessToken = generateAccessToken;
exports.generateRefreshToken = generateRefreshToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
function generateAccessToken(payload) {
    return jsonwebtoken_1.default.sign(payload, env_1.envVars.JWT_ACCESS_SECRET, { expiresIn: "1y" });
}
function generateRefreshToken(payload) {
    return jsonwebtoken_1.default.sign(payload, env_1.envVars.JWT_REFRESH_SECRET, { expiresIn: "1y" });
}
