import { NextRequest, NextResponse } from "next/server";
import { TicketsDatabase } from "@/lib/db/ticketsDb";
import { verifyWebhookSignature, signTicketToken } from "@/lib/payments/gateway";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") || "";

    // Verify webhook authenticity
    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.warn("Invalid Razorpay webhook signature received");
      return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;
    const orderId = paymentEntity?.order_id || payload.payload?.order?.entity?.id;

    if (!orderId) {
      return NextResponse.json({ status: "IGNORED", reason: "No order_id in webhook" });
    }

    const payment = await TicketsDatabase.getPaymentByOrderId(orderId);
    if (!payment) {
      return NextResponse.json({ status: "IGNORED", reason: "Order not found" });
    }

    if (event === "payment.captured" || event === "order.paid") {
      const paymentId = paymentEntity?.id || payment.paymentId || "pay_webhook_captured";

      // 1. Mark Payment as PAID
      await TicketsDatabase.updatePaymentStatus(payment.id, "PAID", {
        paymentId,
        rawResponse: payload
      });

      // 2. Idempotently issue ticket if not already issued
      await TicketsDatabase.issueTicket({
        bookingId: payment.bookingId,
        paymentId: payment.id,
        tokenSigner: (ticketId, pnr, amount) => {
          return signTicketToken({
            ticketId,
            pnr,
            amount,
            validHours: 2
          });
        }
      });

      return NextResponse.json({ status: "PROCESSED", event, paymentStatus: "PAID" });
    } else if (event === "payment.failed") {
      await TicketsDatabase.updatePaymentStatus(payment.id, "FAILED", {
        paymentId: paymentEntity?.id,
        errorMessage: paymentEntity?.error_description || "Payment failed at gateway",
        rawResponse: payload
      });

      return NextResponse.json({ status: "PROCESSED", event, paymentStatus: "FAILED" });
    }

    return NextResponse.json({ status: "IGNORED", event });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "WEBHOOK_FAILED", message: error?.message }, { status: 500 });
  }
}
