"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsSeriesRoutes = void 0;
const express_1 = __importDefault(require("express"));
const enums_1 = require("../../../generated/prisma/enums");
const authenticate_jwt_1 = require("../../middlewares/authenticate-jwt");
const js_series_controller_1 = require("./js-series.controller");
const router = express_1.default.Router();
router.get("/series", (0, authenticate_jwt_1.authenticateJWT)(...Object.values(enums_1.Role)), js_series_controller_1.JsSeriesController.getJsSeriesList); // Public or with progress
router.get("/series-names", (0, authenticate_jwt_1.authenticateJWT)(...Object.values(enums_1.Role)), js_series_controller_1.JsSeriesController.getJsSeriesNameAndId); // Public or with progress
router.get("/series/:id", (0, authenticate_jwt_1.authenticateJWT)(...Object.values(enums_1.Role)), js_series_controller_1.JsSeriesController.getJsSeriesById); // Public or with progress
router.get("/series-organized/:id", (0, authenticate_jwt_1.authenticateJWT)(...Object.values(enums_1.Role)), js_series_controller_1.JsSeriesController.getJsSingleSeriesByIdAndCategories); // Public or with progress
router.post("/series", (0, authenticate_jwt_1.authenticateJWT)(enums_1.Role.ADMIN), js_series_controller_1.JsSeriesController.createJsSeries); // Admin
router.patch("/series/:id", (0, authenticate_jwt_1.authenticateJWT)(enums_1.Role.ADMIN), js_series_controller_1.JsSeriesController.updateJsSeries); // Admin
router.delete("/series/:id", (0, authenticate_jwt_1.authenticateJWT)(enums_1.Role.ADMIN), js_series_controller_1.JsSeriesController.deleteJsSeries); // Admin
router.post("/series/problem", (0, authenticate_jwt_1.authenticateJWT)(enums_1.Role.ADMIN), js_series_controller_1.JsSeriesController.addProblemToSeries); // Admin
router.delete("/series/:seriesId/problem/:problemId", (0, authenticate_jwt_1.authenticateJWT)(enums_1.Role.ADMIN), js_series_controller_1.JsSeriesController.removeProblemFromSeries); // Admin
router.patch("/series/reorder", (0, authenticate_jwt_1.authenticateJWT)(enums_1.Role.ADMIN), js_series_controller_1.JsSeriesController.reorderProblemsInSeries); // Admin
exports.jsSeriesRoutes = router;
