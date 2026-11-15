import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, hashPassword } from "@/lib/auth";
import { generateSlug, generateTempPassword } from "@/lib/utils";

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
    // Ensure uniqueness
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

    const url = `https://${company.slug}.nexora.app`;

    return NextResponse.json({
      success: true,
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
      },
      url,
      tempPassword,
    });
  } catch (error) {
    console.error("Create company error:", error);
    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 }
    );
  }
}
