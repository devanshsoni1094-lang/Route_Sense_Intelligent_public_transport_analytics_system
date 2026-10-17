import { NextRequest, NextResponse } from "next/server";
import { TicketsDatabase } from "@/lib/db/ticketsDb";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: "Missing ticket id" }, { status: 400 });
    }

    const ticket =
      (await TicketsDatabase.getTicket(id)) ||
      (await TicketsDatabase.getTicketByTicketNumber(id)) ||
      (await TicketsDatabase.getTicketByPnr(id));

    if (!ticket) {
      return NextResponse.json({ error: "TICKET_NOT_FOUND", message: `Ticket "${id}" not found.` }, { status: 404 });
    }

    const payment = await TicketsDatabase.getPayment(ticket.paymentId);

    return NextResponse.json({
      ticket,
      payment: payment
        ? {
            id: payment.id,
            status: payment.status,
            orderId: payment.orderId,
            paymentId: payment.paymentId,
            amount: payment.amount,
            currency: payment.currency,
            gateway: payment.gateway,
            isSandbox: payment.isSandbox
          }
        : null
    });
  } catch (err: any) {
    return NextResponse.json({ error: "TICKET_LOOKUP_FAILED", message: err?.message }, { status: 500 });
  }
}
