import express from "express";
import { foodController, gitIssueController } from "./lab.controller";
const router = express.Router();

router.get('/issues', gitIssueController.gitAllIssueController)
router.get('/issue/:id', gitIssueController.getIssueByIdController)
router.get('/issues/search', gitIssueController.searchIssueController)

//
router.get('/foods/top-foods', foodController.topFoodsController)


export default router;

export const labRoute = router