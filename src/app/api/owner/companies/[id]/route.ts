import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "PLATFORM_OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action } = body;

    let status: string;
    if (action === "suspend") status = "SUSPENDED";
    else if (action === "deactivate") status = "DEACTIVATED";
    else if (action === "reactivate") status = "ACTIVE";
    else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await prisma.company.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("Update company status error:", error);
    return NextResponse.json(
      { error: "Failed to update company" },
      { status: 500 }
    );
  }
}
