import { prisma } from "@/lib/db";
import { startOfDay, endOfDay, subDays, format, differenceInBusinessDays } from "date-fns";

export type Scope = { companyId?: string; branchId?: string; workerId?: string };

function loanWhere(scope: Scope): any {
  const where: any = {};
  if (scope.companyId) where.companyId = scope.companyId;
  if (scope.branchId) where.branchId = scope.branchId;
  if (scope.workerId) where.currentOwnerWorkerId = scope.workerId;
  return where;
}

function customerWhere(scope: Scope): any {
  const where: any = {};
  if (scope.companyId) where.companyId = scope.companyId;
  if (scope.branchId) where.branchId = scope.branchId;
  if (scope.workerId) where.currentOwnerWorkerId = scope.workerId;
  return where;
}

export type TrendPoint = { date: string; label: string; expected: number; realised: number };

export async function getPerformance(scope: Scope, days = 30) {
  const now = new Date();
  const startToday = startOfDay(now);
  const endToday = endOfDay(now);
  const since = subDays(startToday, days);
  const lw = loanWhere(scope);
  const cw = customerWhere(scope);

  const [expToday, realToday, expHist, realHist, rows, allocs] = await Promise.all([
    prisma.repaymentScheduleRow.aggregate({
      where: { dueDate: { gte: startToday, lte: endToday }, loan: lw },
      _sum: { totalDue: true },
    }),
    prisma.paymentAllocation.aggregate({
      where: { allocStatus: "POSTED", postedAt: { gte: startToday, lte: endToday }, customer: cw },
      _sum: { loanAllocation: true },
    }),
    prisma.repaymentScheduleRow.aggregate({
      where: { dueDate: { gte: since, lte: endToday }, loan: lw },
      _sum: { totalDue: true },
    }),
    prisma.paymentAllocation.aggregate({
      where: { allocStatus: "POSTED", postedAt: { gte: since, lte: endToday }, customer: cw },
      _sum: { loanAllocation: true },
    }),
    prisma.repaymentScheduleRow.findMany({
      where: { dueDate: { gte: since, lte: endToday }, loan: lw },
      select: { dueDate: true, totalDue: true },
    }),
    prisma.paymentAllocation.findMany({
      where: { allocStatus: "POSTED", postedAt: { gte: since, lte: endToday }, customer: cw },
      select: { postedAt: true, loanAllocation: true },
    }),
  ]);

  const trendMap = new Map<string, TrendPoint>();
  for (let i = 13; i >= 0; i--) {
    const d = subDays(startToday, i);
    const key = format(d, "yyyy-MM-dd");
    trendMap.set(key, { date: key, label: format(d, "dd MMM"), expected: 0, realised: 0 });
  }
  for (const r of rows) {
    const key = format(r.dueDate, "yyyy-MM-dd");
    const point = trendMap.get(key);
    if (point) point.expected += r.totalDue;
  }
  for (const a of allocs) {
    if (!a.postedAt) continue;
    const key = format(a.postedAt, "yyyy-MM-dd");
    const point = trendMap.get(key);
    if (point) point.realised += a.loanAllocation;
  }

  const expectedToday = expToday._sum.totalDue || 0;
  const realisedToday = realToday._sum.loanAllocation || 0;
  const historicalExpected = expHist._sum.totalDue || 0;
  const historicalRealised = realHist._sum.loanAllocation || 0;

  const recent = trendMap.get(format(subDays(startToday, 0), "yyyy-MM-dd"))!;
  const forTrend =
    trendMap.get(format(subDays(startToday, 0), "yyyy-MM-dd"))!.realised +
    trendMap.get(format(subDays(startToday, 1), "yyyy-MM-dd"))!.realised +
    trendMap.get(format(subDays(startToday, 2), "yyyy-MM-dd"))!.realised +
    trendMap.get(format(subDays(startToday, 3), "yyyy-MM-dd"))!.realised +
    trendMap.get(format(subDays(startToday, 4), "yyyy-MM-dd"))!.realised +
    trendMap.get(format(subDays(startToday, 5), "yyyy-MM-dd"))!.realised +
    trendMap.get(format(subDays(startToday, 6), "yyyy-MM-dd"))!.realised;
  const priorTrend =
    trendMap.get(format(subDays(startToday, 7), "yyyy-MM-dd"))!.realised +
    trendMap.get(format(subDays(startToday, 8), "yyyy-MM-dd"))!.realised +
    trendMap.get(format(subDays(startToday, 9), "yyyy-MM-dd"))!.realised +
    trendMap.get(format(subDays(startToday, 10), "yyyy-MM-dd"))!.realised +
    trendMap.get(format(subDays(startToday, 11), "yyyy-MM-dd"))!.realised +
    trendMap.get(format(subDays(startToday, 12), "yyyy-MM-dd"))!.realised +
    trendMap.get(format(subDays(startToday, 13), "yyyy-MM-dd"))!.realised;

  return {
    expectedToday,
    realisedToday,
    difference: Math.round((realisedToday - expectedToday) * 100) / 100,
    achievementPct: expectedToday > 0 ? Math.round((realisedToday / expectedToday) * 1000) / 10 : 0,
    historicalExpected,
    historicalRealised,
    trend: Array.from(trendMap.values()),
    direction: priorTrend > 0 ? (forTrend >= priorTrend ? "up" : "down") : forTrend > 0 ? "up" : "flat",
    changePct: priorTrend > 0 ? Math.round(((forTrend - priorTrend) / priorTrend) * 1000) / 10 : 0,
  };
}

export async function getOverdue(scope: Scope) {
  const rows = await prisma.repaymentScheduleRow.findMany({
    where: {
      status: "PENDING",
      dueDate: { lt: new Date() },
      loan: { ...loanWhere(scope), loanStatus: "ACTIVE" },
    },
    select: { totalDue: true, dueDate: true, loanId: true, loan: { select: { customer: { select: { fullName: true, id: true } } } } },
  }).catch(() => [] as any[]);
  return {
    amount: rows.reduce((s, r: any) => s + r.totalDue, 0),
    count: rows.length,
    rows,
  };
}

export async function getOutstanding(scope: Scope) {
  const result = await prisma.loan.aggregate({
    where: { ...loanWhere(scope), loanStatus: "ACTIVE" },
    _sum: { outstandingBalance: true },
  });
  return result._sum.outstandingBalance || 0;
}

export async function getCompanyHealth(companyId: string) {
  const [warnings, failedProviders, stuckVA] = await Promise.all([
    prisma.operationalWarning.findMany({
      where: { companyId, resolved: false },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.providerConnection.findMany({
      where: { companyId, OR: [{ connectionStatus: "FAILED" }, { isActive: false }] },
      select: { id: true, branchId: true, providerCode: true, connectionStatus: true, isActive: true, branch: { select: { name: true } } },
    }),
    prisma.loan.findMany({
      where: { companyId, virtualAccountStatus: "RETRYING", activatedAt: { lt: new Date(Date.now() - 3600000) } },
      select: { id: true, branchId: true, customer: { select: { fullName: true } }, branch: { select: { name: true } } },
      take: 20,
    }),
  ]);

  const items: Array<{ id: string; type: string; severity: string; message: string; branchId?: string | null; branchName?: string; createdAt: string }> = [];
  for (const w of warnings) {
    items.push({
      id: w.id,
      type: w.type,
      severity: w.severity,
      message: w.message,
      branchId: w.branchId,
      branchName: w.branchId ? (await prisma.branch.findUnique({ where: { id: w.branchId }, select: { name: true } }))?.name : undefined,
      createdAt: w.createdAt.toISOString(),
    });
  }
  for (const p of failedProviders) {
    items.push({
      id: `provider-${p.id}`,
      type: "PROVIDER_FAILED",
      severity: "CRITICAL",
      message: `${p.providerCode} connection ${p.isActive ? "failed" : "disconnected"} in ${p.branch.name}`,
      branchId: p.branchId,
      branchName: p.branch.name,
      createdAt: new Date().toISOString(),
    });
  }
  for (const l of stuckVA) {
    items.push({
      id: `va-${l.id}`,
      type: "VA_RETRYING",
      severity: "WARNING",
      message: `Virtual account still RETRYING after one hour for ${l.customer.fullName} in ${l.branch.name}`,
      branchId: l.branchId,
      branchName: l.branch.name,
      createdAt: new Date().toISOString(),
    });
  }
  return items;
}

export async function getOwnerHealth() {
  const [companies, activeCompanies, suspended, deactivated, branches, workers, customers, loans, activeLoans, receipts, pending, failedProviders, webhookEvents, warnings] = await Promise.all([
    prisma.company.count(),
    prisma.company.count({ where: { status: "ACTIVE" } }),
    prisma.company.count({ where: { status: "SUSPENDED" } }),
    prisma.company.count({ where: { status: "DEACTIVATED" } }),
    prisma.branch.count(),
    prisma.worker.count(),
    prisma.customer.count(),
    prisma.loan.count(),
    prisma.loan.count({ where: { loanStatus: "ACTIVE" } }),
    prisma.paymentReceipt.aggregate({ _sum: { verifiedAmount: true } }),
    prisma.paymentReceipt.count({ where: { status: "AWAITING_ALLOCATION" } }),
    prisma.providerConnection.count({ where: { connectionStatus: "FAILED" } }),
    prisma.webhookEvent.count(),
    prisma.operationalWarning.count({ where: { resolved: false } }),
  ]);
  return {
    companies, activeCompanies, suspended, deactivated, branches, workers, customers, loans, activeLoans,
    totalCollections: receipts._sum.verifiedAmount || 0,
    pendingAllocations: pending,
    failedProviders,
    webhookEvents,
    openWarnings: warnings,
    checkedAt: new Date().toISOString(),
  };
}

export async function getBranchWorkers(companyId: string, branchId: string) {
  const workers = await prisma.worker.findMany({
    where: { companyId, branchId },
    include: {
      identities: { where: { identityStatus: "ACTIVE" }, take: 1 },
      _count: { select: { ownedCustomers: true, ownedGroups: true, ownedLoans: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return Promise.all(
    workers.map(async (w) => {
      const perf = await getPerformance({ companyId, branchId, workerId: w.id });
      return {
        id: w.id,
        role: w.role,
        accountStatus: w.accountStatus,
        name: w.identities[0]?.name || "Worker",
        phone: w.identities[0]?.phone || "",
        passport: w.identities[0]?.passportReference || null,
        customerCount: w._count.ownedCustomers,
        groupCount: w._count.ownedGroups,
        loanCount: w._count.ownedLoans,
        expectedToday: perf.expectedToday,
        realisedToday: perf.realisedToday,
        historicalExpected: perf.historicalExpected,
        historicalRealised: perf.historicalRealised,
        trend: perf.trend,
        createdAt: w.createdAt.toISOString(),
      };
    })
  );
}

export async function getWorkerOverview(companyId: string, branchId: string, workerId: string) {
  const [worker, perf, outstanding, overdue] = await Promise.all([
    prisma.worker.findFirst({
      where: { id: workerId, companyId, branchId },
      include: {
        identities: { orderBy: { validFrom: "desc" } },
        branch: { select: { name: true, id: true } },
        _count: { select: { ownedCustomers: true, ownedGroups: true, ownedLoans: true } },
      },
    }),
    getPerformance({ companyId, branchId, workerId }),
    getOutstanding({ companyId, branchId, workerId }),
    getOverdue({ companyId, branchId, workerId }),
  ]);
  if (!worker) return null;
  const [customers, groups, loans] = await Promise.all([
    prisma.customer.findMany({ where: { currentOwnerWorkerId: workerId }, select: { id: true, fullName: true, phone: true, savingsBalance: true, customerStatus: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.group.findMany({ where: { currentOwnerWorkerId: workerId, status: "ACTIVE" }, select: { id: true, name: true, number: true, status: true, dateCreated: true }, orderBy: { dateCreated: "desc" }, take: 100 }),
    prisma.loan.findMany({ where: { currentOwnerWorkerId: workerId }, select: { id: true, loanStatus: true, outstandingBalance: true, totalContractual: true, activatedAt: true, customer: { select: { fullName: true } } }, orderBy: { activatedAt: "desc" }, take: 100 }),
  ]);
  return {
    worker: {
      id: worker.id,
      role: worker.role,
      accountStatus: worker.accountStatus,
      branchId: worker.branch.id,
      branchName: worker.branch.name,
      currentName: worker.identities.find((i) => i.identityStatus === "ACTIVE")?.name || "Worker",
      currentPhone: worker.identities.find((i) => i.identityStatus === "ACTIVE")?.phone || "",
      customerCount: worker._count.ownedCustomers,
      groupCount: worker._count.ownedGroups,
      loanCount: worker._count.ownedLoans,
    },
    identities: worker.identities.map((i) => ({
      id: i.id, name: i.name, phone: i.phone, status: i.identityStatus,
      validFrom: i.validFrom.toISOString(), validUntil: i.validUntil?.toISOString() || null,
    })),
    customers: customers.map((c) => ({ ...c, phone: c.phone || "", status: c.customerStatus, createdAt: c.createdAt.toISOString() })),
    groups: groups.map((g) => ({ ...g, number: g.number || "", dateCreated: g.dateCreated.toISOString() })),
    loans: loans.map((l) => ({ id: l.id, customerName: l.customer.fullName, status: l.loanStatus, outstanding: l.outstandingBalance, total: l.totalContractual, activatedAt: l.activatedAt.toISOString() })),
    performance: perf,
    outstanding,
    overdue: { amount: overdue.amount, count: overdue.count },
  };
}

export async function getCOFullDashboard(workerId: string, companyId?: string, branchId?: string) {
  const scope: Scope = { workerId, companyId, branchId };
  const [perf, outstanding, overdue, counts, pendingApps, awaiting, notifications, loansWithApp] = await Promise.all([
    getPerformance(scope),
    getOutstanding(scope),
    getOverdue(scope),
    Promise.all([
      prisma.customer.count({ where: { currentOwnerWorkerId: workerId } }),
      prisma.group.count({ where: { currentOwnerWorkerId: workerId, status: "ACTIVE" } }),
      prisma.loan.count({ where: { currentOwnerWorkerId: workerId, loanStatus: "ACTIVE" } }),
      prisma.loan.count({ where: { currentOwnerWorkerId: workerId, loanStatus: "COMPLETED" } }),
    ]),
    prisma.loanApplication.count({ where: { currentOwnerWorkerId: workerId, appStatus: "DRAFT" } }),
    prisma.paymentReceipt.count({ where: { status: "AWAITING_ALLOCATION", customer: { currentOwnerWorkerId: workerId } } }),
    prisma.notification.findMany({ where: { workerId, read: false }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.loan.findMany({
      where: { currentOwnerWorkerId: workerId, loanStatus: "ACTIVE" },
      select: { id: true, outstandingBalance: true, application: { select: { repaymentMode: true } }, customer: { select: { fullName: true, id: true } }, scheduleRows: { where: { status: "PENDING", dueDate: { lt: new Date() } }, orderBy: { dueDate: "asc" }, take: 1, select: { dueDate: true, totalDue: true } } },
    }),
  ]);

  const inactivity = loansWithApp
    .filter((l) => l.scheduleRows.length > 0)
    .map((l) => {
      const missed = l.scheduleRows[0].dueDate;
      const mode = l.application?.repaymentMode === "DAILY" ? "DAILY" : "WEEKLY";
      return { loanId: l.id, customerName: l.customer.fullName, dueDate: missed.toISOString(), mode, inactive: differenceInBusinessDays(new Date(), missed) >= (mode === "WEEKLY" ? 15 : 3) };
    })
    .filter((x) => x.inactive);

  const [customerRows, groupRows] = await Promise.all([
    prisma.customer.findMany({
      where: { currentOwnerWorkerId: workerId },
      select: { id: true, fullName: true, phone: true, savingsBalance: true, customerStatus: true, loans: { where: { loanStatus: "ACTIVE" }, select: { outstandingBalance: true } } },
      orderBy: { createdAt: "desc" }, take: 50,
    }),
    prisma.group.findMany({
      where: { currentOwnerWorkerId: workerId, status: "ACTIVE" },
      select: { id: true, name: true, number: true, _count: { select: { memberships: true } } },
      orderBy: { dateCreated: "desc" }, take: 50,
    }),
  ]);

  return {
    performance: perf,
    outstanding,
    overdue: { amount: overdue.amount, count: overdue.count },
    overdueRows: overdue.rows.slice(0, 20).map((r: any) => ({
      loanId: r.loanId,
      customerName: r.loan?.customer?.fullName || "Customer",
      amount: r.totalDue,
      dueDate: r.dueDate.toISOString(),
    })),
    customers: counts[0], groups: counts[1], activeLoans: counts[2], completedLoans: counts[3],
    pendingApplications: pendingApps,
    awaitingAllocation: awaiting,
    notifications: notifications.map((n) => ({ id: n.id, title: n.title, message: n.message, type: n.type, createdAt: n.createdAt.toISOString() })),
    inactivity,
    customerPerformance: customerRows.map((c) => ({
      id: c.id, fullName: c.fullName, phone: c.phone || "", savings: c.savingsBalance,
      status: c.customerStatus, outstanding: c.loans.reduce((s, l) => s + l.outstandingBalance, 0),
    })),
    groupPerformance: groupRows.map((g) => ({ id: g.id, name: g.name, number: g.number || "", members: g._count.memberships })),
  };
}

export async function getBMBranchData(branchId: string, companyId: string) {
  const [branch, perf, outstanding, overdue, groups, customers, loans, workers] = await Promise.all([
    prisma.branch.findFirst({ where: { id: branchId, companyId }, select: { id: true, name: true, slug: true, address: true } }),
    getPerformance({ companyId, branchId }),
    getOutstanding({ companyId, branchId }),
    getOverdue({ companyId, branchId }),
    prisma.group.findMany({ where: { companyId, branchId, status: "ACTIVE" }, select: { id: true, name: true, number: true, currentOwnerWorkerId: true, dateCreated: true }, orderBy: { dateCreated: "desc" }, take: 200 }),
    prisma.customer.findMany({ where: { companyId, branchId }, select: { id: true, fullName: true, phone: true, currentOwnerWorkerId: true, savingsBalance: true, customerStatus: true }, orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.loan.findMany({ where: { companyId, branchId }, select: { id: true, loanStatus: true, outstandingBalance: true, totalContractual: true, currentOwnerWorkerId: true, customer: { select: { fullName: true } } }, orderBy: { activatedAt: "desc" }, take: 200 }),
    prisma.worker.findMany({ where: { companyId, branchId }, include: { identities: { where: { identityStatus: "ACTIVE" }, take: 1 } } }),
  ]);
  const ownerName = new Map(workers.map((w) => [w.id, w.identities[0]?.name || "Worker"]));
  return {
    branch,
    performance: perf,
    outstanding,
    overdue: { amount: overdue.amount, count: overdue.count },
    groups: groups.map((g) => ({ ...g, number: g.number || "", ownerName: ownerName.get(g.currentOwnerWorkerId) || "", dateCreated: g.dateCreated.toISOString() })),
    customers: customers.map((c) => ({ ...c, phone: c.phone || "", ownerName: ownerName.get(c.currentOwnerWorkerId) || "" })),
    loans: loans.map((l) => ({ id: l.id, status: l.loanStatus, outstanding: l.outstandingBalance, total: l.totalContractual, customerName: l.customer.fullName, ownerName: ownerName.get(l.currentOwnerWorkerId) || "" })),
  };
}

export async function markNotificationsRead(workerId: string) {
  await prisma.notification.updateMany({ where: { workerId, read: false }, data: { read: true } });
}
