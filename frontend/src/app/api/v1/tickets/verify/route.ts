import { NextRequest, NextResponse } from "next/server";
import { TicketsDatabase } from "@/lib/db/ticketsDb";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    let identifier =
      body.token ||
      body.ticketNumber ||
      body.ticketId ||
      body.id ||
      body.pnr ||
      body.query ||
      body.data;

    if (!identifier || typeof identifier !== "string") {
      return NextResponse.json(
        {
          error: "MISSING_IDENTIFIER",
          status: "INVALID",
          message: "Please provide a valid ticket token, QR code string, or Ticket Number."
        },
        { status: 400 }
      );
    }

    const verification = await TicketsDatabase.verifyTicket(identifier);

    return NextResponse.json({
      status: verification.status,
      ticket: verification.ticket,
      payment: verification.payment
        ? {
            id: verification.payment.id,
            status: verification.payment.status,
            orderId: verification.payment.orderId,
            paymentId: verification.payment.paymentId,
            amount: verification.payment.amount,
            currency: verification.payment.currency,
            gateway: verification.payment.gateway,
            isSandbox: verification.payment.isSandbox,
            paidAt: verification.payment.updatedAt
          }
        : null,
      validationHistory: verification.validationHistory,
      reason: verification.reason,
      verifiedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Ticket verification error:", error);
    return NextResponse.json(
      {
        status: "INVALID",
        error: "VERIFICATION_ERROR",
        message: error?.message || "Failed to verify ticket on backend."
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token =
    searchParams.get("token") ||
    searchParams.get("id") ||
    searchParams.get("ticketNumber") ||
    searchParams.get("pnr") ||
    searchParams.get("query");

  if (!token) {
    return NextResponse.json(
      { error: "MISSING_PARAM", message: "Query parameter 'token', 'id', or 'ticketNumber' required" },
      { status: 400 }
    );
  }

  const verification = await TicketsDatabase.verifyTicket(token);

  return NextResponse.json({
    status: verification.status,
    ticket: verification.ticket,
    payment: verification.payment
      ? {
          id: verification.payment.id,
          status: verification.payment.status,
          orderId: verification.payment.orderId,
          paymentId: verification.payment.paymentId,
          amount: verification.payment.amount,
          currency: verification.payment.currency,
          gateway: verification.payment.gateway,
          isSandbox: verification.payment.isSandbox,
          paidAt: verification.payment.updatedAt
        }
      : null,
    validationHistory: verification.validationHistory,
    reason: verification.reason,
    verifiedAt: new Date().toISOString()
  });
}
