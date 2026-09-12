import { Request, Response } from "express";
import categories from "./categories.json";
import photos from "./photos.json";

//news categories
export const getCategories = (req: Request, res: Response) => {
  return res.status(200).json({
    status: "success",
    message: "Photo categories fetched successfully",
    data: categories,
  });
};

// all news
export const getPhotos = (req: Request, res: Response) => {
  res.json({
    status: "success",
    message: "Photos fetched successfully",
    data: photos,
  });
};

//get single news
export const getSinglePhoto = (req: Request, res: Response) => {
    const { id } = req.params;
    const singlePhoto = photos.find((n) => n.id === Number(id));
    if(!singlePhoto) {
        return res.status(404).json({
            status: "error",
            message: `No Photo found with id ${id}`,
        });
    }
    return res.status(200).json({
        status: "success",
        message: `Photos with id ${id} fetched successfully`,
        data: singlePhoto,
    });
};

//get photos by category id
export const getPhotosByCategoryName = (req: Request, res: Response) => {
    const { id } = req.params;
    const category = categories.find((c) => c.id === Number(id));
    if(!category) {
        return res.status(404).json({
            status: "error",
            message: `No category found with id ${id}`,
        });
    }
    const photosByCategory = photos.filter((n) => n.category.toLowerCase() == category.name.toLowerCase());
    if(photosByCategory.length === 0) {
        return res.status(404).json({
            status: "error",
            message: `No photo found with categoryId ${id}`,
        });
    }
    return res.status(200).json({
        status: "success",
        message: `Photos with categoryId ${id} fetched successfully`,
        data: photosByCategory,
    });

}


export const IllustraController = {
    getCategories,
    getPhotos,
    getSinglePhoto,
    getPhotosByCategoryName
}