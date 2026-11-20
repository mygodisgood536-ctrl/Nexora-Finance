import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getBMBranchData } from "@/lib/analytics";
import { getCOMetrics } from "@/lib/metrics";
import { prisma } from "@/lib/db";

/**
 * Branch-manager inspection. Read-only: never transfers portfolio ownership.
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "BM" || !session.branchId || !session.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = await getBMBranchData(session.branchId, session.companyId);
  const officers = await prisma.worker.findMany({
    where: { companyId: session.companyId, branchId: session.branchId, role: "CO" },
    include: { identities: { where: { identityStatus: "ACTIVE" }, take: 1 } },
  });
  const perCO = await Promise.all(
    officers.map(async (w) => ({
      workerId: w.id,
      name: w.identities[0]?.name || "CO",
      ...(await getCOMetrics(w.id)),
    }))
  );
  return NextResponse.json({ ...data, perCO });
}
