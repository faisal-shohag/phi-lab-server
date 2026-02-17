import { Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/send-response";
import { HttpStatusCode } from "axios";
// import AppError from "../../helpers/app-error";
import { CssCreationService } from "./css-creation.service";

export const CssTargetCreation = catchAsync(
  async (req:any, res: Response) => {
    // const {user} = req
    const {code } = req.body;
    // if(!user) throw new AppError(401, "User not found... Unauthorized!")
    const result = await CssCreationService.CreateCSSTarget(code);
    sendResponse(res, {
      statusCode: HttpStatusCode.Ok,
      success: true,
      message: "CSS comparison done!",
      data: result,
    });
  }
);

export const CssCreationControllers = {
  CssTargetCreation,
};