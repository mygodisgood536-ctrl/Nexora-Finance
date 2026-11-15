/**
 * Repayment schedule rules from Vision:
 * - Business days = Monday–Friday excluding Nigerian public holidays
 * - Daily: first due = next business day after disbursement
 * - Weekly: first due = next occurrence of selected weekday strictly after disbursement, adjusted to business day
 * - Schedule rows are immutable after generation
 * - Early payment reduces outstanding but does NOT satisfy future instalments
 */

import { addDays, nextDay, isWeekend, format } from "date-fns";
import { calculateInterest, calculateTotalContractual, roundToKobo } from "./money";

// Minimal Nigerian public holidays (extend as needed)
const NIGERIAN_HOLIDAYS_2025_2026 = new Set([
  "2025-01-01", "2025-04-18", "2025-04-21", "2025-05-01", "2025-06-12",
  "2025-10-01", "2025-12-25", "2025-12-26",
  "2026-01-01", "2026-04-03", "2026-04-06", "2026-05-01", "2026-06-12",
  "2026-10-01", "2026-12-25", "2026-12-26",
]);

export function isBusinessDay(date: Date): boolean {
  if (isWeekend(date)) return false;
  const key = format(date, "yyyy-MM-dd");
  return !NIGERIAN_HOLIDAYS_2025_2026.has(key);
}

export function nextBusinessDay(from: Date): Date {
  let d = addDays(from, 1);
  while (!isBusinessDay(d)) {
    d = addDays(d, 1);
  }
  return d;
}

export function nextWeekdayBusiness(from: Date, weekday: number): Date {
  // weekday: 0=Sun ... 6=Sat. Vision uses selected repayment weekday.
  let d = nextDay(from, weekday as 0 | 1 | 2 | 3 | 4 | 5 | 6);
  while (!isBusinessDay(d)) {
    d = addDays(d, 7); // next week same day, then adjust if needed
    if (!isBusinessDay(d)) d = nextBusinessDay(d);
  }
  return d;
}

export type ScheduleRow = {
  dueDate: Date;
  principalDue: number;
  interestDue: number;
  totalDue: number;
};

/**
 * Generate immutable schedule.
 * For simplicity in first version we distribute total contractual evenly.
 * Vision requires the contractual total to match the tally.
 */
export function generateSchedule(params: {
  principal: number;
  interestPercentage: number;
  repaymentAmount: number;
  period: number;
  mode: "DAILY" | "WEEKLY";
  weekday?: number; // 0-6 for weekly
  disbursementDate: Date;
}): ScheduleRow[] {
  const { principal, interestPercentage, repaymentAmount, period, mode, weekday, disbursementDate } = params;
  const total = calculateTotalContractual(principal, interestPercentage);
  const interestTotal = calculateInterest(principal, interestPercentage);

  // Even split of principal and interest across instalments (simple; can refine later)
  const principalPer = roundToKobo(principal / period);
  const interestPer = roundToKobo(interestTotal / period);

  const rows: ScheduleRow[] = [];
  let current = disbursementDate;

  for (let i = 0; i < period; i++) {
    if (mode === "DAILY") {
      current = nextBusinessDay(current);
    } else {
      current = nextWeekdayBusiness(current, weekday ?? 1);
    }

    // Last row absorbs rounding difference
    const isLast = i === period - 1;
    const pDue = isLast ? roundToKobo(principal - principalPer * (period - 1)) : principalPer;
    const iDue = isLast ? roundToKobo(interestTotal - interestPer * (period - 1)) : interestPer;

    rows.push({
      dueDate: current,
      principalDue: pDue,
      interestDue: iDue,
      totalDue: roundToKobo(pDue + iDue),
    });
  }

  return rows;
}
