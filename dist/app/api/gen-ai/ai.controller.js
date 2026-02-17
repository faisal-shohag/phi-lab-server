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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiControllers = exports.geminiStream = void 0;
const app_error_1 = __importDefault(require("../../helpers/app-error"));
const genai_1 = require("@google/genai");
// In your controller
const geminiStream = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, e_1, _b, _c;
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    const { apiKey } = req.query;
    if (!apiKey) {
        throw new app_error_1.default(401, "Please provide apiKey!");
    }
    const genAI = new genai_1.GoogleGenAI({ apiKey: apiKey });
    const { prompt, model } = req.query;
    // console.log(model)
    // Validate input
    if (!prompt || typeof prompt !== "string") {
        res.write(`data: ${JSON.stringify({ error: "Invalid prompt" })}\n\n`);
        res.end();
        return;
    }
    //   console.log(prompt)
    //	gemini-2.5-flash
    try {
        const result = yield genAI.models.generateContentStream({
            model: model || "gemini-3-flash-preview",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        });
        try {
            for (var _d = true, result_1 = __asyncValues(result), result_1_1; result_1_1 = yield result_1.next(), _a = result_1_1.done, !_a; _d = true) {
                _c = result_1_1.value;
                _d = false;
                const chunk = _c;
                const text = chunk.text;
                //   console.log(text)
                if (text) {
                    res.write(`data: ${JSON.stringify({ text })}\n\n`);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = result_1.return)) yield _b.call(result_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        // res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    }
    catch (error) {
        // console.error(error);
        res.write(`data: ${JSON.stringify({ error: (error === null || error === void 0 ? void 0 : error.message) || "AI service error" })}\n\n`);
        res.end();
    }
});
exports.geminiStream = geminiStream;
exports.AiControllers = {
    geminiStream: exports.geminiStream,
};
