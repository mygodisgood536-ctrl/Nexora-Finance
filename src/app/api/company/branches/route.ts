import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { generateSlug } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "COMPANY" || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, address } = body;

    if (!name?.trim() || !address?.trim()) {
      return NextResponse.json(
        { error: "Branch name and address are required" },
        { status: 400 }
      );
    }

    let slug = generateSlug(name);
    // Ensure uniqueness within company
    const existing = await prisma.branch.findFirst({
      where: { companyId: session.companyId, slug },
    });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    }

    const branch = await prisma.branch.create({
      data: {
        companyId: session.companyId,
        name: name.trim(),
        slug,
        address: address.trim(),
      },
    });

    return NextResponse.json({
      success: true,
      branch: {
        id: branch.id,
        name: branch.name,
        slug: branch.slug,
        url: `${branch.slug}.${(await prisma.company.findUnique({ where: { id: session.companyId } }))?.slug}.nexora.app`,
      },
    });
  } catch (error) {
    console.error("Create branch error:", error);
    return NextResponse.json(
      { error: "Failed to create branch" },
      { status: 500 }
    );
  }
}
