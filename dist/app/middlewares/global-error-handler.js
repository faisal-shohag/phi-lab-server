"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = void 0;
const env_1 = require("../config/env");
const handler_zod_error_1 = require("../helpers/handler-zod-error");
const app_error_1 = __importDefault(require("../helpers/app-error"));
const globalErrorHandler = (err, req, res, next) => {
    // if (envVars.NODE_ENV === "development" ) {
    console.log("Global Error:", err);
    // }
    let errorSources = [];
    let statusCode = 500;
    let message = "Something Went Wrong!!";
    //Duplicate error
    // if (err.code === 11000) {
    //     const simplifiedError = handlerDuplicateError(err)
    //     statusCode = simplifiedError.statusCode;
    //     message = simplifiedError.message
    // }
    // Object ID error / Cast Error
    // else if (err.name === "CastError") {
    //     const simplifiedError = handleCastError(err)
    //     statusCode = simplifiedError.statusCode;
    //     message = simplifiedError.message
    // }
    if (err.name === "ZodError") {
        const simplifiedError = (0, handler_zod_error_1.handlerZodError)(err);
        statusCode = simplifiedError.statusCode;
        message = simplifiedError.message;
        errorSources = simplifiedError.errorSources;
    }
    //Mongoose Validation Error
    // else if (err.name === "ValidationError") {
    //     const simplifiedError = handlerValidationError(err)
    //     statusCode = simplifiedError.statusCode;
    //     errorSources = simplifiedError.errorSources as TErrorSources[]
    //     message = simplifiedError.message
    // }
    else if (err instanceof app_error_1.default) {
        statusCode = err.statusCode;
        message = err.message;
    }
    else if (err instanceof Error) {
        statusCode = 500;
        message = err.message;
    }
    res.status(statusCode).json({
        success: false,
        message,
        errorSources,
        err: env_1.envVars.NODE_ENV === "development" ? err : null,
        stack: env_1.envVars.NODE_ENV === "development" ? err.stack : null
    });
};
exports.globalErrorHandler = globalErrorHandler;
