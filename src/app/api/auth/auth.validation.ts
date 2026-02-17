import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { catchAsync } from "../../utils/catchAsync";
export const RegisterSchema = z.object({
  email: z.email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters").regex(/[A-Z]/, "Password must contain an uppercase letter").regex(/[0-9]/, "Password must contain a number").regex(/[^a-zA-Z0-9]/, "Password must contain a special character"),
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
});

export const LoginSchema = z.object({
  email: z.email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const OTPSchema = z.object({
  email: z.email("Invalid email format"),
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "OTP must contain only digits"),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const PasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters").regex(/[A-Z]/, "Password must contain an uppercase letter").regex(/[0-9]/, "Password must contain a number").regex(/[^a-zA-Z0-9]/, "Password must contain a special character"),
})
//zod schema for username no special character only "-", "_" is allowed. no space is allowed. 
export const UsernameSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters").regex(/^[a-zA-Z0-9_-]+$/, "Username must contain only letters, numbers, hyphens, and underscores"),
})

export const registerValidation = catchAsync(async (req:Request, res:Response, next:NextFunction) => {
    RegisterSchema.parse(req.body)
    next()
})

export const loginValidation = catchAsync(async (req:Request, res:Response, next:NextFunction) => {
  LoginSchema.parse(req.body)
    next()
})

export const passwordValidation = catchAsync(async (req:Request, res:Response, next:NextFunction) => {
    PasswordSchema.parse(req.body)
    next()
})


