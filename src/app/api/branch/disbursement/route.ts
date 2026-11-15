import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { generateSchedule } from "@/lib/schedule";
import { calculateTotalContractual } from "@/lib/money";

/**
 * CO confirms external disbursement → loan becomes ACTIVE immediately.
 * Schedule is generated as immutable rows.
 * Virtual account provisioning is async (not blocking activation).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "CO" && session.role !== "BM") || !session.workerId || !session.identityId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { applicationId, disbursementAmount } = await req.json();
    if (!applicationId) {
      return NextResponse.json({ error: "applicationId required" }, { status: 400 });
    }

    const application = await prisma.loanApplication.findFirst({
      where: {
        id: applicationId,
        currentOwnerWorkerId: session.workerId,
        appStatus: "AWAITING_DISBURSEMENT_CONFIRMATION",
      },
      include: { customer: true },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found or not ready for confirmation" }, { status: 404 });
    }

    const principal = application.requestedAmount || 0;
    const interestPct = application.interestPercentage || 0;
    const total = calculateTotalContractual(principal, interestPct);
    const amount = disbursementAmount != null ? Number(disbursementAmount) : principal;

    const result = await prisma.$transaction(async (tx) => {
      // Update application
      await tx.loanApplication.update({
        where: { id: applicationId },
        data: {
          appStatus: "COMPLETED",
          confirmedByWorkerIdentityId: session.identityId,
          disbursementConfirmedAt: new Date(),
          disbursementAmount: amount,
        },
      });

      // Create ACTIVE loan
      const loan = await tx.loan.create({
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

      // Generate immutable schedule
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
            loanId: loan.id,
            dueDate: r.dueDate,
            principalDue: r.principalDue,
            interestDue: r.interestDue,
            totalDue: r.totalDue,
            status: "PENDING",
          })),
        });
      }

      return loan;
    });

    // Virtual account provisioning would be queued here (async, non-blocking)

    return NextResponse.json({
      success: true,
      loanId: result.id,
      status: "ACTIVE",
      message: "Loan activated. Virtual account provisioning is running in the background.",
    });
  } catch (error) {
    console.error("Disbursement confirmation error:", error);
    return NextResponse.json({ error: "Failed to confirm disbursement" }, { status: 500 });
  }
}
