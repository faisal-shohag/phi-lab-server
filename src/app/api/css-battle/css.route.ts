import express from "express";
import { CssControllers } from "./css.controller";
import { Role } from "../../../generated/prisma/enums";
import { authenticateJWT } from "../../middlewares/authenticate-jwt";
const router = express.Router();

router.post('/battle/submit', authenticateJWT(...Object.values(Role)), CssControllers.CompareCss)
router.post('/battle/submit/v2', CssControllers.CompareCssV2)
router.get('/battle/:battleNo',authenticateJWT(...Object.values(Role)), CssControllers.getBattleByNo)
router.post('/collection', authenticateJWT(Role.ADMIN), CssControllers.createCollection)
router.get('/collection', CssControllers.getCollections)
router.get('/collection/:collectionId', authenticateJWT(...Object.values(Role)), CssControllers.getCollectionById)
router.post('/battle', authenticateJWT(Role.ADMIN), CssControllers.createBattle)
router.delete('/collection/:collectionId', authenticateJWT(Role.ADMIN), CssControllers.deleteCollection)
router.delete('/battle/:battleId', authenticateJWT(Role.ADMIN), CssControllers.deleteBattle)
router.get('/battles', authenticateJWT(...Object.values(Role)), CssControllers.getBattles)



export const cssRoutes = router