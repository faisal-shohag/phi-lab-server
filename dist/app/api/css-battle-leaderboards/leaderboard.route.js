"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.leaderboardRoutes = void 0;
const express_1 = __importDefault(require("express"));
// import { authenticateJWT } from "../../middlewares/authenticate-jwt";
// import { Role } from "../../../generated/prisma/enums";
const leaderboard_controller_1 = require("./leaderboard.controller");
const router = express_1.default.Router();
router.get('/css/global', leaderboard_controller_1.LeaderboardController.getGlobal);
router.get('/collection/:collectionId', leaderboard_controller_1.LeaderboardController.getCollection);
router.get('/battle/:battleId', leaderboard_controller_1.LeaderboardController.getBattle);
router.get('/js/global', leaderboard_controller_1.LeaderboardController.getJsGlobal);
exports.leaderboardRoutes = router;
