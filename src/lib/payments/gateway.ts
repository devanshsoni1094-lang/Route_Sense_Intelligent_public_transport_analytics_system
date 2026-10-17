/**
 * Route Sense Mumbai — Payment Gateway & Cryptographic Verification Service
 * Supports official Razorpay Gateway with HMAC-SHA256 signature verification,
 * signed webhooks, and a clearly labelled, secure Demo/Sandbox Gateway
 * for development, evaluation, and automated testing.
 */

import crypto from "crypto";

const DEMO_SECRET_KEY = process.env.SECRET_KEY || "routesense-mumbai-default-crypto-secret-2026";
const TOKEN_SIGNING_SECRET = process.env.ROUTE_SENSE_TOKEN_SECRET || DEMO_SECRET_KEY;

export interface PaymentOrderResult {
  orderId: string;
  amountInr: number;
  amountPaise: number;
  currency: string;
  keyId: string;
  isSandbox: boolean;
  gateway: "RAZORPAY" | "DEMO_SANDBOX";
  receipt: string;
  disclaimer: string;
}

export interface PaymentVerificationInput {
  orderId: string;
  paymentId: string;
  signature: string;
}

/**
 * Checks if production/live Razorpay credentials are configured
 */
export function isRazorpayConfigured(): boolean {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  return Boolean(
    keyId &&
    keySecret &&
    !keyId.includes("your_") &&
    !keySecret.includes("your_") &&
    keyId.trim().length > 6
  );
}

export function getRazorpayKeyId(): string {
  if (isRazorpayConfigured()) {
    return process.env.RAZORPAY_KEY_ID!.trim();
  }
  return "rzp_test_routesense_sandbox";
}

/**
 * 1. Create Payment Order on Backend
 */
export async function createPaymentOrder(params: {
  bookingId: string;
  amountInr: number;
  currency?: string;
  notes?: Record<string, string>;
}): Promise<PaymentOrderResult> {
  const currency = params.currency || "INR";
  const amountPaise = Math.round(params.amountInr * 100);
  const receipt = `rcpt_${params.bookingId.replace(/[^a-zA-Z0-9]/g, "").slice(-12)}`;

  const disclaimer =
    "Route Sense Demonstration & Commuter Pass — Not an official BEST / Indian Railways suburban ticket.";

  // If real Razorpay credentials are set, initiate order via Razorpay API
  if (isRazorpayConfigured()) {
    const keyId = process.env.RAZORPAY_KEY_ID!.trim();
    const keySecret = process.env.RAZORPAY_KEY_SECRET!.trim();
    const authHeader = "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    try {
      const res = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader
        },
        body: JSON.stringify({
          amount: amountPaise,
          currency,
          receipt,
          notes: {
            bookingId: params.bookingId,
            platform: "Route Sense Mumbai",
            ...params.notes
          }
        })
      });

      if (!res.ok) {
        const errorBody = await res.text();
        console.error("Razorpay API order creation failed:", res.status, errorBody);
        throw new Error(`Razorpay Order creation failed with status ${res.status}`);
      }

      const orderData = await res.json();
      return {
        orderId: orderData.id,
        amountInr: params.amountInr,
        amountPaise: orderData.amount,
        currency: orderData.currency,
        keyId,
        isSandbox: false,
        gateway: "RAZORPAY",
        receipt,
        disclaimer
      };
    } catch (err: any) {
      console.warn("Live Razorpay call failed, falling back to secure sandbox order:", err?.message || err);
      // Fall through to sandbox
    }
  }

  // Secure Sandbox / Route Sense Demonstration Gateway
  const orderId = `order_demo_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`;
  return {
    orderId,
    amountInr: params.amountInr,
    amountPaise,
    currency,
    keyId: "rzp_test_routesense_sandbox",
    isSandbox: true,
    gateway: "DEMO_SANDBOX",
    receipt,
    disclaimer
  };
}

/**
 * 2. Verify Payment Signature using HMAC-SHA256 with Constant-Time Comparison
 */
export function verifyPaymentSignature(input: PaymentVerificationInput): {
  valid: boolean;
  reason?: string;
} {
  const { orderId, paymentId, signature } = input;

  if (!orderId || !paymentId || !signature) {
    return { valid: false, reason: "Missing required orderId, paymentId, or signature" };
  }

  const payload = `${orderId}|${paymentId}`;

  // Check if live Razorpay order
  if (!orderId.startsWith("order_demo_") && isRazorpayConfigured()) {
    const keySecret = process.env.RAZORPAY_KEY_SECRET!.trim();
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(payload)
      .digest("hex");

    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expectedBuffer.length) {
      return { valid: false, reason: "Signature length mismatch" };
    }

    const isValid = crypto.timingSafeEqual(sigBuffer, expectedBuffer);
    if (!isValid) {
      return { valid: false, reason: "Cryptographic HMAC signature does not match gateway secret" };
    }
    return { valid: true };
  }

  // Sandbox / Demo order verification
  const demoSecret = DEMO_SECRET_KEY;
  const expectedDemoSignature = crypto
    .createHmac("sha256", demoSecret)
    .update(payload)
    .digest("hex");

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedDemoSignature);

  if (sigBuffer.length !== expectedBuffer.length) {
    return { valid: false, reason: "Demo signature length mismatch" };
  }

  const isValid = crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  if (!isValid) {
    return { valid: false, reason: "Demo signature verification failed. Forged or corrupted signature." };
  }

  return { valid: true };
}

/**
 * Generates an authentic signature for Sandbox / Demonstration mode
 */
export function generateDemoPaymentSignature(orderId: string, paymentId: string): string {
  const payload = `${orderId}|${paymentId}`;
  return crypto.createHmac("sha256", DEMO_SECRET_KEY).update(payload).digest("hex");
}

/**
 * 3. Verify Razorpay Webhook Signature
 */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || DEMO_SECRET_KEY;
  if (!rawBody || !signatureHeader) return false;

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  const sigBuffer = Buffer.from(signatureHeader.trim());
  const expectedBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
}

/**
 * 4. Sign Ticket Verification Token
 * Generates a signed cryptographic token embedded in the ticket QR code.
 */
export function signTicketToken(params: {
  ticketId: string;
  pnr: string;
  amount: number;
  validHours?: number;
}): { token: string; qrPayload: string; verificationUrl: string } {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + (params.validHours || 2) * 3600;

  const payloadObj = {
    t: params.ticketId,
    p: params.pnr,
    a: params.amount,
    iat: issuedAt,
    exp: expiresAt,
    iss: "routesense.mumbai"
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payloadObj)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", TOKEN_SIGNING_SECRET)
    .update(payloadBase64)
    .digest("base64url");

  const token = `${payloadBase64}.${signature}`;
  const verificationUrl = `/verify?token=${token}`;

  const qrPayload = JSON.stringify({
    ticketId: params.ticketId,
    pnr: params.pnr,
    token,
    url: verificationUrl,
    securedBy: "Route Sense HMAC-SHA256"
  });

  return {
    token,
    qrPayload,
    verificationUrl
  };
}

/**
 * 5. Verify Ticket Token
 */
export function verifyTicketToken(token: string): {
  valid: boolean;
  isExpired?: boolean;
  payload?: any;
  reason?: string;
} {
  try {
    const parts = token.trim().split(".");
    if (parts.length !== 2) {
      return { valid: false, reason: "Malformed verification token structure" };
    }

    const [payloadBase64, signature] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", TOKEN_SIGNING_SECRET)
      .update(payloadBase64)
      .digest("base64url");

    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expectedBuffer.length) {
      return { valid: false, reason: "Signature length mismatch" };
    }

    if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return { valid: false, reason: "Token signature does not match Route Sense signing key" };
    }

    const decoded = JSON.parse(Buffer.from(payloadBase64, "base64url").toString("utf-8"));
    const now = Math.floor(Date.now() / 1000);

    if (decoded.exp && now > decoded.exp) {
      return { valid: false, isExpired: true, payload: decoded, reason: "Ticket validity duration has expired" };
    }

    return { valid: true, isExpired: false, payload: decoded };
  } catch (err: any) {
    return { valid: false, reason: `Token decode error: ${err?.message || "Invalid payload"}` };
  }
}
