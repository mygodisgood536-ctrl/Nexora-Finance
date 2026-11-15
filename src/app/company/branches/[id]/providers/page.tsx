import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProviderSetup } from "@/components/company/ProviderSetup";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function BranchProvidersPage({
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
      providerConnections: {
        where: { isActive: true },
        take: 1,
      },
    },
  });
  if (!branch) notFound();

  const existing = branch.providerConnections[0]
    ? {
        providerCode: branch.providerConnections[0].providerCode,
        connectionStatus: branch.providerConnections[0].connectionStatus,
        webhookUrl: branch.providerConnections[0].webhookUrl,
      }
    : null;

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href={`/company/branches/${id}`} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold text-white">Payment Provider</h1>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">
        <ProviderSetup branchId={branch.id} branchName={branch.name} existing={existing} />
      </main>
    </div>
  );
}
