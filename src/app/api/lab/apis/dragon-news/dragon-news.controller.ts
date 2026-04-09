import { Request, Response } from "express";
import categories from "./category.json";
import news from "./news.json";

//news categories
export const getCategories = (req: Request, res: Response) => {
  return res.status(200).json({
    status: "success",
    message: "News categories fetched successfully",
    data: categories,
  });
};

// all news
export const getNews = (req: Request, res: Response) => {
  res.json({
    status: "success",
    message: "News fetched successfully",
    data: news,
  });
};

//get single news
export const getSingleNews = (req: Request, res: Response) => {
    const { id } = req.params;
    const singleNews = news.find((n) => n.id === id);
    if(!singleNews) {
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

//get news by category id
export const getNewsByCategoryId = (req: Request, res: Response) => {
    const { id } = req.params;
    const newsByCategory = news.filter((n) => n.category_id == Number(id));
    // console.log(newsByCategory)
    if(newsByCategory.length === 0) {
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

}


export const DragonNewsController = {
    getCategories,
    getNews,
    getSingleNews,
    getNewsByCategoryId,
}