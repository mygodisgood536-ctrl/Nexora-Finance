import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProviderSetup } from "@/components/company/ProviderSetup";

export const dynamic = "force-dynamic";

export default async function BranchProvidersPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "COMPANY" || !session.companyId) redirect("/company/login");
  const { id } = await params;
  const branch = await prisma.branch.findFirst({
    where: { id, companyId: session.companyId },
    include: { providerConnections: { orderBy: { createdAt: "desc" }, take: 20 } },
  });
  if (!branch) notFound();

  const active = branch.providerConnections.find((c) => c.isActive) || branch.providerConnections[0];
  const existing = active ? {
    id: active.id,
    providerCode: active.providerCode,
    connectionStatus: active.connectionStatus,
    webhookUrl: active.webhookUrl,
    isActive: active.isActive,
    lastHealthCheck: active.lastHealthCheck?.toISOString() || null,
  } : null;
  const history = branch.providerConnections.map((c) => ({
    id: c.id,
    providerCode: c.providerCode,
    connectionStatus: c.connectionStatus,
    isActive: c.isActive,
    webhookUrl: c.webhookUrl,
    createdAt: c.createdAt.toISOString(),
  }));

  return <ProviderSetup branchId={branch.id} branchName={branch.name} existing={existing} history={history} />;
}
