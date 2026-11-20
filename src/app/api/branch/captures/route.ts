import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/notifications";

const FACE_TYPES = ["CUSTOMER_FACE", "GUARANTOR_FACE"];
const EVIDENCE_TYPES = ["CUSTOMER_HOUSE", "GUARANTOR_HOUSE", "CUSTOMER_BUSINESS", "GUARANTOR_BUSINESS", "LOAN_FORM"];

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.workerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const applicationId = new URL(req.url).searchParams.get("applicationId");
  if (!applicationId) return NextResponse.json({ error: "applicationId required" }, { status: 400 });
  const application = await prisma.loanApplication.findFirst({
    where: { id: applicationId, currentOwnerWorkerId: session.workerId },
  });
  if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 });
  const [faces, evidence] = await Promise.all([
    prisma.faceCapture.findMany({ where: { applicationId }, orderBy: { createdAt: "asc" } }),
    prisma.evidenceCapture.findMany({ where: { applicationId }, orderBy: [{ type: "asc" }, { pageNumber: "asc" }, { createdAt: "asc" }] }),
  ]);
  return NextResponse.json({ faces, evidence });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.workerId || !session.identityId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const { applicationId, type, imageData, pageNumber, quality } = body;
    if (!applicationId || !type || !imageData) return NextResponse.json({ error: "applicationId, type and imageData required" }, { status: 400 });
    if (typeof imageData !== "string" || !imageData.startsWith("data:") || imageData.length > 15 * 1024 * 1024) {
      return NextResponse.json({ error: "Invalid or oversized image" }, { status: 400 });
    }
    const application = await prisma.loanApplication.findFirst({
      where: { id: applicationId, currentOwnerWorkerId: session.workerId },
    });
    if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 });

    let id: string;
    if (FACE_TYPES.includes(type)) {
      const q = quality || {};
      const face = await prisma.faceCapture.create({
        data: {
          applicationId,
          type: type === "CUSTOMER_FACE" ? "CUSTOMER" : "GUARANTOR",
          imagePath: `capture://${applicationId}/${type}`,
          imageData,
          meanBrightness: q.meanBrightness ?? null,
          laplacianVariance: q.laplacianVariance ?? null,
          faceConfidence: q.faceConfidence ?? null,
          passiveLiveness: q.passiveLiveness ?? null,
          passed: true,
        },
      });
      id = face.id;
    } else if (EVIDENCE_TYPES.includes(type)) {
      const ev = await prisma.evidenceCapture.create({
        data: {
          applicationId,
          type,
          imagePath: `capture://${applicationId}/${type}`,
          imageData,
          pageNumber: type === "LOAN_FORM" ? (pageNumber ?? null) : null,
        },
      });
      id = ev.id;
    } else {
      return NextResponse.json({ error: "Invalid capture type" }, { status: 400 });
    }

    await audit({
      companyId: application.customerId ? (await prisma.customer.findUnique({ where: { id: application.customerId }, select: { companyId: true } }))?.companyId || "" : "",
      branchId: undefined,
      actorIdentityId: session.identityId,
      actorRole: session.role,
      action: "CAPTURE_SAVED",
      entity: type,
      entityId: id,
    }).catch(() => undefined);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to save capture" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.workerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { captureId, kind } = await req.json();
  if (!captureId || !["face", "evidence"].includes(kind)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  if (kind === "face") {
    const face = await prisma.faceCapture.findFirst({ where: { id: captureId, application: { currentOwnerWorkerId: session.workerId } } });
    if (!face) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.faceCapture.delete({ where: { id: captureId } });
  } else {
    const ev = await prisma.evidenceCapture.findFirst({ where: { id: captureId, application: { currentOwnerWorkerId: session.workerId } } });
    if (!ev) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.evidenceCapture.delete({ where: { id: captureId } });
  }
  return NextResponse.json({ success: true });
}
