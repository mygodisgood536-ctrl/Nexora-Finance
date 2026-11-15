import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ApplicationsList } from "@/components/branch/ApplicationsList";

export default async function ApplicationsPage() {
  const session = await getSession();
  if (!session || (session.role !== "CO" && session.role !== "BM") || !session.workerId) {
    redirect("/branch/login");
  }

  const applications = await prisma.loanApplication.findMany({
    where: { currentOwnerWorkerId: session.workerId },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      customer: { select: { fullName: true, phone: true } },
    },
  });

  return (
    <ApplicationsList
      applications={applications.map((a) => ({
        id: a.id,
        customerName: a.customer.fullName,
        phone: a.customer.phone || "",
        stage: a.stage,
        status: a.appStatus,
        amount: a.requestedAmount || 0,
        mode: a.repaymentMode || "",
        updatedAt: a.updatedAt.toISOString(),
      }))}
    />
  );
}
