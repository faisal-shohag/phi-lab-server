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
exports.sheetsService = exports.updateRow = exports.getRows = exports.appendRow = void 0;
const google_1 = require("../../../config/google");
const SPREADSHEET_ID = "1a9FGJDDE-PFMSxai6U1Ms0YX_nnEch0kGDEJaVEwTVU";
// ➕ Append Row
const appendRow = (range, values) => __awaiter(void 0, void 0, void 0, function* () {
    const sheets = yield (0, google_1.getSheetsClient)();
    return sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range,
        valueInputOption: "USER_ENTERED",
        requestBody: { values },
    });
});
exports.appendRow = appendRow;
// 📖 Get Rows
const getRows = (range) => __awaiter(void 0, void 0, void 0, function* () {
    const sheets = yield (0, google_1.getSheetsClient)();
    const res = yield sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range,
    });
    return res.data.values || [];
});
exports.getRows = getRows;
// ✏️ Update Row
const updateRow = (range, values) => __awaiter(void 0, void 0, void 0, function* () {
    const sheets = yield (0, google_1.getSheetsClient)();
    return sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range,
        valueInputOption: "USER_ENTERED",
        requestBody: { values },
    });
});
exports.updateRow = updateRow;
exports.sheetsService = {
    appendRow: exports.appendRow,
    getRows: exports.getRows,
    updateRow: exports.updateRow
};
