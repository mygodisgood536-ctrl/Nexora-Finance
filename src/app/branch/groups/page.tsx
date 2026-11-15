import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { GroupsPage } from "@/components/branch/GroupsPage";

export default async function BranchGroupsPage() {
  const session = await getSession();
  if (!session || (session.role !== "CO" && session.role !== "BM") || !session.workerId) {
    redirect("/branch/login");
  }

  const groups = await prisma.group.findMany({
    where: { currentOwnerWorkerId: session.workerId, status: "ACTIVE" },
    orderBy: { dateCreated: "desc" },
    include: {
      _count: { select: { memberships: true } },
    },
  });

  return (
    <GroupsPage
      groups={groups.map((g) => ({
        id: g.id,
        name: g.name,
        number: g.number || "",
        address: g.address || "",
        memberCount: g._count.memberships,
        dateCreated: g.dateCreated.toISOString(),
      }))}
    />
  );
}
