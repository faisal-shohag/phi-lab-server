"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BooksController = exports.getBooksByCategory = exports.getSingleBook = exports.getCategories = exports.getBooks = void 0;
const books_json_1 = __importDefault(require("./books.json"));
// all books
const getBooks = (req, res) => {
    return res.status(200).json({
        status: "success",
        message: "Books fetched successfully",
        data: books_json_1.default,
    });
};
exports.getBooks = getBooks;
// distinct categories
const getCategories = (req, res) => {
    const categories = [...new Set(books_json_1.default.map((b) => b.category))];
    return res.status(200).json({
        status: "success",
        message: "Book categories fetched successfully",
        data: categories,
    });
};
exports.getCategories = getCategories;
// single book by bookId
const getSingleBook = (req, res) => {
    const { id } = req.params;
    const singleBook = books_json_1.default.find((b) => b.bookId === Number(id));
    if (!singleBook) {
        return res.status(404).json({
            status: "error",
            message: `No Book found with id ${id}`,
        });
    }
    return res.status(200).json({
        status: "success",
        message: `Book with id ${id} fetched successfully`,
        data: singleBook,
    });
};
exports.getSingleBook = getSingleBook;
// books by category name
const getBooksByCategory = (req, res) => {
    const { category } = req.params;
    const booksByCategory = books_json_1.default.filter((b) => b.category.toLowerCase() === category.toLowerCase());
    if (booksByCategory.length === 0) {
        return res.status(404).json({
            status: "error",
            message: `No book found with category ${category}`,
        });
    }
    return res.status(200).json({
        status: "success",
        message: `Books with category ${category} fetched successfully`,
        data: booksByCategory,
    });
};
exports.getBooksByCategory = getBooksByCategory;
exports.BooksController = {
    getBooks: exports.getBooks,
    getCategories: exports.getCategories,
    getSingleBook: exports.getSingleBook,
    getBooksByCategory: exports.getBooksByCategory,
};
