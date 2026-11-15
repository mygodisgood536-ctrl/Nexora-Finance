import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "COMPANY" || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { password } = await req.json();
    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }
    const passwordHash = await hashPassword(password);
    await prisma.company.update({
      where: { id: session.companyId },
      data: {
        passwordHash,
        tempPassword: null,
        mustChangePassword: false,
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
  }
}
