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
exports.CssControllers = exports.getBattles = exports.deleteBattle = exports.deleteCollection = exports.createBattle = exports.getCollectionById = exports.getCollections = exports.createCollection = exports.getBattleByNo = exports.createSubmission = exports.CompareCssV2 = exports.CompareCss = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const css_service_1 = require("./css.service");
const send_response_1 = require("../../utils/send-response");
const axios_1 = require("axios");
const app_error_1 = __importDefault(require("../../helpers/app-error"));
exports.CompareCss = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user } = req;
    const { battleId, code, targetURL } = req.body;
    if (!user)
        throw new app_error_1.default(401, "User not found... Unauthorized!");
    const result = yield css_service_1.CssService.CompareCss(battleId, code, targetURL, user.id);
    (0, send_response_1.sendResponse)(res, {
        statusCode: axios_1.HttpStatusCode.Ok,
        success: true,
        message: "CSS comparison done!",
        data: result,
    });
}));
exports.CompareCssV2 = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // const { user } = req;
    const { battleId, code, targetURL, userId } = req.body;
    if (!userId)
        throw new app_error_1.default(401, "User not found... Unauthorized!");
    const result = yield css_service_1.CssService.CompareCssV2(battleId, code, targetURL, userId);
    (0, send_response_1.sendResponse)(res, {
        statusCode: axios_1.HttpStatusCode.Ok,
        success: true,
        message: "CSS comparison done!",
        data: result,
    });
}));
exports.createSubmission = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user } = req;
    const { battleId, code, accuracy, score } = req.body;
    if (!user)
        throw new app_error_1.default(401, "User not found... Unauthorized!");
    const result = yield css_service_1.CssService.createSubmission(user.id, battleId, score, code, accuracy);
    (0, send_response_1.sendResponse)(res, {
        statusCode: axios_1.HttpStatusCode.Ok,
        success: true,
        message: "Submission created successfully!",
        data: result,
    });
}));
exports.getBattleByNo = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user } = req;
    if (!user)
        throw new app_error_1.default(401, "User not found... Unauthorized!");
    const { battleNo } = req.params;
    const result = yield css_service_1.CssService.getBattleByNo(parseInt(battleNo), user.id);
    (0, send_response_1.sendResponse)(res, {
        statusCode: axios_1.HttpStatusCode.Ok,
        success: true,
        message: "Battle is retrieved successfully!",
        data: result,
    });
}));
exports.createCollection = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user } = req;
    if (!user)
        throw new app_error_1.default(401, "User not found... Unauthorized!");
    const { title, description, picture } = req.body;
    const result = yield css_service_1.CssService.createCollection(title, description, picture);
    (0, send_response_1.sendResponse)(res, {
        statusCode: axios_1.HttpStatusCode.Ok,
        success: true,
        message: "Collection created successfully!",
        data: result,
    });
}));
exports.getCollections = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { limit } = req.query;
    const result = yield css_service_1.CssService.getCollections(Number(limit));
    (0, send_response_1.sendResponse)(res, {
        statusCode: axios_1.HttpStatusCode.Ok,
        success: true,
        message: "Collections retrieved successfully!",
        data: result,
    });
}));
exports.getCollectionById = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user } = req;
    if (!user)
        throw new app_error_1.default(401, "User not found... Unauthorized!");
    const { collectionId } = req.params;
    const result = yield css_service_1.CssService.getCollectionById(parseInt(collectionId), user);
    (0, send_response_1.sendResponse)(res, {
        statusCode: axios_1.HttpStatusCode.Ok,
        success: true,
        message: "Collection retrieved successfully!",
        data: result,
    });
}));
exports.createBattle = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user } = req;
    if (!user)
        throw new app_error_1.default(401, "User not found... Unauthorized!");
    const { title, description, target, size, collectionId, colors, assets, battleNo, } = req.body;
    const result = yield css_service_1.CssService.createBattle(title, description, target, size, collectionId, colors, assets, battleNo);
    (0, send_response_1.sendResponse)(res, {
        statusCode: axios_1.HttpStatusCode.Ok,
        success: true,
        message: "Battle created successfully!",
        data: result,
    });
}));
exports.deleteCollection = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user } = req;
    if (!user)
        throw new app_error_1.default(401, "User not found... Unauthorized!");
    const { collectionId } = req.params;
    const result = yield css_service_1.CssService.deleteCollection(parseInt(collectionId));
    (0, send_response_1.sendResponse)(res, {
        statusCode: axios_1.HttpStatusCode.Ok,
        success: true,
        message: "Collection deleted successfully!",
        data: result,
    });
}));
exports.deleteBattle = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user } = req;
    if (!user)
        throw new app_error_1.default(401, "User not found... Unauthorized!");
    const { battleId } = req.params;
    const result = yield css_service_1.CssService.deleteBattle(parseInt(battleId));
    (0, send_response_1.sendResponse)(res, {
        statusCode: axios_1.HttpStatusCode.Ok,
        success: true,
        message: "Battle deleted successfully!",
        data: result,
    });
}));
exports.getBattles = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user } = req;
    if (!user)
        throw new app_error_1.default(401, "User not found... Unauthorized!");
    // console.log(req.query)
    const filters = {
        cursor: req.query.cursor === "undefined" ? undefined : Number(req.query.cursor),
        limit: Number(req.query.limit),
        search: req.query.search,
        collectionId: req.query.collectionId === "undefined"
            ? undefined
            : Number(req.query.collectionId),
        sort: req.query.sort,
    };
    // console.log(filters)
    const result = yield css_service_1.CssService.getBattles(user.id, filters);
    (0, send_response_1.sendResponse)(res, {
        statusCode: axios_1.HttpStatusCode.Ok,
        success: true,
        message: "Battles retrieved successfully!",
        data: result,
    });
}));
exports.CssControllers = {
    CompareCss: exports.CompareCss,
    CompareCssV2: exports.CompareCssV2,
    createSubmission: exports.createSubmission,
    getBattleByNo: exports.getBattleByNo,
    createCollection: exports.createCollection,
    getCollections: exports.getCollections,
    getCollectionById: exports.getCollectionById,
    createBattle: exports.createBattle,
    deleteCollection: exports.deleteCollection,
    deleteBattle: exports.deleteBattle,
    getBattles: exports.getBattles,
};
