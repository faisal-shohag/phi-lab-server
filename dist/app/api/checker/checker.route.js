"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkerRoute = void 0;
const express_1 = __importDefault(require("express"));
const checker_controller_1 = require("./checker.controller");
// import { Role } from "../../../generated/prisma/enums";
// import { authenticateJWT } from "../../middlewares/authenticate-jwt";
const router = express_1.default.Router();
router.post('/website', checker_controller_1.CheckerController.WebsiteCheckController);
exports.checkerRoute = router;
