import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { pollVirtualAccounts } from "@/lib/virtual-account";

/** Drives one provisioning retry pass. Callable by a scheduler or an authenticated user. */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.get("x-cron-secret") || req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || null;
  const session = await getSession();
  const byCron = !!secret && header === secret;
  const byUser = !!session && ["COMPANY", "BM", "CO"].includes(session.role);
  if (!byCron && !byUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const processed = await pollVirtualAccounts(session?.companyId);
  return NextResponse.json({ processed });
}

export async function GET() {
  return NextResponse.json({ status: "Provisioning poller is available via POST" });
}
