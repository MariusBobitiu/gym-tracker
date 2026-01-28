/**
 * Date utilities for Planner feature
 * All week calculations are Monday-based (Monday 00:00 to Sunday 23:59 local time)
 */

/**
 * Get the Monday (start of week) for a given date
 * Returns a new Date set to Monday 00:00:00 local time
 */
export function startOfWeekMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the Sunday (end of week) for a given date's week
 * Returns a new Date set to Sunday 23:59:59.999 local time
 */
export function endOfWeekSunday(date: Date): Date {
  const monday = startOfWeekMonday(date);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}

/**
 * Get the week range as [Monday, Sunday] dates for a given date
 */
export function getWeekRange(date: Date): [Date, Date] {
  return [startOfWeekMonday(date), endOfWeekSunday(date)];
}

/**
 * Calculate the number of weeks between two Monday dates
 * Both dates should be Monday 00:00:00
 */
export function weeksBetween(startMonday: Date, endMonday: Date): number {
  const start = startOfWeekMonday(startMonday);
  const end = startOfWeekMonday(endMonday);
  const diffMs = end.getTime() - start.getTime();
  const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  return diffWeeks;
}

/**
 * Calculate which week index in a cycle pattern a given week falls into
 * @param cycleStartMonday - The Monday when the cycle started
 * @param weekMonday - The Monday of the week to check
 * @param cycleLengthWeeks - Length of the cycle pattern (e.g., 2 for A/B)
 * @returns The week index within the cycle (0-based, e.g., 0 for Week A, 1 for Week B)
 */
export function getWeekIndexInCycle(
  cycleStartMonday: Date,
  weekMonday: Date,
  cycleLengthWeeks: number
): number {
  const weeksSinceStart = weeksBetween(cycleStartMonday, weekMonday);
  return weeksSinceStart % cycleLengthWeeks;
}

/**
 * Format a date range as "DD MMM – DD MMM YYYY" (e.g., "19 Jan – 25 Jan 2026")
 */
export function formatWeekRange(start: Date, end: Date): string {
  const startDay = start.getDate();
  const startMonth = start.toLocaleDateString("en-US", { month: "short" });
  const endDay = end.getDate();
  const endMonth = end.toLocaleDateString("en-US", { month: "short" });
  const year = end.getFullYear();

  if (startMonth === endMonth) {
    return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${year}`;
  }
  return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${year}`;
}

/**
 * Format a date as "DD MMM" (e.g., "19 Jan")
 */
export function formatDateShort(date: Date): string {
  const day = date.getDate();
  const month = date.toLocaleDateString("en-US", { month: "short" });
  return `${day} ${month}`;
}

/**
 * Check if a date is in the past (before today at 00:00:00)
 */
export function isDateInPast(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate.getTime() < today.getTime();
}

/**
 * Check if a date is in the current week (Monday-Sunday)
 */
export function isDateInCurrentWeek(date: Date): boolean {
  const [weekStart, weekEnd] = getWeekRange(new Date());
  return date >= weekStart && date <= weekEnd;
}
