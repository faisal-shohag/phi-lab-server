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
exports.CheckerController = exports.WebsiteCheckController = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const send_response_1 = require("../../utils/send-response");
const axios_1 = require("axios");
const checker_service_1 = require("./checker.service");
exports.WebsiteCheckController = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { url } = req.body;
    const result = yield checker_service_1.CheckService.CheckWebsite(url);
    (0, send_response_1.sendResponse)(res, {
        statusCode: axios_1.HttpStatusCode.Ok,
        success: true,
        message: "CSS comparison done!",
        data: result,
    });
}));
exports.CheckerController = { WebsiteCheckController: exports.WebsiteCheckController };
