import express from "express";
import { CheckerController } from "./checker.controller";

// import { Role } from "../../../generated/prisma/enums";
// import { authenticateJWT } from "../../middlewares/authenticate-jwt";
const router = express.Router();

router.post('/website', CheckerController.WebsiteCheckController)

export const checkerRoute = router