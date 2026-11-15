import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isTallyExact } from "@/lib/money";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "CO" && session.role !== "BM") || !session.workerId || !session.identityId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const application = await prisma.loanApplication.findFirst({
      where: { id, currentOwnerWorkerId: session.workerId },
    });
    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (body.action === "submit") {
      if (application.stage < 12) {
        return NextResponse.json({ error: "Complete all stages before submit" }, { status: 400 });
      }
      await prisma.loanApplication.update({
        where: { id },
        data: {
          appStatus: "AWAITING_DISBURSEMENT_CONFIRMATION",
          submittedByWorkerIdentityId: session.identityId,
          stage: 12,
        },
      });
      return NextResponse.json({ success: true });
    }

    // Save stage progress
    const newStage = body.stage || application.stage;
    const updateData: any = {
      stage: newStage,
      updatedAt: new Date(),
    };

    if (body.repaymentMode) updateData.repaymentMode = body.repaymentMode;
    if (body.requestedAmount != null) updateData.requestedAmount = Number(body.requestedAmount);
    if (body.loanPurpose != null) updateData.loanPurpose = body.loanPurpose;
    if (body.interestPercentage != null) updateData.interestPercentage = Number(body.interestPercentage);
    if (body.repaymentAmount != null) updateData.repaymentAmount = Number(body.repaymentAmount);
    if (body.period != null) updateData.period = Number(body.period);
    if (body.repaymentWeekday != null) updateData.repaymentWeekday = body.repaymentWeekday;

    // Validate tally when on stage 11→12
    if (newStage === 12 && updateData.repaymentAmount && updateData.period && updateData.interestPercentage) {
      const principal = updateData.requestedAmount ?? application.requestedAmount ?? 0;
      if (!isTallyExact(principal, updateData.interestPercentage, updateData.repaymentAmount, updateData.period)) {
        return NextResponse.json({ error: "NOT TALLY" }, { status: 400 });
      }
    }

    // Merge captured data
    let captured: any = {};
    try {
      captured = application.capturedData ? JSON.parse(application.capturedData) : {};
    } catch {}
    captured[`stage${newStage}`] = body;
    updateData.capturedData = JSON.stringify(captured);

    // Also update customer profile fields when provided
    if (body.nextOfKinName || body.bvn || body.nin || body.bankAccount || body.occupation) {
      await prisma.customer.update({
        where: { id: application.customerId },
        data: {
          nextOfKinName: body.nextOfKinName ?? undefined,
          nextOfKinPhone: body.nextOfKinPhone ?? undefined,
          occupation: body.occupation ?? undefined,
          bvn: body.bvn ?? undefined,
          nin: body.nin ?? undefined,
          bankAccount: body.bankAccount ?? undefined,
        },
      });
    }

    await prisma.loanApplication.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, stage: newStage });
  } catch (error) {
    console.error("Application update error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
