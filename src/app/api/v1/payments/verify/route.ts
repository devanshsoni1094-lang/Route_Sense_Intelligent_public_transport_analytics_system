import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { TicketsDatabase } from "@/lib/db/ticketsDb";
import { verifyPaymentSignature, signTicketToken } from "@/lib/payments/gateway";

const VerifyPaymentSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  orderId: z.string().min(1, "Order ID is required"),
  paymentId: z.string().min(1, "Payment ID is required"),
  signature: z.string().min(1, "Signature is required"),
  source: z.string().optional(),
  destination: z.string().optional(),
  transportMode: z.enum(["BUS", "TRAIN"]).optional(),
  tier: z.string().optional(),
  passengerName: z.string().optional(),
  passengerPhone: z.string().optional(),
  passengerEmail: z.string().optional(),
  passengerCount: z.number().optional(),
  fareAmount: z.number().optional()
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

    // Retrieve matching booking and payment record
    let booking = await TicketsDatabase.getBooking(bookingId);
    let payment = await TicketsDatabase.getPaymentByOrderId(orderId);

    const activeSource = (parsed.data.source && parsed.data.source.trim()) || (booking?.source) || "Dadar Central Station";
    const activeDestination = (parsed.data.destination && parsed.data.destination.trim()) || (booking?.destination) || "CSMT Terminus";
    const activeMode = parsed.data.transportMode || booking?.transportMode || "TRAIN";
    const activeName = (parsed.data.passengerName && parsed.data.passengerName.trim()) || booking?.passengerName || "Devansh Soni";
    const activePhone = (parsed.data.passengerPhone && parsed.data.passengerPhone.trim()) || booking?.passengerPhone || "9876543210";
    const activeEmail = (parsed.data.passengerEmail && parsed.data.passengerEmail.trim()) || booking?.passengerEmail || "commuter@routesense.in";
    const activeCount = parsed.data.passengerCount || booking?.passengerCount || 1;
    const activeFare = parsed.data.fareAmount || booking?.totalFare || 10;

    if ((!booking || !payment) && orderId.startsWith("order_demo_")) {
      if (!booking) {
        booking = await TicketsDatabase.createBooking({
          source: activeSource,
          destination: activeDestination,
          distanceKm: 10,
          passengerName: activeName,
          passengerPhone: activePhone,
          passengerEmail: activeEmail,
          passengerCount: activeCount,
          transportMode: activeMode,
          tier: parsed.data.tier || "LOCAL_II",
          operator: activeMode === "BUS" ? "BEST Undertaking" : "Mumbai Suburban Railway (Central Line)",
          vehicleTitle: activeMode === "BUS" ? "BEST Electric Non-AC / AC Bus" : "Suburban EMU Local Train",
          singleFare: activeFare / activeCount,
          totalFare: activeFare,
          currency: "INR"
        });
      }
      if (!payment) {
        payment = await TicketsDatabase.createPayment({
          bookingId: booking.id,
          orderId,
          amount: activeFare,
          currency: "INR",
          gateway: "DEMO_SANDBOX",
          isSandbox: true
        });
      }
    }

    if (booking) {
      // Ensure booking reflects the commuter's latest chosen source and destination
      if (parsed.data.source) booking.source = parsed.data.source.trim();
      if (parsed.data.destination) booking.destination = parsed.data.destination.trim();
      if (parsed.data.passengerName) booking.passengerName = parsed.data.passengerName.trim();
      if (parsed.data.passengerPhone) booking.passengerPhone = parsed.data.passengerPhone.trim();
      if (parsed.data.passengerEmail) booking.passengerEmail = parsed.data.passengerEmail.trim();
      if (parsed.data.transportMode) booking.transportMode = parsed.data.transportMode;
      if (parsed.data.fareAmount) booking.totalFare = parsed.data.fareAmount;
      if (parsed.data.passengerCount) booking.passengerCount = parsed.data.passengerCount;
    }

    if (!booking) {
      return NextResponse.json(
        { error: "BOOKING_NOT_FOUND", message: `Booking "${bookingId}" was not found.` },
        { status: 404 }
      );
    }

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
      source: activeSource,
      destination: activeDestination,
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
