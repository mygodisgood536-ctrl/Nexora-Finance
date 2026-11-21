import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BranchDetail } from "@/components/company/BranchDetail";
import { getBranchCollectionMetrics } from "@/lib/company-metrics";
import { getPerformance } from "@/lib/analytics";

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
      providerConnections: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      _count: {
        select: { customers: true, groups: true, loans: true },
      },
    },
  });

  if (!branch) notFound();

  const metrics = await getBranchCollectionMetrics(branch.id, session.companyId);
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://nexorafinancecom.vercel.app").replace(/\/$/, "");
  const branchUrl = `${baseUrl}/branch/login?company=${encodeURIComponent(branch.company.slug)}&branch=${encodeURIComponent(branch.slug)}`;
  const branchHost = `${branch.slug}.${branch.company.slug}.nexora.app`;
  const branchLoginPath = "/branch/login";

  const provider = branch.providerConnections[0]
    ? {
        id: branch.providerConnections[0].id,
        providerCode: branch.providerConnections[0].providerCode,
        connectionStatus: branch.providerConnections[0].connectionStatus,
        webhookUrl: branch.providerConnections[0].webhookUrl,
        isActive: branch.providerConnections[0].isActive,
        lastHealthCheck: branch.providerConnections[0].lastHealthCheck?.toISOString() || null,
      }
    : null;
  const providerHistory = branch.providerConnections.map((c) => ({
    id: c.id,
    providerCode: c.providerCode,
    connectionStatus: c.connectionStatus,
    isActive: c.isActive,
    webhookUrl: c.webhookUrl,
    createdAt: c.createdAt.toISOString(),
  }));

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
        branchUrl,
        branchHost,
        branchLoginPath,
      }}
      workers={await Promise.all(branch.workers.map(async (w) => {
        const perf = await getPerformance({ companyId: session.companyId!, branchId: branch.id, workerId: w.id });
        return {
          id: w.id,
          role: w.role,
          accountStatus: w.accountStatus,
          name: w.identities[0]?.name || "Unknown",
          phone: w.identities[0]?.phone || "",
          customerCount: w._count.ownedCustomers,
          groupCount: w._count.ownedGroups,
          loanCount: w._count.ownedLoans,
          expectedToday: perf.expectedToday,
          realisedToday: perf.realisedToday,
          historicalExpected: perf.historicalExpected,
          historicalRealised: perf.historicalRealised,
          createdAt: w.createdAt.toISOString(),
        };
      }))}
      metrics={metrics}
      provider={provider}
      providerHistory={providerHistory}
    />
  );
}
