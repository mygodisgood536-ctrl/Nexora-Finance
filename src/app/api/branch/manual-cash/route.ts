import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

/**
 * Manual cash receipt (payment_source = MANUAL_CASH).
 * Distinct from provider webhooks. Enters the same allocation workflow.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "CO" && session.role !== "BM") || !session.workerId || !session.identityId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { customerId, amount, loanId } = await req.json();
    if (!customerId || !amount || Number(amount) <= 0) {
      return NextResponse.json({ error: "customerId and positive amount required" }, { status: 400 });
    }

    const customer = await prisma.customer.findFirst({
      where: { id: customerId, currentOwnerWorkerId: session.workerId },
    });
    if (!customer) {
      return NextResponse.json({ error: "Customer not in your portfolio" }, { status: 403 });
    }

    const receipt = await prisma.paymentReceipt.create({
      data: {
        paymentSource: "MANUAL_CASH",
        customerId,
        loanId: loanId || null,
        verifiedAmount: Number(amount),
        recordedByWorkerIdentityId: session.identityId,
        status: "AWAITING_ALLOCATION",
      },
    });

    return NextResponse.json({ success: true, receiptId: receipt.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to record manual cash" }, { status: 500 });
  }
}
