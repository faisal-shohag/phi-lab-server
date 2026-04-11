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
exports.sheetsController = exports.extractJobStructuredData = exports.updateData = exports.getData = exports.addData = void 0;
const sheet_service_1 = require("./sheet.service");
// POST
const addData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { values } = req.body;
        const response = yield sheet_service_1.sheetsService.appendRow("Sheet1!A:Z", values);
        res.json({
            success: true,
            data: response.data,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.addData = addData;
// GET
const getData = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield sheet_service_1.sheetsService.getRows("Sheet1!A:Z");
        res.json({
            success: true,
            data,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.getData = getData;
// PUT
const updateData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { range, values } = req.body;
        const response = yield sheet_service_1.sheetsService.updateRow(range, values);
        res.json({
            success: true,
            data: response.data,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.updateData = updateData;
const extractJobStructuredData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { jobDescription } = req.body;
    const OLLAMA_API_KEY = "6940e750ce0e46f7818ae1275d04f9da.xAJtr0rEXjJVG0haDTjwIlHJ";
    if (!jobDescription || typeof jobDescription !== "string") {
        return res.status(400).json({ message: "jobDescription is required" });
    }
    if (!OLLAMA_API_KEY) {
        return res
            .status(500)
            .json({ message: "Ollama API key not configured on server" });
    }
    try {
        const ollamaRes = yield fetch("https://ollama.com/api/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${OLLAMA_API_KEY}`,
            },
            body: JSON.stringify({
                model: "gemma4:31b-cloud", // ← Smaller & faster model
                prompt: `This is a job description: ${jobDescription}

Return **ONLY** a valid JSON array with exactly these 9 fields in this exact order:

[
  "Job Title",
  "Company Name",
  "Category",
  "Category_1",
  "Location",
  "Work Type",
  "Experience",
  "Salary (BDT/mo)",
  "Skills Required"
]

Rules:
- Return only one array, nothing else. No explanation.
- If multiple jobs are mentioned, pick only the internship or entry-level one if available.
- Use "N/A" if information is missing.
- Salary must be converted/estimated in BDT per month.
- Skills Required: comma-separated string (max 15 skills).
- Do not include Posted date, Source, or Job URL.`,
                stream: false,
                think: false,
            }),
        });
        if (!ollamaRes.ok) {
            const errorText = yield ollamaRes.text();
            throw new Error(`Ollama API failed: ${ollamaRes.status} - ${errorText}`);
        }
        const data = yield ollamaRes.json();
        // console.log(data)
        const content = data.response || ((_a = data.message) === null || _a === void 0 ? void 0 : _a.content) || "";
        const structuredData = content;
        // // Ensure it's an array of 9 items
        // if (!Array.isArray(structuredData) || structuredData.length !== 9) {
        //   throw new Error("Invalid structured data format");
        // }
        return res.json(structuredData);
    }
    catch (error) {
        console.error("Extract job error:", error);
        return res.status(500).json({
            message: error.message || "Failed to extract structured data",
        });
    }
});
exports.extractJobStructuredData = extractJobStructuredData;
exports.sheetsController = {
    addData: exports.addData,
    getData: exports.getData,
    updateData: exports.updateData,
    extractJobStructuredData: exports.extractJobStructuredData
};
