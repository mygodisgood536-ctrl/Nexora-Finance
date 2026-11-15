import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  setSessionCookie,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Ensure platform owner exists (bootstrap)
    let owner = await prisma.platformOwner.findUnique({
      where: { username: process.env.NEXORA_OWNER_USERNAME || "owner" },
    });

    if (!owner) {
      // First run: create the owner with the configured password
      const passwordHash = await hashPassword(
        process.env.NEXORA_OWNER_PASSWORD || "Shellybr@123"
      );
      owner = await prisma.platformOwner.create({
        data: {
          username: process.env.NEXORA_OWNER_USERNAME || "owner",
          passwordHash,
        },
      });
    }

    // Verify credentials
    if (username !== owner.username) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await verifyPassword(password, owner.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await createSessionToken({
      sub: owner.id,
      role: "PLATFORM_OWNER",
      name: "Platform Owner",
    });

    await setSessionCookie(token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Owner login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
