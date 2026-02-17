"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatStackTrace = formatStackTrace;
exports.extractLineNumber = extractLineNumber;
exports.leetCodeFormat = leetCodeFormat;
exports.freezeIntrinsics = freezeIntrinsics;
exports.deepEqual = deepEqual;
exports.parseExpectedOutput = parseExpectedOutput;
const util_1 = __importDefault(require("util"));
/* --------------------------------------------------
  🎨 Helper: Format Stack Trace for Display
-------------------------------------------------- */
function formatStackTrace(stack) {
    if (!stack)
        return "   No stack trace available";
    // Filter out internal Node.js VM and execution service traces
    const filteredLines = stack
        .split("\n")
        .filter((line) => {
        const trimmed = line.trim();
        // Keep only user code errors, exclude Node internal and service traces
        if (trimmed.includes("user-code.js") ||
            (trimmed.startsWith("at ") && !trimmed.includes("node:") && !trimmed.includes("execution.service"))) {
            return true;
        }
        return trimmed.startsWith("Error") || trimmed.match(/^\w+Error:/);
    });
    if (filteredLines.length === 0) {
        return "   " + stack.split("\n")[0];
    }
    return filteredLines
        .map((line, idx) => `   ${idx === 0 ? "→" : "├"} ${line.trim()}`)
        .join("\n");
}
/* --------------------------------------------------
  🔍 Helper: Extract Line Number from Stack
-------------------------------------------------- */
function extractLineNumber(stack) {
    if (!stack)
        return undefined;
    const match = stack.match(/:(\d+):\d+/);
    return match ? parseInt(match[1], 10) : undefined;
}
/* --------------------------------------------------
   🧪 LeetCode-style formatter
-------------------------------------------------- */
function leetCodeFormat(value) {
    return util_1.default.inspect(value, {
        depth: null,
        maxArrayLength: Infinity,
        compact: true,
        breakLength: Infinity,
        colors: false,
    });
}
/* --------------------------------------------------
   🔒 Freeze all JS intrinsics to prevent prototype abuse
-------------------------------------------------- */
function freezeIntrinsics() {
    const intrinsics = [
        Object,
        Array,
        Function,
        Number,
        String,
        Boolean,
        Symbol,
        BigInt,
        Date,
        RegExp,
        Map,
        Set,
        WeakMap,
        WeakSet,
        Promise,
    ];
    for (const i of intrinsics) {
        if (i === null || i === void 0 ? void 0 : i.prototype)
            Object.freeze(i.prototype);
        Object.freeze(i);
    }
}
function deepEqual(a, b) {
    if (a === b)
        return true;
    if (typeof a !== typeof b)
        return false;
    if (typeof a !== "object" || a === null || b === null) {
        return String(a) === String(b);
    }
    if (Array.isArray(a) !== Array.isArray(b))
        return false;
    if (Array.isArray(a)) {
        if (a.length !== b.length)
            return false;
        return a.every((item, index) => deepEqual(item, b[index]));
    }
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length)
        return false;
    return keysA.every((key) => deepEqual(a[key], b[key]));
}
function parseExpectedOutput(value) {
    if (typeof value !== "string")
        return value;
    const trimmed = value.trim();
    // 1️⃣ Try JSON first
    try {
        return JSON.parse(trimmed);
    }
    catch (_a) {
        // Ignore JSON parse errors
    }
    // 2️⃣ Try JS object literal (safe mode)
    try {
        if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
            // Wrap in parentheses to allow object literals
            return Function(`"use strict"; return (${trimmed});`)();
        }
    }
    catch (_b) {
        // Ignore JS parse errors
    }
    // 3️⃣ Fallback to string
    return trimmed;
}
