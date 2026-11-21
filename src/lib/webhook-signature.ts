import { createHmac, timingSafeEqual, createHash } from "crypto";
import { decrypt } from "@/lib/encryption";

function safeEqual(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a.toLowerCase(), "hex");
    const bb = Buffer.from(b.toLowerCase(), "hex");
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

/**
 * Real provider webhook authenticity verification (Vision rule 37).
 * No IP allowlist is used — verification is by signature/hash only.
 */
export function verifyWebhookSignature(params: {
  providerCode: string;
  rawBody: string;
  headers: Headers;
  encryptedCredentials: string | null;
  payload: any;
}): { valid: boolean; reason?: string } {
  let credentials: any = {};
  try {
    credentials = params.encryptedCredentials ? JSON.parse(decrypt(params.encryptedCredentials)) : {};
  } catch {
    return { valid: false, reason: "Provider credentials could not be read" };
  }

  if (params.providerCode === "PAYSTACK") {
    const secret = credentials.secretKey;
    if (!secret) return { valid: false, reason: "Paystack secret key not configured" };
    const signature = params.headers.get("x-paystack-signature");
    if (!signature) return { valid: false, reason: "Missing x-paystack-signature" };
    const expected = createHmac("sha512", secret).update(params.rawBody).digest("hex");
    return safeEqual(signature, expected)
      ? { valid: true }
      : { valid: false, reason: "Invalid Paystack signature" };
  }

  if (params.providerCode === "FLUTTERWAVE") {
    const secret = credentials.secretKey || credentials.encryptionKey;
    if (!secret) return { valid: false, reason: "Flutterwave secret key not configured" };
    const signature =
      params.headers.get("verified-hash") ||
      params.headers.get("x-flutterwave-signature") ||
      (typeof params.payload?.hash === "string" ? params.payload.hash : "");
    if (!signature) return { valid: false, reason: "Missing Flutterwave hash" };
    const expected = createHmac("sha256", secret).update(params.rawBody).digest("hex");
    return safeEqual(signature, expected)
      ? { valid: true }
      : { valid: false, reason: "Invalid Flutterwave hash" };
  }

  if (params.providerCode === "MONNIFY") {
    const secret = credentials.secretKey;
    if (!secret) return { valid: false, reason: "Monnify secret key not configured" };
    const provided =
      params.headers.get("x-monnify-signature") ||
      (typeof params.payload?.hash === "string" ? params.payload.hash : "") ||
      (typeof params.payload?.signature === "string" ? params.payload.signature : "");
    if (!provided) return { valid: false, reason: "Missing Monnify signature" };
    const p = params.payload?.data || params.payload || {};
    const paymentReference = p.paymentReference || p.payment_reference || "";
    const amount = p.amountPaid ?? p.amount ?? "";
    const transactionReference = p.transactionReference || p.transaction_reference || "";
    const canonical = `${paymentReference}${amount}|${transactionReference}`;
    const expected = createHash("sha512").update(canonical).update(secret).digest("hex");
    if (safeEqual(provided, expected)) return { valid: true };
    const hmacExpected = createHmac("sha512", secret).update(params.rawBody).digest("hex");
    return safeEqual(provided, hmacExpected)
      ? { valid: true }
      : { valid: false, reason: "Invalid Monnify signature" };
  }

  return { valid: false, reason: "Unsupported provider" };
}

/**
 * Connection test: performs a lightweight authenticated request to the
 * provider using the configured credentials, before activating the connection.
 */
export async function testProviderConnection(providerCode: string, credentials: any): Promise<{ ok: boolean; message: string }> {
  try {
    if (providerCode === "PAYSTACK") {
      if (!credentials.secretKey) return { ok: false, message: "Secret key is required" };
      const res = await fetch("https://api.paystack.co/bank", {
        headers: { Authorization: `Bearer ${credentials.secretKey}` },
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) return { ok: true, message: "Paystack connection verified" };
      return { ok: false, message: `Paystack rejected the credentials (HTTP ${res.status})` };
    }
    if (providerCode === "FLUTTERWAVE") {
      if (!credentials.secretKey) return { ok: false, message: "Secret key is required" };
      const res = await fetch("https://openapi.flutterwave.com/v3/banks/NG", {
        headers: { Authorization: `Bearer ${credentials.secretKey}` },
        signal: AbortSignal.timeout(10000),
      });
      const json: any = await res.json().catch(() => ({}));
      return json.status === "success"
        ? { ok: true, message: "Flutterwave connection verified" }
        : { ok: false, message: json.message || "Flutterwave rejected the credentials" };
    }
    if (providerCode === "MONNIFY") {
      if (!credentials.apiKey || !credentials.secretKey) return { ok: false, message: "API key and secret key are required" };
      const tokenRes = await fetch("https://api.monnify.com/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(`${credentials.apiKey}:${credentials.secretKey}`).toString("base64")}`,
        },
        signal: AbortSignal.timeout(10000),
      });
      const json: any = await tokenRes.json().catch(() => ({}));
      return json.requestSuccessful
        ? { ok: true, message: "Monnify connection verified" }
        : { ok: false, message: json.responseMessage || "Monnify rejected the credentials" };
    }
    return { ok: false, message: "Unsupported provider" };
  } catch (e: any) {
    return { ok: false, message: `Connection test failed: ${e?.message || "network error"}` };
  }
}
