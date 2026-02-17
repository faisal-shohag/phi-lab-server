import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/send-response";
import httpStatus from "http-status-codes";
import AppError from "../../helpers/app-error";
import { UploadServices } from "./upload.service";


export const CloudinaryUpload = catchAsync(
  async (req: Request, res: Response) => {
    const { file, folder } = req.body;

    if (!file || !folder) {
      throw new AppError(httpStatus.BAD_REQUEST, "Image and folder is required!");
    }

    const result = await UploadServices.uploadImageToCloudinary({file, folder});

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Image uploaded successfully!",
      data: result,
    });
  }
)

export const CloudinaryUploadProfileImage = catchAsync(
  async (req: Request, res: Response) => {
    const { file, folder, previousImageURL } = req.body;

    if (!file || !folder) {
      throw new AppError(httpStatus.BAD_REQUEST, "Image and folder is required!");
    }

    const result = await UploadServices.uploadProfileImageToCloudinary({file, folder, previousImageURL});

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Image uploaded successfully!",
      data: result,
    });
  }
)


export const CloudinaryGetImages = catchAsync(
  async (req: Request, res: Response) => {
    const { folder } = req.body;

    if (!folder) {
      throw new AppError(httpStatus.BAD_REQUEST, "Folder is required");
    }

    const result = await UploadServices.getImagesByFolder(folder);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Images retrieved successfully!",
      data: result,
    });
  }
)

export const CloudinaryDeleteImage = catchAsync(
  async (req: Request, res: Response) => {
    const { publicId } = req.body;

    if (!publicId) {
      throw new AppError(httpStatus.BAD_REQUEST, "Public ID is required");
    }

    const result = await UploadServices.deleteImageFromCloudinary(publicId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Image deleted successfully!",
      data: result,
    });
  }
)

export const UploadControllers = {
    CloudinaryUpload,
    CloudinaryGetImages,
    CloudinaryDeleteImage,
    CloudinaryUploadProfileImage
}