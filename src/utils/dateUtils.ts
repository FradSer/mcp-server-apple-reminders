/**
 * dateUtils.ts
 * Shared date calculation utilities
 */

/**
 * Creates a date object representing the start of today (midnight)
 */
export function getTodayStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Creates a date object representing the start of tomorrow (midnight)
 */
export function getTomorrowStart(): Date {
  const today = getTodayStart();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
}

/**
 * Creates a date object representing the end of the week (7 days from today)
 */
export function getWeekEnd(): Date {
  const today = getTodayStart();
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);
  return weekEnd;
}

/**
 * Creates a date object representing the start of a specific date (midnight)
 */
export function getDateStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
