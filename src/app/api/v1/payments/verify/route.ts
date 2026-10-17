import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { TicketsDatabase } from "@/lib/db/ticketsDb";
import { verifyPaymentSignature, signTicketToken } from "@/lib/payments/gateway";

const VerifyPaymentSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  orderId: z.string().min(1, "Order ID is required"),
  paymentId: z.string().min(1, "Payment ID is required"),
  signature: z.string().min(1, "Signature is required")
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = VerifyPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "INVALID_VERIFICATION_PAYLOAD",
          message: "Order ID, Payment ID, and Gateway Signature are required for verification.",
          details: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`)
        },
        { status: 400 }
      );
    }

    const { bookingId, orderId, paymentId, signature } = parsed.data;

    // Retrieve matching booking
    const booking = await TicketsDatabase.getBooking(bookingId);
    if (!booking) {
      return NextResponse.json(
        { error: "BOOKING_NOT_FOUND", message: `Booking "${bookingId}" was not found.` },
        { status: 404 }
      );
    }

    // Retrieve matching payment record
    const payment = await TicketsDatabase.getPaymentByOrderId(orderId);
    if (!payment) {
      return NextResponse.json(
        { error: "PAYMENT_RECORD_NOT_FOUND", message: `No payment order matching "${orderId}".` },
        { status: 404 }
      );
    }

    // Security Check: Server-side cryptographic HMAC-SHA256 signature verification
    const verification = verifyPaymentSignature({
      orderId,
      paymentId,
      signature
    });

    if (!verification.valid) {
      // Security enforcement: Mark payment as FAILED and DO NOT issue ticket
      await TicketsDatabase.updatePaymentStatus(payment.id, "FAILED", {
        paymentId,
        signature,
        errorMessage: verification.reason || "Cryptographic HMAC signature mismatch"
      });

      return NextResponse.json(
        {
          error: "SIGNATURE_VERIFICATION_FAILED",
          message:
            verification.reason ||
            "Payment verification failed: cryptographic signature does not match gateway credentials. No ticket was issued.",
          paymentStatus: "FAILED"
        },
        { status: 400 }
      );
    }

    // Payment Signature Verified: Transition payment to PAID
    await TicketsDatabase.updatePaymentStatus(payment.id, "PAID", {
      paymentId,
      signature
    });

    // Issue Ticket (Idempotent: prevents duplicate tickets on replay or refresh)
    const ticket = await TicketsDatabase.issueTicket({
      bookingId: booking.id,
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

    return NextResponse.json({
      success: true,
      paymentStatus: "PAID",
      ticket
    });
  } catch (error: any) {
    console.error("Payment verification failure:", error);
    return NextResponse.json(
      {
        error: "PAYMENT_VERIFICATION_ERROR",
        message: error?.message || "Internal server error during payment verification."
      },
      { status: 500 }
    );
  }
}
