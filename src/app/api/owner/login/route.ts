import { NextRequest, NextResponse } from "next/server";
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

    // Lazy import so missing Prisma client gives a clear message
    let prisma: any;
    try {
      const mod = await import("@/lib/db");
      prisma = mod.prisma;
    } catch (e: any) {
      console.error("Prisma import failed:", e);
      return NextResponse.json(
        { error: "Database client not ready. Run: npm install && npx prisma db push && npx prisma generate" },
        { status: 500 }
      );
    }

    const ownerUsername = process.env.NEXORA_OWNER_USERNAME || "owner";
    const ownerPassword = process.env.NEXORA_OWNER_PASSWORD || "Shellybr@123";

    let owner = await prisma.platformOwner.findUnique({
      where: { username: ownerUsername },
    });

    if (!owner) {
      const passwordHash = await hashPassword(ownerPassword);
      owner = await prisma.platformOwner.create({
        data: {
          username: ownerUsername,
          passwordHash,
        },
      });
    }

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
  } catch (error: any) {
    console.error("Owner login error:", error);
    const msg = error?.message || "Internal server error";
    // Surface common Prisma / DB errors clearly
    if (msg.includes("Can't reach database") || msg.includes("P1001") || msg.includes("does not exist")) {
      return NextResponse.json(
        { error: "Database not ready. Run: npx prisma db push && npx prisma generate" },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: msg.includes("prisma") ? "Database error — run prisma generate & db push" : "Internal server error" },
      { status: 500 }
    );
  }
}
