import { describe, it, expect, beforeEach } from "vitest";
import { TicketsDatabase } from "./ticketsDb";
import { signTicketToken } from "../payments/gateway";

describe("TicketsDatabase Core Storage & State Engine", () => {
  beforeEach(() => {
    TicketsDatabase._resetForTesting();
  });

  it("creates a new booking record with PENDING_PAYMENT status", async () => {
    const booking = await TicketsDatabase.createBooking({
      source: "Dadar",
      destination: "CSMT",
      distanceKm: 9.5,
      passengerName: "Test Commuter",
      passengerPhone: "9876543210",
      passengerEmail: "commuter@example.com",
      passengerCount: 2,
      transportMode: "TRAIN",
      tier: "LOCAL_II",
      operator: "Central Railway",
      vehicleTitle: "Second Class Suburban",
      singleFare: 10,
      totalFare: 20,
      currency: "INR"
    });

    expect(booking.id).toMatch(/^BKG-/);
    expect(booking.status).toBe("PENDING_PAYMENT");
    expect(booking.totalFare).toBe(20);

    const retrieved = await TicketsDatabase.getBooking(booking.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(booking.id);
  });

  it("creates a payment record and transitions through states", async () => {
    const booking = await TicketsDatabase.createBooking({
      source: "Andheri",
      destination: "Churchgate",
      distanceKm: 22,
      passengerName: "Rohan Patil",
      passengerPhone: "9123456789",
      passengerEmail: "rohan@example.com",
      passengerCount: 1,
      transportMode: "TRAIN",
      tier: "LOCAL_I",
      operator: "Western Railway",
      vehicleTitle: "First Class EMU",
      singleFare: 105,
      totalFare: 105,
      currency: "INR"
    });

    const payment = await TicketsDatabase.createPayment({
      bookingId: booking.id,
      orderId: "order_demo_test_trans_101",
      amount: 105,
      currency: "INR",
      gateway: "DEMO_SANDBOX",
      isSandbox: true
    });

    expect(payment.status).toBe("CREATED");

    // Update to PAID
    const paidPayment = await TicketsDatabase.updatePaymentStatus(payment.id, "PAID", {
      paymentId: "pay_test_trans_101",
      signature: "valid_sig_101"
    });

    expect(paidPayment.status).toBe("PAID");
    expect(paidPayment.paymentId).toBe("pay_test_trans_101");

    // Booking status should also be updated to PAID
    const updatedBooking = await TicketsDatabase.getBooking(booking.id);
    expect(updatedBooking?.status).toBe("PAID");
  });

  it("strictly prohibits ticket issuance for unpaid or failed bookings", async () => {
    const booking = await TicketsDatabase.createBooking({
      source: "Bandra",
      destination: "Kurla",
      distanceKm: 6,
      passengerName: "Anjali Gupta",
      passengerPhone: "9988776655",
      passengerEmail: "anjali@example.com",
      passengerCount: 1,
      transportMode: "BUS",
      tier: "BEST_NON_AC",
      operator: "BEST Undertaking",
      vehicleTitle: "BEST Non-AC",
      singleFare: 12,
      totalFare: 12,
      currency: "INR"
    });

    const payment = await TicketsDatabase.createPayment({
      bookingId: booking.id,
      orderId: "order_demo_unpaid_test",
      amount: 12,
      currency: "INR",
      gateway: "DEMO_SANDBOX",
      isSandbox: true
    });

    // Attempting to issue ticket while payment is still CREATED/PENDING must throw error
    await expect(
      TicketsDatabase.issueTicket({
        bookingId: booking.id,
        paymentId: payment.id,
        tokenSigner: (t, p, a) => signTicketToken({ ticketId: t, pnr: p, amount: a, validHours: 2 })
      })
    ).rejects.toThrow(/Cannot issue ticket: Payment status is/);
  });

  it("issues verified ticket upon successful payment and enforces idempotency", async () => {
    const booking = await TicketsDatabase.createBooking({
      source: "Ghatkopar",
      destination: "Thane",
      distanceKm: 18,
      passengerName: "Sameer Shah",
      passengerPhone: "9820012345",
      passengerEmail: "sameer@example.com",
      passengerCount: 1,
      transportMode: "TRAIN",
      tier: "LOCAL_AC",
      operator: "Central Railway",
      vehicleTitle: "AC Local EMU",
      singleFare: 100,
      totalFare: 100,
      currency: "INR"
    });

    const payment = await TicketsDatabase.createPayment({
      bookingId: booking.id,
      orderId: "order_demo_paid_idempotent",
      amount: 100,
      currency: "INR",
      gateway: "DEMO_SANDBOX",
      isSandbox: true
    });

    await TicketsDatabase.updatePaymentStatus(payment.id, "PAID", {
      paymentId: "pay_idemp_100",
      signature: "sig_idemp_100"
    });

    // 1. First issuance
    const ticket1 = await TicketsDatabase.issueTicket({
      bookingId: booking.id,
      paymentId: payment.id,
      tokenSigner: (t, p, a) => signTicketToken({ ticketId: t, pnr: p, amount: a, validHours: 2 })
    });

    expect(ticket1.status).toBe("VALID");
    expect(ticket1.ticketNumber).toMatch(/^RS-MUM-/);
    expect(ticket1.pnr).toMatch(/^(CRW|BEST)/);
    expect(ticket1.verificationToken).toContain(".");
    expect(ticket1.disclaimer).toContain("Route Sense Demonstration & Commuter Pass");

    // 2. Second issuance (idempotency test)
    const ticket2 = await TicketsDatabase.issueTicket({
      bookingId: booking.id,
      paymentId: payment.id,
      tokenSigner: (t, p, a) => signTicketToken({ ticketId: t, pnr: p, amount: a, validHours: 2 })
    });

    expect(ticket2.id).toBe(ticket1.id);
    expect(ticket2.ticketNumber).toBe(ticket1.ticketNumber);
  });

  it("verifies ticket status and handles staff punch validations (prevents reuse)", async () => {
    const booking = await TicketsDatabase.createBooking({
      source: "Borivali",
      destination: "Churchgate",
      distanceKm: 34,
      passengerName: "Kavita Rao",
      passengerPhone: "9870001122",
      passengerEmail: "kavita@example.com",
      passengerCount: 1,
      transportMode: "BUS",
      tier: "BEST_AC",
      operator: "BEST Undertaking",
      vehicleTitle: "AC Electric Express",
      singleFare: 46,
      totalFare: 46,
      currency: "INR"
    });

    const payment = await TicketsDatabase.createPayment({
      bookingId: booking.id,
      orderId: "order_demo_punch_test",
      amount: 46,
      currency: "INR",
      gateway: "DEMO_SANDBOX",
      isSandbox: true
    });

    await TicketsDatabase.updatePaymentStatus(payment.id, "PAID", {
      paymentId: "pay_punch_46",
      signature: "sig_punch_46"
    });

    const ticket = await TicketsDatabase.issueTicket({
      bookingId: booking.id,
      paymentId: payment.id,
      tokenSigner: (t, p, a) => signTicketToken({ ticketId: t, pnr: p, amount: a, validHours: 2 })
    });

    // Verification check before punch
    const verifyBeforePunch = await TicketsDatabase.verifyTicket(ticket.id);
    expect(verifyBeforePunch.status).toBe("VALID");

    // Conductor punch #1
    const punch1 = await TicketsDatabase.punchTicket({
      ticketId: ticket.id,
      validatorId: "COND-BOM-12",
      validatorName: "M. G. Kadam"
    });

    expect(punch1.success).toBe(true);
    expect(punch1.ticket.status).toBe("USED");

    // Verification after punch returns ALREADY_USED
    const verifyAfterPunch = await TicketsDatabase.verifyTicket(ticket.id);
    expect(verifyAfterPunch.status).toBe("ALREADY_USED");
    expect(verifyAfterPunch.reason).toContain("already validated");

    // Repeat punch throws error
    await expect(
      TicketsDatabase.punchTicket({
        ticketId: ticket.id,
        validatorId: "COND-BOM-12",
        validatorName: "M. G. Kadam"
      })
    ).rejects.toThrow(/already been used/);
  });

  it("returns INVALID for non-existent ticket identifier", async () => {
    const fakeVerification = await TicketsDatabase.verifyTicket("non_existent_ticket_xyz");
    expect(fakeVerification.status).toBe("INVALID");
    expect(fakeVerification.ticket).toBeNull();
  });
});
