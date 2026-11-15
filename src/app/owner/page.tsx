import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { OwnerDashboard } from "@/components/owner/OwnerDashboard";

export default async function OwnerPage() {
  const session = await getSession();

  if (!session || session.role !== "PLATFORM_OWNER") {
    redirect("/owner/login");
  }

  const companies = await prisma.company.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { branches: true, workers: true, customers: true },
      },
    },
  });

  return (
    <OwnerDashboard
      companies={companies.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        gmail: c.gmail,
        address: c.address,
        status: c.status,
        createdAt: c.createdAt.toISOString(),
        branchCount: c._count.branches,
        workerCount: c._count.workers,
        customerCount: c._count.customers,
      }))}
    />
  );
}
