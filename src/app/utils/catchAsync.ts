import { NextFunction, Response } from "express";



type AsyncHanlder = (
  req:any,
  res: Response,
  next: NextFunction
) => Promise<any>;

export const catchAsync = (fn: AsyncHanlder) => {
  return (req:any, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      next(err);
    });
  };
};