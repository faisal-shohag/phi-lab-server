"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadRoutes = void 0;
const express_1 = __importDefault(require("express"));
const enums_1 = require("../../../generated/prisma/enums");
const authenticate_jwt_1 = require("../../middlewares/authenticate-jwt");
const upload_controller_1 = require("./upload.controller");
const router = express_1.default.Router();
router.post("/cloudinary", (0, authenticate_jwt_1.authenticateJWT)(enums_1.Role.ADMIN), upload_controller_1.UploadControllers.CloudinaryUpload);
router.get("/cloudinary", (0, authenticate_jwt_1.authenticateJWT)(enums_1.Role.ADMIN), upload_controller_1.UploadControllers.CloudinaryGetImages);
router.delete("/cloudinary", (0, authenticate_jwt_1.authenticateJWT)(enums_1.Role.ADMIN), upload_controller_1.UploadControllers.CloudinaryDeleteImage);
router.post("/profile", (0, authenticate_jwt_1.authenticateJWT)(enums_1.Role.ADMIN), upload_controller_1.UploadControllers.CloudinaryUploadProfileImage);
exports.uploadRoutes = router;
