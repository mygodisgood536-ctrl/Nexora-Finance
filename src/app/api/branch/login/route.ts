import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, createSessionToken, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { companySlug, branchSlug, phone, password } = await req.json();
    if (!companySlug || !branchSlug || !phone || !password) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }

    const company = await prisma.company.findUnique({
      where: { slug: companySlug.trim().toLowerCase() },
    });
    if (!company || company.status !== "ACTIVE") {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const branch = await prisma.branch.findFirst({
      where: { companyId: company.id, slug: branchSlug.trim().toLowerCase() },
    });
    if (!branch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const identity = await prisma.workerIdentity.findFirst({
      where: {
        phone: phone.trim(),
        identityStatus: "ACTIVE",
        worker: { branchId: branch.id, accountStatus: "ACTIVE" },
      },
      include: { worker: true },
    });

    if (!identity) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await verifyPassword(password, identity.worker.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await createSessionToken({
      sub: identity.worker.id,
      role: identity.worker.role as "BM" | "CO",
      companyId: company.id,
      companyName: company.name,
      companySlug: company.slug,
      branchId: branch.id,
      branchName: branch.name,
      branchSlug: branch.slug,
      workerId: identity.worker.id,
      identityId: identity.id,
      name: identity.name,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      role: identity.worker.role,
      companyName: company.name,
    });
  } catch (error: any) {
    console.error("Branch login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
