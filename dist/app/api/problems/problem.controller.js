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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProblemController = exports.GetJsGlobalLeaderboard = exports.GetSubmissionByProblemId = exports.GetProblemBySlug = exports.GetProblems = exports.CreateProblem = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const send_response_1 = require("../../utils/send-response");
const axios_1 = require("axios");
const app_error_1 = __importDefault(require("../../helpers/app-error"));
const problem_service_1 = require("./problem.service");
exports.CreateProblem = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user } = req;
    if (!user)
        throw new app_error_1.default(401, "User not found... Unauthorized!");
    const result = problem_service_1.ProblemServices.createProblem(req.body, user.id);
    (0, send_response_1.sendResponse)(res, {
        statusCode: axios_1.HttpStatusCode.Ok,
        success: true,
        message: "Problem created successfully!",
        data: result,
    });
}));
exports.GetProblems = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user } = req;
    if (!user)
        throw new app_error_1.default(401, "User not found... Unauthorized!");
    const result = yield problem_service_1.ProblemServices.getProblems(req.query, user.id);
    (0, send_response_1.sendResponse)(res, {
        statusCode: axios_1.HttpStatusCode.Ok,
        success: true,
        message: "Problems retrieved successfully!",
        data: result,
    });
}));
exports.GetProblemBySlug = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user } = req;
    if (!user)
        throw new app_error_1.default(401, "User not found... Unauthorized!");
    const result = yield problem_service_1.ProblemServices.getProblemBySlug(req.params.slug, user.id);
    (0, send_response_1.sendResponse)(res, {
        statusCode: axios_1.HttpStatusCode.Ok,
        success: true,
        message: "Problems retrieved successfully!",
        data: result,
    });
}));
exports.GetSubmissionByProblemId = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user } = req;
    if (!user)
        throw new app_error_1.default(401, "User not found... Unauthorized!");
    const result = yield problem_service_1.ProblemServices.getSubmissionByProblemId(Number(req.params.id), user.id);
    (0, send_response_1.sendResponse)(res, {
        statusCode: axios_1.HttpStatusCode.Ok,
        success: true,
        message: "Problem retrieved successfully!",
        data: result,
    });
}));
exports.GetJsGlobalLeaderboard = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user } = req;
    if (!user)
        throw new app_error_1.default(401, "User not found... Unauthorized!");
    const result = yield problem_service_1.ProblemServices.getJsGlobalLeaderboard(req.query);
    (0, send_response_1.sendResponse)(res, {
        statusCode: axios_1.HttpStatusCode.Ok,
        success: true,
        message: "Js Global Leaderboard retrieved successfully!",
        data: result,
    });
}));
exports.ProblemController = {
    CreateProblem: exports.CreateProblem,
    GetProblems: exports.GetProblems,
    GetProblemBySlug: exports.GetProblemBySlug,
    GetSubmissionByProblemId: exports.GetSubmissionByProblemId,
    GetJsGlobalLeaderboard: exports.GetJsGlobalLeaderboard
};
