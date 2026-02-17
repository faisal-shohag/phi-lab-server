"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executionRoute = void 0;
const enums_1 = require("../../../generated/prisma/enums");
const authenticate_jwt_1 = require("../../middlewares/authenticate-jwt");
const execution_controller_1 = require("./execution.controller");
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
router.post('/js/execute', (0, authenticate_jwt_1.authenticateJWT)(...Object.values(enums_1.Role)), execution_controller_1.handleSubmission);
exports.executionRoute = router;
