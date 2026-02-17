import express from "express";

import { Role } from "../../../generated/prisma/enums";
import { authenticateJWT } from "../../middlewares/authenticate-jwt";
import { CssCreationControllers } from "./css-creation.controller";
const router = express.Router();

router.post('/create/target', authenticateJWT(...Object.values(Role)), CssCreationControllers.CssTargetCreation)



export const CssCreationRoute = router
