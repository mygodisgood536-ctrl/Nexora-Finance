import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { GroupDetail } from "@/components/branch/GroupDetail";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || (session.role !== "CO" && session.role !== "BM") || !session.workerId) {
    redirect("/branch/login");
  }

  const { id } = await params;

  const group = await prisma.group.findFirst({
    where: { id, currentOwnerWorkerId: session.workerId },
    include: {
      memberships: {
        where: { membershipStatus: "ACTIVE" },
        include: {
          customer: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              gender: true,
              maritalStatus: true,
              customerStatus: true,
            },
          },
        },
        orderBy: { joinedAt: "desc" },
      },
    },
  });

  if (!group) notFound();

  return (
    <GroupDetail
      group={{
        id: group.id,
        name: group.name,
        number: group.number || "",
        address: group.address || "",
        dateCreated: group.dateCreated.toISOString(),
      }}
      members={group.memberships.map((m) => ({
        membershipId: m.id,
        customerId: m.customer.id,
        fullName: m.customer.fullName,
        phone: m.customer.phone || "",
        gender: m.customer.gender || "",
        maritalStatus: m.customer.maritalStatus || "",
        groupRole: m.groupRole,
        status: m.customer.customerStatus,
      }))}
    />
  );
}
