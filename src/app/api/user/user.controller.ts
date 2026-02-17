import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/send-response";
import httpStatus from "http-status-codes";
import { UserServices } from "./user.service";
import { TokenPayload } from "../auth/auth.interface";
import { UsernameSchema } from "../auth/auth.validation";
import AppError from "../../helpers/app-error";

export const getMe = catchAsync(async (req: any, res: Response) => {
  const payload: TokenPayload = req.user as TokenPayload;
  const user = await UserServices.getMe(payload.id);
  // console.log(user)
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Your profile retrieved successfully!",
    data: user,
  });
});

export const getAllUser = catchAsync(async (req: Request, res: Response) => {
  const { users } = await UserServices.getAllUser();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Your profile retrieved successfully!",
    data: users,
  });
});

export const getUserProfileInfo = catchAsync(
  async (req: Request, res: Response) => {
    const payload: TokenPayload = req.user as TokenPayload;
    const user = await UserServices.getUserProfileInfo(payload.id);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Your profile retrieved successfully!",
      data: user,
    });
  }
);

export const getUserAdditionalInfo = catchAsync(
  async (req: Request, res: Response) => {
    const payload: TokenPayload = req.user as TokenPayload;
    const user = await UserServices.getUserAdditionalInfo(payload.id);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Your profile retrieved successfully!",
      data: user,
    });
  }
);

export const updateUser = catchAsync(async (req: Request, res: Response) => {
  const payload: TokenPayload = req.user as TokenPayload;
  const user = await UserServices.updateUser(payload.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Your profile retrieved successfully!",
    data: user,
  });
});

//updateUsername with zod validation no special character only "-", "_" is allowed
export const updateUsername = catchAsync(async (req: Request, res: Response) => {
  const payload: TokenPayload = req.user as TokenPayload;
  const username = req.body.username;

  // console.log(username)


 
  const validated = UsernameSchema.parse({username})
  // console.log(validated)
  if(validated.username !== username){
    throw new AppError(httpStatus.NOT_ACCEPTABLE, "Username is not valid")
  }

  const user = await UserServices.updateUsername(payload.id, username);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Your profile retrieved successfully!",
    data: user,
  });
});

export const UserControllers = {
  getMe,
  getAllUser,
  getUserProfileInfo,
  getUserAdditionalInfo,
  updateUser,
  updateUsername
};
