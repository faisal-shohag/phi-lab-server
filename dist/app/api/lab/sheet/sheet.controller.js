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
exports.sheetsController = exports.updateData = exports.getData = exports.addData = void 0;
const sheet_service_1 = require("./sheet.service");
// POST
const addData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { values } = req.body;
        const response = yield sheet_service_1.sheetsService.appendRow("Sheet1!A:Z", values);
        res.json({
            success: true,
            data: response.data,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.addData = addData;
// GET
const getData = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield sheet_service_1.sheetsService.getRows("Sheet1!A:Z");
        res.json({
            success: true,
            data,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.getData = getData;
// PUT
const updateData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { range, values } = req.body;
        const response = yield sheet_service_1.sheetsService.updateRow(range, values);
        res.json({
            success: true,
            data: response.data,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.updateData = updateData;
exports.sheetsController = {
    addData: exports.addData,
    getData: exports.getData,
    updateData: exports.updateData
};
