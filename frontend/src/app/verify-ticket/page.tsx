"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Clock,
  CheckCircle2,
  Search,
  QrCode,
  Ticket,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Building,
  ArrowRight,
  ShieldAlert,
  Loader2,
  RefreshCw,
  Lock,
  Stamp
} from "lucide-react";
import Link from "next/link";
import { TicketRecord, ValidationStatus, ValidationRecord } from "@/lib/db/ticketsDb";

interface VerificationResponse {
  status: ValidationStatus;
  ticket: TicketRecord | null;
  payment: {
    id: string;
    status: string;
    orderId: string;
    paymentId?: string;
    amount: number;
    currency: string;
    gateway: string;
    isSandbox: boolean;
    paidAt: string;
  } | null;
  validationHistory: ValidationRecord[];
  reason: string;
  verifiedAt: string;
}

function TicketVerificationContent() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || searchParams.get("id") || searchParams.get("ticketNumber") || "";

  const [inputQuery, setInputQuery] = useState(tokenFromUrl);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Staff validation punch form
  const [staffValidatorId, setStaffValidatorId] = useState("CONDUCTOR-BOM-104");
  const [staffValidatorName, setStaffValidatorName] = useState("V. K. Shinde (BEST Central)");
  const [punching, setPunching] = useState(false);
  const [punchSuccess, setPunchSuccess] = useState<string | null>(null);

  const runVerification = async (queryToVerify: string) => {
    const clean = queryToVerify.trim();
    if (!clean) {
      setError("Please enter a ticket number, PNR, token, or scan a QR code.");
      return;
    }

    setLoading(true);
    setError(null);
    setPunchSuccess(null);

    try {
      const res = await fetch("/api/v1/tickets/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: clean })
      });

      const data: VerificationResponse = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err?.message || "Verification request failed. Server unreachable.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tokenFromUrl) {
      runVerification(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const handlePunchTicket = async () => {
    if (!result?.ticket?.id) return;
    setPunching(true);
    setPunchSuccess(null);

    try {
      const res = await fetch("/api/v1/tickets/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: result.ticket.id,
          validatorId: staffValidatorId,
          validatorName: staffValidatorName,
          staffKey: "routesense-staff-2026"
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to mark ticket as used.");
      }

      setPunchSuccess(`Ticket successfully punched by ${staffValidatorName}!`);
      // Refresh verification status
      runVerification(result.ticket.id);
    } catch (err: any) {
      setError(err?.message || "Punch action failed.");
    } finally {
      setPunching(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-stone-900 border border-white/10 rounded-[28px] p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono">
              OFFICIAL TICKET AUTHENTICATION TERMINAL
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <span>Route Sense Ticket Validator</span>
            <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/20">
              Staff Portal
            </span>
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Verifies cryptographic HMAC token, server-side payment records, validity duration, and punch history.
          </p>
        </div>

        <Link
          href="/#booking-section"
          className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-stone-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
        >
          <Ticket className="w-3.5 h-3.5 text-rose-400" />
          <span>Book New Pass</span>
        </Link>
      </div>

      {/* Query Search / Scan Bar */}
      <div className="bg-stone-900/90 border border-white/10 rounded-[24px] p-4 shadow-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runVerification(inputQuery);
          }}
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          <div className="relative flex-1 w-full">
            <QrCode className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Enter Ticket Number (RS-MUM-2026-...), PNR, or paste QR token..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-rose-500 transition-colors font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-950/50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Verify Authenticity</span>
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Verification Status Card */}
      {result && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Status Banner */}
          <div
            className={`rounded-[28px] p-5 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xl ${
              result.status === "VALID"
                ? "bg-gradient-to-r from-emerald-950/80 via-emerald-900/60 to-stone-900 border-emerald-500/50"
                : result.status === "ALREADY_USED"
                ? "bg-gradient-to-r from-amber-950/80 via-amber-900/60 to-stone-900 border-amber-500/50"
                : result.status === "EXPIRED"
                ? "bg-gradient-to-r from-rose-950/80 via-rose-900/60 to-stone-900 border-rose-500/50"
                : "bg-gradient-to-r from-red-950/80 via-stone-900 to-stone-950 border-red-500/50"
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg ${
                  result.status === "VALID"
                    ? "bg-emerald-500"
                    : result.status === "ALREADY_USED"
                    ? "bg-amber-500"
                    : result.status === "EXPIRED"
                    ? "bg-rose-500"
                    : "bg-red-600"
                }`}
              >
                {result.status === "VALID" ? (
                  <CheckCircle2 className="w-6 h-6 text-white" />
                ) : result.status === "ALREADY_USED" ? (
                  <Clock className="w-6 h-6 text-white" />
                ) : result.status === "EXPIRED" ? (
                  <AlertTriangle className="w-6 h-6 text-white" />
                ) : (
                  <XCircle className="w-6 h-6 text-white" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      result.status === "VALID"
                        ? "bg-emerald-400 text-stone-950"
                        : result.status === "ALREADY_USED"
                        ? "bg-amber-400 text-stone-950"
                        : "bg-rose-500 text-white"
                    }`}
                  >
                    STATUS: {result.status}
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">
                    Verified at {new Date(result.verifiedAt).toLocaleTimeString("en-IN")}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white mt-1">
                  {result.reason}
                </h3>
              </div>
            </div>

            {/* Status Quick Pill */}
            {result.ticket && (
              <div className="text-right">
                <span className="text-xs text-stone-400 block">Verified Fare</span>
                <span className="text-xl font-black text-white">₹{result.ticket.fareAmount} INR</span>
              </div>
            )}
          </div>

          {/* Ticket Breakdown (If Valid or Record Found) */}
          {result.ticket && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left Column: Passenger & Route Details */}
              <div className="bg-stone-900 border border-white/10 rounded-[24px] p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                    Passenger &amp; Journey
                  </span>
                  <span className="text-xs font-mono font-bold text-stone-300">
                    PNR: {result.ticket.pnr}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-stone-400" />
                      Passenger Name:
                    </span>
                    <span className="font-bold text-white text-sm">{result.ticket.passengerName}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-stone-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-stone-400" />
                      Contact:
                    </span>
                    <span className="font-mono text-stone-300">
                      +91 {result.ticket.passengerPhone}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-stone-400 flex items-center gap-1.5">
                      <Ticket className="w-3.5 h-3.5 text-stone-400" />
                      Passengers:
                    </span>
                    <span className="font-bold text-stone-200">
                      {result.ticket.passengerCount} Commuter(s)
                    </span>
                  </div>

                  <div className="pt-2 border-t border-white/5 space-y-1">
                    <span className="text-stone-400 text-[11px] block">Corridor Route:</span>
                    <div className="flex items-center justify-between font-bold text-white text-xs bg-black/30 p-2.5 rounded-xl border border-white/5">
                      <span className="truncate max-w-[140px] text-orange-300">
                        {result.ticket.source}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                      <span className="truncate max-w-[140px] text-rose-300">
                        {result.ticket.destination}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-stone-400">Service:</span>
                    <span className="font-bold text-stone-200 truncate max-w-[200px]">
                      {result.ticket.vehicleType}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-stone-400">Operator:</span>
                    <span className="text-[11px] text-stone-300 truncate max-w-[200px]">
                      {result.ticket.operator}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Payment & Cryptographic Security */}
              <div className="bg-stone-900 border border-white/10 rounded-[24px] p-5 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Payment &amp; Security Audit
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {result.payment?.status || "CONFIRMED"}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-400">Gateway Order ID:</span>
                      <span className="font-mono text-stone-300">{result.ticket.orderId}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-stone-400">Payment ID:</span>
                      <span className="font-mono text-emerald-300">{result.payment?.paymentId || result.ticket.paymentId}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-stone-400">Gateway Mode:</span>
                      <span className="text-[11px] font-mono text-stone-300">
                        {result.payment?.gateway === "RAZORPAY" ? "Razorpay Gateway (Production)" : "Route Sense Secure Sandbox"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-stone-400">Issuance Time:</span>
                      <span className="font-mono text-stone-300">
                        {new Date(result.ticket.bookingTimestamp).toLocaleTimeString("en-IN")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-stone-400">Valid Until:</span>
                      <span className="font-mono text-amber-300 font-bold">
                        {new Date(result.ticket.validUntil).toLocaleTimeString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Staff Validator Punch Action */}
                {result.status === "VALID" && (
                  <div className="pt-3 border-t border-white/10 mt-2">
                    <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-2.5">
                      <span className="text-[11px] font-bold text-stone-300 flex items-center gap-1.5">
                        <Stamp className="w-3.5 h-3.5 text-amber-400" />
                        Conductor / Turnstile Action:
                      </span>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <input
                          type="text"
                          value={staffValidatorName}
                          onChange={(e) => setStaffValidatorName(e.target.value)}
                          placeholder="Staff Name"
                          className="bg-white/10 border border-white/10 rounded-lg px-2.5 py-1 text-white text-[11px]"
                        />
                        <input
                          type="text"
                          value={staffValidatorId}
                          onChange={(e) => setStaffValidatorId(e.target.value)}
                          placeholder="Staff ID"
                          className="bg-white/10 border border-white/10 rounded-lg px-2.5 py-1 text-white text-[11px]"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handlePunchTicket}
                        disabled={punching}
                        className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer disabled:opacity-75"
                      >
                        {punching ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Stamp className="w-3.5 h-3.5" />
                        )}
                        <span>Punch Ticket &bull; Mark as Used</span>
                      </button>
                    </div>
                  </div>
                )}

                {punchSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{punchSuccess}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Validation History (If Previously Validated) */}
          {result.validationHistory && result.validationHistory.length > 0 && (
            <div className="bg-stone-900 border border-white/10 rounded-[24px] p-5 space-y-3">
              <span className="text-xs font-bold text-stone-300 uppercase tracking-wider block">
                Validation &amp; Inspection Audit Log
              </span>
              <div className="space-y-2">
                {result.validationHistory.map((val, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-black/30 border border-white/5 text-xs"
                  >
                    <div>
                      <p className="font-bold text-white">{val.validatorName} ({val.validatorId})</p>
                      <p className="text-[10px] text-stone-400">{val.notes}</p>
                    </div>
                    <span className="text-[10px] font-mono text-stone-400">
                      {new Date(val.timestamp).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mandatory Public Transport Limitation Disclaimer */}
          <div className="p-4 rounded-[20px] bg-amber-950/40 border border-amber-600/30 text-amber-200 text-xs leading-relaxed flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold mb-0.5 uppercase tracking-wide text-amber-300">
                Official Transport Limitation Disclaimer
              </strong>
              Route Sense Mumbai provides journey planning, simulated commuter passes, and demonstration ticketing.
              This pass is not an official municipal BEST bus ticket or Indian Railways suburban UTS ticket. For actual public transport boarding, commuters must purchase tickets via official transit authority channels (UTS App, Chalo App, or station booking counters).
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TicketVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-950 text-white flex items-center justify-center p-8">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-rose-500" />
            <span className="text-sm font-medium">Loading Ticket Verification Portal...</span>
          </div>
        </div>
      }
    >
      <TicketVerificationContent />
    </Suspense>
  );
}
