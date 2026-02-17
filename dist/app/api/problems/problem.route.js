"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.problemRoutes = void 0;
const express_1 = __importDefault(require("express"));
const enums_1 = require("../../../generated/prisma/enums");
const authenticate_jwt_1 = require("../../middlewares/authenticate-jwt");
const problem_controller_1 = require("./problem.controller");
const router = express_1.default.Router();
router.post("/create", (0, authenticate_jwt_1.authenticateJWT)(enums_1.Role.ADMIN), problem_controller_1.ProblemController.CreateProblem);
router.get("/problems", (0, authenticate_jwt_1.authenticateJWT)(...Object.values(enums_1.Role)), problem_controller_1.ProblemController.GetProblems);
router.get("/problem/:slug", (0, authenticate_jwt_1.authenticateJWT)(...Object.values(enums_1.Role)), problem_controller_1.ProblemController.GetProblemBySlug);
router.get("/submission/:id", (0, authenticate_jwt_1.authenticateJWT)(...Object.values(enums_1.Role)), problem_controller_1.ProblemController.GetSubmissionByProblemId);
router.get("/leaderboard", (0, authenticate_jwt_1.authenticateJWT)(...Object.values(enums_1.Role)), problem_controller_1.ProblemController.GetJsGlobalLeaderboard);
exports.problemRoutes = router;
