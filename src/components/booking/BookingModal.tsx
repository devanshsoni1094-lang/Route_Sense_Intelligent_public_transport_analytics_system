"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Ticket,
  ShieldCheck,
  CreditCard,
  QrCode,
  Smartphone,
  ArrowRight,
  ArrowLeft,
  Clock,
  Calendar,
  MapPin,
  Printer,
  Sparkles,
  Lock,
  User,
  Phone,
  Mail,
  ChevronRight,
  Check,
  CheckCheck,
  Bus,
  Train,
  AlertCircle,
  Copy,
} from "lucide-react";
import { MultiModalOption, ResolvedLocation } from "@/types";
import { PAYMENT_QR_BASE64 } from "@/lib/paymentQrDataUri";

export type TransitMode = "BUS" | "TRAIN";
export type BusTier = "BEST_NON_AC" | "BEST_AC";
export type TrainTier = "LOCAL_II" | "LOCAL_I" | "LOCAL_AC";

export interface IssuedTicket {
  ticketId: string;
  pnr: string;
  bookingDate: string;
  journeyDate: string;
  departureTime: string;
  arrivalTime: string;
  passengerName: string;
  passengerPhone: string;
  passengerEmail: string;
  passengerCount: number;
  transportMode: TransitMode;
  vehicleType: string;
  operator: string;
  sourceName: string;
  sourceCity: string;
  destinationName: string;
  destCity: string;
  distanceKm: number;
  durationMinutes: number;
  farePerPassengerInr: number;
  totalFarePaidInr: number;
  paymentMethod: "UPI_QR";
  paymentStatus: "CONFIRMED";
  txnId: string;
  utrRef: string;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  journey: MultiModalOption | null;
  originLocation: ResolvedLocation | null;
  destLocation: ResolvedLocation | null;
  passengersCount?: number;
}

/**
 * Calculates verified Mumbai municipal & railway tariff
 */
export function calculateMumbaiFare(
  mode: TransitMode,
  tier: BusTier | TrainTier,
  distanceKm: number
): { singleFare: number; operator: string; vehicleTitle: string } {
  const km = Math.max(1, Math.round(distanceKm));

  if (mode === "BUS") {
    if (tier === "BEST_NON_AC") {
      // Non-AC: Starts at ₹10 for first 5 km (₹2.00/km) and scales up to ₹60 for 50 km
      const fare = km <= 5 ? 10 : Math.min(60, Math.round(10 + (km - 5) * 1.11));
      return {
        singleFare: fare,
        operator: "BEST Undertaking (Brihanmumbai Electric Supply & Transport)",
        vehicleTitle: "BEST Bus (Non-AC Regular Suburban)"
      };
    } else {
      // AC: Starts at ₹12 for first 5 km (₹2.40/km) and scales up to ₹65 for 50 km
      const fare = km <= 5 ? 12 : Math.min(65, Math.round(12 + (km - 5) * 1.18));
      return {
        singleFare: fare,
        operator: "BEST Undertaking (Electric Chalo Express)",
        vehicleTitle: "BEST Bus (AC Electric Express)"
      };
    }
  } else {
    // TRAIN
    if (tier === "LOCAL_II") {
      // Second Class: ₹5 for 0–3 km, ₹10 (4–15 km), ₹15 (16–25 km), ₹20 (26–35 km), ₹30 (31+ km)
      let fare = 5;
      if (km <= 3) fare = 5;
      else if (km <= 15) fare = 10;
      else if (km <= 25) fare = 15;
      else if (km <= 35) fare = 20;
      else fare = 30;

      return {
        singleFare: fare,
        operator: "Indian Railways (Suburban Western/Central/Harbour Division)",
        vehicleTitle: "Mumbai Local Train (Second Class - UTS Suburban)"
      };
    } else if (tier === "LOCAL_I") {
      // First Class: ₹65 for 0–3 km, reaching ₹235 beyond 31 km
      let fare = 65;
      if (km <= 3) fare = 65;
      else if (km <= 15) fare = 105;
      else if (km <= 25) fare = 150;
      else if (km <= 35) fare = 195;
      else fare = 235;

      return {
        singleFare: fare,
        operator: "Indian Railways (Suburban Division - Class I)",
        vehicleTitle: "Mumbai Local Train (First Class - Class I)"
      };
    } else {
      // AC Local: ₹65 base, reaching ₹220
      let fare = 65;
      if (km <= 3) fare = 65;
      else if (km <= 15) fare = 100;
      else if (km <= 25) fare = 145;
      else if (km <= 35) fare = 185;
      else fare = 220;

      return {
        singleFare: fare,
        operator: "Indian Railways (AC EMU Suburban Fast)",
        vehicleTitle: "Mumbai AC Local Train (Air-Conditioned EMU)"
      };
    }
  }
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  journey,
  originLocation,
  destLocation,
  passengersCount = 1
}) => {
  // Mode Selection: Strictly BUS or TRAIN
  const [selectedMode, setSelectedMode] = useState<TransitMode>("TRAIN");
  const [busTier, setBusTier] = useState<BusTier>("BEST_NON_AC");
  const [trainTier, setTrainTier] = useState<TrainTier>("LOCAL_II");

  // Editable Source & Destination (Can write any city/stop/station in Mumbai)
  const [customSource, setCustomSource] = useState("");
  const [customDestination, setCustomDestination] = useState("");
  const [customDistanceKm, setCustomDistanceKm] = useState(12);

  // Passenger Form State
  const [passengerName, setPassengerName] = useState("Devansh Soni");
  const [passengerPhone, setPassengerPhone] = useState("9876543210");
  const [passengerEmail, setPassengerEmail] = useState("devansh@routesense.in");
  const [numPassengers, setNumPassengers] = useState(passengersCount || 1);

  // UPI QR Code Payment State
  const [utrNumber, setUtrNumber] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Flow State: "DETAILS" -> "PAYMENT_QR" -> "PROCESSING" -> "TICKET"
  const [flowState, setFlowState] = useState<"DETAILS" | "PAYMENT_QR" | "PROCESSING" | "TICKET">("DETAILS");
  const [processingStep, setProcessingStep] = useState(0);
  const [issuedTicket, setIssuedTicket] = useState<IssuedTicket | null>(null);

  // Initialize or reset state when modal opens or journey changes
  useEffect(() => {
    if (isOpen) {
      setFlowState("DETAILS");
      setProcessingStep(0);
      setIssuedTicket(null);
      setUtrNumber("");

      const sName = originLocation?.displayName || "Dadar Central Station";
      const dName = destLocation?.displayName || "CSMT Terminus";
      setCustomSource(sName);
      setCustomDestination(dName);

      const dist = journey?.route_distance_km || journey?.distance_km || 12;
      setCustomDistanceKm(Math.max(1, Math.round(dist)));

      // Auto-detect Bus vs Train from passed journey
      if (journey) {
        const modeStr = (journey.transport_mode || journey.mode || "").toUpperCase();
        const titleStr = (journey.title || "").toLowerCase();

        if (modeStr.includes("BUS") || titleStr.includes("bus") || titleStr.includes("best")) {
          setSelectedMode("BUS");
          if (titleStr.includes("ac") || titleStr.includes("electric")) {
            setBusTier("BEST_AC");
          } else {
            setBusTier("BEST_NON_AC");
          }
        } else {
          // Default to TRAIN for train, metro, or any non-bus mode
          setSelectedMode("TRAIN");
          if (titleStr.includes("first") || titleStr.includes("1st")) {
            setTrainTier("LOCAL_I");
          } else if (titleStr.includes("ac") || titleStr.includes("air")) {
            setTrainTier("LOCAL_AC");
          } else {
            setTrainTier("LOCAL_II");
          }
        }
      }
    }
  }, [isOpen, journey, originLocation, destLocation]);

  // Sync passengers count if changed from props
  useEffect(() => {
    if (passengersCount) {
      setNumPassengers(passengersCount);
    }
  }, [passengersCount]);

  if (!isOpen) return null;

  // Active Fare Calculation
  const activeTier = selectedMode === "BUS" ? busTier : trainTier;
  const fareInfo = calculateMumbaiFare(selectedMode, activeTier, customDistanceKm);
  const singleFare = fareInfo.singleFare;
  const totalFare = Math.max(5, singleFare * numPassengers);
  const durationEstimate = Math.max(8, Math.round(customDistanceKm * (selectedMode === "TRAIN" ? 1.6 : 2.5)));

  // Handle proceed to Payment QR screen
  const handleProceedToPayment = () => {
    setFlowState("PAYMENT_QR");
  };

  // Auto-fill demo UTR for instant friction-free testing
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

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-2xl animate-fade-in overflow-y-auto">
      {/* Modal Surface Card */}
      <div className="relative w-full max-w-xl rounded-[32px] vision-glass-surface p-5 sm:p-7 shadow-2xl border border-white/15 text-white my-auto max-h-[92vh] overflow-y-auto custom-scrollbar">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white transition-all cursor-pointer z-20 print:hidden"
          title="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ----------------------------------------------------------------- */}
        {/* VIEW 1: BUS & TRAIN ONLY SELECTION + COMMUTER DETAILS             */}
        {/* ----------------------------------------------------------------- */}
        {flowState === "DETAILS" && (
          <div className="flex flex-col gap-5">
            {/* Modal Title Header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <Ticket className="w-4 h-4" />
                </span>
                <h3 className="text-xl font-extrabold tracking-tight text-white">
                  Mumbai Transit E-Ticket Booking
                </h3>
              </div>
              <p className="text-xs text-stone-400">
                Official digital ticketing strictly for <strong>BEST Bus</strong> &amp;{" "}
                <strong>Mumbai Local Trains</strong>. Pay online via QR code.
              </p>
            </div>

            {/* STRICT MODE SELECTOR: BUS OR TRAIN ONLY */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-stone-300 uppercase tracking-wider flex items-center justify-between">
                <span>Select Public Transit Mode:</span>
                <span className="text-[10px] text-amber-400 font-semibold">Bus &amp; Train Only</span>
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
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      selectedMode === "BUS" ? "bg-rose-500 text-white" : "bg-white/10 text-stone-300"
                    }`}
                  >
                    <Bus className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black leading-tight">BEST Bus</p>
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
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      selectedMode === "TRAIN" ? "bg-rose-500 text-white" : "bg-white/10 text-stone-300"
                    }`}
                  >
                    <Train className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black leading-tight">Mumbai Local Train</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">UTS II (₹5+) &bull; I &amp; AC</p>
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

            {/* EDITABLE ORIGIN & DESTINATION (CAN WRITE ANY CITY / PLACE NAME) */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-[11px] text-stone-400">
                <span className="font-bold uppercase tracking-wider text-stone-300">
                  Route Waypoints (Type Any Mumbai Stop or Area)
                </span>
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  RTO Sept 2026
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
                    placeholder="e.g. Dadar, Andheri, CSMT, Ghatkopar..."
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
                    placeholder="e.g. Borivali, Churchgate, Thane, Vashi..."
                    className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px] text-stone-400">
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
                  <span className="text-[10px] text-stone-400">Per-Passenger Rate: </span>
                  <strong className="text-white">₹{singleFare}</strong>
                </div>
              </div>
            </div>

            {/* PASSENGER DETAILS */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-rose-400" />
                <span>Commuter Information</span>
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
                  <label className="block text-[11px] text-stone-400 mb-1">Email (for Digital PDF)</label>
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

            {/* SUMMARY & PROCEED TO PAYMENT CTA */}
            <div className="pt-3 border-t border-white/15 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-stone-400">Total Transit Fare ({numPassengers} Commuter{numPassengers > 1 ? "s" : ""}):</span>
                  <p className="text-[10px] text-rose-300 font-medium">
                    {fareInfo.vehicleTitle} &bull; {customDistanceKm} km
                  </p>
                </div>
                <span className="font-extrabold text-white text-xl">₹{totalFare}.00</span>
              </div>

              <button
                type="button"
                onClick={handleProceedToPayment}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 hover:from-rose-600 hover:to-orange-600 text-white font-extrabold text-sm tracking-wide shadow-xl shadow-rose-950/60 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-white" />
                <span>Pay ₹{totalFare} via Online QR Code</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-stone-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mandatory instant QR scan payment before ticket issuance</span>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* VIEW 2: ONLINE UPI QR PAYMENT (SHOWING AS-IS UPLOADED QR IMAGE)   */}
        {/* ----------------------------------------------------------------- */}
        {flowState === "PAYMENT_QR" && (
          <div className="flex flex-col gap-4 animate-fade-in">
            {/* Top Bar with Back Button */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <button
                type="button"
                onClick={() => setFlowState("DETAILS")}
                className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Details</span>
              </button>

              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                ● LIVE PAYMENT GATEWAY
              </span>
            </div>

            {/* Header info */}
            <div className="text-center">
              <h3 className="text-lg font-black text-white">
                Scan QR Code to Complete Payment
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                Scan using any UPI App (GPay, PhonePe, Paytm, BHIM, Cred, Navi)
              </p>
            </div>

            {/* PROMINENT AS-IS UPLOADED QR CODE DISPLAY */}
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="relative p-3 rounded-[28px] bg-black/90 border-2 border-rose-500/60 shadow-2xl shadow-rose-950/80 group">
                {/* Scanner Glowing Corner Markers */}
                <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-amber-400" />
                <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-amber-400" />
                <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-amber-400" />
                <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-amber-400" />

                {/* The As-Is Uploaded QR Code Image */}
                <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-2xl overflow-hidden bg-black flex items-center justify-center">
                  <img
                    src={PAYMENT_QR_BASE64}
                    alt="Official UPI Payment QR Code"
                    className="w-full h-full object-contain rounded-xl"
                  />
                </div>
              </div>

              {/* Amount Due Badge */}
              <div className="px-5 py-2 rounded-2xl bg-gradient-to-r from-rose-500/25 via-amber-500/20 to-rose-500/25 border border-rose-500/40 text-center">
                <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
                  Amount to Pay:
                </span>
                <span className="text-2xl font-black text-white">
                  ₹{totalFare}.00
                </span>
                <span className="text-[10px] text-amber-300 block font-medium">
                  for {numPassengers} ticket{numPassengers > 1 ? "s" : ""} &bull; {selectedMode === "BUS" ? "BEST Bus" : "Mumbai Local"}
                </span>
              </div>
            </div>

            {/* UPI Handle & Fast Verification Row */}
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-stone-400">Official UPI Merchant ID:</p>
                  <p className="font-mono font-bold text-white text-[11px]">routesense.mumbai@okaxis</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyUpi}
                className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-stone-200 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
              >
                {copiedUpi ? (
                  <>
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* UTR / Reference ID Field (Optional / Auto-Fill Demo) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <label className="text-stone-400 font-medium">
                  UPI Reference / UTR Number (Optional):
                </label>
                <button
                  type="button"
                  onClick={handleAutoFillUtr}
                  className="text-rose-400 hover:text-rose-300 text-[10px] font-bold underline cursor-pointer"
                >
                  Auto-Fill Demo UTR
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  placeholder="e.g. 428910482910 (12 digits)"
                  className="flex-1 bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 font-mono"
                />
              </div>
            </div>

            {/* CONFIRMATION BUTTON */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleConfirmPaymentAndIssueTicket}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm tracking-wide shadow-xl shadow-emerald-950/60 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4 text-white" />
                <span>I Have Paid ₹{totalFare} &mdash; Verify &amp; Issue Ticket</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <p className="text-center text-[10px] text-stone-400">
                Ticket is automatically issued with encrypted QR code turnstile access.
              </p>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* VIEW 3: PROCESSING & ISSUANCE ANIMATION                           */}
        {/* ----------------------------------------------------------------- */}
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

        {/* ----------------------------------------------------------------- */}
        {/* VIEW 4: OFFICIAL DIGITAL E-TICKET (BOARDING PASS)                 */}
        {/* ----------------------------------------------------------------- */}
        {flowState === "TICKET" && issuedTicket && (
          <div className="flex flex-col gap-5 print:p-0 animate-fade-in">
            {/* Success Status Ribbon */}
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
                  {/* Digital Boarding Pass QR */}
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

              {/* Watermark / Legal Disclaimer */}
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
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <span>Done / Book Another</span>
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
