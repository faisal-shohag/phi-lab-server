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
exports.UploadControllers = exports.CloudinaryDeleteImage = exports.CloudinaryGetImages = exports.CloudinaryUploadProfileImage = exports.CloudinaryUpload = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const send_response_1 = require("../../utils/send-response");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const app_error_1 = __importDefault(require("../../helpers/app-error"));
const upload_service_1 = require("./upload.service");
exports.CloudinaryUpload = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { file, folder } = req.body;
    if (!file || !folder) {
        throw new app_error_1.default(http_status_codes_1.default.BAD_REQUEST, "Image and folder is required!");
    }
    const result = yield upload_service_1.UploadServices.uploadImageToCloudinary({ file, folder });
    (0, send_response_1.sendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Image uploaded successfully!",
        data: result,
    });
}));
exports.CloudinaryUploadProfileImage = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { file, folder, previousImageURL } = req.body;
    if (!file || !folder) {
        throw new app_error_1.default(http_status_codes_1.default.BAD_REQUEST, "Image and folder is required!");
    }
    const result = yield upload_service_1.UploadServices.uploadProfileImageToCloudinary({ file, folder, previousImageURL });
    (0, send_response_1.sendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Image uploaded successfully!",
        data: result,
    });
}));
exports.CloudinaryGetImages = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { folder } = req.body;
    if (!folder) {
        throw new app_error_1.default(http_status_codes_1.default.BAD_REQUEST, "Folder is required");
    }
    const result = yield upload_service_1.UploadServices.getImagesByFolder(folder);
    (0, send_response_1.sendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Images retrieved successfully!",
        data: result,
    });
}));
exports.CloudinaryDeleteImage = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { publicId } = req.body;
    if (!publicId) {
        throw new app_error_1.default(http_status_codes_1.default.BAD_REQUEST, "Public ID is required");
    }
    const result = yield upload_service_1.UploadServices.deleteImageFromCloudinary(publicId);
    (0, send_response_1.sendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Image deleted successfully!",
        data: result,
    });
}));
exports.UploadControllers = {
    CloudinaryUpload: exports.CloudinaryUpload,
    CloudinaryGetImages: exports.CloudinaryGetImages,
    CloudinaryDeleteImage: exports.CloudinaryDeleteImage,
    CloudinaryUploadProfileImage: exports.CloudinaryUploadProfileImage
};
