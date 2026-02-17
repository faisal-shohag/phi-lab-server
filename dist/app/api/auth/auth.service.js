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
exports.resetPassword = exports.logout = exports.refreshAccessToken = exports.verifyAccessTokenLoose = exports.verifyAccessToken = exports.verifyOTP = exports.createAndSendOTP = exports.loginWithPassword = exports.registerWithPassword = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../../config/db");
const crypto_1 = require("../../utils/crypto");
const generate_token_1 = require("../../utils/generate-token");
const env_1 = require("../../config/env");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_validation_1 = require("./auth.validation");
const zod_1 = require("zod");
const mailer_1 = require("../../utils/mailer");
const app_error_1 = __importDefault(require("../../helpers/app-error"));
const verifyOTP_1 = require("../../helpers/verifyOTP");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const client_1 = require("../../../generated/prisma/client");
const email_const_1 = require("../../const/email.const");
const time_1 = require("../../helpers/time");
const constants_1 = require("../../utils/constants");
const registerWithPassword = (email, password, name, picture) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if user exists
    const isExist = yield db_1.prisma.user.findUnique({
        where: { email },
    });
    if (isExist) {
        throw new app_error_1.default(401, "User already exist!");
    }
    // Hash password and create user
    const hashed = yield bcryptjs_1.default.hash(password, constants_1.SALT);
    const user = yield db_1.prisma.user.create({
        data: {
            email,
            password: hashed,
            name,
            picture,
        },
        select: {
            id: true,
            email: true,
            name: true,
        },
    });
    const otp = yield (0, exports.createAndSendOTP)(email, mailer_1.sendEmail);
    return { user, otp };
});
exports.registerWithPassword = registerWithPassword;
const loginWithPassword = (email, password) => __awaiter(void 0, void 0, void 0, function* () {
    // Find user
    const user = yield db_1.prisma.user.findUnique({
        where: { email },
        select: {
            id: true,
            email: true,
            name: true,
            password: true,
        },
    });
    if (!user || !user.password) {
        throw new app_error_1.default(401, "User with this email is not registered!");
    }
    // Verify password
    const isPasswordValid = yield bcryptjs_1.default.compare(password, user.password);
    if (!isPasswordValid) {
        throw new app_error_1.default(401, "Incorrect password!");
    }
    // Generate tokens
    // const access = generateAccessToken({ sub: user.id, email: user.email });
    // const refresh = generateRefreshToken({ sub: user.id });
    // Set access token cookie
    // res.cookie("lab_token", access, {
    //   httpOnly: true,
    //   maxAge: maxAge * 1000,
    //   sameSite: envVars.NODE_ENV === "development" ? "strict" : "none",
    //   secure: envVars.NODE_ENV !== "development",
    // });
    //   res.cookie("lab_refesh", refresh, {
    //   httpOnly: true,
    //   maxAge: maxAge * 1000,
    //   sameSite: envVars.NODE_ENV === "development" ? "strict" : "none",
    //   secure: envVars.NODE_ENV !== "development",
    // });
    // Store refresh token hash
    // await prisma.refreshToken.upsert({
    //   where: { userId: user.id },
    //   update: {
    //     tokenHash: hashString(refresh),
    //     expiresAt: new Date(Date.now() + msFromString("360d")),
    //   },
    //   create: {
    //     userId: user.id,
    //     tokenHash: hashString(refresh),
    //     expiresAt: new Date(Date.now() + msFromString("360d")),
    //   }
    // });
    // Return sanitized response
    yield (0, exports.createAndSendOTP)(email, mailer_1.sendEmail);
});
exports.loginWithPassword = loginWithPassword;
const createAndSendOTP = (email, sendFn) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate email
    const validated = zod_1.z
        .object({
        email: zod_1.z.email("Invalid email format"),
    })
        .parse({ email });
    // Check if user exists
    const user = yield db_1.prisma.user.findUnique({
        where: { email: validated.email },
    });
    if (!user)
        throw new app_error_1.default(400, "Please register first!");
    // Generate OTP
    const otpPlain = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = (0, crypto_1.hashString)(otpPlain);
    const expiresAt = (0, time_1.addMinutesDhaka)(Number(env_1.envVars.OTP_EXPIRES_MIN || "10"));
    // Upsert OTP
    yield db_1.prisma.oTP.upsert({
        where: { email: validated.email },
        update: {
            codeHash: otpHash,
            expiresAt,
            used: false,
            createdAt: new Date(),
        },
        create: {
            email: validated.email,
            userId: user.id,
            codeHash: otpHash,
            expiresAt,
        },
    });
    // const html = `<p>Your OTP is <strong>${otpPlain}</strong>. It expires in ${
    //   envVars.OTP_EXPIRES_MIN || "10"
    // } minutes.</p>`;
    yield sendFn(validated.email, "Your OTP code", (0, email_const_1.otpEmailHTML)(otpPlain));
    return { ok: true };
});
exports.createAndSendOTP = createAndSendOTP;
const verifyOTP = (email, otp, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate input
    const validated = auth_validation_1.OTPSchema.parse({ email, otp });
    const otpHash = (0, crypto_1.hashString)(validated.otp);
    // Find and verify OTP
    const record = yield db_1.prisma.oTP.findFirst({
        where: {
            email: validated.email,
            codeHash: otpHash,
            expiresAt: { gt: (0, time_1.nowDhaka)() },
            used: false,
        },
    });
    if (!record)
        throw new app_error_1.default(400, "Invalid or expired OTP");
    // delete verified otp
    yield db_1.prisma.oTP.delete({
        where: { email: validated.email },
    });
    // Get user
    const user = yield db_1.prisma.user.findUnique({
        where: { email: validated.email },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
        },
    });
    if (!user)
        throw new app_error_1.default(400, "Please register first!");
    // Generate tokens
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
    // // Store refresh token hash
    // await prisma.refreshToken.upsert({
    //   where: { userId: user.id },
    //   update: {
    //     tokenHash: hashString(refresh),
    //     expiresAt: new Date(Date.now() + msFromString("360d")),
    //   },
    //   create: {
    //     userId: user.id,
    //     tokenHash: hashString(refresh),
    //     expiresAt: new Date(Date.now() + msFromString("360d")),
    //   }
    // });
    return { access, refresh, user };
});
exports.verifyOTP = verifyOTP;
const verifyAccessToken = (token) => {
    const secret = env_1.envVars.JWT_ACCESS_SECRET;
    if (!secret)
        throw new app_error_1.default(401, "JWT_SECRET not configured");
    const decoded = jsonwebtoken_1.default.verify(token, secret);
    return decoded;
};
exports.verifyAccessToken = verifyAccessToken;
const verifyAccessTokenLoose = (token) => {
    const secret = env_1.envVars.JWT_ACCESS_SECRET;
    if (!secret || !token)
        return { sub: "", id: "", role: client_1.Role.USER };
    const decoded = jsonwebtoken_1.default.verify(token, secret);
    return decoded;
};
exports.verifyAccessTokenLoose = verifyAccessTokenLoose;
const refreshAccessToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const refreshToken = req.cookies["lab_refesh"];
    const validated = auth_validation_1.RefreshTokenSchema.parse({ refreshToken });
    const secret = env_1.envVars.JWT_REFRESH_SECRET;
    if (!secret)
        throw new app_error_1.default(401, "JWT_SECRET not configured");
    const decoded = jsonwebtoken_1.default.verify(validated.refreshToken, secret);
    // Check if refresh token exists and is not revoked
    // const storedToken = await prisma.refreshToken.findFirst({
    //   where: {
    //     userId: decoded.sub,
    //     tokenHash: hashString(validated.refreshToken),
    //     expiresAt: { gt: new Date() },
    //   },
    //   include: { user: true },
    // });
    if (!decoded) {
        throw new app_error_1.default(401, "Refresh token invalid or revoked");
    }
    const user = yield db_1.prisma.user.findUnique({
        where: { id: decoded.sub },
    });
    if (!user) {
        throw new app_error_1.default(http_status_codes_1.default.NOT_FOUND, "User not found during generating new access token!");
    }
    // Generate new access token
    const newAccess = (0, generate_token_1.generateAccessToken)({
        sub: user.id,
        email: user.email,
        id: user.id,
        role: user.role
    });
    // Set new access token cookie
    res.cookie("lab_token", newAccess, {
        httpOnly: true,
        maxAge: constants_1.maxAge * 1000,
        sameSite: env_1.envVars.NODE_ENV === "development" ? "strict" : "none",
        secure: env_1.envVars.NODE_ENV !== "development",
    });
    return {
        access: newAccess,
        refresh: validated.refreshToken,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        },
    };
});
exports.refreshAccessToken = refreshAccessToken;
const logout = (res) => __awaiter(void 0, void 0, void 0, function* () {
    res.clearCookie("lab_refesh");
    res.clearCookie("lab_token");
    res.cookie("lab_token", "", {
        httpOnly: true,
        maxAge: 0,
        sameSite: env_1.envVars.NODE_ENV === "development" ? "strict" : "none",
        secure: env_1.envVars.NODE_ENV !== "development",
    });
    res.cookie("lab_refesh", "", {
        httpOnly: true,
        maxAge: 0,
        sameSite: env_1.envVars.NODE_ENV === "development" ? "strict" : "none",
        secure: env_1.envVars.NODE_ENV !== "development",
    });
    return { ok: true, user: null };
});
exports.logout = logout;
const resetPassword = (res, email, newPassword, otp) => __awaiter(void 0, void 0, void 0, function* () {
    const isVerified = yield (0, verifyOTP_1.verifyOTPOnly)(email, otp);
    if (!isVerified) {
        throw new app_error_1.default(401, "OTP verification failed!");
    }
    const hashed = yield bcryptjs_1.default.hash(newPassword, constants_1.SALT);
    const user = yield db_1.prisma.user.update({
        where: {
            email,
        },
        data: {
            password: hashed,
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true
        }
    });
    const access = (0, generate_token_1.generateAccessToken)({ sub: user.id, id: user.id, email: user.email, role: user.role });
    const refresh = (0, generate_token_1.generateRefreshToken)({ sub: user.id, id: user.id, email: user.email, role: user.role });
    // // Set access token cookie
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
    return { access, refresh, user };
});
exports.resetPassword = resetPassword;
