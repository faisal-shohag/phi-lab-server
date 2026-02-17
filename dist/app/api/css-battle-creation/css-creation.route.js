"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CssCreationRoute = void 0;
const express_1 = __importDefault(require("express"));
const enums_1 = require("../../../generated/prisma/enums");
const authenticate_jwt_1 = require("../../middlewares/authenticate-jwt");
const css_creation_controller_1 = require("./css-creation.controller");
const router = express_1.default.Router();
router.post('/create/target', (0, authenticate_jwt_1.authenticateJWT)(...Object.values(enums_1.Role)), css_creation_controller_1.CssCreationControllers.CssTargetCreation);
exports.CssCreationRoute = router;
