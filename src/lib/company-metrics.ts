import { prisma } from "@/lib/db";
import { startOfDay, endOfDay, subDays, format } from "date-fns";

/** Company-wide collection metrics from real schedule + allocation data */
export async function getCompanyCollectionMetrics(companyId: string) {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const [todayExpected, todayRealised, warnings] = await Promise.all([
    prisma.repaymentScheduleRow.aggregate({
      where: {
        dueDate: { gte: todayStart, lte: todayEnd },
        loan: { companyId, loanStatus: "ACTIVE" },
      },
      _sum: { totalDue: true },
    }),
    prisma.paymentAllocation.aggregate({
      where: {
        postedAt: { gte: todayStart, lte: todayEnd },
        allocStatus: "POSTED",
        customer: { companyId },
      },
      _sum: { loanAllocation: true },
    }),
    prisma.operationalWarning.findMany({
      where: { companyId, resolved: false },
      orderBy: { createdAt: "desc" },
      take: 20,
    }).catch(() => [] as any[]),
  ]);

  // Last 14 days historical series
  const series: Array<{ label: string; expected: number; realised: number }> = [];
  for (let i = 13; i >= 0; i--) {
    const day = subDays(new Date(), i);
    const s = startOfDay(day);
    const e = endOfDay(day);
    const [exp, real] = await Promise.all([
      prisma.repaymentScheduleRow.aggregate({
        where: {
          dueDate: { gte: s, lte: e },
          loan: { companyId },
        },
        _sum: { totalDue: true },
      }),
      prisma.paymentAllocation.aggregate({
        where: {
          postedAt: { gte: s, lte: e },
          allocStatus: "POSTED",
          customer: { companyId },
        },
        _sum: { loanAllocation: true },
      }),
    ]);
    series.push({
      label: format(day, "dd MMM"),
      expected: exp._sum.totalDue || 0,
      realised: real._sum.loanAllocation || 0,
    });
  }

  const expectedToday = todayExpected._sum.totalDue || 0;
  const realisedToday = todayRealised._sum.loanAllocation || 0;
  const prev = series.length >= 2 ? series[series.length - 2] : null;
  const trendUp =
    prev == null
      ? null
      : realisedToday + expectedToday >= (prev.realised + prev.expected);

  return {
    expectedToday,
    realisedToday,
    series,
    trendUp,
    warnings: warnings.map((w: any) => ({
      id: w.id,
      type: w.type,
      message: w.message,
      severity: w.severity,
      createdAt: w.createdAt?.toISOString?.() || String(w.createdAt),
    })),
  };
}

export async function getBranchCollectionMetrics(branchId: string, companyId: string) {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const [todayExpected, todayRealised] = await Promise.all([
    prisma.repaymentScheduleRow.aggregate({
      where: {
        dueDate: { gte: todayStart, lte: todayEnd },
        loan: { branchId, companyId, loanStatus: "ACTIVE" },
      },
      _sum: { totalDue: true },
    }),
    prisma.paymentAllocation.aggregate({
      where: {
        postedAt: { gte: todayStart, lte: todayEnd },
        allocStatus: "POSTED",
        customer: { branchId, companyId },
      },
      _sum: { loanAllocation: true },
    }),
  ]);

  const series: Array<{ label: string; expected: number; realised: number }> = [];
  for (let i = 13; i >= 0; i--) {
    const day = subDays(new Date(), i);
    const s = startOfDay(day);
    const e = endOfDay(day);
    const [exp, real] = await Promise.all([
      prisma.repaymentScheduleRow.aggregate({
        where: { dueDate: { gte: s, lte: e }, loan: { branchId, companyId } },
        _sum: { totalDue: true },
      }),
      prisma.paymentAllocation.aggregate({
        where: {
          postedAt: { gte: s, lte: e },
          allocStatus: "POSTED",
          customer: { branchId, companyId },
        },
        _sum: { loanAllocation: true },
      }),
    ]);
    series.push({
      label: format(day, "dd MMM"),
      expected: exp._sum.totalDue || 0,
      realised: real._sum.loanAllocation || 0,
    });
  }

  return {
    expectedToday: todayExpected._sum.totalDue || 0,
    realisedToday: todayRealised._sum.loanAllocation || 0,
    series,
  };
}
