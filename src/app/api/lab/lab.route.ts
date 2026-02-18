import express from "express";
import { gitIssueController } from "./lab.controller";
const router = express.Router();

router.get('/issues', gitIssueController.gitAllIssueController)
router.get('/issue/:id', gitIssueController.getIssueByIdController)
router.get('/issues/search', gitIssueController.searchIssueController)

export default router;

export const labRoute = router