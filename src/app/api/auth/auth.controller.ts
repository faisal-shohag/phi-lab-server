import { catchAsync } from "../../utils/catchAsync";
import { sendEmail } from "../../utils/mailer";
import { sendResponse } from "../../utils/send-response";
import httpStatus from "http-status-codes";
import {
  createAndSendOTP,
  loginWithPassword,
  logout,
  refreshAccessToken,
  registerWithPassword,
  resetPassword,
  verifyOTP,
} from "./auth.service";
import { saveToken } from "../../utils/save-token";
import AppError from "../../helpers/app-error";
import { envVars } from "../../config/env";

export const registerController = catchAsync(async (req, res) => {
  const { email, password, name, picture } = req.body;
  const user = await registerWithPassword(email, password, name, picture);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "User created successfully",
    data: user,
  });
});

export const loginWithPasswordConroller = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password);
  const result = await loginWithPassword(email, password);
  sendResponse(res, {
    statusCode: httpStatus.ACCEPTED,
    success: true,
    message: "OTP sent successfully!",
    data: result,
  });
});

export const requestOTPController = catchAsync(async (req, res) => {
  const { email } = req.body;
  await createAndSendOTP(email, sendEmail);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "OTP sent!",
    data: {},
  });
});

export const verifyOTPController = catchAsync(async (req, res) => {
  const { email, otp } = req.body;
  const { access, user } = await verifyOTP(email, otp, res);
  sendResponse(res, {
    statusCode: httpStatus.ACCEPTED,
    success: true,
    message: "OTP verified!",
    data: { access, user },
  });
});

export const resetPasswordController = catchAsync(async (req, res) => {
  const { email, password, otp } = req.body;
  const user = await resetPassword(res, email, password, otp);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password was reset successfully and user has been logged in!",
    data: user,
  });
});

export const logoutController = catchAsync(async (req, res) => {
  await logout(res);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Logged out successfully!",
    data: null,
  });
});

export const refreshController = catchAsync(async (req, res) => {
  const { access, refresh, user } = await refreshAccessToken(req, res);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Token refreshed successfully!",
    data: { access, refresh, user },
  });
});

export const googleOAuth = catchAsync(async (req, res) => {
  const user = req.user;

  let redirectTo = req.query.state ? (req.query.state as string) : "";

  if (redirectTo.startsWith("/")) {
    redirectTo = redirectTo.slice(1);
  }

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
  }
  saveToken(res, user);
  res.redirect(`${envVars.CLIENT_URL}/${redirectTo}`);
});

export const githubOAuth = catchAsync(async (req, res) => {
  const user = req.user;

  let redirectTo = req.query.state ? (req.query.state as string) : "";

  if (redirectTo.startsWith("/")) {
    redirectTo = redirectTo.slice(1);
  }

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
  }
  saveToken(res, user);
  res.redirect(`${envVars.CLIENT_URL}/${redirectTo}`);
});

