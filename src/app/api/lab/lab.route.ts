import express from "express";
import { gitIssueController } from "./lab.controller";
const router = express.Router();

router.get('/issues', gitIssueController.gitAllIssueController)
router.get('/issues/:id', gitIssueController.getIssueByIdController)

export const labRoute = router