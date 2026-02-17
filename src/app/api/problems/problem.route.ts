import express from "express";
import { Role } from "../../../generated/prisma/enums";
import { authenticateJWT } from "../../middlewares/authenticate-jwt";
import { ProblemController } from "./problem.controller";
const router = express.Router();

router.post(
  "/create",
  authenticateJWT(Role.ADMIN),
  ProblemController.CreateProblem
);
router.get(
  "/problems",
  authenticateJWT(...Object.values(Role)),
  ProblemController.GetProblems
);
router.get(
  "/problem/:slug",
  authenticateJWT(...Object.values(Role)),
  ProblemController.GetProblemBySlug
);
router.get(
  "/submission/:id",
  authenticateJWT(...Object.values(Role)),
  ProblemController.GetSubmissionByProblemId
)

router.get(
  "/leaderboard",
  authenticateJWT(...Object.values(Role)),
  ProblemController.GetJsGlobalLeaderboard
)

export const problemRoutes = router;
