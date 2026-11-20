import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getOwnerHealth } from "@/lib/analytics";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "PLATFORM_OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const health = await getOwnerHealth();
  return NextResponse.json(health);
}
