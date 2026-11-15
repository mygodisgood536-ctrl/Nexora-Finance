import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Branch-specific webhook endpoint:
 * /webhook/{branch_id}/{provider_code}
 *
 * - Verifies provider signature (placeholder for real implementation)
 * - Idempotent on (provider_connection_id, provider_transaction_ref)
 * - Creates AWAITING_ALLOCATION receipt routed to current portfolio owner
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ branchId: string; provider: string }> }
) {
  try {
    const { branchId, provider } = await params;
    const providerCode = provider.toUpperCase();

    if (!["MONNIFY", "PAYSTACK", "FLUTTERWAVE"].includes(providerCode)) {
      return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
    }

    const connection = await prisma.providerConnection.findFirst({
      where: {
        branchId,
        providerCode,
        isActive: true,
      },
    });

    if (!connection) {
      return NextResponse.json({ error: "No active provider connection for this branch" }, { status: 404 });
    }

    const payload = await req.json();
    // Real implementation would verify signature here using connection.webhookSecret

    const transactionRef =
      payload.transactionReference ||
      payload.reference ||
      payload.data?.reference ||
      payload.id ||
      null;

    if (!transactionRef) {
      return NextResponse.json({ error: "Missing transaction reference" }, { status: 400 });
    }

    // Idempotency
    const existing = await prisma.webhookEvent.findUnique({
      where: {
        providerConnectionId_providerTransactionRef: {
          providerConnectionId: connection.id,
          providerTransactionRef: String(transactionRef),
        },
      },
    });

    if (existing) {
      return NextResponse.json({ status: "already_processed" });
    }

    const amount =
      Number(payload.amount) ||
      Number(payload.data?.amount) ||
      Number(payload.charged_amount) ||
      0;

    // Resolve customer via virtual account number if present
    const vaNumber =
      payload.accountNumber ||
      payload.data?.account_number ||
      payload.customer?.account_number ||
      null;

    let customerId: string | null = null;
    let loanId: string | null = null;

    if (vaNumber) {
      const loan = await prisma.loan.findFirst({
        where: {
          virtualAccountNumber: String(vaNumber),
          loanStatus: "ACTIVE",
          branchId,
        },
        select: { id: true, customerId: true, currentOwnerWorkerId: true },
      });
      if (loan) {
        customerId = loan.customerId;
        loanId = loan.id;
      }
    }

    if (!customerId) {
      // Still record the event for audit; allocation cannot proceed without customer
      await prisma.webhookEvent.create({
        data: {
          providerConnectionId: connection.id,
          providerTransactionRef: String(transactionRef),
          payloadJson: JSON.stringify(payload),
          processedAt: new Date(),
        },
      });
      return NextResponse.json({ status: "received_unmatched" });
    }

    await prisma.$transaction(async (tx) => {
      const event = await tx.webhookEvent.create({
        data: {
          providerConnectionId: connection.id,
          providerTransactionRef: String(transactionRef),
          payloadJson: JSON.stringify(payload),
          processedAt: new Date(),
        },
      });

      await tx.paymentReceipt.create({
        data: {
          webhookEventId: event.id,
          paymentSource: "WEBHOOK",
          providerConnectionId: connection.id,
          providerTransactionRef: String(transactionRef),
          customerId,
          loanId,
          verifiedAmount: amount / (providerCode === "PAYSTACK" ? 100 : 1), // Paystack often kobo
          status: "AWAITING_ALLOCATION",
        },
      });
    });

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
