import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, hashPassword } from "@/lib/auth";
import { generateSlug, generateTempPassword } from "@/lib/utils";

function companyAccessUrl(slug: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://nexorafinancecom.vercel.app";
  // Path-based access on current deployment; custom domain can map host → same routes later
  return `${base.replace(/\/$/, "")}/c/${slug}`;
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "PLATFORM_OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companies = await prisma.company.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { branches: true, workers: true } },
      },
    });

    return NextResponse.json({
      companies: companies.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        gmail: c.gmail,
        address: c.address,
        status: c.status,
        createdAt: c.createdAt.toISOString(),
        branchCount: c._count.branches,
        workerCount: c._count.workers,
        accessUrl: companyAccessUrl(c.slug),
      })),
    });
  } catch (error) {
    console.error("[owner/companies GET]", error);
    return NextResponse.json({ error: "Unable to load companies" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "PLATFORM_OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, gmail, address } = body;

    if (!name?.trim() || !gmail?.trim() || !address?.trim()) {
      return NextResponse.json(
        { error: "Company name, Gmail and address are required" },
        { status: 400 }
      );
    }

    let slug = generateSlug(name);
    if (!slug) slug = `co-${Date.now().toString(36)}`;

    const existing = await prisma.company.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    }

    const tempPassword = generateTempPassword(10);
    const passwordHash = await hashPassword(tempPassword);

    const company = await prisma.company.create({
      data: {
        name: name.trim(),
        slug,
        gmail: gmail.trim().toLowerCase(),
        address: address.trim(),
        passwordHash,
        tempPassword,
        mustChangePassword: true,
        status: "ACTIVE",
      },
    });

    const accessUrl = companyAccessUrl(company.slug);

    return NextResponse.json({
      success: true,
      id: company.id,
      name: company.name,
      slug: company.slug,
      accessUrl,
      // Intended production host form (when wildcard DNS is configured)
      customHost: `${company.slug}.nexora.app`,
      tempPassword,
    });
  } catch (error) {
    console.error("[owner/companies POST]", error);
    return NextResponse.json({ error: "Failed to create company" }, { status: 500 });
  }
}
