import { createContext, Script } from "vm";
import AppError from "../../helpers/app-error";
import { ErrorDetails, ExecutionResult, TestCase } from "./execution.interface";
import { extractLineNumber, formatStackTrace, freezeIntrinsics, leetCodeFormat } from "./execution.helpers";


/* --------------------------------------------------
   🚀 Main Executor with Enhanced Error Logging
-------------------------------------------------- */
export const executeCode = async (
  code: string,
  testCase: TestCase,
  func: string,
  timeLimit: number,
  isNonFunctional: boolean
): Promise<ExecutionResult & { error?: ErrorDetails | null }> => {
  const stdout: string[] = [];


  // const startTime = new Date();

  /* ---------------- Console (LeetCode-like + Error Logging) ---------------- */
  const customConsole = {
    log: (...args: unknown[]) => {
      const output = args.map(arg => typeof arg === 'string' ? arg : leetCodeFormat(arg)).join(" ");
      stdout.push(output);

      if (stdout.length > 1000) {
        throw new AppError(
          400,
          "Maximum console output exceeded (possible infinite loop)"
        );
      }
    },
    error: (...args: unknown[]) => {
      const output = args
        .map((arg) => {
          if (arg instanceof Error) {
            return `${arg.message}\n${arg.stack || ""}`;
          }
          return leetCodeFormat(arg);
        })
        .join(" ");
      stdout.push(`[ERROR] ${output}`);
    },
    warn: (...args: unknown[]) => {
      const output = args.map(leetCodeFormat).join(" ");
      stdout.push(`[WARN] ${output}`);
    },
    info: (...args: unknown[]) => {
      const output = args.map(leetCodeFormat).join(" ");
      stdout.push(`[INFO] ${output}`);
    },
    debug: (...args: unknown[]) => {
      const output = args.map(leetCodeFormat).join(" ");
      stdout.push(`[DEBUG] ${output}`);
    },
  };

  /* ---------------- Hardened Sandbox ---------------- */
  const sandbox: any = {
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
  let input = testCase.input ?? null;
  if (typeof input === "string") {
    try {
      // Try strict JSON first
      input = JSON.parse(input);
    } catch {
      try {
        // Fall back to JS literal evaluation
        input = new Function("return " + input)();
      } catch {
        // Keep as string if both fail
      }
    }
  }
  sandbox.input = input;

  const context = createContext(sandbox);

  /* ---------------- Code Wrapper with Line Numbers (No Extra Lines) ---------------- */
  const freezeIntrinsicsCode = `"use strict";(${freezeIntrinsics.toString()})();`;
  
  let scriptToExecute: string;
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
  let result: any;
  let errorDetails: ErrorDetails | null = null;

  try {
    const script = new Script(scriptToExecute, {
      filename: "user-code.js",
      lineOffset: -23,
      columnOffset: 0,
    });
    result = script.runInContext(context, {
      timeout: timeLimit,
    });

  } catch (err: any) {
    const rawLineNumber = extractLineNumber(err?.stack);
    const adjustedLineNumber = rawLineNumber ? rawLineNumber - lineOffset : undefined;

    errorDetails = {
      message: err?.message || "Execution failed",
      type: err?.constructor?.name || "Error",
      stack: err?.stack || "No stack trace available",
      code: err?.code,
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
${formatStackTrace(errorDetails.stack)}
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
};


