import { NextRequest, NextResponse } from "next/server";
import { getSession, hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateTempPassword } from "@/lib/utils";
import { audit } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "COMPANY" || !session.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { currentPassword } = await req.json();
  if (!currentPassword) return NextResponse.json({ error: "Current password is required" }, { status: 400 });
  const company = await prisma.company.findUnique({ where: { id: session.companyId } });
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });
  if (!(await verifyPassword(currentPassword, company.passwordHash))) {
    return NextResponse.json({ error: "Incorrect current password" }, { status: 401 });
  }
  const tempPassword = generateTempPassword(10);
  await prisma.company.update({
    where: { id: company.id },
    data: {
      passwordHash: await hashPassword(tempPassword),
      tempPassword,
      mustChangePassword: true,
      sessionVersion: { increment: 1 },
    },
  });
  await audit({ companyId: company.id, actorRole: "COMPANY", action: "COMPANY_PASSWORD_RESET", entity: "Company", entityId: company.id }).catch(() => undefined);
  return NextResponse.json({ success: true, tempPassword });
}
