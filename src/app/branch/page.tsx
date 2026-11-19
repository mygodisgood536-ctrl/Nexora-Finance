import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BMDashboard } from "@/components/branch/BMDashboard";
import { CODashboard } from "@/components/branch/CODashboard";
import { getCOMetrics, getTodayCollections } from "@/lib/metrics";

export default async function BranchWorkplacePage() {
  const session = await getSession();
  if (!session || (session.role !== "BM" && session.role !== "CO") || !session.workerId) {
    redirect("/branch/login");
  }

  const worker = await prisma.worker.findUnique({
    where: { id: session.workerId },
    include: {
      branch: true,
      identities: { where: { identityStatus: "ACTIVE" }, take: 1 },
      _count: {
        select: {
          ownedCustomers: true,
          ownedGroups: true,
          ownedLoans: true,
        },
      },
    },
  });

  if (!worker || worker.accountStatus !== "ACTIVE") {
    redirect("/branch/login");
  }

  const identity = worker.identities[0];

  // Shared base props
  const base = {
    workerId: worker.id,
    name: identity?.name || "Worker",
    role: worker.role,
    branchName: worker.branch.name,
    branchId: worker.branch.id,
    companyId: worker.companyId,
    companyName: session.companyName || undefined,
    customerCount: worker._count.ownedCustomers,
    groupCount: worker._count.ownedGroups,
    loanCount: worker._count.ownedLoans,
  };

  if (worker.role === "BM") {
    // Load branch-wide data for BM
    const branchWorkers = await prisma.worker.findMany({
      where: { branchId: worker.branchId, role: "CO" },
      include: {
        identities: { where: { identityStatus: "ACTIVE" }, take: 1 },
        _count: {
          select: {
            ownedCustomers: true,
            ownedLoans: true,
          },
        },
      },
    });

    const coMetrics = await Promise.all(
      branchWorkers.map(async (w) => {
        const m = await getCOMetrics(w.id);
        return {
          workerId: w.id,
          name: w.identities[0]?.name || "CO",
          ...m,
        };
      })
    );

    return <BMDashboard base={base} coMetrics={coMetrics} />;
  }

  // CO
  const today = await getTodayCollections(session.workerId);
  return <CODashboard base={base} today={today} />;
}
