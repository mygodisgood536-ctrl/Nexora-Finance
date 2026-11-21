import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LoanApplicationWizard } from "@/components/branch/LoanApplicationWizard";

export default async function ApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || (session.role !== "CO" && session.role !== "BM") || !session.workerId) {
    redirect("/branch/login");
  }
  const { id } = await params;

  const application = await prisma.loanApplication.findFirst({
    where: { id, currentOwnerWorkerId: session.workerId },
    include: {
      group: { select: { name: true, number: true } },
      customer: {
        include: {
          loans: { orderBy: { activatedAt: "desc" }, take: 10, select: { id: true, loanStatus: true, totalContractual: true, outstandingBalance: true, activatedAt: true } },
          memberships: { where: { membershipStatus: "ACTIVE" }, include: { group: { select: { name: true } } } },
        },
      },
    },
  });
  if (!application) notFound();

  const c = application.customer;
  return (
    <LoanApplicationWizard
      application={{
        id: application.id,
        stage: application.stage,
        status: application.appStatus,
        repaymentMode: application.repaymentMode,
        requestedAmount: application.requestedAmount,
        interestPercentage: application.interestPercentage,
        repaymentAmount: application.repaymentAmount,
        period: application.period,
        repaymentWeekday: application.repaymentWeekday,
        loanPurpose: application.loanPurpose,
        capturedData: application.capturedData,
        cycle: application.loanCycle,
      }}
      customer={{
        id: c.id,
        fullName: c.fullName,
        phone: c.phone || "",
        gender: c.gender || "",
        maritalStatus: c.maritalStatus || "",
        address: c.address || "",
        nextOfKinName: c.nextOfKinName || "",
        nextOfKinRelationship: c.nextOfKinRelationship || "",
        nextOfKinPhone: c.nextOfKinPhone || "",
        occupation: c.occupation || "",
        bvn: c.bvn || "",
        nin: c.nin || "",
        bankAccount: c.bankAccount || "",
        houseAddress: c.houseAddress || "",
        street: c.street || "",
        directionToHouse: c.directionToHouse || "",
        childName: c.childName || "",
        localKnownAs: c.localKnownAs || "",
        shopAddress: c.shopAddress || "",
        averageDailyIncome: c.averageDailyIncome || 0,
        averageMonthlyIncome: c.averageMonthlyIncome || 0,
        identificationType: c.identificationType || "",
        savingsBalance: c.savingsBalance,
        groups: c.memberships.map((m) => m.group.name),
        previousLoans: c.loans.map((l) => ({ id: l.id, status: l.loanStatus, total: l.totalContractual, outstanding: l.outstandingBalance, activatedAt: l.activatedAt.toISOString() })),
      }}
      groupName={application.group?.name || "—"}
    />
  );
}
