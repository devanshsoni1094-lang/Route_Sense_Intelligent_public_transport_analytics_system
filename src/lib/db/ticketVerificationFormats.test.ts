import { describe, it, expect, beforeEach } from "vitest";
import { TicketsDatabase } from "./ticketsDb";
import { signTicketToken } from "../payments/gateway";

describe("Ticket Authentication — Multi-Format & Scanner Support", () => {
  beforeEach(() => {
    TicketsDatabase._resetForTesting();
  });

  it("verifies ticket by exact Ticket Number", async () => {
    const booking = await TicketsDatabase.createBooking({
      source: "Andheri",
      destination: "BKC",
      distanceKm: 12,
      passengerName: "Aarav Sharma",
      passengerPhone: "9820011223",
      passengerEmail: "aarav@example.com",
      passengerCount: 1,
      transportMode: "BUS",
      tier: "BEST_AC",
      operator: "BEST Undertaking",
      vehicleTitle: "Electric AC Bus",
      singleFare: 25,
      totalFare: 25,
      currency: "INR"
    });

    const payment = await TicketsDatabase.createPayment({
      bookingId: booking.id,
      orderId: "order_test_scan_01",
      amount: 25,
      currency: "INR",
      gateway: "DEMO_SANDBOX",
      isSandbox: true
    });

    await TicketsDatabase.updatePaymentStatus(payment.id, "PAID", {
      paymentId: "pay_test_scan_01",
      signature: "sig_test_scan_01"
    });

    const ticket = await TicketsDatabase.issueTicket({
      bookingId: booking.id,
      paymentId: payment.id,
      tokenSigner: (t, p, a) => signTicketToken({ ticketId: t, pnr: p, amount: a, validHours: 2 })
    });

    // 1. Exact Ticket Number
    const res1 = await TicketsDatabase.verifyTicket(ticket.ticketNumber);
    expect(res1.status).toBe("VALID");
    expect(res1.ticket?.id).toBe(ticket.id);

    // 2. Unhyphenated Alphanumeric Ticket Number
    const unhyphenated = ticket.ticketNumber.replace(/[^A-Za-z0-9]/g, "");
    const res2 = await TicketsDatabase.verifyTicket(unhyphenated);
    expect(res2.status).toBe("VALID");

    // 3. 6-digit numeric suffix
    const suffix = ticket.ticketNumber.split("-").pop()!;
    const res3 = await TicketsDatabase.verifyTicket(suffix);
    expect(res3.status).toBe("VALID");

    // 4. Raw QR Scanner JSON String
    const qrJson = JSON.stringify({
      ticketId: ticket.id,
      pnr: ticket.pnr,
      token: ticket.verificationToken
    });
    const res4 = await TicketsDatabase.verifyTicket(qrJson);
    expect(res4.status).toBe("VALID");

    // 5. Full Browser URL with query parameter
    const fullUrl = `https://route-sense.spatial.in/verify?token=${encodeURIComponent(ticket.verificationToken)}`;
    const res5 = await TicketsDatabase.verifyTicket(fullUrl);
    expect(res5.status).toBe("VALID");

    // 6. Normalized PNR without hyphens
    const pnrRaw = ticket.pnr.replace("-", "");
    const res6 = await TicketsDatabase.verifyTicket(pnrRaw);
    expect(res6.status).toBe("VALID");
  });

  it("authenticates cryptographic token even if record is queried directly by token", async () => {
    const signed = signTicketToken({
      ticketId: "TKT-CRYPTO-TEST-01",
      pnr: "CRW-99887766",
      amount: 45,
      validHours: 2
    });

    const res = await TicketsDatabase.verifyTicket(signed.token);
    expect(res.status).toBe("VALID");
    expect(res.ticket?.fareAmount).toBe(45);
    expect(res.ticket?.pnr).toBe("CRW-99887766");
  });

  it("detects expired tickets correctly", async () => {
    const expiredSigned = signTicketToken({
      ticketId: "TKT-EXPIRED-TEST-02",
      pnr: "BEST-11223344",
      amount: 15,
      validHours: -1 // Expired 1 hour ago
    });

    const res = await TicketsDatabase.verifyTicket(expiredSigned.token);
    expect(res.status).toBe("EXPIRED");
  });
});
