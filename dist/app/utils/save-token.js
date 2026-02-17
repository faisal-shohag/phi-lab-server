"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveToken = void 0;
const env_1 = require("../config/env");
const constants_1 = require("./constants");
const generate_token_1 = require("./generate-token");
const saveToken = (res, user) => {
    const access = (0, generate_token_1.generateAccessToken)({ sub: user.id, id: user.id, email: user.email, role: user.role });
    const refresh = (0, generate_token_1.generateRefreshToken)({ sub: user.id, id: user.id, email: user.email, role: user.role });
    // Set access token cookie
    res.cookie("lab_token", access, {
        httpOnly: true,
        maxAge: constants_1.maxAge * 1000,
        sameSite: env_1.envVars.NODE_ENV === "development" ? "strict" : "none",
        secure: env_1.envVars.NODE_ENV !== "development",
    });
    res.cookie("lab_refesh", refresh, {
        httpOnly: true,
        maxAge: constants_1.maxAge * 1000,
        sameSite: env_1.envVars.NODE_ENV === "development" ? "strict" : "none",
        secure: env_1.envVars.NODE_ENV !== "development",
    });
};
exports.saveToken = saveToken;
