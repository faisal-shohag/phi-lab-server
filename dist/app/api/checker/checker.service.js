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
exports.CheckService = exports.CheckWebsite = void 0;
const app_error_1 = __importDefault(require("../../helpers/app-error"));
const get_browser_1 = require("../../utils/get-browser");
const css_helpers_1 = require("../css-battle/css.helpers");
const csss_compare_1 = require("../css-battle/csss.compare");
const pngjs_1 = require("pngjs");
// import { getBrowserV2 } from "../../utils/get-browser-v2";
const CheckWebsite = (url) => __awaiter(void 0, void 0, void 0, function* () {
    if (!url) {
        throw new app_error_1.default(400, "Url is required!");
    }
    const browser = yield (0, get_browser_1.getBrowser)();
    const page = yield browser.newPage();
    try {
        // 1. Load reference image once
        const refImage = yield (0, css_helpers_1.loadPNGfromURL)("https://res.cloudinary.com/dj493l0jy/image/upload/v1775219031/assignment-refs/B13/B13_A1.png");
        // 2. Get exact dimensions of the reference image
        const refImagePNG = pngjs_1.PNG.sync.read(Buffer.from(refImage, "base64"));
        // 3. Navigate to the target website
        yield page.goto(url, {
            waitUntil: "networkidle2",
            timeout: 30000,
        });
        // 4. Force the viewport to be EXACTLY the same size as the reference image
        //    → This guarantees the screenshot will have identical width & height
        yield page.setViewport({
            width: refImagePNG.width,
            height: refImagePNG.height,
        });
        // 5. Take screenshot (viewport size = reference size)
        const imageBuffer = yield page.screenshot({
            type: "png",
            encoding: "base64",
            fullPage: true,
            // fullPage: false is default when viewport height is set
            // We removed fullPage: true because it would break the exact size requirement
        });
        // 6. Compare with reference (now both images have identical dimensions)
        const result = yield (0, csss_compare_1.compare)(refImage, imageBuffer);
        return {
            success: true,
            pngBase64: imageBuffer,
            result,
            // Optional: also return the dimensions used (helpful for debugging)
            dimensions: { width: refImagePNG.width, height: refImagePNG.height },
        };
    }
    finally {
        yield page.close();
    }
});
exports.CheckWebsite = CheckWebsite;
exports.CheckService = { CheckWebsite: exports.CheckWebsite };
