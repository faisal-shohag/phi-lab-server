import { Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/send-response";
import { HttpStatusCode } from "axios";
import { CheckService } from "./checker.service";

export const WebsiteCheckController = catchAsync(async (req: any, res: Response) => {

  const { url} = req.body;
  const result = await CheckService.CheckWebsite(
   url
  );
  sendResponse(res, {
    statusCode: HttpStatusCode.Ok,
    success: true,
    message: "CSS comparison done!",
    data: result,
  });
});

export const CheckerController = {WebsiteCheckController}
