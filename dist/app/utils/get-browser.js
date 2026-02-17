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
exports.getBrowser = void 0;
const puppeteer_core_1 = __importDefault(require("puppeteer-core"));
const puppeteer_1 = __importDefault(require("puppeteer"));
const chromium_1 = __importDefault(require("@sparticuz/chromium"));
// const config = chromium as any;
// Reuse browser instance across requests
let browserInstance = null;
const getBrowser = () => __awaiter(void 0, void 0, void 0, function* () {
    // Return existing browser if still valid
    if (browserInstance) {
        console.log("Launching previous browserInstance!");
        try {
            yield browserInstance.version();
            return browserInstance;
        }
        catch (_a) {
            browserInstance = null;
        }
    }
    if (process.env.NODE_ENV === "production") {
        console.log("Launching new browserInstance!");
        browserInstance = yield puppeteer_core_1.default.launch({
            args: [
                ...(chromium_1.default.args || []).filter(arg => arg && typeof arg === 'string'),
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                // "--single-process",
            ],
            executablePath: yield chromium_1.default.executablePath(),
            headless: true,
            defaultViewport: {
                width: 400,
                height: 300,
                deviceScaleFactor: 1,
            },
        });
    }
    else {
        browserInstance = yield puppeteer_1.default.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
    }
    return browserInstance;
});
exports.getBrowser = getBrowser;
// Optional: cleanup on process exit
if (typeof process !== "undefined") {
    process.on("exit", () => __awaiter(void 0, void 0, void 0, function* () {
        if (browserInstance) {
            yield browserInstance.close();
        }
    }));
}
