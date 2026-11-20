import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { markNotificationsRead } from "@/lib/analytics";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.workerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const notifications = await prisma.notification.findMany({
    where: { workerId: session.workerId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ notifications });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.workerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await markNotificationsRead(session.workerId);
  return NextResponse.json({ success: true });
}
