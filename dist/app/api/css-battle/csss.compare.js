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
exports.compare = void 0;
const pngjs_1 = require("pngjs");
const score_calculation_1 = require("../../utils/score-calculation");
const pixelmatch_1 = __importDefault(require("../../helpers/pixelmatch"));
const compare = (targetBase64_1, userBase64_1, length_1, maxScore_1, ...args_1) => __awaiter(void 0, [targetBase64_1, userBase64_1, length_1, maxScore_1, ...args_1], void 0, function* (targetBase64, userBase64, length, maxScore, threshold = 0) {
    try {
        // const pixelmatch = (await import("pixelmatch")).default;
        // console.log(maxScore)
        const img1 = pngjs_1.PNG.sync.read(Buffer.from(targetBase64, "base64"));
        const img2 = pngjs_1.PNG.sync.read(Buffer.from(userBase64, "base64"));
        if (img1.width !== img2.width || img1.height !== img2.height) {
            return { error: "Image sizes mismatch" };
        }
        const diff = new pngjs_1.PNG({ width: img1.width, height: img1.height });
        const mismatched = (0, pixelmatch_1.default)(img1.data, img2.data, diff.data, img1.width, img1.height, { threshold });
        const total = img1.width * img1.height;
        const accuracy = ((total - mismatched) / total) * 100;
        // if accuracy is 99.99 round it to 100%
        // if (accuracy >= 99.99) {
        //   accuracy = 100;
        // }
        const score = (0, score_calculation_1.calculateScore)(maxScore, accuracy, length);
        // console.log(total, accuracy, score)
        return {
            accuracy: Number(accuracy.toFixed(2)),
            mismatched,
            score,
            total,
            diffBase64: pngjs_1.PNG.sync.write(diff).toString("base64"),
        };
    }
    catch (e) {
        // console.log(e.message);
        return { error: e.message };
    }
});
exports.compare = compare;
