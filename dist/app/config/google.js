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
exports.getSheetsClient = void 0;
const googleapis_1 = require("googleapis");
const decoded = Buffer.from(process.env.sheet_service_key, "base64").toString("utf8");
const key = JSON.parse(decoded);
const auth = new googleapis_1.google.auth.GoogleAuth({
    credentials: key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const getSheetsClient = () => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield auth.getClient();
    return googleapis_1.google.sheets({
        version: "v4",
        auth: client,
    });
});
exports.getSheetsClient = getSheetsClient;
