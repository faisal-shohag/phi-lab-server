"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_github2_1 = require("passport-github2");
const env_1 = require("./env");
const db_1 = require("./db");
const enums_1 = require("../../generated/prisma/enums");
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: env_1.envVars.GOOGLE_CLIENT_ID,
    clientSecret: env_1.envVars.GOOGLE_CLIENT_SECRET,
    callbackURL: env_1.envVars.GOOGLE_CALLBACK_URL,
    scope: ['profile', 'email'],
}, (accessToken, refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const email = (_b = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value;
        if (!email) {
            return done(new Error('No email provided by Google'));
        }
        // 1. Try to find user by googleId
        let user = yield db_1.prisma.user.findUnique({
            where: { googleId: profile.id },
        });
        if (user) {
            return done(null, user);
        }
        // 2. If not found by googleId, try to find by email (for account linking)
        user = yield db_1.prisma.user.findUnique({
            where: { email },
        });
        if (user) {
            // Link existing account with Google
            user = yield db_1.prisma.user.update({
                where: { id: user.id },
                data: { googleId: profile.id },
            });
            return done(null, user);
        }
        // 3. Create new user
        user = yield db_1.prisma.user.create({
            data: {
                email,
                googleId: profile.id,
                name: profile.displayName || null,
                picture: ((_d = (_c = profile.photos) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value) || null,
                role: 'USER', // or any other default role
                status: 'ACTIVE', // or any other default status
                authType: enums_1.AuthType.google,
            },
        });
        return done(null, user);
    }
    catch (err) {
        return done(err);
    }
})));
//github strategy
passport_1.default.use(new passport_github2_1.Strategy({
    clientID: env_1.envVars.GITHUB_CLIENT_ID,
    clientSecret: env_1.envVars.GITHUB_CLIENT_SECRET,
    callbackURL: env_1.envVars.GITHUB_CALLBACK_URL,
    scope: ['user:email'],
}, (accessToken, refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    console.log(profile);
    try {
        const email = (_b = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value;
        if (!email) {
            return done(new Error('No email provided by Github'));
        }
        // 1. Try to find user by githubId
        let user = yield db_1.prisma.user.findUnique({
            where: { githubId: profile.id },
        });
        if (user) {
            return done(null, user);
        }
        // 2. If not found by githubId, try to find by email (for account linking)
        user = yield db_1.prisma.user.findUnique({
            where: { email },
        });
        if (user) {
            // Link existing account with Github
            user = yield db_1.prisma.user.update({
                where: { id: user.id },
                data: { githubId: profile.id },
            });
            return done(null, user);
        }
        // 3. Create new user
        user = yield db_1.prisma.user.create({
            data: {
                email,
                githubId: profile.id,
                name: profile.displayName || null,
                picture: ((_d = (_c = profile.photos) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value) || null,
                role: 'USER', // or any other default role
                status: 'ACTIVE', // or any other default status
                authType: enums_1.AuthType.github,
            },
        });
        return done(null, user);
    }
    catch (err) {
        return done(err);
    }
})));
exports.default = passport_1.default;
