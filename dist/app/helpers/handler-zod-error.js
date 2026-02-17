"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlerZodError = void 0;
const handlerZodError = (err) => {
    const errorSources = JSON.parse(err).map(e => e.message);
    return {
        statusCode: 400,
        message: "Zod Error",
        errorSources
    };
};
exports.handlerZodError = handlerZodError;
