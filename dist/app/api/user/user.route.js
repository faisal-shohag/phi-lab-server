"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
const express_1 = __importDefault(require("express"));
const authenticate_jwt_1 = require("../../middlewares/authenticate-jwt");
const user_controller_1 = require("./user.controller");
const enums_1 = require("../../../generated/prisma/enums");
const router = express_1.default.Router();
router.get('/me', (0, authenticate_jwt_1.authenticateJWT)(...Object.values(enums_1.Role)), user_controller_1.UserControllers.getMe);
router.get('/all', (0, authenticate_jwt_1.authenticateJWT)(enums_1.Role.ADMIN), user_controller_1.UserControllers.getAllUser);
router.get('/profile-info', (0, authenticate_jwt_1.authenticateJWT)(...Object.values(enums_1.Role)), user_controller_1.UserControllers.getUserProfileInfo);
router.get('/additional-info', (0, authenticate_jwt_1.authenticateJWT)(...Object.values(enums_1.Role)), user_controller_1.UserControllers.getUserAdditionalInfo);
router.patch('/update', (0, authenticate_jwt_1.authenticateJWT)(...Object.values(enums_1.Role)), user_controller_1.UserControllers.updateUser);
router.patch('/update-username', (0, authenticate_jwt_1.authenticateJWT)(...Object.values(enums_1.Role)), user_controller_1.UserControllers.updateUsername);
exports.userRoutes = router;
