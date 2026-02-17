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
exports.MatchingCompareProbability = exports.MatchingCompare = void 0;
const css_helpers_1 = require("../../app/api/css-battle/css.helpers");
const pngjs_1 = require("pngjs");
const pixelmatch_1 = __importDefault(require("../../app/helpers/pixelmatch"));
const get_browser_1 = require("../../app/utils/get-browser");
const MatchingCompare = (targetURL, code) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const browser = yield (0, get_browser_1.getBrowser)();
        const page = yield browser.newPage();
        yield page.setViewport({
            width: 400,
            height: 300,
            deviceScaleFactor: 1,
        });
        yield page.evaluate((html) => {
            document.open();
            document.write(`
    <style>
      * { margin: 0; padding: 0; }
      body { overflow: hidden; margin: 11.5px; }
    </style>
    ${html}
  `);
            document.close();
        }, code);
        const imageBuffer = yield page.screenshot({
            type: "png",
            encoding: "base64",
        });
        yield page.close();
        const targetBase64 = yield (0, css_helpers_1.loadPNGfromURL)(targetURL);
        return yield (0, exports.MatchingCompareProbability)(targetBase64, imageBuffer, 0);
    }
    catch (error) {
        console.error("Screenshot error:", error);
        throw error;
    }
});
exports.MatchingCompare = MatchingCompare;
const MatchingCompareProbability = (targetBase64_1, userBase64_1, ...args_1) => __awaiter(void 0, [targetBase64_1, userBase64_1, ...args_1], void 0, function* (targetBase64, userBase64, threshold = 0) {
    try {
        const img1 = pngjs_1.PNG.sync.read(Buffer.from(targetBase64, "base64"));
        const img2 = pngjs_1.PNG.sync.read(Buffer.from(userBase64, "base64"));
        if (img1.width !== img2.width || img1.height !== img2.height) {
            return { error: "Image sizes mismatch" };
        }
        // Reuse buffer if possible, avoid creating new PNG object
        const diff = new pngjs_1.PNG({ width: img1.width, height: img1.height });
        const mismatched = (0, pixelmatch_1.default)(img1.data, img2.data, diff.data, img1.width, img1.height, { threshold });
        const total = img1.width * img1.height;
        const accuracy = ((total - mismatched) / total) * 100;
        return {
            matched: Number(accuracy.toFixed(2)),
            renderedURL: `data:image/png;base64,${userBase64}`,
        };
    }
    catch (e) {
        return { error: e.message };
    }
});
exports.MatchingCompareProbability = MatchingCompareProbability;
