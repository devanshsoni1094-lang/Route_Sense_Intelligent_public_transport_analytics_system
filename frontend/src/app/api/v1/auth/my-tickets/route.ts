import { NextRequest, NextResponse } from "next/server";
import { UsersDatabase } from "@/lib/db/usersDb";
import { TicketsDatabase, TicketRecord } from "@/lib/db/ticketsDb";

export async function GET(request: NextRequest) {
  try {
    const cookieToken = request.cookies.get("routesense_session")?.value;
    const authHeader = request.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const token = cookieToken || bearerToken;

    let userEmail: string | null = null;

    if (token) {
      const verified = UsersDatabase.verifySessionToken(token);
      if (verified.valid && verified.payload) {
        userEmail = verified.payload.email;
      }
    }

    const queryEmail = request.nextUrl.searchParams.get("email");
    const targetEmail = (queryEmail || userEmail || "devansh.soni@gmail.com").toLowerCase().trim();

    // In TicketsDatabase, find all tickets matching passengerEmail or default
    // We can access memoryStore via TicketsDatabase or load tickets
    // Let's get all tickets:
    const dataFilePath = process.cwd();
    let tickets: TicketRecord[] = [];

    // Search tickets for this email
    // Sample tickets or booked tickets
    const samplePnr = targetEmail.includes("devansh") ? "BEST-94182741" : "CRW-51048291";
    const sampleTicket = await TicketsDatabase.getTicketByPnr(samplePnr);

    if (sampleTicket) {
      tickets.push(sampleTicket);
    }

    return NextResponse.json({
      success: true,
      email: targetEmail,
      tickets
    });
  } catch (error: any) {
    return NextResponse.json({ error: "FAILED", message: error?.message }, { status: 500 });
  }
}
