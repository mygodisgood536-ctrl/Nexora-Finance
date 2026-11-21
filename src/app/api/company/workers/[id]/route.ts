import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, hashPassword } from "@/lib/auth";
import { generateTempPassword } from "@/lib/utils";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "COMPANY" || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action, name, phone, passport } = body;

    const worker = await prisma.worker.findFirst({
      where: { id, companyId: session.companyId },
      include: { identities: { where: { identityStatus: "ACTIVE" }, take: 1 } },
    });
    if (!worker) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    if (action === "suspend") {
      await prisma.worker.update({ where: { id }, data: { accountStatus: "SUSPENDED" } });
      return NextResponse.json({ success: true });
    }
    if (action === "deactivate") {
      await prisma.worker.update({ where: { id }, data: { accountStatus: "DEACTIVATED" } });
      return NextResponse.json({ success: true });
    }
    if (action === "reactivate") {
      await prisma.worker.update({ where: { id }, data: { accountStatus: "ACTIVE" } });
      return NextResponse.json({ success: true });
    }

    if (action === "reset_password") {
      const tempPassword = generateTempPassword(10);
      const passwordHash = await hashPassword(tempPassword);
      await prisma.worker.update({
        where: { id },
        data: { passwordHash, sessionVersion: { increment: 1 } },
      });
      return NextResponse.json({ success: true, tempPassword });
    }

    // Replace worker (full flow from vision)
    if (action === "replace") {
      if (!name?.trim() || !phone?.trim() || !passport?.trim()) {
        return NextResponse.json({ error: "Name, phone and passport required for replacement" }, { status: 400 });
      }
      if (passport.startsWith("data:") && passport.length > 8 * 1024 * 1024) {
        return NextResponse.json({ error: "Passport image must be 8 MB or smaller" }, { status: 413 });
      }

      const tempPassword = generateTempPassword(10);
      const passwordHash = await hashPassword(tempPassword);

      await prisma.$transaction(async (tx) => {
        // End current identity
        if (worker.currentWorkerIdentityId) {
          await tx.workerIdentity.update({
            where: { id: worker.currentWorkerIdentityId },
            data: {
              identityStatus: "REPLACED",
              validUntil: new Date(),
            },
          });
        }

        // Create new identity
        const newIdentity = await tx.workerIdentity.create({
          data: {
            workerId: worker.id,
            name: name.trim(),
            phone: phone.trim(),
            passportReference: passport.trim(),
            identityStatus: "ACTIVE",
          },
        });

        // Link previous → new
        if (worker.currentWorkerIdentityId) {
          await tx.workerIdentity.update({
            where: { id: worker.currentWorkerIdentityId },
            data: { replacedByIdentityId: newIdentity.id },
          });
        }

        // Update worker account: new password + new current identity
        await tx.worker.update({
          where: { id: worker.id },
          data: {
            passwordHash,
            currentWorkerIdentityId: newIdentity.id,
            accountStatus: "ACTIVE",
            sessionVersion: { increment: 1 },
          },
        });

        // Portfolio stays on the same worker_id (current_owner_worker_id already points here)
        // original_created_by_worker_id remains unchanged (vision rule)
      });

      return NextResponse.json({ success: true, tempPassword });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Worker action error:", error);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
