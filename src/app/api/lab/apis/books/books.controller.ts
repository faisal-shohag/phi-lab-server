import { Request, Response } from "express";
import books from "./books.json";

// all books
export const getBooks = (req: Request, res: Response) => {
  return res.status(200).json({
    status: "success",
    message: "Books fetched successfully",
    data: books,
  });
};

// distinct categories
export const getCategories = (req: Request, res: Response) => {
  const categories = [...new Set(books.map((b) => b.category))];
  return res.status(200).json({
    status: "success",
    message: "Book categories fetched successfully",
    data: categories,
  });
};

// single book by bookId
export const getSingleBook = (req: Request, res: Response) => {
  const { id } = req.params;
  const singleBook = books.find((b) => b.bookId === Number(id));
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

// books by category name
export const getBooksByCategory = (req: Request, res: Response) => {
  const { category } = req.params;
  const booksByCategory = books.filter(
    (b) => b.category.toLowerCase() === category.toLowerCase()
  );
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

export const BooksController = {
  getBooks,
  getCategories,
  getSingleBook,
  getBooksByCategory,
};
