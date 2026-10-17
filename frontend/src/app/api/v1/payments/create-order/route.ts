import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { TicketsDatabase } from "@/lib/db/ticketsDb";
import { createPaymentOrder } from "@/lib/payments/gateway";
import { calculateMumbaiFare } from "@/components/booking/BookingModal";
import { isWithinMumbaiMMR } from "@/lib/mumbaiGeofence";

const CreateOrderSchema = z.object({
  source: z.string().min(2, "Source location required"),
  destination: z.string().min(2, "Destination location required"),
  distanceKm: z.number().positive("Distance must be positive"),
  transportMode: z.enum(["BUS", "TRAIN"]),
  tier: z.string().min(2, "Service tier required"),
  passengerName: z.string().min(2, "Passenger name is required"),
  passengerPhone: z.string().min(8, "Valid phone number is required"),
  passengerEmail: z.string().email("Valid email address is required"),
  passengerCount: z.number().int().min(1).max(10).default(1),
  sourceLat: z.number().optional(),
  sourceLng: z.number().optional(),
  destLat: z.number().optional(),
  destLng: z.number().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "INVALID_BOOKING_INPUT",
          message: "Please fill in all passenger details and valid journey stops.",
          details: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`)
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Verify MMR boundary for ticketing
    const srcValid = isWithinMumbaiMMR(data.sourceLat || 0, data.sourceLng || 0, data.source);
    const destValid = isWithinMumbaiMMR(data.destLat || 0, data.destLng || 0, data.destination);

    if (!srcValid || !destValid) {
      return NextResponse.json(
        {
          error: "MUMBAI_MMR_ONLY",
          message: "Route Sense ticketing is restricted to the Mumbai Metropolitan Region (MMR). Please select stations or stops within Mumbai, Thane, or Navi Mumbai."
        },
        { status: 400 }
      );
    }

    // Calculate verified fare
    const fareInfo = calculateMumbaiFare(data.transportMode, data.tier as any, data.distanceKm);
    const singleFare = fareInfo.singleFare;
    const totalFare = Math.max(5, singleFare * data.passengerCount);

    // 1. Create Booking Record
    const booking = await TicketsDatabase.createBooking({
      source: data.source,
      destination: data.destination,
      distanceKm: Math.round(data.distanceKm * 10) / 10,
      passengerName: data.passengerName.trim(),
      passengerPhone: data.passengerPhone.trim(),
      passengerEmail: data.passengerEmail.trim().toLowerCase(),
      passengerCount: data.passengerCount,
      transportMode: data.transportMode,
      tier: data.tier,
      operator: fareInfo.operator,
      vehicleTitle: fareInfo.vehicleTitle,
      singleFare,
      totalFare,
      currency: "INR"
    });

    // 2. Create Payment Order with Gateway (Razorpay or Secure Sandbox)
    const orderResult = await createPaymentOrder({
      bookingId: booking.id,
      amountInr: totalFare,
      currency: "INR",
      notes: {
        passengerName: booking.passengerName,
        passengerPhone: booking.passengerPhone,
        mode: booking.transportMode
      }
    });

    // 3. Save Payment Record in Database
    const payment = await TicketsDatabase.createPayment({
      bookingId: booking.id,
      orderId: orderResult.orderId,
      amount: totalFare,
      currency: "INR",
      gateway: orderResult.gateway,
      isSandbox: orderResult.isSandbox
    });

    return NextResponse.json({
      success: true,
      booking,
      payment: {
        id: payment.id,
        status: payment.status,
        orderId: orderResult.orderId,
        amount: totalFare,
        amountPaise: orderResult.amountPaise,
        currency: orderResult.currency,
        keyId: orderResult.keyId,
        isSandbox: orderResult.isSandbox,
        gateway: orderResult.gateway,
        disclaimer: orderResult.disclaimer
      }
    });
  } catch (error: any) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      {
        error: "ORDER_CREATION_FAILED",
        message: error?.message || "Failed to initiate payment order. Please retry."
      },
      { status: 500 }
    );
  }
}
