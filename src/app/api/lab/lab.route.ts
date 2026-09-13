import express from "express";
import { foodController, gitIssueController } from "./lab.controller";
import { DragonNewsController } from "./apis/dragon-news/dragon-news.controller";
import { sheetsController } from "./sheet/sheet.controller";
import { IllustraController } from "./apis/illustra/illustra.controller";
import { BooksController } from "./apis/books/books.controller";
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

//illustra
router.get('/photos/categories', IllustraController.getCategories)
router.get('/photos', IllustraController.getPhotos)
router.get('/photos/:id', IllustraController.getSinglePhoto)
router.get('/photos/category/:id', IllustraController.getPhotosByCategoryName)

//books
router.get('/books/categories', BooksController.getCategories)
router.get('/books', BooksController.getBooks)
router.get('/books/:id', BooksController.getSingleBook)
router.get('/books/category/:category', BooksController.getBooksByCategory)


// sheet-router
router.post('/extract-job', sheetsController.extractJobStructuredData)
router.post("/sheets", sheetsController.addData);
router.get("/sheets", sheetsController.getData);
router.put("/sheets", sheetsController.updateData);

export default router;

export const labRoute = router