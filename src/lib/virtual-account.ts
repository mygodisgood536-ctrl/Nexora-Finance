/**
 * Asynchronous virtual-account provisioning (Vision 16.2).
 * PENDING -> RETRYING -> CREATED | FAILED (terminal provider failure only).
 * Real provider API calls with exponential backoff and persistent retry state.
 * Loan activation NEVER waits for this operation.
 */
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { notify } from "@/lib/notifications";

const BACKOFF_MINUTES = [5, 15, 30, 60, 120, 240, 480, 720];

function nextDelayMs(attempts: number): number {
  const index = Math.min(Math.max(attempts, 0), BACKOFF_MINUTES.length - 1);
  return BACKOFF_MINUTES[index] * 60 * 1000;
}

function credentialsFor(connection: any): any {
  try {
    return connection?.encryptedCredentials ? JSON.parse(decrypt(connection.encryptedCredentials)) : {};
  } catch {
    return {};
  }
}

async function callProvider(params: {
  providerCode: string;
  credentials: any;
  customerName: string;
  customerPhone: string | null;
  bvn: string | null;
  email: string;
  reference: string;
}): Promise<{ accountId: string; accountNumber: string } | { terminal: true; error: string } | { error: string }> {
  const { providerCode, credentials, customerName, email, reference } = params;
  try {
    if (providerCode === "PAYSTACK") {
      const res = await fetch("https://api.paystack.co/virtual_account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${credentials.secretKey}`,
        },
        body: JSON.stringify({
          email,
          name: customerName,
          bank_code: credentials.bankCode || "063",
          reference,
        }),
        signal: AbortSignal.timeout(15000),
      });
      const json: any = await res.json().catch(() => ({}));
      if (res.ok && json.status && json.data?.account_number) {
        return { accountId: json.data.assignment || json.data.id?.toString() || reference, accountNumber: json.data.account_number };
      }
      if (res.status === 401 || res.status === 403) return { terminal: true, error: json.message || "Invalid provider credentials" };
      return { error: json.message || `Provider returned HTTP ${res.status}` };
    }

    if (providerCode === "FLUTTERWAVE") {
      const res = await fetch("https://openapi.flutterwave.com/v3/virtual-accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${credentials.secretKey}`,
        },
        body: JSON.stringify({
          email,
          name: customerName,
          account_reference: reference,
        }),
        signal: AbortSignal.timeout(15000),
      });
      const json: any = await res.json().catch(() => ({}));
      if (res.ok && json.status === "success" && json.data?.account_number) {
        return { accountId: json.data.id?.toString() || reference, accountNumber: json.data.account_number };
      }
      if (res.status === 401 || res.status === 403) return { terminal: true, error: json.message || "Invalid provider credentials" };
      return { error: json.message || `Provider returned HTTP ${res.status}` };
    }

    if (providerCode === "MONNIFY") {
      const authRes = await fetch("https://api.monnify.com/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(`${credentials.apiKey}:${credentials.secretKey}`).toString("base64")}`,
        },
        signal: AbortSignal.timeout(15000),
      });
      const auth: any = await authRes.json().catch(() => ({}));
      if (!auth.requestSuccessful || !auth.responseBody?.accessToken) {
        return authRes.status === 401 || authRes.status === 403
          ? { terminal: true, error: auth.responseMessage || "Invalid provider credentials" }
          : { error: auth.responseMessage || "Could not authenticate with provider" };
      }
      const res = await fetch("https://api.monnify.com/api/v1/bank-transfer/reserved-accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.responseBody.accessToken}`,
        },
        body: JSON.stringify({
          accountReference: reference,
          accountName: customerName,
          currencyCode: "NGN",
          contractCode: credentials.contractCode,
          customerEmail: email,
          customerName,
          customerPhoneNumber: params.customerPhone || undefined,
          metaData: params.bvn ? { bvn: params.bvn } : undefined,
        }),
        signal: AbortSignal.timeout(15000),
      });
      const json: any = await res.json().catch(() => ({}));
      if (res.ok && json.requestSuccessful && json.responseBody?.accountNumber) {
        return {
          accountId: json.responseBody.reservedAccountReference || reference,
          accountNumber: json.responseBody.accountNumber,
        };
      }
      if (res.status === 401 || res.status === 403) return { terminal: true, error: json.responseMessage || "Invalid provider credentials" };
      return { error: json.responseMessage || `Provider returned HTTP ${res.status}` };
    }

    return { terminal: true, error: "Unsupported provider" };
  } catch (e: any) {
    return { error: e?.message || "Provider request failed" };
  }
}

/**
 * Run ONE provisioning attempt for a loan. Safe to call repeatedly.
 */
export async function provisionStep(loanId: string): Promise<void> {
  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    include: {
      customer: true,
      company: { select: { gmail: true } },
      application: { select: { repaymentMode: true } },
    },
  });
  if (!loan || loan.virtualAccountStatus === "CREATED" || loan.virtualAccountStatus === "FAILED") return;

  const connection = await prisma.providerConnection.findFirst({
    where: { branchId: loan.branchId, companyId: loan.companyId, isActive: true },
    orderBy: { createdAt: "desc" },
  });

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  if (loan.activatedAt <= oneHourAgo) {
    await prisma.operationalWarning.upsert({
      where: { id: `va-1hr-${loan.id}` },
      update: {},
      create: {
        id: `va-1hr-${loan.id}`,
        companyId: loan.companyId,
        branchId: loan.branchId,
        type: "VA_RETRYING",
        severity: "WARNING",
        message: `Virtual account provisioning still RETRYING after one hour for loan ${loan.id}. Retries continue.`,
      },
    }).catch(() => undefined);
    await notify({
      companyId: loan.companyId,
      branchId: loan.branchId,
      workerId: loan.currentOwnerWorkerId,
      customerId: loan.customerId,
      title: "Virtual account still provisioning",
      message: `Provisioning for ${loan.customer.fullName} is still retrying after one hour. Retrying continues automatically.`,
      type: "VA_ALERT",
    }).catch(() => undefined);
  }

  if (!connection) {
    const attempts = loan.provisioningAttempts + 1;
    await prisma.loan.update({
      where: { id: loanId },
      data: {
        virtualAccountStatus: "RETRYING",
        provisioningAttempts: attempts,
        nextProvisioningAt: new Date(Date.now() + nextDelayMs(attempts - 1)),
        provisioningError: "No active payment provider connection for this branch",
      },
    });
    return;
  }

  const credentials = credentialsFor(connection);
  const result = await callProvider({
    providerCode: connection.providerCode,
    credentials,
    customerName: loan.customer.fullName,
    customerPhone: loan.customer.phone,
    bvn: loan.customer.bvn,
    email: loan.company.gmail,
    reference: `NEXORA-${loan.id}`,
  });

  if ("accountNumber" in result) {
    await prisma.$transaction([
      prisma.loan.update({
        where: { id: loanId },
        data: {
          virtualAccountStatus: "CREATED",
          virtualAccountId: result.accountId,
          virtualAccountNumber: result.accountNumber,
          provisioningError: null,
          nextProvisioningAt: null,
        },
      }),
      prisma.providerConnection.update({
        where: { id: connection.id },
        data: { connectionStatus: "CONNECTED", lastHealthCheck: new Date() },
      }),
    ]);
    await notify({
      companyId: loan.companyId,
      branchId: loan.branchId,
      workerId: loan.currentOwnerWorkerId,
      customerId: loan.customerId,
      title: "Virtual account ready",
      message: `Virtual account created for ${loan.customer.fullName}. Communicate the details to the customer outside the platform.`,
      type: "VA_ALERT",
    }).catch(() => undefined);
    return;
  }

  if ("terminal" in result) {
    await prisma.loan.update({
      where: { id: loanId },
      data: {
        virtualAccountStatus: "FAILED",
        provisioningError: result.error,
        nextProvisioningAt: null,
      },
    });
    await prisma.operationalWarning.create({
      data: {
        companyId: loan.companyId,
        branchId: loan.branchId,
        type: "PROVIDER_FAILED",
        severity: "CRITICAL",
        message: `Terminal provider failure for loan ${loan.id}: ${result.error}`,
      },
    }).catch(() => undefined);
    return;
  }

  const attempts = loan.provisioningAttempts + 1;
  await prisma.loan.update({
    where: { id: loanId },
    data: {
      virtualAccountStatus: "RETRYING",
      provisioningAttempts: attempts,
      nextProvisioningAt: new Date(Date.now() + nextDelayMs(attempts - 1)),
      provisioningError: result.error,
    },
  });
  await prisma.providerConnection.update({
    where: { id: connection.id },
    data: { connectionStatus: "FAILED" },
  }).catch(() => undefined);
}

export async function queueVirtualAccountProvisioning(loanId: string) {
  await prisma.loan.update({
    where: { id: loanId },
    data: { virtualAccountStatus: "PENDING", nextProvisioningAt: new Date() },
  });
  void provisionStep(loanId).catch((e) => console.error("provisionStep", e));
}

export async function pollVirtualAccounts(companyId?: string) {
  const due = await prisma.loan.findMany({
    where: {
      virtualAccountStatus: { in: ["PENDING", "RETRYING"] },
      OR: [{ nextProvisioningAt: null }, { nextProvisioningAt: { lte: new Date() } }],
      ...(companyId ? { companyId } : {}),
    },
    select: { id: true },
    take: 50,
  });
  for (const loan of due) {
    await provisionStep(loan.id).catch((e) => console.error("poll provisionStep", e));
  }
  return due.length;
}

export async function checkAndAlertStuckProvisioning(companyId: string) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const stuck = await prisma.loan.findMany({
    where: { companyId, virtualAccountStatus: "RETRYING", activatedAt: { lt: oneHourAgo } },
    select: { id: true, branchId: true, customer: { select: { fullName: true } } },
  });
  for (const loan of stuck) {
    await notify({
      companyId,
      branchId: loan.branchId,
      title: "Virtual account still retrying",
      message: `${loan.customer.fullName}'s virtual account is still retrying after one hour. Retries continue.`,
      type: "VA_ALERT",
    }).catch(() => undefined);
  }
  return stuck.length;
}
