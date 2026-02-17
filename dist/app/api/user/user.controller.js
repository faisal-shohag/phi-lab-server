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
exports.UserControllers = exports.updateUsername = exports.updateUser = exports.getUserAdditionalInfo = exports.getUserProfileInfo = exports.getAllUser = exports.getMe = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const send_response_1 = require("../../utils/send-response");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const user_service_1 = require("./user.service");
const auth_validation_1 = require("../auth/auth.validation");
const app_error_1 = __importDefault(require("../../helpers/app-error"));
exports.getMe = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const payload = req.user;
    const user = yield user_service_1.UserServices.getMe(payload.id);
    // console.log(user)
    (0, send_response_1.sendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Your profile retrieved successfully!",
        data: user,
    });
}));
exports.getAllUser = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { users } = yield user_service_1.UserServices.getAllUser();
    (0, send_response_1.sendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Your profile retrieved successfully!",
        data: users,
    });
}));
exports.getUserProfileInfo = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const payload = req.user;
    const user = yield user_service_1.UserServices.getUserProfileInfo(payload.id);
    (0, send_response_1.sendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Your profile retrieved successfully!",
        data: user,
    });
}));
exports.getUserAdditionalInfo = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const payload = req.user;
    const user = yield user_service_1.UserServices.getUserAdditionalInfo(payload.id);
    (0, send_response_1.sendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Your profile retrieved successfully!",
        data: user,
    });
}));
exports.updateUser = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const payload = req.user;
    const user = yield user_service_1.UserServices.updateUser(payload.id, req.body);
    (0, send_response_1.sendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Your profile retrieved successfully!",
        data: user,
    });
}));
//updateUsername with zod validation no special character only "-", "_" is allowed
exports.updateUsername = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const payload = req.user;
    const username = req.body.username;
    // console.log(username)
    const validated = auth_validation_1.UsernameSchema.parse({ username });
    // console.log(validated)
    if (validated.username !== username) {
        throw new app_error_1.default(http_status_codes_1.default.NOT_ACCEPTABLE, "Username is not valid");
    }
    const user = yield user_service_1.UserServices.updateUsername(payload.id, username);
    (0, send_response_1.sendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Your profile retrieved successfully!",
        data: user,
    });
}));
exports.UserControllers = {
    getMe: exports.getMe,
    getAllUser: exports.getAllUser,
    getUserProfileInfo: exports.getUserProfileInfo,
    getUserAdditionalInfo: exports.getUserAdditionalInfo,
    updateUser: exports.updateUser,
    updateUsername: exports.updateUsername
};
