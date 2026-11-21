import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { encrypt, decrypt } from "@/lib/encryption";
import { testProviderConnection } from "@/lib/webhook-signature";
import { audit } from "@/lib/notifications";

const PROVIDERS = ["MONNIFY", "PAYSTACK", "FLUTTERWAVE"];

function webhookUrl(branchId: string, providerCode: string) {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://nexorafinancecom.vercel.app").replace(/\/$/, "");
  return `${base}/webhook/${branchId}/${providerCode.toLowerCase()}`;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "COMPANY" || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { branchId, providerCode, credentials } = await req.json();
    if (!branchId || !providerCode || !credentials) {
      return NextResponse.json({ error: "branchId, providerCode and credentials required" }, { status: 400 });
    }
    if (!PROVIDERS.includes(providerCode)) {
      return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
    }
    const branch = await prisma.branch.findFirst({ where: { id: branchId, companyId: session.companyId } });
    if (!branch) return NextResponse.json({ error: "Branch not found" }, { status: 404 });

    const test = await testProviderConnection(providerCode, credentials);
    if (!test.ok) {
      return NextResponse.json({ error: test.message }, { status: 400 });
    }

    await prisma.providerConnection.updateMany({
      where: { branchId, isActive: true },
      data: { isActive: false },
    });
    const connection = await prisma.providerConnection.create({
      data: {
        companyId: session.companyId,
        branchId,
        providerCode,
        encryptedCredentials: encrypt(JSON.stringify(credentials)),
        webhookUrl: webhookUrl(branchId, providerCode),
        connectionStatus: "CONNECTED",
        lastHealthCheck: new Date(),
        isActive: true,
      },
    });
    await audit({
      companyId: session.companyId,
      branchId,
      actorRole: "COMPANY",
      action: "PROVIDER_CONNECTED",
      entity: "ProviderConnection",
      entityId: connection.id,
      details: { providerCode },
    });
    return NextResponse.json({
      success: true,
      connectionId: connection.id,
      webhookUrl: connection.webhookUrl,
      message: "Connection tested and activated. Register the webhook endpoint if your provider requires manual setup.",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to save provider connection" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "COMPANY" || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const branchId = new URL(req.url).searchParams.get("branchId");
    const where: any = { companyId: session.companyId, isActive: true };
    if (branchId) where.branchId = branchId;
    const connections = await prisma.providerConnection.findMany({
      where,
      include: { branch: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({
      connections: connections.map((c) => ({
        id: c.id,
        branchId: c.branchId,
        branchName: c.branch.name,
        providerCode: c.providerCode,
        webhookUrl: c.webhookUrl,
        connectionStatus: c.connectionStatus,
        lastHealthCheck: c.lastHealthCheck?.toISOString() || null,
        createdAt: c.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load connections" }, { status: 500 });
  }
}

/** Test, reconnect, or disconnect an existing connection. */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "COMPANY" || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { connectionId, action } = await req.json();
    const connection = await prisma.providerConnection.findFirst({
      where: { id: connectionId, companyId: session.companyId },
    });
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

    if (action === "disconnect") {
      await prisma.providerConnection.update({
        where: { id: connection.id },
        data: { isActive: false, connectionStatus: "MANUAL_SETUP_REQUIRED" },
      });
      await audit({ companyId: session.companyId, branchId: connection.branchId, actorRole: "COMPANY", action: "PROVIDER_DISCONNECTED", entity: "ProviderConnection", entityId: connection.id });
      return NextResponse.json({ success: true });
    }

    if (action === "test" || action === "reconnect") {
      let credentials: any = {};
      try { credentials = JSON.parse(decrypt(connection.encryptedCredentials)); } catch { /* ignore */ }
      const test = await testProviderConnection(connection.providerCode, credentials);
      if (!test.ok) {
        await prisma.providerConnection.update({
          where: { id: connection.id },
          data: { connectionStatus: "FAILED" },
        });
        return NextResponse.json({ error: test.message }, { status: 400 });
      }
      await prisma.providerConnection.update({
        where: { id: connection.id },
        data: { connectionStatus: "CONNECTED", isActive: true, lastHealthCheck: new Date() },
      });
      await audit({ companyId: session.companyId, branchId: connection.branchId, actorRole: "COMPANY", action: action === "test" ? "PROVIDER_TESTED" : "PROVIDER_RECONNECTED", entity: "ProviderConnection", entityId: connection.id });
      return NextResponse.json({ success: true, message: test.message });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Provider action failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "COMPANY" || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const branchId = new URL(req.url).searchParams.get("branchId");
    if (!branchId) return NextResponse.json({ error: "branchId required" }, { status: 400 });
    await prisma.providerConnection.updateMany({
      where: { companyId: session.companyId, branchId },
      data: { isActive: false, connectionStatus: "MANUAL_SETUP_REQUIRED" },
    });
    await audit({ companyId: session.companyId, branchId, actorRole: "COMPANY", action: "PROVIDER_DISCONNECTED", entity: "ProviderConnection" });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
  }
}
