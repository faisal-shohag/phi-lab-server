 import util from "util";
 /* --------------------------------------------------
   🎨 Helper: Format Stack Trace for Display
-------------------------------------------------- */
export function formatStackTrace(stack?: string): string {
  if (!stack) return "   No stack trace available";

  // Filter out internal Node.js VM and execution service traces
  const filteredLines = stack
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      // Keep only user code errors, exclude Node internal and service traces
      if (
        trimmed.includes("user-code.js") ||
        (trimmed.startsWith("at ") && !trimmed.includes("node:") && !trimmed.includes("execution.service"))
      ) {
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
export function extractLineNumber(stack?: string): number | undefined {
  if (!stack) return undefined;
  const match = stack.match(/:(\d+):\d+/);
  return match ? parseInt(match[1], 10) : undefined;
}




/* --------------------------------------------------
   🧪 LeetCode-style formatter
-------------------------------------------------- */
export function leetCodeFormat(value: unknown): string {
  return util.inspect(value, {
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
export function freezeIntrinsics() {
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
    if (i?.prototype) Object.freeze(i.prototype);
    Object.freeze(i);
  }
}




export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;

  if (typeof a !== typeof b) return false;

  if (typeof a !== "object" || a === null || b === null) {
    return String(a) === String(b);
  }

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  return keysA.every((key) => deepEqual(a[key], b[key]));
}

export function parseExpectedOutput(value: any): any {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();

  // 1️⃣ Try JSON first
  try {
    return JSON.parse(trimmed);
  } catch {
    // Ignore JSON parse errors
  }

  // 2️⃣ Try JS object literal (safe mode)
  try {
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      // Wrap in parentheses to allow object literals
      return Function(`"use strict"; return (${trimmed});`)();
    }
  } catch {
    // Ignore JS parse errors
  }

  // 3️⃣ Fallback to string
  return trimmed;
}
