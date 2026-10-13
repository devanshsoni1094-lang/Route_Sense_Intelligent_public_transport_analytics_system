"use client";

import React, { useState } from "react";
import {
  Ticket,
  ShieldCheck,
  CreditCard,
  QrCode,
  Smartphone,
  ArrowRight,
  Clock,
  Printer,
  Sparkles,
  Lock,
  User,
  Phone,
  Mail,
  Check,
  Bus,
  Train,
  Copy,
  CheckCheck,
  RefreshCw
} from "lucide-react";
import { PAYMENT_QR_BASE64 } from "@/lib/paymentQrDataUri";
import { calculateMumbaiFare, TransitMode, BusTier, TrainTier, IssuedTicket } from "./BookingModal";

interface BookingSectionProps {
  initialOrigin?: string;
  initialDest?: string;
  initialDistanceKm?: number;
}

export const BookingSection: React.FC<BookingSectionProps> = ({
  initialOrigin = "Dadar Central Railway Station",
  initialDest = "CSMT Terminus",
  initialDistanceKm = 10
}) => {
  // Mode Selection: Strictly BUS or TRAIN
  const [selectedMode, setSelectedMode] = useState<TransitMode>("TRAIN");
  const [busTier, setBusTier] = useState<BusTier>("BEST_NON_AC");
  const [trainTier, setTrainTier] = useState<TrainTier>("LOCAL_II");

  // Editable Source & Destination (Can write any city/stop/station in Mumbai)
  const [customSource, setCustomSource] = useState(initialOrigin);
  const [customDestination, setCustomDestination] = useState(initialDest);
  const [customDistanceKm, setCustomDistanceKm] = useState(initialDistanceKm);

  // Commuter Form State
  const [passengerName, setPassengerName] = useState("Devansh Soni");
  const [passengerPhone, setPassengerPhone] = useState("9876543210");
  const [passengerEmail, setPassengerEmail] = useState("devansh@routesense.in");
  const [numPassengers, setNumPassengers] = useState(1);

  // UPI Payment State
  const [utrNumber, setUtrNumber] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Flow State: "FORM" | "PROCESSING" | "TICKET"
  const [flowState, setFlowState] = useState<"FORM" | "PROCESSING" | "TICKET">("FORM");
  const [processingStep, setProcessingStep] = useState(0);
  const [issuedTicket, setIssuedTicket] = useState<IssuedTicket | null>(null);

  // Calculate Fare dynamically
  const activeTier = selectedMode === "BUS" ? busTier : trainTier;
  const fareInfo = calculateMumbaiFare(selectedMode, activeTier, customDistanceKm);
  const singleFare = fareInfo.singleFare;
  const totalFare = Math.max(5, singleFare * numPassengers);
  const durationEstimate = Math.max(8, Math.round(customDistanceKm * (selectedMode === "TRAIN" ? 1.6 : 2.5)));

  // Auto-fill demo UTR for testing
  const handleAutoFillUtr = () => {
    const randomUtr = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    setUtrNumber(randomUtr);
  };

  // Copy UPI handle
  const handleCopyUpi = () => {
    navigator.clipboard?.writeText("routesense.mumbai@okaxis");
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // Handle Payment Confirmation & Ticket Issuance
  const handleConfirmPaymentAndIssueTicket = () => {
    setFlowState("PROCESSING");
    setProcessingStep(1);

    setTimeout(() => {
      setProcessingStep(2);
    }, 800);

    setTimeout(() => {
      setProcessingStep(3);
    }, 1600);

    setTimeout(() => {
      const now = new Date();
      const pnrNum = (selectedMode === "BUS" ? "BEST" : "CRW") + Math.floor(10000000 + Math.random() * 90000000);
      const txnNum = "TXN" + Date.now().toString(36).toUpperCase() + Math.floor(1000 + Math.random() * 9000);
      const generatedUtr = utrNumber.trim() || Math.floor(100000000000 + Math.random() * 900000000000).toString();

      const depTime = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      const arrTime = new Date(now.getTime() + durationEstimate * 60000).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit"
      });

      const ticket: IssuedTicket = {
        ticketId: `TKT-${Date.now()}`,
        pnr: pnrNum,
        bookingDate:
          now.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
          }) +
          " · " +
          depTime,
        journeyDate: now.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "long",
          year: "numeric"
        }),
        departureTime: depTime,
        arrivalTime: arrTime,
        passengerName: passengerName.trim() || "Valued Commuter",
        passengerPhone: passengerPhone.trim() || "+91 9876543210",
        passengerEmail: passengerEmail.trim() || "passenger@routesense.in",
        passengerCount: numPassengers,
        transportMode: selectedMode,
        vehicleType: fareInfo.vehicleTitle,
        operator: fareInfo.operator,
        sourceName: customSource.trim() || "Mumbai Central",
        sourceCity: "Mumbai",
        destinationName: customDestination.trim() || "Dadar",
        destCity: "Mumbai",
        distanceKm: customDistanceKm,
        durationMinutes: durationEstimate,
        farePerPassengerInr: singleFare,
        totalFarePaidInr: totalFare,
        paymentMethod: "UPI_QR",
        paymentStatus: "CONFIRMED",
        txnId: txnNum,
        utrRef: generatedUtr
      };

      setIssuedTicket(ticket);
      setFlowState("TICKET");
    }, 2400);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBookAnother = () => {
    setFlowState("FORM");
    setProcessingStep(0);
    setIssuedTicket(null);
    setUtrNumber("");
  };

  return (
    <section id="booking-section" className="w-full rounded-[32px] vision-card p-5 sm:p-7 shadow-2xl border border-white/15 my-6 text-white">
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white shadow-md">
              <Ticket className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Mumbai Transit Ticket Booking &amp; Online QR Payment
            </h2>
          </div>
          <p className="text-xs text-stone-400">
            Official digital ticketing strictly for <strong>BEST Bus</strong> and <strong>Mumbai Local Trains</strong>. Pay online via QR code to generate verified digital boarding pass.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
            ● Bus &amp; Train Only
          </span>
          <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold">
            Instant QR Payment
          </span>
        </div>
      </div>

      {/* VIEW 1: BOOKING & QR PAYMENT FORM */}
      {flowState === "FORM" && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: TRANSIT & COMMUTER SELECTION (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            
            {/* 1. TRANSIT MODE SELECTOR: BUS OR TRAIN ONLY */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center justify-between">
                <span>1. Select Public Transit Mode:</span>
                <span className="text-[10px] text-amber-400 font-semibold">Strictly Bus &amp; Train</span>
              </label>

              <div className="grid grid-cols-2 gap-3">
                {/* BUS BUTTON */}
                <button
                  type="button"
                  onClick={() => setSelectedMode("BUS")}
                  className={`p-3.5 rounded-2xl flex items-center gap-3 border transition-all cursor-pointer ${
                    selectedMode === "BUS"
                      ? "bg-rose-500/25 border-rose-500 text-white shadow-lg ring-2 ring-rose-500/50"
                      : "bg-white/5 border-white/10 text-stone-400 hover:bg-white/10 hover:text-stone-200"
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${selectedMode === "BUS" ? "bg-rose-500 text-white" : "bg-white/10 text-stone-300"}`}>
                    <Bus className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black leading-tight">BEST Bus</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">Non-AC (₹10+) &bull; AC (₹12+)</p>
                  </div>
                </button>

                {/* TRAIN BUTTON */}
                <button
                  type="button"
                  onClick={() => setSelectedMode("TRAIN")}
                  className={`p-3.5 rounded-2xl flex items-center gap-3 border transition-all cursor-pointer ${
                    selectedMode === "TRAIN"
                      ? "bg-rose-500/25 border-rose-500 text-white shadow-lg ring-2 ring-rose-500/50"
                      : "bg-white/5 border-white/10 text-stone-400 hover:bg-white/10 hover:text-stone-200"
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${selectedMode === "TRAIN" ? "bg-rose-500 text-white" : "bg-white/10 text-stone-300"}`}>
                    <Train className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black leading-tight">Mumbai Local Train</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">UTS II (₹5+) &bull; I &bull; AC</p>
                  </div>
                </button>
              </div>

              {/* SERVICE TIER SELECTOR */}
              {selectedMode === "BUS" ? (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setBusTier("BEST_NON_AC")}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      busTier === "BEST_NON_AC"
                        ? "bg-amber-500/20 border-amber-500 text-amber-200 ring-1 ring-amber-500/40"
                        : "bg-white/5 border-white/10 text-stone-400 hover:bg-white/10"
                    }`}
                  >
                    <span className="text-xs font-bold block">Non-AC Regular Bus</span>
                    <span className="text-[10px] text-stone-400">₹10 base &bull; ₹2.00/km (max ₹60)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBusTier("BEST_AC")}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      busTier === "BEST_AC"
                        ? "bg-cyan-500/20 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500/40"
                        : "bg-white/5 border-white/10 text-stone-400 hover:bg-white/10"
                    }`}
                  >
                    <span className="text-xs font-bold block">AC Electric Express</span>
                    <span className="text-[10px] text-stone-400">₹12 base &bull; ₹2.40/km (max ₹65)</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setTrainTier("LOCAL_II")}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      trainTier === "LOCAL_II"
                        ? "bg-rose-500/20 border-rose-500 text-rose-200 ring-1 ring-rose-500/40"
                        : "bg-white/5 border-white/10 text-stone-400 hover:bg-white/10"
                    }`}
                  >
                    <span className="text-xs font-bold block">Second Class (II)</span>
                    <span className="text-[10px] text-stone-400">₹5 &ndash; ₹30 (UTS)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTrainTier("LOCAL_I")}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      trainTier === "LOCAL_I"
                        ? "bg-amber-500/20 border-amber-500 text-amber-200 ring-1 ring-amber-500/40"
                        : "bg-white/5 border-white/10 text-stone-400 hover:bg-white/10"
                    }`}
                  >
                    <span className="text-xs font-bold block">First Class (I)</span>
                    <span className="text-[10px] text-stone-400">₹65 &ndash; ₹235</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTrainTier("LOCAL_AC")}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      trainTier === "LOCAL_AC"
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/40"
                        : "bg-white/5 border-white/10 text-stone-400 hover:bg-white/10"
                    }`}
                  >
                    <span className="text-xs font-bold block">AC Local EMU</span>
                    <span className="text-[10px] text-stone-400">₹65 &ndash; ₹220</span>
                  </button>
                </div>
              )}
            </div>

            {/* 2. EDITABLE ROUTE: FROM & TO (ANY MUMBAI CITY / LOCALITY / STATION) */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span className="font-bold uppercase tracking-wider text-stone-300">
                  2. Route Stations &amp; Distance
                </span>
                <span className="text-emerald-400 flex items-center gap-1 font-semibold text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  RTO Sept 2026 Tariff
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">
                    From (Station / Stop / Locality)
                  </label>
                  <input
                    type="text"
                    value={customSource}
                    onChange={(e) => setCustomSource(e.target.value)}
                    placeholder="e.g. Dadar, Andheri, CSMT, Thane, Borivali..."
                    className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">
                    To (Station / Stop / Locality)
                  </label>
                  <input
                    type="text"
                    value={customDestination}
                    onChange={(e) => setCustomDestination(e.target.value)}
                    placeholder="e.g. Churchgate, Kurla, Ghatkopar, Vashi..."
                    className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs text-stone-400">
                <div className="flex items-center gap-2">
                  <span>Approx Distance:</span>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={customDistanceKm}
                    onChange={(e) => setCustomDistanceKm(Math.max(1, Number(e.target.value) || 1))}
                    className="w-16 bg-white/10 border border-white/15 rounded-lg px-2 py-0.5 text-center text-xs font-bold text-white focus:outline-none"
                  />
                  <span>km</span>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-stone-400">Base Fare: </span>
                  <strong className="text-white">₹{singleFare} / passenger</strong>
                </div>
              </div>
            </div>

            {/* 3. COMMUTER INFORMATION */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-rose-400" />
                <span>3. Commuter Information</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-stone-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={passengerName}
                    onChange={(e) => setPassengerName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-stone-400 mb-1">Mobile (+91)</label>
                  <input
                    type="tel"
                    value={passengerPhone}
                    onChange={(e) => setPassengerPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-stone-400 mb-1">Email (for E-Ticket PDF)</label>
                  <input
                    type="email"
                    value={passengerEmail}
                    onChange={(e) => setPassengerEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-stone-400 mb-1">Number of Passengers</label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 6].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setNumPassengers(p)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          numPassengers === p
                            ? "bg-rose-500 text-white shadow-md ring-1 ring-rose-400"
                            : "bg-white/10 text-stone-300 hover:bg-white/15"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: MANDATORY ONLINE QR PAYMENT BOX (5 Cols) */}
          <div className="lg:col-span-5 rounded-[26px] bg-gradient-to-b from-[#201518] to-[#160f12] border-2 border-rose-500/40 p-5 shadow-2xl flex flex-col justify-between">
            <div>
              {/* Payment Box Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-full bg-rose-500/20 text-rose-400">
                    <QrCode className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">4. Scan &amp; Pay Online via QR</h3>
                    <p className="text-[10px] text-stone-400">Mandatory payment before ticket issuance</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  ● LIVE UPI
                </span>
              </div>

              {/* AS-IS UPLOADED QR CODE DISPLAY */}
              <div className="mt-4 flex flex-col items-center">
                <div className="relative p-2.5 rounded-2xl bg-black border-2 border-rose-500/60 shadow-xl shadow-rose-950/70">
                  {/* Scanner Glowing Corner Markers */}
                  <div className="absolute top-1.5 left-1.5 w-4 h-4 border-t-2 border-l-2 border-amber-400" />
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 border-t-2 border-r-2 border-amber-400" />
                  <div className="absolute bottom-1.5 left-1.5 w-4 h-4 border-b-2 border-l-2 border-amber-400" />
                  <div className="absolute bottom-1.5 right-1.5 w-4 h-4 border-b-2 border-r-2 border-amber-400" />

                  {/* The As-Is Uploaded QR Code Image */}
                  <div className="w-48 h-48 sm:w-52 sm:h-52 rounded-xl overflow-hidden bg-black flex items-center justify-center">
                    <img
                      src={PAYMENT_QR_BASE64}
                      alt="Official Payment QR Code"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                </div>

                {/* Amount Due Pill */}
                <div className="mt-3 px-4 py-1.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-center w-full">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Total Amount to Pay:</span>
                  <span className="text-2xl font-black text-white">₹{totalFare}.00</span>
                  <span className="text-[10px] text-amber-300 block">
                    {numPassengers} commuter{numPassengers > 1 ? "s" : ""} &bull; {fareInfo.vehicleTitle}
                  </span>
                </div>
              </div>

              {/* UPI Handle with Copy Button */}
              <div className="mt-3 p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-[9px] text-stone-400">UPI ID:</p>
                    <p className="font-mono font-bold text-white text-[10px]">routesense.mumbai@okaxis</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-stone-200 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                >
                  {copiedUpi ? (
                    <>
                      <CheckCheck className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* UPI Reference / UTR Number Field */}
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-stone-400">UPI Ref / UTR (Optional):</span>
                  <button
                    type="button"
                    onClick={handleAutoFillUtr}
                    className="text-rose-400 hover:text-rose-300 font-bold underline cursor-pointer"
                  >
                    Auto-Fill Demo UTR
                  </button>
                </div>
                <input
                  type="text"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  placeholder="e.g. 428910482910"
                  className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white placeholder-stone-500 font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                />
              </div>
            </div>

            {/* ACTION CTA: VERIFY PAYMENT & ISSUE TICKET */}
            <div className="mt-4 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={handleConfirmPaymentAndIssueTicket}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm tracking-wide shadow-xl shadow-emerald-950/60 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4 text-white" />
                <span>I Have Paid ₹{totalFare} &mdash; Verify &amp; Issue E-Ticket</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
              <p className="text-center text-[10px] text-stone-400 mt-2">
                100% verified digital transit pass with turnstile barcode.
              </p>
            </div>

          </div>

        </div>
      )}

      {/* VIEW 2: PROCESSING ANIMATION */}
      {flowState === "PROCESSING" && (
        <div className="py-16 flex flex-col items-center justify-center gap-5 text-center">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-rose-500/20 border-t-rose-500 animate-spin" />
            <Ticket className="w-8 h-8 text-rose-400 animate-pulse" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-extrabold text-white">
              Verifying Online QR Payment
            </h3>
            <p className="text-xs text-stone-400">
              {processingStep === 1 && "Verifying UPI Transaction with Banking Network..."}
              {processingStep === 2 && `Validating Passenger with ${selectedMode === "BUS" ? "BEST Bus Undertaking" : "Suburban Railway"}...`}
              {processingStep === 3 && "Issuing Official Digital Transit Pass & Encrypted Turnstile QR..."}
            </p>
          </div>

          <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-gradient-to-r from-rose-500 via-orange-400 to-emerald-400 transition-all duration-500 rounded-full"
              style={{ width: `${(processingStep / 3) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* VIEW 3: OFFICIAL DIGITAL E-TICKET (BOARDING PASS) */}
      {flowState === "TICKET" && issuedTicket && (
        <div className="mt-6 flex flex-col gap-5 print:p-0 animate-fade-in">
          {/* Status Banner */}
          <div className="flex items-center justify-between pb-3 border-b border-white/15">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                <Check className="w-4 h-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-white leading-tight">Payment Verified via QR</p>
                <p className="text-[10px] text-emerald-400 font-medium">Digital Transit Pass Issued</p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[10px] text-stone-400 uppercase tracking-wider font-bold">Booking PNR</p>
              <p className="text-xs font-black text-rose-300 font-mono tracking-wider">{issuedTicket.pnr}</p>
            </div>
          </div>

          {/* THE TICKET PASS SURFACE (Printable) */}
          <div
            id="printable-ticket"
            className="rounded-[26px] bg-gradient-to-b from-[#2b181b] via-[#221719] to-[#1a1315] border border-rose-500/30 p-5 shadow-2xl relative overflow-hidden flex flex-col gap-4 text-white"
          >
            {/* Header Ribbon */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center shadow-md">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-black tracking-tight text-white leading-tight">
                    ROUTE SENSE MUMBAI E-PASS
                  </h4>
                  <p className="text-[9px] text-stone-400 uppercase tracking-widest font-bold">
                    {issuedTicket.transportMode === "BUS" ? "BEST Bus Digital Boarding Pass" : "Mumbai Suburban Railway Ticket"}
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold uppercase">
                ● ACTIVE PASS
              </span>
            </div>

            {/* Journey Route Banner */}
            <div className="flex items-center justify-between gap-4 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-stone-400 uppercase">From</p>
                <p className="text-base font-black text-white truncate">{issuedTicket.sourceName}</p>
                <p className="text-xs font-bold text-rose-400 mt-0.5">{issuedTicket.departureTime}</p>
              </div>

              <div className="flex flex-col items-center shrink-0">
                <span className="text-[10px] font-bold text-stone-400">
                  {issuedTicket.durationMinutes} mins &bull; {issuedTicket.distanceKm} km
                </span>
                <div className="flex items-center gap-1 my-1">
                  <div className="w-2 h-2 rounded-full bg-rose-500" />
                  <div className="w-12 h-0.5 bg-gradient-to-r from-rose-500 via-orange-400 to-amber-500" />
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                </div>
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-white/10 text-stone-300">
                  {issuedTicket.transportMode === "BUS" ? "BEST BUS" : "LOCAL TRAIN"}
                </span>
              </div>

              <div className="flex-1 min-w-0 text-right">
                <p className="text-[10px] font-bold text-stone-400 uppercase">To</p>
                <p className="text-base font-black text-white truncate">{issuedTicket.destinationName}</p>
                <p className="text-xs font-bold text-amber-400 mt-0.5">{issuedTicket.arrivalTime}</p>
              </div>
            </div>

            {/* Detailed Info Grid */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
              <div>
                <span className="block text-stone-400 text-[10px]">Date of Travel:</span>
                <strong className="text-white text-xs">{issuedTicket.journeyDate}</strong>
              </div>

              <div>
                <span className="block text-stone-400 text-[10px]">Vehicle / Class:</span>
                <strong className="text-white text-xs truncate block">{issuedTicket.vehicleType}</strong>
              </div>

              <div>
                <span className="block text-stone-400 text-[10px]">Passenger:</span>
                <strong className="text-white text-xs truncate block">
                  {issuedTicket.passengerName} (x{issuedTicket.passengerCount})
                </strong>
              </div>

              <div>
                <span className="block text-stone-400 text-[10px]">Total Fare Paid:</span>
                <strong className="text-rose-400 text-sm font-black">₹{issuedTicket.totalFarePaidInr}.00</strong>
              </div>
            </div>

            {/* QR Code & AFC Turnstile Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3.5 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-20 h-20 bg-white p-1.5 rounded-xl flex items-center justify-center shrink-0 shadow-md">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-black fill-current">
                    <rect x="5" y="5" width="28" height="28" fill="black" />
                    <rect x="9" y="9" width="20" height="20" fill="white" />
                    <rect x="13" y="13" width="12" height="12" fill="black" />

                    <rect x="67" y="5" width="28" height="28" fill="black" />
                    <rect x="71" y="9" width="20" height="20" fill="white" />
                    <rect x="75" y="13" width="12" height="12" fill="black" />

                    <rect x="5" y="67" width="28" height="28" fill="black" />
                    <rect x="9" y="71" width="20" height="20" fill="white" />
                    <rect x="13" y="75" width="12" height="12" fill="black" />

                    <rect x="40" y="8" width="6" height="6" fill="black" />
                    <rect x="52" y="14" width="8" height="8" fill="black" />
                    <rect x="42" y="26" width="14" height="6" fill="black" />
                    <rect x="10" y="42" width="6" height="14" fill="black" />
                    <rect x="22" y="48" width="12" height="6" fill="black" />
                    <rect x="42" y="42" width="16" height="16" fill="black" />
                    <rect x="68" y="44" width="10" height="6" fill="black" />
                    <rect x="82" y="48" width="8" height="12" fill="black" />
                    <rect x="45" y="68" width="8" height="16" fill="black" />
                    <rect x="60" y="75" width="18" height="8" fill="black" />
                    <rect x="84" y="72" width="10" height="10" fill="black" />
                  </svg>
                </div>

                <div>
                  <p className="text-xs font-bold text-white">Contactless AFC Turnstile QR</p>
                  <p className="text-[10px] text-stone-400 mt-0.5 leading-relaxed">
                    Scan at station AFC automated gates or present to BEST bus conductor.
                  </p>
                  <p className="text-[10px] text-stone-500 font-mono mt-1">
                    UTR: {issuedTicket.utrRef} &bull; Txn: {issuedTicket.txnId}
                  </p>
                </div>
              </div>

              <div className="text-right sm:border-l sm:border-white/10 sm:pl-4 shrink-0">
                <span className="text-[9px] uppercase font-bold text-stone-400 block">Operator Authority</span>
                <span className="text-xs font-bold text-stone-200 block truncate max-w-[150px]">
                  {issuedTicket.operator}
                </span>
                <span className="text-[9px] text-emerald-400 font-semibold block mt-1">
                  ✓ Verified Digital Seal
                </span>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="text-[9px] text-stone-400 text-center uppercase tracking-wider">
              Brihanmumbai Transport &bull; Indian Railways Suburban &bull; Route Sense Digital Ticketing
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2 print:hidden">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4 text-rose-400" />
              <span>Print / Save Ticket PDF</span>
            </button>

            <button
              type="button"
              onClick={handleBookAnother}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Book Another Ticket</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
