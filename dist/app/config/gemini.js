"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genAI = void 0;
const genai_1 = require("@google/genai");
const env_1 = require("./env");
exports.genAI = new genai_1.GoogleGenAI({ apiKey: env_1.envVars.GEMINI_API_KEY });
