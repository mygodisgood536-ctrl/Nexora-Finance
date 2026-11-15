import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CompanyDashboard } from "@/components/company/CompanyDashboard";

export default async function CompanyPage() {
  const session = await getSession();

  if (!session || session.role !== "COMPANY" || !session.companyId) {
    redirect("/company/login");
  }

  const company = await prisma.company.findUnique({
    where: { id: session.companyId },
    include: {
      branches: {
        include: {
          _count: { select: { workers: true, customers: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: { branches: true, workers: true, customers: true, loans: true },
      },
    },
  });

  if (!company) {
    redirect("/company/login");
  }

  // Force password change if needed
  if (company.mustChangePassword) {
    redirect("/company/change-password");
  }

  return (
    <CompanyDashboard
      company={{
        id: company.id,
        name: company.name,
        slug: company.slug,
        status: company.status,
      }}
      branches={company.branches.map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        address: b.address,
        workerCount: b._count.workers,
        customerCount: b._count.customers,
        createdAt: b.createdAt.toISOString(),
      }))}
      stats={{
        branchCount: company._count.branches,
        workerCount: company._count.workers,
        customerCount: company._count.customers,
        loanCount: company._count.loans,
      }}
    />
  );
}
