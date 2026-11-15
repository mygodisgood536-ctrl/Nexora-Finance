import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "CO" && session.role !== "BM") || !session.workerId || !session.branchId || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, number, address } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Group name is required" }, { status: 400 });
    }

    const group = await prisma.group.create({
      data: {
        companyId: session.companyId,
        branchId: session.branchId,
        name: name.trim(),
        number: number?.trim() || null,
        address: address?.trim() || null,
        currentOwnerWorkerId: session.workerId,
        originalCreatedByWorkerId: session.workerId,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({ success: true, group });
  } catch (error) {
    console.error("Create group error:", error);
    return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.workerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const groups = await prisma.group.findMany({
      where: { currentOwnerWorkerId: session.workerId, status: "ACTIVE" },
      orderBy: { dateCreated: "desc" },
      include: {
        _count: { select: { memberships: true } },
      },
    });

    return NextResponse.json({ groups });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load groups" }, { status: 500 });
  }
}
