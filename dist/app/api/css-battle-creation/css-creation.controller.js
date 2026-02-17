"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CssCreationControllers = exports.CssTargetCreation = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const send_response_1 = require("../../utils/send-response");
const axios_1 = require("axios");
// import AppError from "../../helpers/app-error";
const css_creation_service_1 = require("./css-creation.service");
exports.CssTargetCreation = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // const {user} = req
    const { code } = req.body;
    // if(!user) throw new AppError(401, "User not found... Unauthorized!")
    const result = yield css_creation_service_1.CssCreationService.CreateCSSTarget(code);
    (0, send_response_1.sendResponse)(res, {
        statusCode: axios_1.HttpStatusCode.Ok,
        success: true,
        message: "CSS comparison done!",
        data: result,
    });
}));
exports.CssCreationControllers = {
    CssTargetCreation: exports.CssTargetCreation,
};
