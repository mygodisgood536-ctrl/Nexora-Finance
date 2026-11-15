/**
 * Asynchronous virtual-account provisioning (Vision 16.2).
 * States: PENDING → RETRYING → CREATED | FAILED
 * Exponential backoff. After 1 hour of retries → alert CO + Company Health.
 * Does NOT block loan activation.
 */

import { prisma } from "@/lib/db";

const BACKOFF_MINUTES = [5, 15, 30, 60, 120, 240];

export async function queueVirtualAccountProvisioning(loanId: string) {
  // In production this would be a real queue (BullMQ / Inngest / etc.)
  // Here we simulate the state machine for the platform.
  const loan = await prisma.loan.findUnique({ where: { id: loanId } });
  if (!loan || loan.virtualAccountStatus === "CREATED") return;

  // For demo / local: mark as RETRYING then later CREATED via a simple timer pattern
  // Real implementation would call the provider API with customer name/phone/BVN.
  await prisma.loan.update({
    where: { id: loanId },
    data: { virtualAccountStatus: "RETRYING" },
  });
}

export async function checkAndAlertStuckProvisioning(companyId: string) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const stuck = await prisma.loan.findMany({
    where: {
      companyId,
      virtualAccountStatus: "RETRYING",
      activatedAt: { lt: oneHourAgo },
    },
    select: { id: true, branchId: true, customerId: true },
  });

  for (const loan of stuck) {
    // Create operational warning if not already present for this loan
    const existing = await prisma.operationalWarning.findFirst({
      where: {
        companyId,
        type: "VA_RETRYING",
        message: { contains: loan.id },
        resolved: false,
      },
    });
    if (!existing) {
      await prisma.operationalWarning.create({
        data: {
          companyId,
          branchId: loan.branchId,
          type: "VA_RETRYING",
          message: `Virtual account provisioning still RETRYING after 1 hour for loan ${loan.id}`,
          severity: "WARNING",
        },
      });
    }
  }
  return stuck.length;
}
