/**
 * Inactivity alert thresholds from Vision:
 * - Weekly: 15 business days after a missed due date
 * - Daily: 3 business days after a missed due date
 * Tracked per loan.
 */

import { differenceInBusinessDays, parseISO } from "date-fns";

export function isInactive(params: {
  mode: "WEEKLY" | "DAILY";
  missedDueDate: string | Date;
  now?: Date;
}): boolean {
  const missed = typeof params.missedDueDate === "string"
    ? parseISO(params.missedDueDate)
    : params.missedDueDate;
  const now = params.now || new Date();
  const days = differenceInBusinessDays(now, missed);
  if (params.mode === "WEEKLY") return days >= 15;
  return days >= 3;
}
