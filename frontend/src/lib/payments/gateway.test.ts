import { describe, it, expect } from "vitest";
import crypto from "crypto";
import {
  createPaymentOrder,
  verifyPaymentSignature,
  generateDemoPaymentSignature,
  signTicketToken,
  verifyTicketToken,
  verifyWebhookSignature
} from "./gateway";

describe("Route Sense Gateway & Cryptographic Engine", () => {
  it("creates a payment order in sandbox mode with correct amount in paise", async () => {
    const order = await createPaymentOrder({
      bookingId: "BKG_TEST_101",
      amountInr: 25,
      currency: "INR",
      notes: { mode: "TRAIN" }
    });

    expect(order.orderId).toMatch(/^order_demo_/);
    expect(order.amountInr).toBe(25);
    expect(order.amountPaise).toBe(2500);
    expect(order.currency).toBe("INR");
    expect(order.isSandbox).toBe(true);
    expect(order.disclaimer).toContain("Route Sense Demonstration & Commuter Pass");
  });

  it("verifies authentic demo payment signature generated with HMAC-SHA256", () => {
    const orderId = "order_demo_test_order_123";
    const paymentId = "pay_demo_user_456";

    const signature = generateDemoPaymentSignature(orderId, paymentId);
    expect(typeof signature).toBe("string");
    expect(signature.length).toBe(64); // SHA-256 hex string length

    const result = verifyPaymentSignature({
      orderId,
      paymentId,
      signature
    });

    expect(result.valid).toBe(true);
  });

  it("strictly rejects tampered or fraudulent payment signatures", () => {
    const orderId = "order_demo_test_order_123";
    const paymentId = "pay_demo_user_456";

    // Tampered signature of 64 hex characters
    const forgedSignature = "a".repeat(64);

    const result = verifyPaymentSignature({
      orderId,
      paymentId,
      signature: forgedSignature
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain("signature verification failed");
  });

  it("rejects verification requests with missing or empty parameters", () => {
    const result1 = verifyPaymentSignature({
      orderId: "",
      paymentId: "pay_123",
      signature: "sig_123"
    });
    expect(result1.valid).toBe(false);

    const result2 = verifyPaymentSignature({
      orderId: "order_123",
      paymentId: "",
      signature: "sig_123"
    });
    expect(result2.valid).toBe(false);

    const result3 = verifyPaymentSignature({
      orderId: "order_123",
      paymentId: "pay_123",
      signature: ""
    });
    expect(result3.valid).toBe(false);
  });

  it("signs and verifies cryptographic ticket tokens", () => {
    const signed = signTicketToken({
      ticketId: "TKT_TEST_999",
      pnr: "CRW-98765432",
      amount: 40,
      validHours: 2
    });

    expect(signed.token).toContain(".");
    const [payloadB64, sig] = signed.token.split(".");
    expect(payloadB64).toBeDefined();
    expect(sig).toBeDefined();

    const verification = verifyTicketToken(signed.token);
    expect(verification.valid).toBe(true);
    expect(verification.payload?.t).toBe("TKT_TEST_999");
    expect(verification.payload?.p).toBe("CRW-98765432");
    expect(verification.payload?.a).toBe(40);
  });

  it("rejects a ticket token with tampered payload or signature", () => {
    const signed = signTicketToken({
      ticketId: "TKT_REAL_001",
      pnr: "CRW-11111111",
      amount: 10,
      validHours: 2
    });

    const [payloadB64] = signed.token.split(".");
    const fakeToken = `${payloadB64}.tampered_signature_bytes_should_fail`;

    const result = verifyTicketToken(fakeToken);
    expect(result.valid).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it("rejects an expired ticket token", () => {
    // Generate token with negative validity (-1 hour)
    const signed = signTicketToken({
      ticketId: "TKT_EXPIRED_001",
      pnr: "CRW-00000000",
      amount: 15,
      validHours: -1
    });

    const result = verifyTicketToken(signed.token);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("expired");
  });

  it("validates webhook HMAC signatures properly", () => {
    const rawPayload = JSON.stringify({ event: "payment.captured", id: "evt_123" });
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.SECRET_KEY || "routesense-mumbai-default-crypto-secret-2026";

    // Compute expected signature
    const validSignature = crypto.createHmac("sha256", secret).update(rawPayload).digest("hex");

    const validResult = verifyWebhookSignature(rawPayload, validSignature);
    expect(validResult).toBe(true);

    const invalidResult = verifyWebhookSignature(rawPayload, "invalid_webhook_sig");
    expect(invalidResult).toBe(false);
  });
});
