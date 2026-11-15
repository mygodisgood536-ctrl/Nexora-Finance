import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BranchDetail } from "@/components/company/BranchDetail";

export default async function BranchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "COMPANY" || !session.companyId) {
    redirect("/company/login");
  }

  const { id } = await params;

  const branch = await prisma.branch.findFirst({
    where: { id, companyId: session.companyId },
    include: {
      company: { select: { name: true, slug: true } },
      workers: {
        include: {
          identities: {
            where: { identityStatus: "ACTIVE" },
            take: 1,
          },
          _count: {
            select: {
              ownedCustomers: true,
              ownedGroups: true,
              ownedLoans: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: { customers: true, groups: true, loans: true },
      },
    },
  });

  if (!branch) notFound();

  return (
    <BranchDetail
      branch={{
        id: branch.id,
        name: branch.name,
        slug: branch.slug,
        address: branch.address,
        companyName: branch.company.name,
        companySlug: branch.company.slug,
        customerCount: branch._count.customers,
        groupCount: branch._count.groups,
        loanCount: branch._count.loans,
      }}
      workers={branch.workers.map((w) => ({
        id: w.id,
        role: w.role,
        accountStatus: w.accountStatus,
        name: w.identities[0]?.name || "Unknown",
        phone: w.identities[0]?.phone || "",
        customerCount: w._count.ownedCustomers,
        groupCount: w._count.ownedGroups,
        loanCount: w._count.ownedLoans,
        createdAt: w.createdAt.toISOString(),
      }))}
    />
  );
}
