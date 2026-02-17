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
exports.LeaderboardController = exports.getJsGlobal = exports.getBattle = exports.getCollection = exports.getGlobal = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const send_response_1 = require("../../utils/send-response");
const axios_1 = require("axios");
const leaderboard_service_1 = require("./leaderboard.service");
const auth_service_1 = require("../auth/auth.service");
exports.getGlobal = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = Number(req.query.page || 0);
    const token = req.cookies.lab_token;
    const payload = (0, auth_service_1.verifyAccessTokenLoose)(token);
    const result = yield leaderboard_service_1.LeaderboardService.getGlobal(page, payload.id);
    (0, send_response_1.sendResponse)(res, {
        statusCode: axios_1.HttpStatusCode.Ok,
        success: true,
        message: "Leaderboard is retrieved successfully!",
        data: result,
    });
}));
exports.getCollection = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { collectionId } = req.params;
    const page = Number(req.query.page || 0);
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const result = yield leaderboard_service_1.LeaderboardService.getCollection(Number(collectionId), page, userId);
    (0, send_response_1.sendResponse)(res, {
        statusCode: axios_1.HttpStatusCode.Ok,
        success: true,
        message: "Leaderboard is retrieved successfully!",
        data: result,
    });
}));
exports.getBattle = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { battleId } = req.params;
    const page = Number(req.query.page || 0);
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const result = yield leaderboard_service_1.LeaderboardService.getBattle(Number(battleId), page, userId);
    (0, send_response_1.sendResponse)(res, {
        statusCode: axios_1.HttpStatusCode.Ok,
        success: true,
        message: "Leaderboard is retrieved successfully!",
        data: result,
    });
}));
exports.getJsGlobal = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = Number(req.query.page || 0);
    const token = req.cookies.lab_token;
    const payload = (0, auth_service_1.verifyAccessTokenLoose)(token);
    const result = yield leaderboard_service_1.LeaderboardService.getJsGlobal(page, payload.id);
    (0, send_response_1.sendResponse)(res, {
        statusCode: axios_1.HttpStatusCode.Ok,
        success: true,
        message: "JS Global leaderboard is retrieved successfully!",
        data: result,
    });
}));
exports.LeaderboardController = {
    getGlobal: exports.getGlobal,
    getCollection: exports.getCollection,
    getBattle: exports.getBattle,
    getJsGlobal: exports.getJsGlobal,
};
