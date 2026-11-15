import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.workerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const status = new URL(req.url).searchParams.get("status") || "AWAITING_ALLOCATION";
    const receipts = await prisma.paymentReceipt.findMany({
      where: {
        status,
        customer: { currentOwnerWorkerId: session.workerId },
      },
      orderBy: { receivedAt: "desc" },
      include: {
        customer: { select: { id: true, fullName: true, phone: true, savingsBalance: true } },
        loan: { select: { id: true, outstandingBalance: true } },
      },
      take: 50,
    });
    return NextResponse.json({ receipts });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
