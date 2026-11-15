import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { encrypt } from "@/lib/encryption";

// Company users manage provider per branch. Credentials stored encrypted (placeholder for now).

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

    if (!["MONNIFY", "PAYSTACK", "FLUTTERWAVE"].includes(providerCode)) {
      return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
    }

    const branch = await prisma.branch.findFirst({
      where: { id: branchId, companyId: session.companyId },
    });
    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    // Deactivate any existing active connection for this branch
    await prisma.providerConnection.updateMany({
      where: { branchId, isActive: true },
      data: { isActive: false },
    });

    // Create new connection (credentials should be encrypted in production)
    const connection = await prisma.providerConnection.create({
      data: {
        companyId: session.companyId,
        branchId,
        providerCode,
        encryptedCredentials: encrypt(JSON.stringify(credentials)),
        webhookUrl: `/webhook/${branchId}/${providerCode.toLowerCase()}`,
        connectionStatus: "MANUAL_SETUP_REQUIRED",
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      connectionId: connection.id,
      webhookUrl: connection.webhookUrl,
      message: "Provider connection created. Complete manual webhook registration if required by the provider.",
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

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");

    const where: any = { companyId: session.companyId, isActive: true };
    if (branchId) where.branchId = branchId;

    const connections = await prisma.providerConnection.findMany({
      where,
      select: {
        id: true,
        branchId: true,
        providerCode: true,
        webhookUrl: true,
        connectionStatus: true,
        lastHealthCheck: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ connections });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load connections" }, { status: 500 });
  }
}
