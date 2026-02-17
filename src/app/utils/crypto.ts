import crypto from "crypto";

export function hashString(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}