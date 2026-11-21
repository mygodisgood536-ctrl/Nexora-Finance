import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, hashPassword } from "@/lib/auth";
import { generateTempPassword } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "COMPANY" || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { branchId, role, name, phone, passport } = body;

    if (!branchId || !role || !name?.trim() || !phone?.trim() || !passport?.trim()) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }
    if (role !== "BM" && role !== "CO") {
      return NextResponse.json({ error: "Role must be BM or CO" }, { status: 400 });
    }
    if (passport.startsWith("data:") && passport.length > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "Passport image must be 8 MB or smaller" }, { status: 413 });
    }

    // Verify branch belongs to this company
    const branch = await prisma.branch.findFirst({
      where: { id: branchId, companyId: session.companyId },
    });
    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    const tempPassword = generateTempPassword(10);
    const passwordHash = await hashPassword(tempPassword);

    // Create worker account + first identity in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const worker = await tx.worker.create({
        data: {
          companyId: session.companyId!,
          branchId,
          role,
          accountStatus: "ACTIVE",
          passwordHash,
        },
      });

      const identity = await tx.workerIdentity.create({
        data: {
          workerId: worker.id,
          name: name.trim(),
          phone: phone.trim(),
          passportReference: passport.trim(),
          identityStatus: "ACTIVE",
        },
      });

      await tx.worker.update({
        where: { id: worker.id },
        data: { currentWorkerIdentityId: identity.id },
      });

      return { worker, identity };
    });

    return NextResponse.json({
      success: true,
      workerId: result.worker.id,
      tempPassword,
    });
  } catch (error) {
    console.error("Create worker error:", error);
    return NextResponse.json({ error: "Failed to create worker" }, { status: 500 });
  }
}
