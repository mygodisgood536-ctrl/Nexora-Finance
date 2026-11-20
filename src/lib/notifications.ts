import { prisma } from "@/lib/db";

export async function notify(data: {
  companyId: string;
  branchId?: string | null;
  workerId?: string | null;
  customerId?: string | null;
  title: string;
  message: string;
  type?: string;
}) {
  await prisma.notification.create({
    data: {
      companyId: data.companyId,
      branchId: data.branchId || null,
      workerId: data.workerId || null,
      customerId: data.customerId || null,
      title: data.title,
      message: data.message,
      type: data.type || "INFO",
    },
  });
}

export async function audit(data: {
  companyId: string;
  branchId?: string | null;
  actorIdentityId?: string | null;
  actorRole?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: unknown;
}) {
  await prisma.auditLog.create({
    data: {
      companyId: data.companyId,
      branchId: data.branchId || null,
      actorIdentityId: data.actorIdentityId || null,
      actorRole: data.actorRole || null,
      action: data.action,
      entity: data.entity,
      entityId: data.entityId || null,
      details: data.details === undefined ? null : JSON.stringify(data.details),
    },
  });
}
