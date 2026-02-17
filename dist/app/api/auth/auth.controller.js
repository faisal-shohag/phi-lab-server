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
exports.githubOAuth = exports.googleOAuth = exports.refreshController = exports.logoutController = exports.resetPasswordController = exports.verifyOTPController = exports.requestOTPController = exports.loginWithPasswordConroller = exports.registerController = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const mailer_1 = require("../../utils/mailer");
const send_response_1 = require("../../utils/send-response");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const auth_service_1 = require("./auth.service");
const save_token_1 = require("../../utils/save-token");
const app_error_1 = __importDefault(require("../../helpers/app-error"));
const env_1 = require("../../config/env");
exports.registerController = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, name, picture } = req.body;
    const user = yield (0, auth_service_1.registerWithPassword)(email, password, name, picture);
    (0, send_response_1.sendResponse)(res, {
        statusCode: http_status_codes_1.default.CREATED,
        success: true,
        message: "User created successfully",
        data: user,
    });
}));
exports.loginWithPasswordConroller = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    console.log(email, password);
    const result = yield (0, auth_service_1.loginWithPassword)(email, password);
    (0, send_response_1.sendResponse)(res, {
        statusCode: http_status_codes_1.default.ACCEPTED,
        success: true,
        message: "OTP sent successfully!",
        data: result,
    });
}));
exports.requestOTPController = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    yield (0, auth_service_1.createAndSendOTP)(email, mailer_1.sendEmail);
    (0, send_response_1.sendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "OTP sent!",
        data: {},
    });
}));
exports.verifyOTPController = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, otp } = req.body;
    const { access, user } = yield (0, auth_service_1.verifyOTP)(email, otp, res);
    (0, send_response_1.sendResponse)(res, {
        statusCode: http_status_codes_1.default.ACCEPTED,
        success: true,
        message: "OTP verified!",
        data: { access, user },
    });
}));
exports.resetPasswordController = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, otp } = req.body;
    const user = yield (0, auth_service_1.resetPassword)(res, email, password, otp);
    (0, send_response_1.sendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Password was reset successfully and user has been logged in!",
        data: user,
    });
}));
exports.logoutController = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, auth_service_1.logout)(res);
    (0, send_response_1.sendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Logged out successfully!",
        data: null,
    });
}));
exports.refreshController = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { access, refresh, user } = yield (0, auth_service_1.refreshAccessToken)(req, res);
    (0, send_response_1.sendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Token refreshed successfully!",
        data: { access, refresh, user },
    });
}));
exports.googleOAuth = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    let redirectTo = req.query.state ? req.query.state : "";
    if (redirectTo.startsWith("/")) {
        redirectTo = redirectTo.slice(1);
    }
    if (!user) {
        throw new app_error_1.default(http_status_codes_1.default.NOT_FOUND, "User Not Found");
    }
    (0, save_token_1.saveToken)(res, user);
    res.redirect(`${env_1.envVars.CLIENT_URL}/${redirectTo}`);
}));
exports.githubOAuth = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    let redirectTo = req.query.state ? req.query.state : "";
    if (redirectTo.startsWith("/")) {
        redirectTo = redirectTo.slice(1);
    }
    if (!user) {
        throw new app_error_1.default(http_status_codes_1.default.NOT_FOUND, "User Not Found");
    }
    (0, save_token_1.saveToken)(res, user);
    res.redirect(`${env_1.envVars.CLIENT_URL}/${redirectTo}`);
}));
