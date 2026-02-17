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
Object.defineProperty(exports, "__esModule", { value: true });
exports.passwordValidation = exports.loginValidation = exports.registerValidation = exports.UsernameSchema = exports.PasswordSchema = exports.RefreshTokenSchema = exports.OTPSchema = exports.LoginSchema = exports.RegisterSchema = void 0;
const zod_1 = require("zod");
const catchAsync_1 = require("../../utils/catchAsync");
exports.RegisterSchema = zod_1.z.object({
    email: zod_1.z.email("Invalid email format"),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters").regex(/[A-Z]/, "Password must contain an uppercase letter").regex(/[0-9]/, "Password must contain a number").regex(/[^a-zA-Z0-9]/, "Password must contain a special character"),
    name: zod_1.z.string().min(2, "Name must be at least 2 characters").optional(),
});
exports.LoginSchema = zod_1.z.object({
    email: zod_1.z.email("Invalid email format"),
    password: zod_1.z.string().min(1, "Password is required"),
});
exports.OTPSchema = zod_1.z.object({
    email: zod_1.z.email("Invalid email format"),
    otp: zod_1.z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "OTP must contain only digits"),
});
exports.RefreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, "Refresh token is required"),
});
exports.PasswordSchema = zod_1.z.object({
    password: zod_1.z.string().min(8, "Password must be at least 8 characters").regex(/[A-Z]/, "Password must contain an uppercase letter").regex(/[0-9]/, "Password must contain a number").regex(/[^a-zA-Z0-9]/, "Password must contain a special character"),
});
//zod schema for username no special character only "-", "_" is allowed. no space is allowed. 
exports.UsernameSchema = zod_1.z.object({
    username: zod_1.z.string().min(2, "Username must be at least 2 characters").regex(/^[a-zA-Z0-9_-]+$/, "Username must contain only letters, numbers, hyphens, and underscores"),
});
exports.registerValidation = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    exports.RegisterSchema.parse(req.body);
    next();
}));
exports.loginValidation = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    exports.LoginSchema.parse(req.body);
    next();
}));
exports.passwordValidation = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    exports.PasswordSchema.parse(req.body);
    next();
}));
