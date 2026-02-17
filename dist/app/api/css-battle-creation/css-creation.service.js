"use strict";
// import puppeteer from "puppeteer";
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
exports.CssCreationService = exports.CreateCSSTarget = void 0;
const get_browser_v2_1 = require("../../utils/get-browser-v2");
// import { getBrowser } from "../../utils/get-browser";
const CreateCSSTarget = (code) => __awaiter(void 0, void 0, void 0, function* () {
    const browser = yield (0, get_browser_v2_1.getBrowserV2)();
    const page = yield browser.newPage();
    yield page.setViewport({
        width: 400,
        height: 300,
        deviceScaleFactor: 1,
    });
    // const htmlContent = `
    //       <style>
    //     * {
    //       margin: 0;
    //       padding: 0;
    //     }
    //     body {
    //       overflow: hidden;
    //       margin: 11.5px;
    //       position:relative;
    //     }
    //   </style>
    //         ${code}
    //   `;
    // await page.setContent(htmlContent, {
    //   waitUntil: "domcontentloaded",
    // });
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
    return {
        success: true,
        pngBase64: `data:image/png;base64, ${imageBuffer}`,
    };
});
exports.CreateCSSTarget = CreateCSSTarget;
exports.CssCreationService = {
    CreateCSSTarget: exports.CreateCSSTarget,
};
