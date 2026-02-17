import bcrypt from "bcryptjs";
import { prisma } from "../../config/db";
import { hashString } from "../../utils/crypto";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../utils/generate-token";
import { Request, Response } from "express";
import { envVars } from "../../config/env";
// import { msFromString } from "../../helpers/msFromString";
import { AuthResponse, TokenPayload } from "./auth.interface";
import jwt from "jsonwebtoken";
import { OTPSchema, RefreshTokenSchema } from "./auth.validation";
import { z } from "zod";
import { sendEmail } from "../../utils/mailer";
import AppError from "../../helpers/app-error";
import { verifyOTPOnly } from "../../helpers/verifyOTP";

import httpStatus from "http-status-codes";
import { Role, User } from "../../../generated/prisma/client";
import { otpEmailHTML } from "../../const/email.const";
import { addMinutesDhaka, nowDhaka } from "../../helpers/time";
import { maxAge, SALT } from "../../utils/constants";

export const registerWithPassword = async (
  email: string,
  password: string,
  name?: string,
  picture?: string,
) => {
  // Check if user exists
  const isExist = await prisma.user.findUnique({
    where: { email },
  });

  if (isExist) {
    throw new AppError(401, "User already exist!");
  }

  // Hash password and create user
  const hashed = await bcrypt.hash(password, SALT);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      name,
      picture,
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  const otp = await createAndSendOTP(email, sendEmail);

  return {user, otp};
};

export const loginWithPassword = async (email: string, password: string) => {
  // Find user
  const user: User = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      password: true,
    },
  }) as User;

  if (!user || !user.password) {
    throw new AppError(401, "User with this email is not registered!");
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new AppError(401, "Incorrect password!");
  }

  // Generate tokens
  // const access = generateAccessToken({ sub: user.id, email: user.email });
  // const refresh = generateRefreshToken({ sub: user.id });

  // Set access token cookie
  // res.cookie("lab_token", access, {
  //   httpOnly: true,
  //   maxAge: maxAge * 1000,
  //   sameSite: envVars.NODE_ENV === "development" ? "strict" : "none",
  //   secure: envVars.NODE_ENV !== "development",
  // });

  //   res.cookie("lab_refesh", refresh, {
  //   httpOnly: true,
  //   maxAge: maxAge * 1000,
  //   sameSite: envVars.NODE_ENV === "development" ? "strict" : "none",
  //   secure: envVars.NODE_ENV !== "development",
  // });

  // Store refresh token hash
  // await prisma.refreshToken.upsert({
  //   where: { userId: user.id },
  //   update: {
  //     tokenHash: hashString(refresh),
  //     expiresAt: new Date(Date.now() + msFromString("360d")),
  //   },
  //   create: {
  //     userId: user.id,
  //     tokenHash: hashString(refresh),
  //     expiresAt: new Date(Date.now() + msFromString("360d")),
  //   }
  // });

  // Return sanitized response
   await createAndSendOTP(email, sendEmail);
};

export const createAndSendOTP = async (
  email: string,
  sendFn: (to: string, subject: string, html: string) => Promise<any>
) => {
  // Validate email
  const validated = z
    .object({
      email: z.email("Invalid email format"),
    })
    .parse({ email });

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { email: validated.email },
  });

  if (!user) throw new AppError(400, "Please register first!");

  // Generate OTP
  const otpPlain = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = hashString(otpPlain);

  const expiresAt = addMinutesDhaka(Number(envVars.OTP_EXPIRES_MIN || "10"));


  // Upsert OTP
  await prisma.oTP.upsert({
    where: { email: validated.email },
    update: {
      codeHash: otpHash,
      expiresAt,
      used: false,
      createdAt: new Date(),
    },
    create: {
      email: validated.email,
      userId: user.id,
      codeHash: otpHash,
      expiresAt,
    },
  });

  // const html = `<p>Your OTP is <strong>${otpPlain}</strong>. It expires in ${
  //   envVars.OTP_EXPIRES_MIN || "10"
  // } minutes.</p>`;

  await sendFn(validated.email, "Your OTP code", otpEmailHTML(otpPlain));

  return { ok: true };
};

export const verifyOTP = async (
  email: string,
  otp: string,
  res: Response
): Promise<AuthResponse> => {
  // Validate input
  const validated = OTPSchema.parse({ email, otp });

  const otpHash = hashString(validated.otp);

  // Find and verify OTP
  const record = await prisma.oTP.findFirst({
    where: {
      email: validated.email,
      codeHash: otpHash,
      expiresAt: { gt: nowDhaka() },
      used: false,
    },
  });

  if (!record) throw new AppError(400, "Invalid or expired OTP");

  // delete verified otp
  await prisma.oTP.delete({
    where: { email: validated.email },
  });

  // Get user
  const user:User = await prisma.user.findUnique({
    where: { email: validated.email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  }) as User;

  if (!user) throw new AppError(400, "Please register first!");

  // Generate tokens
  const access = generateAccessToken({ sub: user.id, id: user.id, email: user.email, role: user.role });
  const refresh = generateRefreshToken({ sub: user.id, id: user.id, email: user.email, role: user.role });

  // Set access token cookie
  res.cookie("lab_token", access, {
    httpOnly: true,
    maxAge: maxAge * 1000,
    sameSite: envVars.NODE_ENV === "development" ? "strict" : "none",
    secure: envVars.NODE_ENV !== "development",
  });

  res.cookie("lab_refesh", refresh, {
    httpOnly: true,
    maxAge: maxAge * 1000,
    sameSite: envVars.NODE_ENV === "development" ? "strict" : "none",
    secure: envVars.NODE_ENV !== "development",
  });

  // // Store refresh token hash
  // await prisma.refreshToken.upsert({
  //   where: { userId: user.id },
  //   update: {
  //     tokenHash: hashString(refresh),
  //     expiresAt: new Date(Date.now() + msFromString("360d")),
  //   },
  //   create: {
  //     userId: user.id,
  //     tokenHash: hashString(refresh),
  //     expiresAt: new Date(Date.now() + msFromString("360d")),
  //   }
  // });

  return { access, refresh, user };
};

export const verifyAccessToken = (token: string): TokenPayload | null => {
  const secret = envVars.JWT_ACCESS_SECRET;
  if (!secret) throw new AppError(401, "JWT_SECRET not configured");
  const decoded = jwt.verify(token, secret) as TokenPayload;
  return decoded;
};

export const verifyAccessTokenLoose = (token: string): TokenPayload | null => {
  const secret = envVars.JWT_ACCESS_SECRET;
  
  if (!secret || !token) return {sub: "", id: "", role: Role.USER}
  const decoded = jwt.verify(token, secret) as TokenPayload;
  return decoded;
};

export const refreshAccessToken = async (
  req:Request,
  res: Response
): Promise<AuthResponse> => {
  const refreshToken = req.cookies["lab_refesh"];
  const validated = RefreshTokenSchema.parse({ refreshToken });

  const secret = envVars.JWT_REFRESH_SECRET;
  if (!secret) throw new AppError(401, "JWT_SECRET not configured");

  const decoded = jwt.verify(validated.refreshToken, secret) as TokenPayload;

  // Check if refresh token exists and is not revoked
  // const storedToken = await prisma.refreshToken.findFirst({
  //   where: {
  //     userId: decoded.sub,
  //     tokenHash: hashString(validated.refreshToken),
  //     expiresAt: { gt: new Date() },
  //   },
  //   include: { user: true },
  // });

  if (!decoded) {
    throw new AppError(401, "Refresh token invalid or revoked");
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.sub },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found during generating new access token!");
  }

  // Generate new access token
  const newAccess = generateAccessToken({
    sub: user.id,
    email: user.email,
    id: user.id,
    role: user.role
  });

  // Set new access token cookie
  res.cookie("lab_token", newAccess, {
    httpOnly: true,
    maxAge: maxAge * 1000,
    sameSite: envVars.NODE_ENV === "development" ? "strict" : "none",
    secure: envVars.NODE_ENV !== "development",
  });

  return {
    access: newAccess,
    refresh: validated.refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    },
  };
};

export const logout = async (res: Response) => {
  res.clearCookie("lab_refesh");
  res.clearCookie("lab_token");
    res.cookie("lab_token", "", {
    httpOnly: true,
    maxAge: 0,
    sameSite: envVars.NODE_ENV === "development" ? "strict" : "none",
    secure: envVars.NODE_ENV !== "development",
  });

    res.cookie("lab_refesh", "", {
    httpOnly: true,
    maxAge: 0,
    sameSite: envVars.NODE_ENV === "development" ? "strict" : "none",
    secure: envVars.NODE_ENV !== "development",
  });
  return { ok: true, user: null };
};

export const resetPassword = async (
  res: Response,
  email: string,
  newPassword: string,
  otp: string
) => {
  const isVerified = await verifyOTPOnly(email, otp);
  if (!isVerified) {
    throw new AppError(401, "OTP verification failed!");
  }
  const hashed = await bcrypt.hash(newPassword, SALT);
  const user = await prisma.user.update({
    where: {
      email,
    },
    data: {
      password: hashed,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  });

  const access = generateAccessToken({ sub: user.id, id: user.id, email: user.email, role: user.role });
  const refresh = generateRefreshToken({ sub: user.id, id: user.id, email: user.email, role: user.role });

  // // Set access token cookie
  res.cookie("lab_token", access, {
    httpOnly: true,
    maxAge: maxAge * 1000,
    sameSite: envVars.NODE_ENV === "development" ? "strict" : "none",
    secure: envVars.NODE_ENV !== "development",
  });

  res.cookie("lab_refesh", refresh, {
    httpOnly: true,
    maxAge: maxAge * 1000,
    sameSite: envVars.NODE_ENV === "development" ? "strict" : "none",
    secure: envVars.NODE_ENV !== "development",
  });

    return { access, refresh, user };
};
