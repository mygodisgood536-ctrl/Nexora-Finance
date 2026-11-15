import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "COMPANY" || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const warnings = await prisma.operationalWarning.findMany({
      where: { companyId: session.companyId, resolved: false },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const stuckVA = await prisma.loan.findMany({
      where: {
        companyId: session.companyId,
        virtualAccountStatus: "RETRYING",
        activatedAt: { lt: new Date(Date.now() - 60 * 60 * 1000) },
      },
      select: {
        id: true,
        branchId: true,
        customer: { select: { fullName: true } },
        activatedAt: true,
      },
      take: 20,
    });

    return NextResponse.json({ warnings, stuckVirtualAccounts: stuckVA });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load health" }, { status: 500 });
  }
}
