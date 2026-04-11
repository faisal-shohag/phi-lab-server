import express from "express";
import { foodController, gitIssueController } from "./lab.controller";
import { DragonNewsController } from "./apis/dragon-news/dragon-news.controller";
import { sheetsController } from "./sheet/sheet.controller";
const router = express.Router();

router.get('/issues', gitIssueController.gitAllIssueController)
router.get('/issue/:id', gitIssueController.getIssueByIdController)
router.get('/issues/search', gitIssueController.searchIssueController)

//foods
router.get('/foods/top-foods', foodController.topFoodsController)
router.get('/foods/:id', foodController.singleFoodController)
router.get('/foods', foodController.allFoodController)


//dragon news
router.get('/news/categories', DragonNewsController.getCategories)
router.get('/news', DragonNewsController.getNews)
router.get('/news/:id', DragonNewsController.getSingleNews)
router.get('/news/category/:id', DragonNewsController.getNewsByCategoryId)


// sheet-router
router.post("/sheets", sheetsController.addData);
router.get("/sheets", sheetsController.getData);
router.put("/sheets", sheetsController.updateData);

export default router;

export const labRoute = router