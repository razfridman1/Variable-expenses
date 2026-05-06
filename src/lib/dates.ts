/**
 * Date helpers — week starts on Sunday (Israeli convention).
 */
import {
  startOfDay,
  endOfDay,
  startOfWeek as fnsStartOfWeek,
  endOfWeek as fnsEndOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
} from "date-fns";

const WEEK_OPTS = { weekStartsOn: 0 as const };

export const dayRange   = (d: Date) => ({ from: startOfDay(d),   to: endOfDay(d) });
export const weekRange  = (d: Date) => ({ from: fnsStartOfWeek(d, WEEK_OPTS), to: fnsEndOfWeek(d, WEEK_OPTS) });
export const monthRange = (d: Date) => ({ from: startOfMonth(d), to: endOfMonth(d) });
export const yearRange  = (d: Date) => ({ from: startOfYear(d),  to: endOfYear(d) });

export function lastNMonths(n: number, anchor = new Date()) {
  const arr: Array<{ year: number; month: number; from: Date; to: Date }> = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = subMonths(anchor, i);
    arr.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      from: startOfMonth(d),
      to: endOfMonth(d),
    });
  }
  return arr;
}
