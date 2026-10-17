import { NextRequest, NextResponse } from "next/server";
import { TicketsDatabase } from "@/lib/db/ticketsDb";
import { verifyTicketToken } from "@/lib/payments/gateway";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let identifier = body.token || body.ticketNumber || body.ticketId || body.id;

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

    identifier = identifier.trim();

    // If identifier is a full URL (e.g. from QR scanner), extract query parameter
    if (identifier.includes("token=") || identifier.includes("id=") || identifier.includes("ticketNumber=")) {
      try {
        const parsedUrl = new URL(identifier, "http://localhost");
        const extracted =
          parsedUrl.searchParams.get("token") ||
          parsedUrl.searchParams.get("ticketNumber") ||
          parsedUrl.searchParams.get("id");
        if (extracted) {
          identifier = extracted;
        }
      } catch {
        // Continue with original identifier
      }
    }

    // 1. If it looks like a cryptographic token (base64url.signature)
    let tokenTicketId: string | null = null;
    if (identifier.includes(".")) {
      const tokenResult = verifyTicketToken(identifier);
      if (!tokenResult.valid) {
        return NextResponse.json(
          {
            status: "INVALID",
            ticket: null,
            payment: null,
            validationHistory: [],
            reason: `Cryptographic signature validation failed: ${tokenResult.reason}`
          },
          { status: 200 }
        );
      }
      tokenTicketId = tokenResult.payload?.t || null;
    }

    // 2. Query database for ticket and server-side payment record
    const lookupId = tokenTicketId || identifier;
    const verification = await TicketsDatabase.verifyTicket(lookupId);

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
  const token = searchParams.get("token") || searchParams.get("id") || searchParams.get("ticketNumber");

  if (!token) {
    return NextResponse.json(
      { error: "MISSING_PARAM", message: "Query parameter 'token' or 'id' required" },
      { status: 400 }
    );
  }

  // Delegate to same logic as POST
  let lookupId = token;
  if (token.includes(".")) {
    const tokenResult = verifyTicketToken(token);
    if (!tokenResult.valid) {
      return NextResponse.json(
        {
          status: "INVALID",
          ticket: null,
          payment: null,
          validationHistory: [],
          reason: `Cryptographic signature validation failed: ${tokenResult.reason}`
        },
        { status: 200 }
      );
    }
    lookupId = tokenResult.payload?.t || token;
  }

  const verification = await TicketsDatabase.verifyTicket(lookupId);

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
