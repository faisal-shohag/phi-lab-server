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
exports.executeCode = void 0;
const vm_1 = require("vm");
const app_error_1 = __importDefault(require("../../helpers/app-error"));
const execution_helpers_1 = require("./execution.helpers");
/* --------------------------------------------------
   🚀 Main Executor with Enhanced Error Logging
-------------------------------------------------- */
const executeCode = (code, testCase, func, timeLimit, isNonFunctional) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const stdout = [];
    // const startTime = new Date();
    /* ---------------- Console (LeetCode-like + Error Logging) ---------------- */
    const customConsole = {
        log: (...args) => {
            const output = args.map(arg => typeof arg === 'string' ? arg : (0, execution_helpers_1.leetCodeFormat)(arg)).join(" ");
            stdout.push(output);
            if (stdout.length > 1000) {
                throw new app_error_1.default(400, "Maximum console output exceeded (possible infinite loop)");
            }
        },
        error: (...args) => {
            const output = args
                .map((arg) => {
                if (arg instanceof Error) {
                    return `${arg.message}\n${arg.stack || ""}`;
                }
                return (0, execution_helpers_1.leetCodeFormat)(arg);
            })
                .join(" ");
            stdout.push(`[ERROR] ${output}`);
        },
        warn: (...args) => {
            const output = args.map(execution_helpers_1.leetCodeFormat).join(" ");
            stdout.push(`[WARN] ${output}`);
        },
        info: (...args) => {
            const output = args.map(execution_helpers_1.leetCodeFormat).join(" ");
            stdout.push(`[INFO] ${output}`);
        },
        debug: (...args) => {
            const output = args.map(execution_helpers_1.leetCodeFormat).join(" ");
            stdout.push(`[DEBUG] ${output}`);
        },
    };
    /* ---------------- Hardened Sandbox ---------------- */
    const sandbox = {
        console: customConsole,
        // ❌ Kill dangerous globals
        Function: undefined,
        eval: undefined,
        require: undefined,
        process: undefined,
        global: undefined,
        globalThis: undefined,
        module: undefined,
        exports: undefined,
        // ❌ Kill async abuse
        Promise: undefined,
        queueMicrotask: undefined,
        // ❌ Timers (optional – enable only if needed)
        setTimeout: undefined,
        setInterval: undefined,
        clearTimeout: undefined,
        clearInterval: undefined,
    };
    // Parse input outside sandbox (assume trusted test cases)
    let input = (_a = testCase.input) !== null && _a !== void 0 ? _a : null;
    if (typeof input === "string") {
        try {
            // Try strict JSON first
            input = JSON.parse(input);
        }
        catch (_c) {
            try {
                // Fall back to JS literal evaluation
                input = new Function("return " + input)();
            }
            catch (_d) {
                // Keep as string if both fail
            }
        }
    }
    sandbox.input = input;
    const context = (0, vm_1.createContext)(sandbox);
    /* ---------------- Code Wrapper with Line Numbers (No Extra Lines) ---------------- */
    const freezeIntrinsicsCode = `"use strict";(${execution_helpers_1.freezeIntrinsics.toString()})();`;
    let scriptToExecute;
    let lineOffset = 1; // Starting line offset
    /* ---------------- Non-Functional Mode ---------------- */
    if (isNonFunctional) {
        scriptToExecute = `${freezeIntrinsicsCode}
${code}`;
        lineOffset = 1;
    }
    /* ---------------- Functional Mode ---------------- */
    else {
        scriptToExecute = `${freezeIntrinsicsCode}
${code}
(function () {
  try {
    const fn = typeof ${func} === "function" ? ${func} : null;
    if (!fn) {
      throw new Error("Function '${func}' not found");
    }
    let args = Array.isArray(input) ? input : [input];
    return fn(...args);
  } catch (e) {
    throw e;
  }
})();`;
        lineOffset = 1;
    }
    /* ---------------- Run VM with Enhanced Error Handling ---------------- */
    let result;
    let errorDetails = null;
    try {
        const script = new vm_1.Script(scriptToExecute, {
            filename: "user-code.js",
            lineOffset: -23,
            columnOffset: 0,
        });
        result = script.runInContext(context, {
            timeout: timeLimit,
        });
    }
    catch (err) {
        const rawLineNumber = (0, execution_helpers_1.extractLineNumber)(err === null || err === void 0 ? void 0 : err.stack);
        const adjustedLineNumber = rawLineNumber ? rawLineNumber - lineOffset : undefined;
        errorDetails = {
            message: (err === null || err === void 0 ? void 0 : err.message) || "Execution failed",
            type: ((_b = err === null || err === void 0 ? void 0 : err.constructor) === null || _b === void 0 ? void 0 : _b.name) || "Error",
            stack: (err === null || err === void 0 ? void 0 : err.stack) || "No stack trace available",
            code: err === null || err === void 0 ? void 0 : err.code,
            lineNumber: adjustedLineNumber,
            timestamp: new Date().toISOString(),
        };
        // Log error to stdout as well
        stdout.push(`
[EXECUTION ERROR]
├─ Type: ${errorDetails.type}
├─ Message: ${errorDetails.message}
├─ Line Number: ${errorDetails.lineNumber || "Unknown"}
├─ Timestamp: ${errorDetails.timestamp}
└─ Stack Trace:
${(0, execution_helpers_1.formatStackTrace)(errorDetails.stack)}
    `);
    }
    // const endTime = new Date();
    // const executionTime = endTime.getTime() - startTime.getTime();
    // Add execution metadata
    // stdout.push(
    //   `\n[EXECUTION METADATA]\n├─ Duration: ${executionTime}ms\n├─ Status: ${errorDetails ? "Failed" : "Success"}\n└─ Output Lines: ${stdout.length}`
    // );
    // console.log({stdout})
    return { result, stdout, error: errorDetails };
});
exports.executeCode = executeCode;
