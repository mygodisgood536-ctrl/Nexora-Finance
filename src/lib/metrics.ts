/**
 * BM 9 metrics + performance figures derived from real posted data (Vision).
 * Realised collection = posted loan allocations.
 * Savings collected = posted savings allocations.
 * Pending allocations = verified receipts not yet posted.
 * Overdue = scheduled instalments past due date and not satisfied.
 */

import { prisma } from "@/lib/db";
import { startOfDay, endOfDay, subDays } from "date-fns";

export async function getCOMetrics(workerId: string, periodDays = 30) {
  const since = subDays(new Date(), periodDays);

  const [
    totalCustomers,
    activeLoans,
    postedAllocations,
    pendingReceipts,
    overdueRows,
  ] = await Promise.all([
    prisma.customer.count({ where: { currentOwnerWorkerId: workerId } }),
    prisma.loan.count({ where: { currentOwnerWorkerId: workerId, loanStatus: "ACTIVE" } }),
    prisma.paymentAllocation.findMany({
      where: {
        allocatedByWorkerIdentityId: { not: undefined },
        allocStatus: "POSTED",
        postedAt: { gte: since },
        customer: { currentOwnerWorkerId: workerId },
      },
      select: { loanAllocation: true, savingsAllocation: true },
    }),
    prisma.paymentReceipt.count({
      where: {
        status: "AWAITING_ALLOCATION",
        customer: { currentOwnerWorkerId: workerId },
      },
    }),
    prisma.repaymentScheduleRow.findMany({
      where: {
        status: "PENDING",
        dueDate: { lt: new Date() },
        loan: { currentOwnerWorkerId: workerId, loanStatus: "ACTIVE" },
      },
      select: { totalDue: true },
    }),
  ]);

  const realisedCollection = postedAllocations.reduce((s, a) => s + (a.loanAllocation || 0), 0);
  const savingsCollected = postedAllocations.reduce((s, a) => s + (a.savingsAllocation || 0), 0);
  const overdueAmount = overdueRows.reduce((s, r) => s + r.totalDue, 0);
  const overdueCount = overdueRows.length;

  // Expected = sum of totalDue for schedule rows in period (simplified)
  const expectedRows = await prisma.repaymentScheduleRow.findMany({
    where: {
      dueDate: { gte: since, lte: new Date() },
      loan: { currentOwnerWorkerId: workerId },
    },
    select: { totalDue: true },
  });
  const expectedCollection = expectedRows.reduce((s, r) => s + r.totalDue, 0);

  const repaymentRate =
    expectedCollection > 0
      ? Math.round((realisedCollection / expectedCollection) * 1000) / 10
      : 0;

  return {
    totalCustomers,
    activeLoans,
    expectedCollection,
    realisedCollection,
    overdueAmount,
    overdueCount,
    repaymentRate,
    savingsCollected,
    pendingAllocations: pendingReceipts,
  };
}

export async function getTodayCollections(workerId: string) {
  const start = startOfDay(new Date());
  const end = endOfDay(new Date());

  const [expected, realised] = await Promise.all([
    prisma.repaymentScheduleRow.aggregate({
      where: {
        dueDate: { gte: start, lte: end },
        loan: { currentOwnerWorkerId: workerId },
      },
      _sum: { totalDue: true },
    }),
    prisma.paymentAllocation.aggregate({
      where: {
        postedAt: { gte: start, lte: end },
        allocStatus: "POSTED",
        customer: { currentOwnerWorkerId: workerId },
      },
      _sum: { loanAllocation: true },
    }),
  ]);

  return {
    expected: expected._sum.totalDue || 0,
    realised: realised._sum.loanAllocation || 0,
  };
}
