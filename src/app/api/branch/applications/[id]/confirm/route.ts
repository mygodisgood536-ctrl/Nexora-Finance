import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { generateSchedule } from "@/lib/schedule";
import { calculateTotalContractual } from "@/lib/money";
import { queueVirtualAccountProvisioning } from "@/lib/virtual-account";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "CO" && session.role !== "BM") || !session.workerId || !session.identityId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id: applicationId } = await params;
    const body = await req.json().catch(() => ({}));
    const application = await prisma.loanApplication.findFirst({
      where: {
        id: applicationId,
        currentOwnerWorkerId: session.workerId,
        appStatus: "AWAITING_DISBURSEMENT_CONFIRMATION",
      },
      include: { customer: true },
    });
    if (!application) {
      return NextResponse.json({ error: "Application not found or not ready" }, { status: 404 });
    }
    const principal = application.requestedAmount || 0;
    const interestPct = application.interestPercentage || 0;
    const total = calculateTotalContractual(principal, interestPct);
    const amount = body.disbursementAmount != null ? Number(body.disbursementAmount) : principal;

    const loan = await prisma.$transaction(async (tx) => {
      await tx.loanApplication.update({
        where: { id: applicationId },
        data: {
          appStatus: "COMPLETED",
          confirmedByWorkerIdentityId: session.identityId,
          disbursementConfirmedAt: new Date(),
          disbursementAmount: amount,
        },
      });
      const created = await tx.loan.create({
        data: {
          applicationId,
          customerId: application.customerId,
          companyId: application.customer.companyId,
          branchId: application.customer.branchId,
          currentOwnerWorkerId: session.workerId!,
          loanStatus: "ACTIVE",
          virtualAccountStatus: "PENDING",
          outstandingBalance: total,
          totalContractual: total,
          activatedAt: new Date(),
        },
      });
      if (application.repaymentMode && application.repaymentAmount && application.period) {
        const rows = generateSchedule({
          principal,
          interestPercentage: interestPct,
          repaymentAmount: application.repaymentAmount,
          period: application.period,
          mode: application.repaymentMode as "DAILY" | "WEEKLY",
          weekday: application.repaymentWeekday ? Number(application.repaymentWeekday) : 1,
          disbursementDate: new Date(),
        });
        await tx.repaymentScheduleRow.createMany({
          data: rows.map((r) => ({
            loanId: created.id,
            dueDate: r.dueDate,
            principalDue: r.principalDue,
            interestDue: r.interestDue,
            totalDue: r.totalDue,
            status: "PENDING",
          })),
        });
      }
      return created;
    });
    return NextResponse.json({ success: true, loanId: loan.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
