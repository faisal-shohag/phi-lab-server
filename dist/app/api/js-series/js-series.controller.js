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
exports.JsSeriesController = exports.reorderProblemsInSeries = exports.removeProblemFromSeries = exports.addProblemToSeries = exports.deleteJsSeries = exports.updateJsSeries = exports.createJsSeries = exports.getJsSingleSeriesByIdAndCategories = exports.getJsSeriesById = exports.getJsSeriesNameAndId = exports.getJsSeriesList = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const send_response_1 = require("../../utils/send-response");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const app_error_1 = __importDefault(require("../../helpers/app-error"));
const js_series_service_1 = require("./js-series.service");
// Extend Request to include authenticated user
// interface any extends Request {
//   user?: {
//     id: string;
//     role: string; // assuming you have role in user object (e.g., "ADMIN" | "USER")
//   };
// }
// ========================
// Get All Series (with user progress if logged in)
// ========================
exports.getJsSeriesList = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    // Public access allowed — userId optional for progress
    const result = yield js_series_service_1.jsSeriesService.getJsSeriesList(userId);
    (0, send_response_1.sendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Series list retrieved successfully!",
        data: result,
    });
}));
exports.getJsSeriesNameAndId = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Public access allowed — userId optional for progress
    const result = yield js_series_service_1.jsSeriesService.getJsSeriesNameAndId();
    (0, send_response_1.sendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Series list retrieved successfully!",
        data: result,
    });
}));
// ========================
// Get Single Series by ID (with problems + progress)
// ========================
exports.getJsSeriesById = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const seriesId = Number(req.params.id);
    if (isNaN(seriesId)) {
        throw new app_error_1.default(http_status_codes_1.default.BAD_REQUEST, "Invalid series ID");
    }
    const result = yield js_series_service_1.jsSeriesService.getJsSeriesById(seriesId, userId);
    (0, send_response_1.sendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Series retrieved successfully!",
        data: result,
    });
}));
// getJsSingleSeriesByIdAndTags
exports.getJsSingleSeriesByIdAndCategories = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const seriesId = Number(req.params.id);
    if (isNaN(seriesId)) {
        throw new app_error_1.default(http_status_codes_1.default.BAD_REQUEST, "Invalid series ID");
    }
    const result = yield js_series_service_1.jsSeriesService.getJsSingleSeriesByIdAndCategories(seriesId, userId);
    (0, send_response_1.sendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Series retrieved successfully!",
        data: result,
    });
}));
// ========================
// Create New Series (Admin only)
// ========================
exports.createJsSeries = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "ADMIN") {
        throw new app_error_1.default(http_status_codes_1.default.FORBIDDEN, "Only admins can create series");
    }
    const { title, description, picture } = req.body;
    if (!title) {
        throw new app_error_1.default(http_status_codes_1.default.BAD_REQUEST, "Title is required");
    }
    const result = yield js_series_service_1.jsSeriesService.createJsSeries({
        title,
        description: description || null,
        picture: picture || null,
    });
    (0, send_response_1.sendResponse)(res, {
        statusCode: http_status_codes_1.default.CREATED,
        success: true,
        message: "Series created successfully!",
        data: result,
    });
}));
// ========================
// Update Series (Admin only)
// ========================
exports.updateJsSeries = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "ADMIN") {
        throw new app_error_1.default(http_status_codes_1.default.FORBIDDEN, "Only admins can update series");
    }
    const seriesId = Number(req.params.id);
    if (isNaN(seriesId)) {
        throw new app_error_1.default(http_status_codes_1.default.BAD_REQUEST, "Invalid series ID");
    }
    const { title, description, picture } = req.body;
    if (!title && !description && picture === undefined) {
        throw new app_error_1.default(http_status_codes_1.default.BAD_REQUEST, "At least one field to update is required");
    }
    const result = yield js_series_service_1.jsSeriesService.updateJsSeries(seriesId, {
        title,
        description: description !== null && description !== void 0 ? description : undefined,
        picture: picture !== null && picture !== void 0 ? picture : undefined,
    });
    (0, send_response_1.sendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Series updated successfully!",
        data: result,
    });
}));
// ========================
// Delete Series (Admin only)
// ========================
exports.deleteJsSeries = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "ADMIN") {
        throw new app_error_1.default(http_status_codes_1.default.FORBIDDEN, "Only admins can delete series");
    }
    const seriesId = Number(req.params.id);
    if (isNaN(seriesId)) {
        throw new app_error_1.default(http_status_codes_1.default.BAD_REQUEST, "Invalid series ID");
    }
    yield js_series_service_1.jsSeriesService.deleteJsSeries(seriesId);
    (0, send_response_1.sendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Series deleted successfully!",
        data: null,
    });
}));
// ========================
// Add Problem to Series (Admin only)
// ========================
exports.addProblemToSeries = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "ADMIN") {
        throw new app_error_1.default(http_status_codes_1.default.FORBIDDEN, "Only admins can modify series problems");
    }
    const seriesId = Number(req.body.seriesId);
    const problemId = Number(req.body.problemId);
    const order = Number(req.body.order);
    if (isNaN(seriesId) || isNaN(problemId) || isNaN(order)) {
        throw new app_error_1.default(http_status_codes_1.default.BAD_REQUEST, "seriesId, problemId, and order must be numbers");
    }
    const result = yield js_series_service_1.jsSeriesService.addProblemToSeries({
        seriesId,
        problemId,
        order,
    });
    (0, send_response_1.sendResponse)(res, {
        statusCode: http_status_codes_1.default.CREATED,
        success: true,
        message: "Problem added to series successfully!",
        data: result,
    });
}));
// ========================
// Remove Problem from Series (Admin only)
// ========================
exports.removeProblemFromSeries = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "ADMIN") {
        throw new app_error_1.default(http_status_codes_1.default.FORBIDDEN, "Only admins can modify series problems");
    }
    const seriesId = Number(req.params.seriesId);
    const problemId = Number(req.params.problemId);
    if (isNaN(seriesId) || isNaN(problemId)) {
        throw new app_error_1.default(http_status_codes_1.default.BAD_REQUEST, "Invalid seriesId or problemId");
    }
    yield js_series_service_1.jsSeriesService.removeProblemFromSeries(seriesId, problemId);
    (0, send_response_1.sendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Problem removed from series successfully!",
        data: null,
    });
}));
// ========================
// Reorder Problems in Series (Admin only)
// ========================
exports.reorderProblemsInSeries = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "ADMIN") {
        throw new app_error_1.default(http_status_codes_1.default.FORBIDDEN, "Only admins can reorder series problems");
    }
    const { seriesId, orderedProblemIds } = req.body;
    if (!seriesId || !Array.isArray(orderedProblemIds)) {
        throw new app_error_1.default(http_status_codes_1.default.BAD_REQUEST, "seriesId and orderedProblemIds array are required");
    }
    yield js_series_service_1.jsSeriesService.reorderProblemsInSeries({
        seriesId: Number(seriesId),
        orderedProblemIds: orderedProblemIds.map(Number),
    });
    (0, send_response_1.sendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Problems reordered successfully!",
        data: null,
    });
}));
exports.JsSeriesController = {
    getJsSeriesList: exports.getJsSeriesList,
    getJsSeriesNameAndId: exports.getJsSeriesNameAndId,
    getJsSeriesById: exports.getJsSeriesById,
    getJsSingleSeriesByIdAndCategories: exports.getJsSingleSeriesByIdAndCategories,
    createJsSeries: exports.createJsSeries,
    updateJsSeries: exports.updateJsSeries,
    deleteJsSeries: exports.deleteJsSeries,
    addProblemToSeries: exports.addProblemToSeries,
    removeProblemFromSeries: exports.removeProblemFromSeries,
    reorderProblemsInSeries: exports.reorderProblemsInSeries,
};
