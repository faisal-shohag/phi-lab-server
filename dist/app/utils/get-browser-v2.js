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
exports.getBrowserV2 = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
// Reuse browser instance across requests
let browserInstance = null;
const getBrowserV2 = () => __awaiter(void 0, void 0, void 0, function* () {
    // console.log("Launching browserInstance!");
    // Return existing browser if still valid
    if (browserInstance) {
        // console.log("Launching previous browserInstance!");
        try {
            yield browserInstance.version();
            return browserInstance;
        }
        catch (_a) {
            browserInstance = null;
        }
    }
    // console.log("Launching new browserInstance!");
    browserInstance = yield puppeteer_1.default.launch({
        headless: true,
        args: [
            "--single-process",
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-gpu",
            "--no-zygote",
            "--disable-dev-shm-usage",
        ],
        executablePath: "./google-chrome-stable",
        timeout: 60000,
    });
    return browserInstance;
});
exports.getBrowserV2 = getBrowserV2;
// Optional: cleanup on process exit
if (typeof process !== "undefined") {
    process.on("exit", () => __awaiter(void 0, void 0, void 0, function* () {
        if (browserInstance) {
            yield browserInstance.close();
        }
    }));
}
