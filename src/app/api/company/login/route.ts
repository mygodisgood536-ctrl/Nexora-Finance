import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  verifyPassword,
  createSessionToken,
  setSessionCookie,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, password } = body;

    if (!slug?.trim() || !password) {
      return NextResponse.json(
        { error: "Workspace ID and password are required" },
        { status: 400 }
      );
    }

    const company = await prisma.company.findUnique({
      where: { slug: slug.trim().toLowerCase() },
    });

    if (!company) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (company.status === "DEACTIVATED") {
      return NextResponse.json(
        { error: "This workspace has been deactivated" },
        { status: 403 }
      );
    }

    if (company.status === "SUSPENDED") {
      return NextResponse.json(
        { error: "This workspace is currently suspended" },
        { status: 403 }
      );
    }

    const valid = await verifyPassword(password, company.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await createSessionToken({
      sub: company.id,
      role: "COMPANY",
      companyId: company.id,
      companyName: company.name,
      companySlug: company.slug,
      name: company.name,
      sessionVersion: company.sessionVersion,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      mustChangePassword: company.mustChangePassword,
      companyName: company.name,
    });
  } catch (error: any) {
    console.error("Company login error:", error);
    const msg = error?.message || "";
    if (msg.includes("prisma") || msg.includes("database") || msg.includes("Can't reach")) {
      return NextResponse.json(
        { error: "Database not ready. Run prisma generate & db push." },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
