import { Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/send-response";
import httpStatus from "http-status-codes";
import AppError from "../../helpers/app-error";
import { jsSeriesService } from "./js-series.service";




// Extend Request to include authenticated user
// interface any extends Request {
//   user?: {
//     id: string;
//     role: string; // assuming you have role in user object (e.g., "ADMIN" | "USER")
//   };
// }

// ========================
// Get All Series (with user progress if logged in)
// ========================
export const getJsSeriesList = catchAsync(
  async (req: any, res: Response) => {
    const userId = req.user?.id;

    // Public access allowed — userId optional for progress
    const result = await jsSeriesService.getJsSeriesList(userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Series list retrieved successfully!",
      data: result,
    });
  }
);

export const getJsSeriesNameAndId = catchAsync(
  async (req: any, res: Response) => {
    // Public access allowed — userId optional for progress
    const result = await jsSeriesService.getJsSeriesNameAndId();

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Series list retrieved successfully!",
      data: result,
    });
  }
);

// ========================
// Get Single Series by ID (with problems + progress)
// ========================
export const getJsSeriesById = catchAsync(
  async (req: any, res: Response) => {
    const userId = req.user?.id;
    const seriesId = Number(req.params.id);

    if (isNaN(seriesId)) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid series ID");
    }

    const result = await jsSeriesService.getJsSeriesById(seriesId, userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Series retrieved successfully!",
      data: result,
    });
  }
);

// getJsSingleSeriesByIdAndTags
export const getJsSingleSeriesByIdAndCategories = catchAsync(
  async (req: any, res: Response) => {
    const userId = req.user?.id;
    const seriesId = Number(req.params.id);

    if (isNaN(seriesId)) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid series ID");
    }

    const result = await jsSeriesService.getJsSingleSeriesByIdAndCategories(seriesId, userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Series retrieved successfully!",
      data: result,
    });
  }
);

// ========================
// Create New Series (Admin only)
// ========================
export const createJsSeries = catchAsync(
  async (req: any, res: Response) => {
    if (req.user?.role !== "ADMIN") {
      throw new AppError(httpStatus.FORBIDDEN, "Only admins can create series");
    }

    const { title, description, picture } = req.body;

    if (!title) {
      throw new AppError(httpStatus.BAD_REQUEST, "Title is required");
    }

    const result = await jsSeriesService.createJsSeries({
      title,
      description: description || null,
      picture: picture || null,
    });

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Series created successfully!",
      data: result,
    });
  }
);

// ========================
// Update Series (Admin only)
// ========================
export const updateJsSeries = catchAsync(
  async (req: any, res: Response) => {
    if (req.user?.role !== "ADMIN") {
      throw new AppError(httpStatus.FORBIDDEN, "Only admins can update series");
    }

    const seriesId = Number(req.params.id);
    if (isNaN(seriesId)) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid series ID");
    }

    const { title, description, picture } = req.body;

    if (!title && !description && picture === undefined) {
      throw new AppError(httpStatus.BAD_REQUEST, "At least one field to update is required");
    }

    const result = await jsSeriesService.updateJsSeries(seriesId, {
      title,
      description: description ?? undefined,
      picture: picture ?? undefined,
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Series updated successfully!",
      data: result,
    });
  }
);

// ========================
// Delete Series (Admin only)
// ========================
export const deleteJsSeries = catchAsync(
  async (req: any, res: Response) => {
    if (req.user?.role !== "ADMIN") {
      throw new AppError(httpStatus.FORBIDDEN, "Only admins can delete series");
    }

    const seriesId = Number(req.params.id);
    if (isNaN(seriesId)) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid series ID");
    }

    await jsSeriesService.deleteJsSeries(seriesId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Series deleted successfully!",
      data: null,
    });
  }
);

// ========================
// Add Problem to Series (Admin only)
// ========================
export const addProblemToSeries = catchAsync(
  async (req: any, res: Response) => {
    if (req.user?.role !== "ADMIN") {
      throw new AppError(httpStatus.FORBIDDEN, "Only admins can modify series problems");
    }

    const seriesId = Number(req.body.seriesId);
    const problemId = Number(req.body.problemId);
    const order = Number(req.body.order);

    if (isNaN(seriesId) || isNaN(problemId) || isNaN(order)) {
      throw new AppError(httpStatus.BAD_REQUEST, "seriesId, problemId, and order must be numbers");
    }

    const result = await jsSeriesService.addProblemToSeries({
      seriesId,
      problemId,
      order,
    });

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Problem added to series successfully!",
      data: result,
    });
  }
);

// ========================
// Remove Problem from Series (Admin only)
// ========================
export const removeProblemFromSeries = catchAsync(
  async (req: any, res: Response) => {
    if (req.user?.role !== "ADMIN") {
      throw new AppError(httpStatus.FORBIDDEN, "Only admins can modify series problems");
    }

    const seriesId = Number(req.params.seriesId);
    const problemId = Number(req.params.problemId);

    if (isNaN(seriesId) || isNaN(problemId)) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid seriesId or problemId");
    }

    await jsSeriesService.removeProblemFromSeries(seriesId, problemId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Problem removed from series successfully!",
      data: null,
    });
  }
);

// ========================
// Reorder Problems in Series (Admin only)
// ========================
export const reorderProblemsInSeries = catchAsync(
  async (req: any, res: Response) => {
    if (req.user?.role !== "ADMIN") {
      throw new AppError(httpStatus.FORBIDDEN, "Only admins can reorder series problems");
    }

    const { seriesId, orderedProblemIds } = req.body;

    if (!seriesId || !Array.isArray(orderedProblemIds)) {
      throw new AppError(httpStatus.BAD_REQUEST, "seriesId and orderedProblemIds array are required");
    }

    await jsSeriesService.reorderProblemsInSeries({
      seriesId: Number(seriesId),
      orderedProblemIds: orderedProblemIds.map(Number),
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Problems reordered successfully!",
      data: null,
    });
  }
);

export const JsSeriesController = {
    getJsSeriesList,
    getJsSeriesNameAndId,
    getJsSeriesById,
    getJsSingleSeriesByIdAndCategories,
    createJsSeries,
    updateJsSeries,
    deleteJsSeries,
    addProblemToSeries,
    removeProblemFromSeries,
    reorderProblemsInSeries,
}