import { Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/send-response";
import { HttpStatusCode } from "axios";
import { LeaderboardService } from "./leaderboard.service";

import { TokenPayload } from "../auth/auth.interface";
import { verifyAccessTokenLoose } from "../auth/auth.service";

export const getGlobal = catchAsync(async (req: any, res: Response) => {
  const page = Number(req.query.page || 0);
  const token = req.cookies.lab_token;
  const payload: TokenPayload = verifyAccessTokenLoose(token) as TokenPayload;
  const result = await LeaderboardService.getGlobal(page, payload.id as string);
  sendResponse(res, {
    statusCode: HttpStatusCode.Ok,
    success: true,
    message: "Leaderboard is retrieved successfully!",
    data: result,
  });
});

export const getCollection = catchAsync(
  async (req: any, res: Response) => {
    const { collectionId } = req.params;
    const page = Number(req.query.page || 0);
    const userId = req.user?.id;

    const result = await LeaderboardService.getCollection(
      Number(collectionId),
      page,
      userId
    );
    sendResponse(res, {
      statusCode: HttpStatusCode.Ok,
      success: true,
      message: "Leaderboard is retrieved successfully!",
      data: result,
    });
  }
);

export const getBattle = catchAsync(async (req: any, res: Response) => {
  const { battleId } = req.params;
  const page = Number(req.query.page || 0);
  const userId = req.user?.id;

  const result = await LeaderboardService.getBattle(
    Number(battleId),
    page,
    userId
  );
  sendResponse(res, {
    statusCode: HttpStatusCode.Ok,
    success: true,
    message: "Leaderboard is retrieved successfully!",
    data: result,
  });
});

export const getJsGlobal = catchAsync(async (req: any, res: Response) => {
  const page = Number(req.query.page || 0);
  const token = req.cookies.lab_token;
  const payload: TokenPayload = verifyAccessTokenLoose(token) as TokenPayload;
  const result = await LeaderboardService.getJsGlobal(page, payload.id as string);
  sendResponse(res, {
    statusCode: HttpStatusCode.Ok,
    success: true,
    message: "JS Global leaderboard is retrieved successfully!",
    data: result,
  });
});



export const LeaderboardController = {
  getGlobal,
  getCollection,
  getBattle,
  getJsGlobal,
};
