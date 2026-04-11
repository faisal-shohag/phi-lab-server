"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.labRoute = void 0;
const express_1 = __importDefault(require("express"));
const lab_controller_1 = require("./lab.controller");
const dragon_news_controller_1 = require("./apis/dragon-news/dragon-news.controller");
const sheet_controller_1 = require("./sheet/sheet.controller");
const router = express_1.default.Router();
router.get('/issues', lab_controller_1.gitIssueController.gitAllIssueController);
router.get('/issue/:id', lab_controller_1.gitIssueController.getIssueByIdController);
router.get('/issues/search', lab_controller_1.gitIssueController.searchIssueController);
//foods
router.get('/foods/top-foods', lab_controller_1.foodController.topFoodsController);
router.get('/foods/:id', lab_controller_1.foodController.singleFoodController);
router.get('/foods', lab_controller_1.foodController.allFoodController);
//dragon news
router.get('/news/categories', dragon_news_controller_1.DragonNewsController.getCategories);
router.get('/news', dragon_news_controller_1.DragonNewsController.getNews);
router.get('/news/:id', dragon_news_controller_1.DragonNewsController.getSingleNews);
router.get('/news/category/:id', dragon_news_controller_1.DragonNewsController.getNewsByCategoryId);
// sheet-router
router.post("/sheets", sheet_controller_1.sheetsController.addData);
router.get("/sheets", sheet_controller_1.sheetsController.getData);
router.put("/sheets", sheet_controller_1.sheetsController.updateData);
exports.default = router;
exports.labRoute = router;
