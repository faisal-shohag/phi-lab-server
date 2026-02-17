import { Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/send-response";
import { HttpStatusCode } from "axios";
import AppError from "../../helpers/app-error";
import { ProblemServices } from "./problem.service";


export const CreateProblem = catchAsync(
  async (req:any, res: Response) => {
    const { user } = req;
    if (!user) throw new AppError(401, "User not found... Unauthorized!");
    const result = ProblemServices.createProblem(req.body, user.id)
    sendResponse(res, {
      statusCode: HttpStatusCode.Ok,
      success: true,
      message: "Problem created successfully!",
      data: result,
    });
  }
);

export const GetProblems = catchAsync(
  async (req:any, res: Response) => {
    const { user } = req;
    if (!user) throw new AppError(401, "User not found... Unauthorized!");
    const result = await ProblemServices.getProblems(req.query, user.id);
    sendResponse(res, {
      statusCode: HttpStatusCode.Ok,
      success: true,
      message: "Problems retrieved successfully!",
      data: result,
    });
  }
);


export const GetProblemBySlug = catchAsync(
  async (req:any, res: Response) => {
    const { user } = req;
    if (!user) throw new AppError(401, "User not found... Unauthorized!");
    const result = await ProblemServices.getProblemBySlug(req.params.slug, user.id);
    sendResponse(res, {
      statusCode: HttpStatusCode.Ok,
      success: true,
      message: "Problems retrieved successfully!",
      data: result,
    });
  }
);

export const GetSubmissionByProblemId = catchAsync(
  async (req:any, res: Response) => {
    const { user } = req;
    if (!user) throw new AppError(401, "User not found... Unauthorized!");
    const result = await ProblemServices.getSubmissionByProblemId(Number(req.params.id), user.id);
    sendResponse(res, {
      statusCode: HttpStatusCode.Ok,
      success: true,
      message: "Problem retrieved successfully!",
      data: result,
    });
  }
);

export const GetJsGlobalLeaderboard = catchAsync(
  async (req:any, res: Response) => {
    const { user } = req;
    if (!user) throw new AppError(401, "User not found... Unauthorized!");
    const result = await ProblemServices.getJsGlobalLeaderboard(req.query);
    sendResponse(res, {
      statusCode: HttpStatusCode.Ok,
      success: true,
      message: "Js Global Leaderboard retrieved successfully!",
      data: result,
    });
  }
)

export const ProblemController = {
  CreateProblem,
  GetProblems,
  GetProblemBySlug,
  GetSubmissionByProblemId,
  GetJsGlobalLeaderboard
};