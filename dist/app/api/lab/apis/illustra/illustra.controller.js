"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IllustraController = exports.getPhotosByCategoryName = exports.getSinglePhoto = exports.getPhotos = exports.getCategories = void 0;
const categories_json_1 = __importDefault(require("./categories.json"));
const photos_json_1 = __importDefault(require("./photos.json"));
//news categories
const getCategories = (req, res) => {
    return res.status(200).json({
        status: "success",
        message: "Photo categories fetched successfully",
        data: categories_json_1.default,
    });
};
exports.getCategories = getCategories;
// all news
const getPhotos = (req, res) => {
    res.json({
        status: "success",
        message: "Photos fetched successfully",
        data: photos_json_1.default,
    });
};
exports.getPhotos = getPhotos;
//get single news
const getSinglePhoto = (req, res) => {
    const { id } = req.params;
    const singlePhoto = photos_json_1.default.find((n) => n.id === Number(id));
    if (!singlePhoto) {
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
exports.getSinglePhoto = getSinglePhoto;
//get photos by category id
const getPhotosByCategoryName = (req, res) => {
    const { id } = req.params;
    const category = categories_json_1.default.find((c) => c.id === Number(id));
    if (!category) {
        return res.status(404).json({
            status: "error",
            message: `No category found with id ${id}`,
        });
    }
    const photosByCategory = photos_json_1.default.filter((n) => n.category.toLowerCase() == category.name.toLowerCase());
    if (photosByCategory.length === 0) {
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
};
exports.getPhotosByCategoryName = getPhotosByCategoryName;
exports.IllustraController = {
    getCategories: exports.getCategories,
    getPhotos: exports.getPhotos,
    getSinglePhoto: exports.getSinglePhoto,
    getPhotosByCategoryName: exports.getPhotosByCategoryName
};
