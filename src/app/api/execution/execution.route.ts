
import { Role } from "../../../generated/prisma/enums";
import { authenticateJWT } from "../../middlewares/authenticate-jwt";
import { handleSubmission } from "./execution.controller";
import express from 'express'
const router = express.Router();
router.post('/js/execute', authenticateJWT(...Object.values(Role)), handleSubmission);

export const executionRoute = router
