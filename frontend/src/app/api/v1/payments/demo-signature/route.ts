import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { generateDemoPaymentSignature } from "@/lib/payments/gateway";
import { TicketsDatabase } from "@/lib/db/ticketsDb";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    // Security check: Only demo orders can request a demo payment signature
    if (!orderId.startsWith("order_demo_")) {
      return NextResponse.json(
        {
          error: "NOT_SANDBOX_ORDER",
          message: "Demo signature generation is strictly restricted to sandbox orders."
        },
        { status: 403 }
      );
    }

    const payment = await TicketsDatabase.getPaymentByOrderId(orderId);
    if (!payment) {
      return NextResponse.json({ error: "Order not found in database" }, { status: 404 });
    }

    const paymentId = `pay_demo_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`;
    const signature = generateDemoPaymentSignature(orderId, paymentId);

    return NextResponse.json({
      success: true,
      orderId,
      paymentId,
      signature,
      isSandbox: true,
      disclaimer: "Sandbox Test Payment Simulation — Verified via Server HMAC SHA-256"
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "DEMO_SIGNATURE_FAILED", message: error?.message || "Failed to generate demo payment signature." },
      { status: 500 }
    );
  }
}
