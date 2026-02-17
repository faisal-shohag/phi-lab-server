import express from "express";
// import { authenticateJWT } from "../../middlewares/authenticate-jwt";
// import { Role } from "../../../generated/prisma/enums";
import { LeaderboardController } from "./leaderboard.controller";
const router = express.Router();

router.get('/css/global', LeaderboardController.getGlobal)

router.get('/collection/:collectionId', LeaderboardController.getCollection)

router.get('/battle/:battleId', LeaderboardController.getBattle)
router.get('/js/global', LeaderboardController.getJsGlobal)

export const leaderboardRoutes = router