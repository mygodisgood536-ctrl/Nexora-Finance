import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CustomerDetail } from "@/components/branch/CustomerDetail";

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || (session.role !== "CO" && session.role !== "BM") || !session.workerId) redirect("/branch/login");
  const { id } = await params;
  const readOnly = session.role === "BM";
  const where: any = { id };
  if (readOnly && session.branchId) where.branchId = session.branchId;
  else where.currentOwnerWorkerId = session.workerId;

  const customer = await prisma.customer.findFirst({
    where,
    include: {
      memberships: { where: { membershipStatus: "ACTIVE" }, include: { group: { select: { id: true, name: true } } } },
      loans: {
        orderBy: { activatedAt: "desc" }, take: 10,
        include: { scheduleRows: { orderBy: { dueDate: "asc" }, take: 50 } },
      },
      applications: { where: { appStatus: { in: ["DRAFT", "SUBMITTED", "AWAITING_DISBURSEMENT_CONFIRMATION"] } }, orderBy: { updatedAt: "desc" }, take: 5 },
      allocations: { orderBy: { allocatedAt: "desc" }, take: 20, select: { id: true, loanAllocation: true, savingsAllocation: true, allocatedAt: true, allocStatus: true } },
    },
  });
  if (!customer) notFound();

  return (
    <CustomerDetail
      customer={{
        id: customer.id,
        fullName: customer.fullName,
        phone: customer.phone || "",
        gender: customer.gender || "",
        maritalStatus: customer.maritalStatus || "",
        address: customer.address || "",
        savingsBalance: customer.savingsBalance,
        status: customer.customerStatus,
        hasActiveLoan: customer.loans.some((l) => l.loanStatus === "ACTIVE"),
        readOnly,
      }}
      groups={customer.memberships.map((m) => ({ id: m.group.id, name: m.group.name, role: m.groupRole }))}
      loans={customer.loans.map((l) => ({
        id: l.id, status: l.loanStatus, outstanding: l.outstandingBalance, total: l.totalContractual,
        activatedAt: l.activatedAt.toISOString(), virtualAccountStatus: l.virtualAccountStatus,
        scheduleRows: l.scheduleRows.map((r) => ({ id: r.id, dueDate: r.dueDate.toISOString(), totalDue: r.totalDue, status: r.status })),
      }))}
      applications={customer.applications.map((a) => ({
        id: a.id, stage: a.stage, status: a.appStatus, amount: a.requestedAmount || 0,
        mode: a.repaymentMode || "", updatedAt: a.updatedAt.toISOString(),
      }))}
      collections={customer.allocations.map((a) => ({
        id: a.id, loan: a.loanAllocation, savings: a.savingsAllocation,
        at: a.allocatedAt.toISOString(), status: a.allocStatus,
      }))}
      readOnly={readOnly}
    />
  );
}
