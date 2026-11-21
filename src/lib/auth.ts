import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXORA_JWT_SECRET || "fallback-secret-change-me"
);

/**
 * Session carries branding context so each environment
 * can render the correct identity without hardcoding names.
 *
 * PLATFORM_OWNER → no company branding
 * COMPANY        → companyName only
 * BM / CO        → companyName + role label
 */
export type SessionPayload = {
  sub: string;
  role: "PLATFORM_OWNER" | "COMPANY" | "BM" | "CO";
  companyId?: string;
  companyName?: string;
  companySlug?: string;
  branchId?: string;
  branchName?: string;
  branchSlug?: string;
  workerId?: string;
  identityId?: string;
  name?: string;
  sessionVersion?: number;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(
  payload: SessionPayload,
  expiresIn = "7d"
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET);
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("nexora_session")?.value;
  if (!token) return null;
  const payload = await verifySessionToken(token);
  if (!payload) return null;

  // Revoke all earlier sessions when an account's sessionVersion is bumped
  // (worker replacement / password reset).
  try {
    if (payload.role === "COMPANY" && payload.companyId) {
      const company = await prisma.company.findUnique({
        where: { id: payload.companyId },
        select: { sessionVersion: true, status: true },
      });
      if (!company || company.status !== "ACTIVE" || company.sessionVersion !== (payload.sessionVersion ?? -1)) return null;
    } else if ((payload.role === "BM" || payload.role === "CO") && payload.workerId) {
      const worker = await prisma.worker.findUnique({
        where: { id: payload.workerId },
        select: { sessionVersion: true, accountStatus: true },
      });
      if (!worker || worker.accountStatus !== "ACTIVE" || worker.sessionVersion !== (payload.sessionVersion ?? -1)) return null;
    }
  } catch {
    return null;
  }
  return payload;
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("nexora_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("nexora_session");
}
