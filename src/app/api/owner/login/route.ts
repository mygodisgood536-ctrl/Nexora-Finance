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

    let prisma: any;
    try {
      const mod = await import("@/lib/db");
      prisma = mod.prisma;
    } catch (e) {
      console.error("[owner/login] Prisma import failed:", e);
      return NextResponse.json(
        { error: "Sign-in is temporarily unavailable. Please try again shortly." },
        { status: 503 }
      );
    }

    const ownerUsername = process.env.NEXORA_OWNER_USERNAME || "owner";
    const ownerPassword = process.env.NEXORA_OWNER_PASSWORD || "Shellybr@123";

    let owner;
    try {
      owner = await prisma.platformOwner.findUnique({
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
    } catch (e) {
      console.error("[owner/login] Database operation failed:", e);
      return NextResponse.json(
        { error: "Sign-in is temporarily unavailable. Please try again shortly." },
        { status: 503 }
      );
    }

    if (username !== owner.username) {
      return NextResponse.json({ error: "Incorrect username or password." }, { status: 401 });
    }

    const valid = await verifyPassword(password, owner.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Incorrect username or password." }, { status: 401 });
    }

    const token = await createSessionToken({
      sub: owner.id,
      role: "PLATFORM_OWNER",
      name: "Infrastructure Owner",
    });

    await setSessionCookie(token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[owner/login] Unexpected error:", error);
    return NextResponse.json(
      { error: "Sign-in is temporarily unavailable. Please try again shortly." },
      { status: 500 }
    );
  }
}
