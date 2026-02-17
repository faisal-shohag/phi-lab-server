// ============ TIMEZONE UTILITY ============

/**
 * Get current date in Bangladesh timezone (GMT+6)
 * Returns a Date object representing midnight of that date in Bangladesh
 * Stored value will be YYYY-MM-DD without time component
 */
const BD_OFFSET_MINUTES = 6 * 60;

export function getBangladeshDate(input?: Date): Date {
  const now = input ? new Date(input) : new Date();

  // shift time to Bangladesh timezone
  const bdTime = new Date(now.getTime() + BD_OFFSET_MINUTES * 60 * 1000);

  // normalize to date only (UTC midnight)
  return new Date(
    Date.UTC(bdTime.getUTCFullYear(), bdTime.getUTCMonth(), bdTime.getUTCDate())
  );
}

/**
 * Get yesterday's date in Bangladesh timezone (GMT+6)
 */
export function getYesterdayBangladesh(): Date {
  const today = getBangladeshDate();
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return yesterday;
}

/**
 * Compare two dates (ignoring time)
 * Both should be normalized to midnight
 */
export function isSameDate(a: Date, b: Date): boolean {
  return a.getTime() === b.getTime();
}

/**
 * Check if date1 is yesterday compared to date2
 */
export function isYesterday(last: Date, today: Date): boolean {
  const diff =
    (today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
  return diff === 1;
}

export function getHeatmapLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 10) return 3;
  return 4;
}
