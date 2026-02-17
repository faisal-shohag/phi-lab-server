/**
 * Dhaka Time Utilities (GMT+6)
 * -----------------------------------------------------
 * All date operations adjusted to GMT+6.
 * Safe for streaks, OTPs, analytics, and Prisma timestamps.
 */

/** Returns Date() shifted to GMT+6 */
export const nowDhaka = (): Date => {
  const nowUTC = Date.now();
  const offsetMs = 6 * 60 * 60 * 1000;
  return new Date(nowUTC + offsetMs);
};

/** Returns the start of Dhaka day (00:00:00) */
export const startOfDhakaDay = (date: Date = nowDhaka()): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/** Adds days to a Dhaka date */
export const dhakaDateAddDays = (date: Date, days: number): Date => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return startOfDhakaDay(d);
};

export const addMinutesDhaka = (minutes: number) => {
  const nowUTC = Date.now();
  const offsetMs = 6 * 60 * 60 * 1000;
  return new Date(nowUTC + offsetMs + minutes * 60 * 1000);
};

export const dhakaDateToYMD = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10); // safe because it's already at 00:00 local
};

/** Convert a Dhaka date → YYYY-MM-DD */
export const dhakaToYMD = (date: Date): string => {
  const d = startOfDhakaDay(date);

  // Instead of ISO (UTC-based), extract real Dhaka components
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/** Returns true if two Dhaka dates represent the same Dhaka day */
export const dhakaSameDay = (a: Date, b: Date): boolean => {
  return dhakaToYMD(a) === dhakaToYMD(b);
};

/** Returns true if a date is today in Dhaka */
export const isDhakaToday = (date: Date): boolean => {
  return dhakaSameDay(date, nowDhaka());
};

/** Returns true if a date is yesterday in Dhaka */
export const isDhakaYesterday = (date: Date): boolean => {
  const yesterday = dhakaDateAddDays(startOfDhakaDay(), -1);
  return dhakaSameDay(date, yesterday);
};

/** Returns an object with Dhaka date parts */
export const dhakaParts = (date: Date) => {
  const d = new Date(date);
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
    hours: d.getHours(),
    minutes: d.getMinutes(),
    seconds: d.getSeconds()
  };
};