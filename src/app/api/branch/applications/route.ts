import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "CO" && session.role !== "BM") || !session.workerId || !session.identityId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { customerId, groupId, repaymentMode, requestedAmount, loanPurpose } = await req.json();

    if (!customerId || !repaymentMode || !requestedAmount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Block if customer has active loan
    const active = await prisma.loan.findFirst({
      where: { customerId, loanStatus: "ACTIVE" },
    });
    if (active) {
      return NextResponse.json({ error: "Customer already has an active loan" }, { status: 409 });
    }

    // Verify ownership
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, currentOwnerWorkerId: session.workerId },
    });
    if (!customer) {
      return NextResponse.json({ error: "Customer not in your portfolio" }, { status: 403 });
    }

    const application = await prisma.loanApplication.create({
      data: {
        customerId,
        groupId: groupId || null,
        currentOwnerWorkerId: session.workerId,
        createdByWorkerIdentityId: session.identityId,
        stage: 1,
        appStatus: "DRAFT",
        repaymentMode,
        requestedAmount: Number(requestedAmount),
        loanPurpose: loanPurpose || null,
        capturedData: JSON.stringify({ stage1: { repaymentMode, requestedAmount, loanPurpose } }),
      },
    });

    return NextResponse.json({ success: true, applicationId: application.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to start application" }, { status: 500 });
  }
}
