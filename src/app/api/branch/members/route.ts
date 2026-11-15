import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "CO" && session.role !== "BM") || !session.workerId || !session.identityId || !session.branchId || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      groupId,
      fullName,
      fatherHusband,
      maritalStatus,
      dateOfBirth,
      gender,
      address,
      phone,
      groupRole,
    } = body;

    if (!groupId || !fullName?.trim() || !phone?.trim() || !groupRole) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    // Verify group belongs to this worker
    const group = await prisma.group.findFirst({
      where: { id: groupId, currentOwnerWorkerId: session.workerId },
    });
    if (!group) {
      return NextResponse.json({ error: "Group not found or not owned by you" }, { status: 404 });
    }

    // Check if customer already exists by phone in this company
    let customer = await prisma.customer.findFirst({
      where: { companyId: session.companyId, phone: phone.trim() },
    });

    if (customer) {
      // Check for active loan
      const activeLoan = await prisma.loan.findFirst({
        where: { customerId: customer.id, loanStatus: "ACTIVE" },
        include: {
          currentOwner: {
            include: { identities: { where: { identityStatus: "ACTIVE" }, take: 1 } },
          },
          // We need group info - approximate via application if needed
        },
      });
      if (activeLoan) {
        const coName = activeLoan.currentOwner.identities[0]?.name || "another CO";
        return NextResponse.json({
          error: `Customer has active loan in a group under ${coName}`,
        }, { status: 409 });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      if (!customer) {
        customer = await tx.customer.create({
          data: {
            companyId: session.companyId!,
            branchId: session.branchId!,
            fullName: fullName.trim(),
            fatherHusband: fatherHusband?.trim() || null,
            maritalStatus: maritalStatus || null,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            gender: gender || null,
            address: address?.trim() || null,
            phone: phone.trim(),
            currentOwnerWorkerId: session.workerId!,
            originalCreatedByWorkerId: session.workerId!,
            customerStatus: "ACTIVE",
            savingsBalance: 0,
          },
        });
      } else {
        // Update ownership if needed? Vision keeps financial with customer, membership separate
        // For simplicity we do not change current_owner unless transferring
      }

      const membership = await tx.customerGroupMembership.create({
        data: {
          customerId: customer!.id,
          groupId,
          addedByWorkerIdentityId: session.identityId!,
          groupRole,
          membershipStatus: "ACTIVE",
        },
      });

      return { customer, membership };
    });

    return NextResponse.json({ success: true, customerId: result.customer.id, membershipId: result.membership.id });
  } catch (error) {
    console.error("Add member error:", error);
    return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
  }
}
