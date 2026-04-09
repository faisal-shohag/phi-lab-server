"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DragonNewsController = exports.getNewsByCategoryId = exports.getSingleNews = exports.getNews = exports.getCategories = void 0;
const category_json_1 = __importDefault(require("./category.json"));
const news_json_1 = __importDefault(require("./news.json"));
//news categories
const getCategories = (req, res) => {
    return res.status(200).json({
        status: "success",
        message: "News categories fetched successfully",
        data: category_json_1.default,
    });
};
exports.getCategories = getCategories;
// all news
const getNews = (req, res) => {
    res.json({
        status: "success",
        message: "News fetched successfully",
        data: news_json_1.default,
    });
};
exports.getNews = getNews;
//get single news
const getSingleNews = (req, res) => {
    const { id } = req.params;
    const singleNews = news_json_1.default.find((n) => n.id === id);
    if (!singleNews) {
        return res.status(404).json({
            status: "error",
            message: `No news found with id ${id}`,
        });
    }
    return res.status(200).json({
        status: "success",
        message: `News with id ${id} fetched successfully`,
        data: singleNews,
    });
};
exports.getSingleNews = getSingleNews;
//get news by category id
const getNewsByCategoryId = (req, res) => {
    const { id } = req.params;
    const newsByCategory = news_json_1.default.filter((n) => n.category_id == Number(id));
    // console.log(newsByCategory)
    if (newsByCategory.length === 0) {
        return res.status(404).json({
            status: "error",
            message: `No news found with categoryId ${id}`,
        });
    }
    return res.status(200).json({
        status: "success",
        message: `News with categoryId ${id} fetched successfully`,
        data: newsByCategory,
    });
};
exports.getNewsByCategoryId = getNewsByCategoryId;
exports.DragonNewsController = {
    getCategories: exports.getCategories,
    getNews: exports.getNews,
    getSingleNews: exports.getSingleNews,
    getNewsByCategoryId: exports.getNewsByCategoryId,
};
