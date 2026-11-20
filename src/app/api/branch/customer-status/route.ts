import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/notifications";

/** Vision rules 50/51: CLOSED blocks new applications but never blocks allocation
 * against an existing active loan; REOPENED restores the ability to apply. */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.workerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { customerId, status } = await req.json();
  if (!["ACTIVE", "CLOSED", "REOPENED"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const where: any = { id: customerId };
  if (session.role === "BM" && session.branchId) where.branchId = session.branchId;
  else where.currentOwnerWorkerId = session.workerId;
  const customer = await prisma.customer.findFirst({ where });
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  await prisma.customer.update({ where: { id: customerId }, data: { customerStatus: status } });
  await audit({
    companyId: customer.companyId, branchId: customer.branchId, actorIdentityId: session.identityId,
    actorRole: session.role, action: "CUSTOMER_STATUS_CHANGED", entity: "Customer", entityId: customerId, details: { status },
  }).catch(() => undefined);
  return NextResponse.json({ success: true, status });
}
