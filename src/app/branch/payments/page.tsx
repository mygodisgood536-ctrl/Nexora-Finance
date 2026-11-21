import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PaymentsPage } from "@/components/branch/PaymentsPage";

export default async function BranchPaymentsPage() {
  const session = await getSession();
  if (!session || (session.role !== "CO" && session.role !== "BM") || !session.workerId) {
    redirect("/branch/login");
  }

  const receipts = await prisma.paymentReceipt.findMany({
    where: {
      status: "AWAITING_ALLOCATION",
      customer: { currentOwnerWorkerId: session.workerId },
    },
    orderBy: { receivedAt: "desc" },
    include: {
      customer: { select: { id: true, fullName: true, phone: true, savingsBalance: true } },
      loan: { select: { id: true, outstandingBalance: true, totalContractual: true } },
    },
  });

  const customers = await prisma.customer.findMany({
    where: { currentOwnerWorkerId: session.workerId, customerStatus: { not: "CLOSED" } },
    select: { id: true, fullName: true, loans: { where: { loanStatus: "ACTIVE" }, select: { id: true } } },
    orderBy: { fullName: "asc" },
  });

  return (
    <PaymentsPage
      customers={customers.map((c) => ({ id: c.id, name: c.fullName, loanId: c.loans[0]?.id || null }))}
      receipts={receipts.map((r) => ({
        id: r.id,
        amount: r.verifiedAmount,
        source: r.paymentSource,
        receivedAt: r.receivedAt.toISOString(),
        customer: {
          id: r.customer.id,
          name: r.customer.fullName,
          phone: r.customer.phone || "",
          savings: r.customer.savingsBalance,
        },
        loan: r.loan
          ? {
              id: r.loan.id,
              outstanding: r.loan.outstandingBalance,
              total: r.loan.totalContractual,
            }
          : null,
      }))}
    />
  );
}
