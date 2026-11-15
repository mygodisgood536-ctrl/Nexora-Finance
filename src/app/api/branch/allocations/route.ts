import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { roundToKobo } from "@/lib/money";

/**
 * CO allocates a verified receipt:
 * Loan Allocation + Savings Allocation must exactly equal receipt amount.
 * Loan allocation capped at outstanding balance; excess goes to savings.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "CO" && session.role !== "BM") || !session.workerId || !session.identityId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { receiptId, loanAllocation, savingsAllocation } = await req.json();
    if (!receiptId || loanAllocation == null || savingsAllocation == null) {
      return NextResponse.json({ error: "receiptId, loanAllocation and savingsAllocation required" }, { status: 400 });
    }

    const receipt = await prisma.paymentReceipt.findFirst({
      where: {
        id: receiptId,
        status: "AWAITING_ALLOCATION",
        customer: { currentOwnerWorkerId: session.workerId },
      },
      include: {
        customer: true,
        loan: true,
      },
    });

    if (!receipt) {
      return NextResponse.json({ error: "Receipt not found or not awaiting allocation" }, { status: 404 });
    }

    let loanAlloc = roundToKobo(Number(loanAllocation));
    let savingsAlloc = roundToKobo(Number(savingsAllocation));

    // Exact tally
    if (Math.abs(loanAlloc + savingsAlloc - receipt.verifiedAmount) > 0.015) {
      return NextResponse.json({
        error: "Loan Allocation + Savings Allocation must exactly equal the receipt amount",
      }, { status: 400 });
    }

    // Cap loan allocation at outstanding
    if (receipt.loan && loanAlloc > receipt.loan.outstandingBalance) {
      const excess = roundToKobo(loanAlloc - receipt.loan.outstandingBalance);
      loanAlloc = receipt.loan.outstandingBalance;
      savingsAlloc = roundToKobo(savingsAlloc + excess);
    }

    const result = await prisma.$transaction(async (tx) => {
      const allocation = await tx.paymentAllocation.create({
        data: {
          receiptId,
          customerId: receipt.customerId,
          loanId: receipt.loanId,
          loanAllocation: loanAlloc,
          savingsAllocation: savingsAlloc,
          allocatedByWorkerIdentityId: session.identityId!,
          allocatedAt: new Date(),
          postedAt: new Date(),
          allocStatus: "POSTED",
        },
      });

      await tx.paymentReceipt.update({
        where: { id: receiptId },
        data: { status: "POSTED" },
      });

      if (receipt.loanId && loanAlloc > 0) {
        await tx.loan.update({
          where: { id: receipt.loanId },
          data: {
            outstandingBalance: {
              decrement: loanAlloc,
            },
          },
        });
      }

      if (savingsAlloc > 0) {
        const newBalance = roundToKobo(receipt.customer.savingsBalance + savingsAlloc);
        await tx.customer.update({
          where: { id: receipt.customerId },
          data: { savingsBalance: newBalance },
        });
        await tx.savingsLedger.create({
          data: {
            customerId: receipt.customerId,
            allocationId: allocation.id,
            amount: savingsAlloc,
            balanceAfter: newBalance,
          },
        });
      }

      return allocation;
    });

    return NextResponse.json({ success: true, allocationId: result.id });
  } catch (error) {
    console.error("Allocation error:", error);
    return NextResponse.json({ error: "Failed to post allocation" }, { status: 500 });
  }
}
