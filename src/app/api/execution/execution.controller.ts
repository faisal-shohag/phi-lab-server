import AppError from "../../helpers/app-error";
import { recordUserActivity } from "../daily-streak/daily-streak.service";
import { createSubmission } from "../problems/problem.service";
import { deepEqual, formatStackTrace, leetCodeFormat, parseExpectedOutput } from "./execution.helpers";
import { Output } from "./execution.interface";
import { executeCode } from "./execution.service";



/* --------------------------------------------------
   🎨 Extract Error Details from Stack
-------------------------------------------------- */
function extractErrorDetails(errorMessage: string, stack?: string) {
  let lineNumber: number | undefined;
  let errorType = "Runtime Error";
  const cleanMessage = errorMessage;

  // Detect error type
  if (errorMessage.includes("SyntaxError")) {
    errorType = "Compilation Error";
  } else if (
    errorMessage.includes("ReferenceError") ||
    errorMessage.includes("TypeError") ||
    errorMessage.includes("RangeError")
  ) {
    errorType = "Runtime Error";
  }

  // Extract line number from stack trace (user-code.js only)
  if (stack) {
    const match = stack.match(/at user-code\.js:(\d+):/);
    if (match?.[1]) {
      lineNumber = parseInt(match[1], 10);
    }
  }

  return { lineNumber, errorType, cleanMessage };
}

/* --------------------------------------------------
   🚀 Controller
-------------------------------------------------- */

export const handleSubmission = async (req, res) => {
  const { user } = req;
  if (!user) throw new AppError(401, "User not found... Unauthorized!");

  const {
    code,
    testCases,
    action,
    func = "",
    timeLimit,
    memoryLimit,
    problemId,
    problemRating,
    problemType = "Fx",
    problemCollectionType,
    seriesId,
  } = req.body;

  if (!code || !testCases || !action || !timeLimit || !memoryLimit) {
    return res.status(400).json({
      error: "Missing required fields in request body.",
    });
  }

  const isNonFunctional = problemType === "NFx";

  // 🔒 Validate function existence only for Fx
  if (!isNonFunctional && func) {
    const functionExistsRegex = new RegExp(
      `(?:async\\s+)?function\\s+${func}\\b|(?:(const|let|var)\\s+${func}\\s*=\\s*(?:async\\s*)?(?:\\(?[^)]*\\)?\\s*=>|function))`
    );

    if (!functionExistsRegex.test(code)) {
      return res.status(400).json({
        status: "Compilation Error",
        error: `Function '${func}' not found in the provided code.`,
      });
    }
  }

  const output: Output[] = [];
  let passedTestCases = 0;
  let totalRuntime = 0;
  let totalMemoryUsed = 0;
  let overallStatus = "Accepted";
  const memoryLimitKB = memoryLimit * 1024;

  for (const testCase of testCases) {
    const startTime = performance.now();
    const memoryBefore = process.memoryUsage().heapUsed;

    let currentStatus = "passed";
    let runtime = 0;
    let memoryUsedKB = 0;
    let stdout: string[] = [];
    let errorMessage: string | null = null;
    let lineNumber: number | undefined;
    let errorDetails: any = null;

    try {
      const executionResult = await executeCode(
        code,
        testCase,
        func,
        timeLimit,
        isNonFunctional
      );

      const endTime = performance.now();
      runtime = Math.round(endTime - startTime);
      const memoryAfter = process.memoryUsage().heapUsed;
      memoryUsedKB = Math.max(
        0,
        Math.round((memoryAfter - memoryBefore) / 1024)
      );

      totalRuntime += runtime;
      totalMemoryUsed += memoryUsedKB;

      stdout = executionResult.stdout || [];

      /* ---------------- Check for Execution Errors ---------------- */
      if (executionResult.error) {
        currentStatus = "failed";
        errorDetails = executionResult.error;
        errorMessage = executionResult.error.message;
        lineNumber = executionResult.error.lineNumber;
        
        // Check if it's a timeout error
        if (errorMessage.includes('Script execution timed out')) {
          overallStatus = prioritizeStatus(overallStatus, "Time Limit Exceeded");
        } else {
          const { errorType } = extractErrorDetails(errorMessage, errorDetails.stack);
          overallStatus = prioritizeStatus(overallStatus, errorType);
        }

        output.push({
          error: errorMessage,
          output: String(testCase.output),
          input: String(testCase.input),
          status: currentStatus,
          stderr: formatErrorForDisplay(errorDetails, overallStatus),
          stdout,
          yourOutput: null,
          runtime,
          memory: memoryUsedKB,
          lineNumber,
        });

        continue;
      }

      /* ---------------- Output Handling (No Error) ---------------- */

      let actualValue: any;
      let displayOutput: any;

      if (isNonFunctional) {
        const rawStdout = stdout.join("\n");
        actualValue = rawStdout.trim();
        displayOutput = rawStdout;
      } else {
        actualValue = executionResult.result;
        displayOutput = executionResult.result;
      }

      
      const expectedValue = parseExpectedOutput(testCase.output);
      const actualValueNormalized = parseExpectedOutput(actualValue);
// console.log({actualValue, displayOutput, expectedValue})
      const isTestCasePassed = deepEqual(actualValueNormalized, expectedValue);

      /* ---------------- Verdict ---------------- */
      let verdictError:any = null;

      if (runtime > timeLimit) {
        currentStatus = "failed";
        verdictError = "Time Limit Exceeded";
        overallStatus = prioritizeStatus(overallStatus, verdictError);
      } else if (memoryUsedKB > memoryLimitKB) {
        currentStatus = "failed";
        verdictError = "Memory Limit Exceeded";
        overallStatus = prioritizeStatus(overallStatus, verdictError);
      } else if (!isTestCasePassed) {
        currentStatus = "failed";
        verdictError = "Wrong Answer";
        overallStatus = prioritizeStatus(overallStatus, verdictError);
      }

      if (currentStatus === "passed") {
        passedTestCases++;
      }

      output.push({
        error: verdictError,
        output: testCase.output,
        input: String(testCase.input),
        status: currentStatus,
        stderr: verdictError || "",
        stdout,
        yourOutput: isNonFunctional ? stdout: leetCodeFormat(displayOutput),
        runtime,
        memory: memoryUsedKB,
        lineNumber: undefined,
      });
    } catch (error: any) {
      currentStatus = "failed";
      runtime = 0;

      errorMessage = error instanceof Error ? error.message : String(error);
      const { errorType, lineNumber: extractedLine } = extractErrorDetails(
        errorMessage,
        error?.stack
      );

      lineNumber = extractedLine;
      overallStatus = prioritizeStatus(overallStatus, errorType);

      output.push({
        error: errorMessage,
        output: String(testCase.output),
        input: String(testCase.input),
        status: currentStatus,
        stderr: formatErrorForDisplay({
          message: errorMessage,
          type: errorType,
          lineNumber,
          stack: error?.stack,
          timestamp: new Date().toISOString(),
        }),
        stdout,
        yourOutput: null,
        runtime,
        memory: 0,
        lineNumber,
      });
    }
  }

  const accuracy =
    testCases.length > 0
      ? Math.round((passedTestCases / testCases.length) * 100)
      : 0;

  const response = {
    output,
    totalPassed: passedTestCases,
    totalFailed: testCases.length - passedTestCases,
    accuracy,
    version: process.version,
    runtime: totalRuntime,
    memory: totalMemoryUsed,
    status: overallStatus,
    totalTestCases: testCases.length,
  };

  if (action === "submit") {
    await createSubmission(
      {
        userId: user.id,
        problemId,
        code,
        status: overallStatus,
        language: "javascript",
        runtime: response.runtime,
        memory: response.memory,
        percentage: response.accuracy,
        totalPassed: passedTestCases,
        totaltc: response.totalTestCases,
        tc: response.output,
        problemRating,
      },
      problemCollectionType,
      seriesId
    );

    await recordUserActivity(user.id);
  }

  res.status(200).json(response);
};

/* --------------------------------------------------
   📋 Format Error for Display
-------------------------------------------------- */
function formatErrorForDisplay(errorDetails: any, errorType?: string): string {
  if (!errorDetails) return "";

  const displayType = errorType || errorDetails.type;

  // For Time Limit Exceeded, show simplified message
  if (displayType === "Time Limit Exceeded") {
    return "Time Limit Exceeded";
  }

  // For Memory Limit Exceeded, show simplified message
  if (displayType === "Memory Limit Exceeded") {
    return "Memory Limit Exceeded";
  }

  // For Runtime/Compilation errors, show detailed info
  return `
[EXECUTION ERROR]
├─ Type: ${displayType}
├─ Message: ${errorDetails.message}
├─ Line Number: ${errorDetails.lineNumber || "Unknown"}
├─ Timestamp: ${errorDetails.timestamp}
└─ Stack Trace:
${formatStackTrace(errorDetails.stack)}
  `;
}

/* --------------------------------------------------
   📊 Status Priority
-------------------------------------------------- */

function prioritizeStatus(current: string, candidate: string): string {
  const order = [
    "Accepted",
    "Wrong Answer",
    "Time Limit Exceeded",
    "Memory Limit Exceeded",
    "Runtime Error",
    "Compilation Error",
  ];
  return order.indexOf(candidate) > order.indexOf(current)
    ? candidate
    : current;
}