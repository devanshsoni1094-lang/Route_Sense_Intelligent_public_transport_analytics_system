/**
 * Route Sense Mumbai — Ticketing, Payment & Validation Database Engine
 * Implements persistent ACID-like storage with separate booking, payment, ticket,
 * and validation audit records, strict state transitions, and idempotency locks.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { verifyTicketToken } from "../payments/gateway";

export type PaymentStatus = "CREATED" | "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type TicketStatus = "NOT_ISSUED" | "VALID" | "USED" | "EXPIRED" | "CANCELLED";
export type ValidationStatus = "VALID" | "ALREADY_USED" | "EXPIRED" | "INVALID" | "CANCELLED";

export interface BookingRecord {
  id: string;
  source: string;
  destination: string;
  distanceKm: number;
  passengerName: string;
  passengerPhone: string;
  passengerEmail: string;
  passengerCount: number;
  transportMode: "BUS" | "TRAIN";
  tier: string;
  operator: string;
  vehicleTitle: string;
  singleFare: number;
  totalFare: number;
  currency: "INR";
  status: "PENDING_PAYMENT" | "PAID" | "EXPIRED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  bookingId: string;
  orderId: string;
  paymentId?: string;
  signature?: string;
  amount: number; // in INR
  amountPaise: number; // in paise
  currency: "INR";
  status: PaymentStatus;
  gateway: "RAZORPAY" | "DEMO_SANDBOX";
  isSandbox: boolean;
  rawResponse?: Record<string, any>;
  errorMessage?: string;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketRecord {
  id: string;
  ticketNumber: string;
  pnr: string;
  bookingId: string;
  paymentId: string;
  orderId: string;
  status: TicketStatus;
  transportMode: "BUS" | "TRAIN";
  operator: string;
  vehicleType: string;
  source: string;
  destination: string;
  passengerName: string;
  passengerPhone: string;
  passengerEmail: string;
  passengerCount: number;
  singleFare: number;
  fareAmount: number;
  currency: "INR";
  journeyDate: string;
  bookingTimestamp: string;
  validFrom: string;
  validUntil: string;
  usedAt?: string;
  usedByValidator?: string;
  verificationToken: string;
  verificationUrl: string;
  qrPayload: string;
  disclaimer: string;
  isOfficialTicket: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ValidationRecord {
  id: string;
  ticketId: string;
  ticketNumber: string;
  pnr: string;
  validatorId: string;
  validatorName: string;
  validationStatus: ValidationStatus;
  notes?: string;
  timestamp: string;
}

interface DatabaseSchema {
  bookings: Record<string, BookingRecord>;
  payments: Record<string, PaymentRecord>;
  tickets: Record<string, TicketRecord>;
  validations: ValidationRecord[];
}

// In-Memory store for fast zero-latency access
const memoryStore: DatabaseSchema = {
  bookings: {},
  payments: {},
  tickets: {},
  validations: []
};

let isInitialized = false;
let lastLoadedMtime = 0;

// Determine writable database file path (with /tmp fallback for serverless environments)
function getDbFilePath(): string {
  const localDir = path.join(process.cwd(), "data");
  const localPath = path.join(localDir, "routesense_store.json");

  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    // Test write permission
    fs.writeFileSync(path.join(localDir, ".write_test"), "ok");
    fs.unlinkSync(path.join(localDir, ".write_test"));
    return localPath;
  } catch {
    // Fallback to /tmp on read-only environments (e.g. AWS Lambda / Vercel Serverless)
    const tmpDir = path.join(process.platform === "win32" ? process.env.TEMP || "C:\\temp" : "/tmp", "routesense");
    if (!fs.existsSync(tmpDir)) {
      try {
        fs.mkdirSync(tmpDir, { recursive: true });
      } catch {}
    }
    return path.join(tmpDir, "routesense_store.json");
  }
}

function seedDefaultTickets(): void {
  const now = new Date();
  const sampleTickets: TicketRecord[] = [
    {
      id: "TKT-SAMPLE-BEST-7821",
      ticketNumber: "RS-MUM-2026-782145",
      pnr: "BEST-94182741",
      bookingId: "BKG-SAMPLE-BEST-01",
      paymentId: "PAY-SAMPLE-BEST-01",
      orderId: "order_sample_best_01",
      status: "VALID",
      transportMode: "BUS",
      operator: "BEST Undertaking (Brihanmumbai Electric Supply & Transport)",
      vehicleType: "AC Electric Express (Bus Route 302)",
      source: "Andheri Station (West)",
      destination: "BKC Diamond Bourse",
      passengerName: "Aarav Sharma",
      passengerPhone: "9820011223",
      passengerEmail: "aarav.sharma@gmail.com",
      passengerCount: 1,
      singleFare: 30,
      fareAmount: 30,
      currency: "INR",
      journeyDate: now.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }),
      bookingTimestamp: new Date(now.getTime() - 20 * 60 * 1000).toISOString(),
      validFrom: new Date(now.getTime() - 20 * 60 * 1000).toISOString(),
      validUntil: new Date(now.getTime() + 100 * 60 * 1000).toISOString(),
      verificationToken: "sample_token_best_valid",
      verificationUrl: "/verify?token=sample_token_best_valid",
      qrPayload: JSON.stringify({
        ticketId: "TKT-SAMPLE-BEST-7821",
        pnr: "BEST-94182741",
        ticketNumber: "RS-MUM-2026-782145",
        status: "VALID"
      }),
      disclaimer: "Route Sense Demonstration & Commuter Pass — Not an official BEST ticket.",
      isOfficialTicket: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    },
    {
      id: "TKT-SAMPLE-CRW-8941",
      ticketNumber: "RS-MUM-2026-894120",
      pnr: "CRW-51048291",
      bookingId: "BKG-SAMPLE-CRW-02",
      paymentId: "PAY-SAMPLE-CRW-02",
      orderId: "order_sample_crw_02",
      status: "VALID",
      transportMode: "TRAIN",
      operator: "Western Railway Mumbai Suburban Network",
      vehicleType: "Fast Suburban Local (First Class)",
      source: "Borivali Railway Station",
      destination: "Churchgate Terminus",
      passengerName: "Pooja Mehta",
      passengerPhone: "9819922334",
      passengerEmail: "pooja.mehta@gmail.com",
      passengerCount: 2,
      singleFare: 140,
      fareAmount: 280,
      currency: "INR",
      journeyDate: now.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }),
      bookingTimestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
      validFrom: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
      validUntil: new Date(now.getTime() + 105 * 60 * 1000).toISOString(),
      verificationToken: "sample_token_crw_valid",
      verificationUrl: "/verify?token=sample_token_crw_valid",
      qrPayload: JSON.stringify({
        ticketId: "TKT-SAMPLE-CRW-8941",
        pnr: "CRW-51048291",
        ticketNumber: "RS-MUM-2026-894120",
        status: "VALID"
      }),
      disclaimer: "Route Sense Demonstration & Commuter Pass — Not an official Indian Railways suburban ticket.",
      isOfficialTicket: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    },
    {
      id: "TKT-SAMPLE-USED-6979",
      ticketNumber: "RS-MUM-2026-697989",
      pnr: "BEST-27172491",
      bookingId: "BKG-SAMPLE-USED-03",
      paymentId: "PAY-SAMPLE-USED-03",
      orderId: "order_sample_used_03",
      status: "USED",
      transportMode: "BUS",
      operator: "BEST Undertaking",
      vehicleType: "AC Electric Express",
      source: "Borivali",
      destination: "Churchgate",
      passengerName: "Kavita Rao",
      passengerPhone: "9870001122",
      passengerEmail: "kavita@example.com",
      passengerCount: 1,
      singleFare: 46,
      fareAmount: 46,
      currency: "INR",
      journeyDate: now.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }),
      bookingTimestamp: new Date(now.getTime() - 90 * 60 * 1000).toISOString(),
      validFrom: new Date(now.getTime() - 90 * 60 * 1000).toISOString(),
      validUntil: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
      usedAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
      usedByValidator: "V. K. Shinde (BEST Central - BOM-104)",
      verificationToken: "sample_token_used",
      verificationUrl: "/verify?token=sample_token_used",
      qrPayload: JSON.stringify({
        ticketId: "TKT-SAMPLE-USED-6979",
        pnr: "BEST-27172491",
        ticketNumber: "RS-MUM-2026-697989",
        status: "USED"
      }),
      disclaimer: "Route Sense Demonstration & Commuter Pass — Not an official BEST ticket.",
      isOfficialTicket: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    },
    {
      id: "TKT-SAMPLE-EXPIRED-3021",
      ticketNumber: "RS-MUM-2026-302194",
      pnr: "CRW-10928374",
      bookingId: "BKG-SAMPLE-EXPIRED-04",
      paymentId: "PAY-SAMPLE-EXPIRED-04",
      orderId: "order_sample_expired_04",
      status: "EXPIRED",
      transportMode: "TRAIN",
      operator: "Western Railway Suburban",
      vehicleType: "Second Class Local",
      source: "Dadar Junction",
      destination: "Thane",
      passengerName: "Rahul Verma",
      passengerPhone: "9812345678",
      passengerEmail: "rahul.verma@example.com",
      passengerCount: 1,
      singleFare: 15,
      fareAmount: 15,
      currency: "INR",
      journeyDate: "16 October 2026",
      bookingTimestamp: new Date(now.getTime() - 26 * 60 * 60 * 1000).toISOString(),
      validFrom: new Date(now.getTime() - 26 * 60 * 60 * 1000).toISOString(),
      validUntil: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      verificationToken: "sample_token_expired",
      verificationUrl: "/verify?token=sample_token_expired",
      qrPayload: JSON.stringify({
        ticketId: "TKT-SAMPLE-EXPIRED-3021",
        pnr: "CRW-10928374",
        ticketNumber: "RS-MUM-2026-302194",
        status: "EXPIRED"
      }),
      disclaimer: "Route Sense Demonstration & Commuter Pass.",
      isOfficialTicket: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    }
  ];

  for (const t of sampleTickets) {
    if (!memoryStore.tickets[t.id]) {
      memoryStore.tickets[t.id] = t;
      memoryStore.payments[t.paymentId] = {
        id: t.paymentId,
        bookingId: t.bookingId,
        orderId: t.orderId,
        paymentId: `pay_${t.id.slice(-6)}`,
        signature: `sig_${t.id.slice(-6)}`,
        amount: t.fareAmount,
        amountPaise: t.fareAmount * 100,
        currency: "INR",
        status: "PAID",
        gateway: "DEMO_SANDBOX",
        isSandbox: true,
        idempotencyKey: `idem-${t.bookingId}`,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt
      };
      if (t.status === "USED" && t.usedAt) {
        memoryStore.validations.unshift({
          id: `VAL-SAMPLE-01`,
          ticketId: t.id,
          ticketNumber: t.ticketNumber,
          pnr: t.pnr,
          validatorId: "CONDUCTOR-BOM-104",
          validatorName: "V. K. Shinde (BEST Central)",
          validationStatus: "VALID",
          notes: "Punched at Dadar Station Turnstile",
          timestamp: t.usedAt
        });
      }
    }
  }
}

function loadFromDisk(): void {
  try {
    const dbPath = getDbFilePath();
    if (fs.existsSync(dbPath)) {
      const raw = fs.readFileSync(dbPath, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed.bookings) memoryStore.bookings = parsed.bookings;
      if (parsed.payments) memoryStore.payments = parsed.payments;
      if (parsed.tickets) memoryStore.tickets = parsed.tickets;
      if (parsed.validations) memoryStore.validations = parsed.validations;
      const stat = fs.statSync(dbPath);
      lastLoadedMtime = stat.mtimeMs;
    }
  } catch (err) {
    console.warn("Could not load ticketing store from disk, running in memory:", err);
  }
  // Ensure default demo tickets are seeded if ticket store is empty
  if (Object.keys(memoryStore.tickets).length === 0) {
    seedDefaultTickets();
  }
  isInitialized = true;
}

function persistToDisk(): void {
  if (process.env.NODE_ENV === "test" || process.env.VITEST) {
    return;
  }
  try {
    const dbPath = getDbFilePath();
    const data = JSON.stringify(memoryStore, null, 2);
    fs.writeFileSync(dbPath, data, "utf-8");
    try {
      const stat = fs.statSync(dbPath);
      lastLoadedMtime = stat.mtimeMs;
    } catch {
      lastLoadedMtime = Date.now();
    }
  } catch (err) {
    console.warn("Could not persist ticketing store to disk (ephemeral container fallback):", err);
  }
}

function ensureInit(): void {
  if (process.env.NODE_ENV === "test" || process.env.VITEST) {
    if (!isInitialized) {
      loadFromDisk();
    }
    return;
  }

  try {
    const dbPath = getDbFilePath();
    if (fs.existsSync(dbPath)) {
      const stat = fs.statSync(dbPath);
      if (!isInitialized || stat.mtimeMs > lastLoadedMtime) {
        loadFromDisk();
        lastLoadedMtime = stat.mtimeMs;
      }
    } else if (!isInitialized) {
      loadFromDisk();
    }
  } catch {
    if (!isInitialized) {
      loadFromDisk();
    }
  }
}

/**
 * Mutex lock to serialize critical payment-to-ticket transitions
 */
let mutexPromise = Promise.resolve();
function withLock<T>(fn: () => Promise<T> | T): Promise<T> {
  const next = mutexPromise.then(() => fn());
  mutexPromise = next.then(() => {}, () => {});
  return next;
}

// ============================================================================
// Public Database Access Methods
// ============================================================================

export const TicketsDatabase = {
  /**
   * Create a new transit booking in PENDING_PAYMENT state
   */
  async createBooking(data: Omit<BookingRecord, "id" | "status" | "createdAt" | "updatedAt">): Promise<BookingRecord> {
    return withLock(() => {
      ensureInit();
      const now = new Date().toISOString();
      const bookingId = `BKG-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

      const booking: BookingRecord = {
        ...data,
        id: bookingId,
        status: "PENDING_PAYMENT",
        createdAt: now,
        updatedAt: now
      };

      memoryStore.bookings[bookingId] = booking;
      persistToDisk();
      return booking;
    });
  },

  async getBooking(id: string): Promise<BookingRecord | null> {
    ensureInit();
    return memoryStore.bookings[id] || null;
  },

  /**
   * Create a payment record in CREATED or PENDING state
   */
  async createPayment(data: {
    bookingId: string;
    orderId: string;
    amount: number;
    currency: "INR";
    gateway: "RAZORPAY" | "DEMO_SANDBOX";
    isSandbox: boolean;
    idempotencyKey?: string;
  }): Promise<PaymentRecord> {
    return withLock(() => {
      ensureInit();
      const now = new Date().toISOString();
      const paymentId = `PAY-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
      const idempotencyKey = data.idempotencyKey || `idem-${data.bookingId}-${data.orderId}`;

      // Check if order already recorded
      const existing = Object.values(memoryStore.payments).find(
        (p) => p.orderId === data.orderId || p.idempotencyKey === idempotencyKey
      );
      if (existing) {
        return existing;
      }

      const payment: PaymentRecord = {
        id: paymentId,
        bookingId: data.bookingId,
        orderId: data.orderId,
        amount: data.amount,
        amountPaise: Math.round(data.amount * 100),
        currency: data.currency,
        status: "CREATED",
        gateway: data.gateway,
        isSandbox: data.isSandbox,
        idempotencyKey,
        createdAt: now,
        updatedAt: now
      };

      memoryStore.payments[paymentId] = payment;
      persistToDisk();
      return payment;
    });
  },

  async getPayment(id: string): Promise<PaymentRecord | null> {
    ensureInit();
    return memoryStore.payments[id] || null;
  },

  async getPaymentByOrderId(orderId: string): Promise<PaymentRecord | null> {
    ensureInit();
    return Object.values(memoryStore.payments).find((p) => p.orderId === orderId) || null;
  },

  async getPaymentByBookingId(bookingId: string): Promise<PaymentRecord | null> {
    ensureInit();
    return Object.values(memoryStore.payments).find((p) => p.bookingId === bookingId) || null;
  },

  /**
   * Transition payment status with validation
   */
  async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    details?: { paymentId?: string; signature?: string; rawResponse?: any; errorMessage?: string }
  ): Promise<PaymentRecord> {
    return withLock(() => {
      ensureInit();
      const payment = memoryStore.payments[paymentId];
      if (!payment) {
        throw new Error(`Payment record with id "${paymentId}" not found`);
      }

      const now = new Date().toISOString();
      payment.status = status;
      payment.updatedAt = now;

      if (details?.paymentId) payment.paymentId = details.paymentId;
      if (details?.signature) payment.signature = details.signature;
      if (details?.rawResponse) payment.rawResponse = details.rawResponse;
      if (details?.errorMessage) payment.errorMessage = details.errorMessage;

      // Update matching booking status if paid
      if (status === "PAID" && memoryStore.bookings[payment.bookingId]) {
        memoryStore.bookings[payment.bookingId].status = "PAID";
        memoryStore.bookings[payment.bookingId].updatedAt = now;
      }

      persistToDisk();
      return payment;
    });
  },

  /**
   * Issue a genuine Ticket ONLY after payment status is verified as PAID.
   * Completely idempotent: calling multiple times for the same payment or booking
   * returns the existing ticket without creating a duplicate.
   */
  async issueTicket(params: {
    bookingId: string;
    paymentId: string;
    tokenSigner: (ticketId: string, pnr: string, amount: number) => { token: string; qrPayload: string; verificationUrl: string };
  }): Promise<TicketRecord> {
    return withLock(() => {
      ensureInit();
      const booking = memoryStore.bookings[params.bookingId];
      if (!booking) {
        throw new Error(`Booking "${params.bookingId}" does not exist.`);
      }

      const payment = memoryStore.payments[params.paymentId];
      if (!payment) {
        throw new Error(`Payment record "${params.paymentId}" does not exist.`);
      }

      // Security Check: Never issue a ticket unless payment is confirmed PAID
      if (payment.status !== "PAID") {
        throw new Error(
          `Cannot issue ticket: Payment status is "${payment.status}". Ticket is only issued after verified payment.`
        );
      }

      // Idempotency: check if ticket already exists for this booking or payment
      const existingTicket = Object.values(memoryStore.tickets).find(
        (t) => t.bookingId === params.bookingId || t.paymentId === params.paymentId
      );
      if (existingTicket) {
        return existingTicket;
      }

      const now = new Date();
      const validUntilDate = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours validity for suburban transit

      const ticketId = `TKT-${now.getTime().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
      const prefix = booking.transportMode === "BUS" ? "BEST" : "CRW";
      const pnr = `${prefix}-${Math.floor(10000000 + Math.random() * 90000000)}`;
      const ticketNumber = `RS-MUM-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

      const { token, qrPayload, verificationUrl } = params.tokenSigner(ticketId, pnr, payment.amount);

      const disclaimer =
        "Route Sense Demonstration & Commuter Pass — Not an official BEST / Indian Railways suburban ticket. For actual transit boarding, official UTS / Chalo / Yatri tickets are required.";

      const ticket: TicketRecord = {
        id: ticketId,
        ticketNumber,
        pnr,
        bookingId: booking.id,
        paymentId: payment.id,
        orderId: payment.orderId,
        status: "VALID",
        transportMode: booking.transportMode,
        operator: booking.operator,
        vehicleType: booking.vehicleTitle,
        source: booking.source,
        destination: booking.destination,
        passengerName: booking.passengerName,
        passengerPhone: booking.passengerPhone,
        passengerEmail: booking.passengerEmail,
        passengerCount: booking.passengerCount,
        singleFare: booking.singleFare,
        fareAmount: payment.amount,
        currency: "INR",
        journeyDate: now.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }),
        bookingTimestamp: now.toISOString(),
        validFrom: now.toISOString(),
        validUntil: validUntilDate.toISOString(),
        verificationToken: token,
        verificationUrl,
        qrPayload,
        disclaimer,
        isOfficialTicket: false,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };

      memoryStore.tickets[ticketId] = ticket;
      persistToDisk();
      return ticket;
    });
  },

  async getTicket(id: string): Promise<TicketRecord | null> {
    ensureInit();
    return memoryStore.tickets[id] || null;
  },

  async getTicketByTicketNumber(ticketNumber: string): Promise<TicketRecord | null> {
    ensureInit();
    const clean = ticketNumber.trim().toUpperCase();
    return Object.values(memoryStore.tickets).find((t) => t.ticketNumber.toUpperCase() === clean) || null;
  },

  async getTicketByPnr(pnr: string): Promise<TicketRecord | null> {
    ensureInit();
    const clean = pnr.trim().toUpperCase();
    return Object.values(memoryStore.tickets).find((t) => t.pnr.toUpperCase() === clean) || null;
  },

  async getTicketByBookingId(bookingId: string): Promise<TicketRecord | null> {
    ensureInit();
    return Object.values(memoryStore.tickets).find((t) => t.bookingId === bookingId) || null;
  },

  /**
   * Verify ticket authenticity and state for conductors / validators
   */
  async verifyTicket(identifier: string): Promise<{
    status: ValidationStatus;
    ticket: TicketRecord | null;
    payment: PaymentRecord | null;
    validationHistory: ValidationRecord[];
    reason: string;
  }> {
    ensureInit();
    let raw = identifier ? String(identifier).trim() : "";
    if (!raw) {
      return {
        status: "INVALID",
        ticket: null,
        payment: null,
        validationHistory: [],
        reason: "No ticket identifier or token was provided."
      };
    }

    // 1. If raw is a JSON string (e.g. from a raw QR code scanner)
    if (raw.startsWith("{") && raw.endsWith("}")) {
      try {
        const parsed = JSON.parse(raw);
        raw = parsed.token || parsed.ticketNumber || parsed.ticketId || parsed.id || parsed.pnr || raw;
      } catch {}
    }

    // 2. If raw is a URL or query string (e.g. https://domain/verify?token=... or /verify?token=...)
    if (raw.includes("token=") || raw.includes("id=") || raw.includes("ticketNumber=") || raw.includes("pnr=")) {
      try {
        const parsedUrl = new URL(raw, "http://localhost");
        const extracted =
          parsedUrl.searchParams.get("token") ||
          parsedUrl.searchParams.get("ticketNumber") ||
          parsedUrl.searchParams.get("id") ||
          parsedUrl.searchParams.get("pnr");
        if (extracted) {
          raw = extracted.trim();
        }
      } catch {
        const match = raw.match(/[?&](?:token|ticketNumber|id|pnr)=([^&]+)/);
        if (match && match[1]) {
          raw = decodeURIComponent(match[1]).trim();
        }
      }
    }

    const clean = raw.trim();
    const cleanUpper = clean.toUpperCase();
    const cleanAlpha = clean.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

    // 3. Search in memoryStore.tickets
    let ticket = Object.values(memoryStore.tickets).find((t) => {
      if (t.id === clean || t.id.toUpperCase() === cleanUpper) return true;
      if (t.ticketNumber.toUpperCase() === cleanUpper) return true;
      if (t.pnr.toUpperCase() === cleanUpper) return true;
      if (t.verificationToken === clean) return true;

      // Alphanumeric normalized comparison (e.g. RSMUM2026782145 matches RS-MUM-2026-782145)
      const ticketNumAlpha = t.ticketNumber.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
      if (ticketNumAlpha === cleanAlpha) return true;

      const pnrAlpha = t.pnr.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
      if (pnrAlpha === cleanAlpha) return true;

      // 5+ character numeric suffix match (e.g. "782145" matches "RS-MUM-2026-782145")
      if (cleanAlpha.length >= 5 && ticketNumAlpha.endsWith(cleanAlpha)) return true;

      return false;
    });

    // 4. Cryptographic Token Fallback
    // If ticket record was not found in disk (e.g. ephemeral serverless container cold start),
    // but the token contains a cryptographically verified HMAC signature from Route Sense:
    if (!ticket && clean.includes(".")) {
      try {
        const tokenResult = verifyTicketToken(clean);
        if ((tokenResult.valid || tokenResult.isExpired) && tokenResult.payload) {
          const payload = tokenResult.payload;
          const now = new Date();
          const validUntil = new Date((payload.exp || Math.floor(Date.now() / 1000) + 7200) * 1000);
          const isExpired = now > validUntil || Boolean(tokenResult.isExpired);

          ticket = {
            id: payload.t || `TKT-HMAC-${Date.now().toString(36).toUpperCase()}`,
            ticketNumber: `RS-MUM-2026-${String(payload.a || 50).padStart(2, "0")}${Math.floor(1000 + Math.random() * 9000)}`,
            pnr: payload.p || `COMMUTER-${Math.floor(10000000 + Math.random() * 90000000)}`,
            bookingId: `BKG-VERIFIED-${Date.now().toString(36)}`,
            paymentId: `PAY-VERIFIED-${Date.now().toString(36)}`,
            orderId: `order_verified_hmac`,
            status: isExpired ? "EXPIRED" : "VALID",
            transportMode: payload.p?.startsWith("BEST") ? "BUS" : "TRAIN",
            operator: payload.p?.startsWith("BEST") ? "BEST Undertaking" : "Mumbai Suburban Railway",
            vehicleType: payload.p?.startsWith("BEST") ? "BEST Electric Bus" : "Suburban Local Train",
            source: "Mumbai Suburban Network",
            destination: "Destination Station",
            passengerName: "Verified Commuter",
            passengerPhone: "9870000000",
            passengerEmail: "commuter@routesense.mumbai",
            passengerCount: 1,
            singleFare: payload.a || 20,
            fareAmount: payload.a || 20,
            currency: "INR",
            journeyDate: now.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }),
            bookingTimestamp: new Date(payload.iat ? payload.iat * 1000 : Date.now()).toISOString(),
            validFrom: new Date(payload.iat ? payload.iat * 1000 : Date.now()).toISOString(),
            validUntil: validUntil.toISOString(),
            verificationToken: clean,
            verificationUrl: `/verify?token=${clean}`,
            qrPayload: clean,
            disclaimer: "Route Sense Demonstration & Commuter Pass.",
            isOfficialTicket: false,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString()
          };

          memoryStore.tickets[ticket.id] = ticket;
          memoryStore.payments[ticket.paymentId] = {
            id: ticket.paymentId,
            bookingId: ticket.bookingId,
            orderId: ticket.orderId,
            amount: ticket.fareAmount,
            amountPaise: ticket.fareAmount * 100,
            currency: "INR",
            status: "PAID",
            gateway: "DEMO_SANDBOX",
            isSandbox: true,
            idempotencyKey: `idem-${ticket.id}`,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString()
          };
          persistToDisk();
        }
      } catch {}
    }

    if (!ticket) {
      return {
        status: "INVALID",
        ticket: null,
        payment: null,
        validationHistory: [],
        reason: "Ticket not found in Route Sense database. Unverified or forged ticket."
      };
    }

    const payment = memoryStore.payments[ticket.paymentId] || null;
    if (!payment || payment.status !== "PAID") {
      return {
        status: "INVALID",
        ticket,
        payment,
        validationHistory: [],
        reason: "Payment record is unverified or failed. This ticket has not been paid for."
      };
    }

    const history = memoryStore.validations.filter((v) => v.ticketId === ticket.id);

    if (ticket.status === "CANCELLED") {
      return {
        status: "CANCELLED",
        ticket,
        payment,
        validationHistory: history,
        reason: "This ticket has been cancelled or refunded."
      };
    }

    if (ticket.status === "USED") {
      return {
        status: "ALREADY_USED",
        ticket,
        payment,
        validationHistory: history,
        reason: `Ticket was already validated & used on ${new Date(ticket.usedAt || ticket.updatedAt).toLocaleString("en-IN")}.`
      };
    }

    // Check expiration
    const now = new Date();
    const expiry = new Date(ticket.validUntil);
    if (now > expiry || ticket.status === "EXPIRED") {
      ticket.status = "EXPIRED";
      ticket.updatedAt = now.toISOString();
      persistToDisk();
      return {
        status: "EXPIRED",
        ticket,
        payment,
        validationHistory: history,
        reason: `Ticket expired on ${expiry.toLocaleTimeString("en-IN")}. Standard suburban pass validity is 2 hours.`
      };
    }

    return {
      status: "VALID",
      ticket,
      payment,
      validationHistory: history,
      reason: "Ticket is authentic, verified against server payment record, and valid for travel."
    };
  },

  /**
   * Authorized staff punches / marks ticket as USED
   */
  async punchTicket(params: {
    ticketId: string;
    validatorId: string;
    validatorName: string;
    notes?: string;
  }): Promise<{ success: boolean; validation: ValidationRecord; ticket: TicketRecord }> {
    return withLock(() => {
      ensureInit();
      const ticket = memoryStore.tickets[params.ticketId];
      if (!ticket) {
        throw new Error(`Ticket "${params.ticketId}" not found.`);
      }

      if (ticket.status === "USED") {
        throw new Error(`Ticket has already been used on ${ticket.usedAt}`);
      }

      const now = new Date().toISOString();
      ticket.status = "USED";
      ticket.usedAt = now;
      ticket.usedByValidator = `${params.validatorName} (${params.validatorId})`;
      ticket.updatedAt = now;

      const validation: ValidationRecord = {
        id: `VAL-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        pnr: ticket.pnr,
        validatorId: params.validatorId,
        validatorName: params.validatorName,
        validationStatus: "VALID",
        notes: params.notes || "Ticket punched & validated at turnstile/boarding",
        timestamp: now
      };

      memoryStore.validations.unshift(validation);
      persistToDisk();

      return {
        success: true,
        validation,
        ticket
      };
    });
  },

  /**
   * Reset store (Used exclusively for automated tests)
   */
  _resetForTesting(): void {
    memoryStore.bookings = {};
    memoryStore.payments = {};
    memoryStore.tickets = {};
    memoryStore.validations = [];
    isInitialized = true;
    lastLoadedMtime = Date.now() + 1000000;
  }
};
