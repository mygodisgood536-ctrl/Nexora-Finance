import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { WorkerDetail } from "@/components/company/WorkerDetail";

export default async function WorkerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "COMPANY" || !session.companyId) {
    redirect("/company/login");
  }

  const { id } = await params;

  const worker = await prisma.worker.findFirst({
    where: { id, companyId: session.companyId },
    include: {
      branch: true,
      identities: { orderBy: { validFrom: "desc" } },
      ownedCustomers: {
        take: 50,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          fullName: true,
          phone: true,
          customerStatus: true,
          savingsBalance: true,
          createdAt: true,
        },
      },
      ownedGroups: {
        take: 30,
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, number: true, status: true, dateCreated: true },
      },
      ownedLoans: {
        take: 30,
        orderBy: { activatedAt: "desc" },
        select: {
          id: true,
          loanStatus: true,
          outstandingBalance: true,
          totalContractual: true,
          activatedAt: true,
          customer: { select: { fullName: true } },
        },
      },
      _count: {
        select: {
          ownedCustomers: true,
          ownedGroups: true,
          ownedLoans: true,
        },
      },
    },
  });

  if (!worker) notFound();

  const currentIdentity = worker.identities.find((i) => i.identityStatus === "ACTIVE");

  return (
    <WorkerDetail
      worker={{
        id: worker.id,
        role: worker.role,
        accountStatus: worker.accountStatus,
        branchName: worker.branch.name,
        branchId: worker.branch.id,
        currentName: currentIdentity?.name || "Unknown",
        currentPhone: currentIdentity?.phone || "",
        customerCount: worker._count.ownedCustomers,
        groupCount: worker._count.ownedGroups,
        loanCount: worker._count.ownedLoans,
        createdAt: worker.createdAt.toISOString(),
      }}
      identities={worker.identities.map((i) => ({
        id: i.id,
        name: i.name,
        phone: i.phone,
        status: i.identityStatus,
        validFrom: i.validFrom.toISOString(),
        validUntil: i.validUntil?.toISOString() || null,
      }))}
      customers={worker.ownedCustomers.map((c) => ({
        id: c.id,
        fullName: c.fullName,
        phone: c.phone || "",
        status: c.customerStatus,
        savingsBalance: c.savingsBalance,
        createdAt: c.createdAt.toISOString(),
      }))}
      groups={worker.ownedGroups.map((g) => ({
        id: g.id,
        name: g.name,
        number: g.number || "",
        status: g.status,
        dateCreated: g.dateCreated.toISOString(),
      }))}
      loans={worker.ownedLoans.map((l) => ({
        id: l.id,
        customerName: l.customer.fullName,
        status: l.loanStatus,
        outstanding: l.outstandingBalance,
        total: l.totalContractual,
        activatedAt: l.activatedAt.toISOString(),
      }))}
    />
  );
}
