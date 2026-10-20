import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { generateDemoPaymentSignature } from "@/lib/payments/gateway";
import { TicketsDatabase } from "@/lib/db/ticketsDb";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, source, destination, transportMode, passengerName } = body;

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

    let payment = await TicketsDatabase.getPaymentByOrderId(orderId);
    if (!payment) {
      if (orderId.startsWith("order_demo_")) {
        const fallbackBooking = await TicketsDatabase.createBooking({
          source: (source && String(source).trim()) || "Dadar Central Station",
          destination: (destination && String(destination).trim()) || "CSMT Terminus",
          distanceKm: 10,
          passengerName: (passengerName && String(passengerName).trim()) || "Devansh Soni",
          passengerPhone: "9876543210",
          passengerEmail: "commuter@routesense.in",
          passengerCount: 1,
          transportMode: transportMode || "TRAIN",
          tier: "LOCAL_II",
          operator: transportMode === "BUS" ? "BEST Undertaking" : "Mumbai Suburban Railway (Central Line)",
          vehicleTitle: transportMode === "BUS" ? "BEST Bus" : "Suburban EMU Local Train",
          singleFare: 10,
          totalFare: 10,
          currency: "INR"
        });
        payment = await TicketsDatabase.createPayment({
          bookingId: fallbackBooking.id,
          orderId,
          amount: 10,
          currency: "INR",
          gateway: "DEMO_SANDBOX",
          isSandbox: true
        });
      } else {
        return NextResponse.json({ error: "Order not found in database" }, { status: 404 });
      }
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
