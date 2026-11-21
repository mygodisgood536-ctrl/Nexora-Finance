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

    const company = await prisma.company.findUnique({ where: { id: session.companyId } });
    const companySlug = company?.slug || "";
    const origin =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
      `${new URL(req.url).protocol}//${new URL(req.url).host}`;

    return NextResponse.json({
      success: true,
      branch: {
        id: branch.id,
        name: branch.name,
        slug: branch.slug,
        // A URL that actually opens the branch staff sign-in on this deployment.
        url: `${origin}/branch/login?company=${encodeURIComponent(companySlug)}&branch=${encodeURIComponent(branch.slug)}`,
        // The canonical host form from the vision; resolves once wildcard DNS is configured.
        host: `${branch.slug}.${companySlug}.nexora.app`,
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
