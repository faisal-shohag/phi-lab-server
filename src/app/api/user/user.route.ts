import express from "express";
import { authenticateJWT } from "../../middlewares/authenticate-jwt";
import { UserControllers } from "./user.controller";
import { Role } from "../../../generated/prisma/enums";
const router = express.Router();

router.get('/me', authenticateJWT(...Object.values(Role)), UserControllers.getMe)
router.get('/all', authenticateJWT(Role.ADMIN), UserControllers.getAllUser)
router.get('/profile-info', authenticateJWT(...Object.values(Role)), UserControllers.getUserProfileInfo)
router.get('/additional-info', authenticateJWT(...Object.values(Role)), UserControllers.getUserAdditionalInfo)
router.patch('/update', authenticateJWT(...Object.values(Role)), UserControllers.updateUser)
router.patch('/update-username', authenticateJWT(...Object.values(Role)), UserControllers.updateUsername)
export const userRoutes = router