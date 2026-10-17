import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { TicketsDatabase } from "@/lib/db/ticketsDb";

const ValidateTicketSchema = z.object({
  ticketId: z.string().min(1, "Ticket ID is required"),
  validatorId: z.string().min(1, "Validator ID is required"),
  validatorName: z.string().min(1, "Validator name is required"),
  notes: z.string().optional(),
  staffKey: z.string().optional()
});

const DEFAULT_STAFF_KEY = process.env.ROUTE_SENSE_STAFF_KEY || "routesense-staff-2026";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = ValidateTicketSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "INVALID_INPUT", details: parsed.error.issues.map((i) => i.message) },
        { status: 400 }
      );
    }

    const { ticketId, validatorId, validatorName, notes, staffKey } = parsed.data;

    // Staff Authorization Check: Verify staff key from header or body
    const headerKey = request.headers.get("x-staff-key");
    const providedKey = staffKey || headerKey;

    if (!providedKey || providedKey !== DEFAULT_STAFF_KEY) {
      // In development / demo mode, allow staff validator role if provided
      if (process.env.NODE_ENV === "production" && providedKey !== DEFAULT_STAFF_KEY) {
        return NextResponse.json(
          {
            error: "UNAUTHORIZED_VALIDATOR",
            message: "Authorized transit staff credentials required to validate tickets."
          },
          { status: 403 }
        );
      }
    }

    const result = await TicketsDatabase.punchTicket({
      ticketId,
      validatorId,
      validatorName,
      notes
    });

    return NextResponse.json({
      success: true,
      message: `Ticket "${result.ticket.ticketNumber}" successfully marked as USED.`,
      ticket: result.ticket,
      validation: result.validation
    });
  } catch (error: any) {
    console.error("Ticket validation error:", error);
    return NextResponse.json(
      {
        error: "VALIDATION_FAILED",
        message: error?.message || "Failed to mark ticket as used."
      },
      { status: 400 }
    );
  }
}
