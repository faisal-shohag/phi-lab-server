import { Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { CssService } from "./css.service";
import { sendResponse } from "../../utils/send-response";
import { HttpStatusCode } from "axios";
import AppError from "../../helpers/app-error";

export const CompareCss = catchAsync(async (req: any, res: Response) => {
  const { user } = req;
  const { battleId, code, targetURL } = req.body;
  if (!user) throw new AppError(401, "User not found... Unauthorized!");
  const result = await CssService.CompareCss(
    battleId,
    code,
    targetURL,
    user.id
  );
  sendResponse(res, {
    statusCode: HttpStatusCode.Ok,
    success: true,
    message: "CSS comparison done!",
    data: result,
  });
});

export const CompareCssV2 = catchAsync(async (req: any, res: Response) => {
  // const { user } = req;
  const { battleId, code, targetURL, userId } = req.body;
  if (!userId) throw new AppError(401, "User not found... Unauthorized!");
  const result = await CssService.CompareCssV2(
    battleId,
    code,
    targetURL,
    userId
  );
  sendResponse(res, {
    statusCode: HttpStatusCode.Ok,
    success: true,
    message: "CSS comparison done!",
    data: result,
  });
});

export const createSubmission = catchAsync(async (req: any, res: Response) => {
  const { user } = req;
  const { battleId, code, accuracy, score } = req.body;
  if (!user) throw new AppError(401, "User not found... Unauthorized!");
  const result = await CssService.createSubmission(
    user.id,
    battleId,
    score,
    code,
    accuracy
  );
  sendResponse(res, {
    statusCode: HttpStatusCode.Ok,
    success: true,
    message: "Submission created successfully!",
    data: result,
  });
});

export const getBattleByNo = catchAsync(async (req: any, res: Response) => {
  const { user } = req;
  if (!user) throw new AppError(401, "User not found... Unauthorized!");
  const { battleNo } = req.params;
  const result = await CssService.getBattleByNo(parseInt(battleNo), user.id);
  sendResponse(res, {
    statusCode: HttpStatusCode.Ok,
    success: true,
    message: "Battle is retrieved successfully!",
    data: result,
  });
});

export const createCollection = catchAsync(async (req: any, res: Response) => {
  const { user } = req;
  if (!user) throw new AppError(401, "User not found... Unauthorized!");
  const { title, description, picture } = req.body;
  const result = await CssService.createCollection(title, description, picture);
  sendResponse(res, {
    statusCode: HttpStatusCode.Ok,
    success: true,
    message: "Collection created successfully!",
    data: result,
  });
});

export const getCollections = catchAsync(async (req: any, res: Response) => {
  const { limit } = req.query;
  const result = await CssService.getCollections(Number(limit));
  sendResponse(res, {
    statusCode: HttpStatusCode.Ok,
    success: true,
    message: "Collections retrieved successfully!",
    data: result,
  });
});

export const getCollectionById = catchAsync(async (req: any, res: Response) => {
  const { user } = req;
  if (!user) throw new AppError(401, "User not found... Unauthorized!");
  const { collectionId } = req.params;
  const result = await CssService.getCollectionById(
    parseInt(collectionId),
    user
  );
  sendResponse(res, {
    statusCode: HttpStatusCode.Ok,
    success: true,
    message: "Collection retrieved successfully!",
    data: result,
  });
});

export const createBattle = catchAsync(async (req: any, res: Response) => {
  const { user } = req;
  if (!user) throw new AppError(401, "User not found... Unauthorized!");
  const {
    title,
    description,
    target,
    size,
    collectionId,
    colors,
    assets,
    battleNo,
  } = req.body;
  const result = await CssService.createBattle(
    title,
    description,
    target,
    size,
    collectionId,
    colors,
    assets,
    battleNo
  );
  sendResponse(res, {
    statusCode: HttpStatusCode.Ok,
    success: true,
    message: "Battle created successfully!",
    data: result,
  });
});

export const deleteCollection = catchAsync(async (req: any, res: Response) => {
  const { user } = req;
  if (!user) throw new AppError(401, "User not found... Unauthorized!");
  const { collectionId } = req.params;
  const result = await CssService.deleteCollection(parseInt(collectionId));
  sendResponse(res, {
    statusCode: HttpStatusCode.Ok,
    success: true,
    message: "Collection deleted successfully!",
    data: result,
  });
});

export const deleteBattle = catchAsync(async (req: any, res: Response) => {
  const { user } = req;
  if (!user) throw new AppError(401, "User not found... Unauthorized!");
  const { battleId } = req.params;
  const result = await CssService.deleteBattle(parseInt(battleId));
  sendResponse(res, {
    statusCode: HttpStatusCode.Ok,
    success: true,
    message: "Battle deleted successfully!",
    data: result,
  });
});

export const getBattles = catchAsync(async (req: any, res: Response) => {
  const { user } = req;
  if (!user) throw new AppError(401, "User not found... Unauthorized!");
  // console.log(req.query)
  const filters: any = {
    cursor:
      req.query.cursor === "undefined" ? undefined : Number(req.query.cursor),
    limit: Number(req.query.limit),
    search: req.query.search,
    collectionId:
      req.query.collectionId === "undefined"
        ? undefined
        : Number(req.query.collectionId),
    sort: req.query.sort,
  };
  // console.log(filters)
  const result = await CssService.getBattles(user.id, filters);
  sendResponse(res, {
    statusCode: HttpStatusCode.Ok,
    success: true,
    message: "Battles retrieved successfully!",
    data: result,
  });
});

export const CssControllers = {
  CompareCss,
  CompareCssV2,
  createSubmission,
  getBattleByNo,
  createCollection,
  getCollections,
  getCollectionById,
  createBattle,
  deleteCollection,
  deleteBattle,
  getBattles,
};
