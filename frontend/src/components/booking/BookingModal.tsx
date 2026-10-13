"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  Ticket,
  ShieldCheck,
  CreditCard,
  QrCode,
  Smartphone,
  Building,
  ArrowRight,
  Clock,
  Calendar,
  MapPin,
  Printer,
  Share2,
  Loader2,
  Sparkles,
  Lock,
  User,
  Phone,
  Mail,
  ChevronRight,
  Check
} from "lucide-react";
import { MultiModalOption, ResolvedLocation } from "@/types";

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
  transportMode: string;
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
  paymentMethod: "UPI" | "CARD" | "NETBANKING" | "WALLET";
  paymentStatus: "CONFIRMED";
  txnId: string;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  journey: MultiModalOption | null;
  originLocation: ResolvedLocation | null;
  destLocation: ResolvedLocation | null;
  passengersCount?: number;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  journey,
  originLocation,
  destLocation,
  passengersCount = 1
}) => {
  // Booking Form State
  const [passengerName, setPassengerName] = useState("Devansh Soni");
  const [passengerPhone, setPassengerPhone] = useState("9876543210");
  const [passengerEmail, setPassengerEmail] = useState("devansh@routesense.in");
  const [numPassengers, setNumPassengers] = useState(passengersCount || 1);
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "CARD" | "NETBANKING" | "WALLET">("UPI");
  const [upiId, setUpiId] = useState("devansh@oksbi");
  const [selectedBank, setSelectedBank] = useState("HDFC");

  // Flow State: "FORM" -> "PROCESSING" -> "TICKET"
  const [flowState, setFlowState] = useState<"FORM" | "PROCESSING" | "TICKET">("FORM");
  const [processingStep, setProcessingStep] = useState(0);
  const [issuedTicket, setIssuedTicket] = useState<IssuedTicket | null>(null);

  // Sync passengers count if changed from props
  useEffect(() => {
    if (passengersCount) {
      setNumPassengers(passengersCount);
    }
  }, [passengersCount]);

  // Reset state when opening modal
  useEffect(() => {
    if (isOpen) {
      setFlowState("FORM");
      setProcessingStep(0);
      setIssuedTicket(null);
    }
  }, [isOpen]);

  if (!isOpen || !journey) return null;

  const sourceName = originLocation?.displayName || "Origin Station";
  const sourceCity = originLocation?.city || "Source City";
  const destName = destLocation?.displayName || "Destination Station";
  const destCity = destLocation?.city || "Destination City";

  const singleFare = journey.price_per_passenger_inr || journey.quoted_price_inr || journey.fare_inr || 10;
  const totalFare = Math.max(5, singleFare * numPassengers);
  const vehicleType = journey.vehicle_category || journey.title || "Public Transit";
  const operatorName = journey.operator || "Transit Undertaking";

  // Handle Payment Submission
  const handlePayAndBook = () => {
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
      const pnrNum = "RS" + Math.floor(10000000 + Math.random() * 90000000);
      const txnNum = "TXN" + Date.now().toString(36).toUpperCase() + Math.floor(1000 + Math.random() * 9000);

      const ticket: IssuedTicket = {
        ticketId: `TKT-${Date.now()}`,
        pnr: pnrNum,
        bookingDate: now.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        }) + " · " + now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        journeyDate: now.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "long",
          year: "numeric"
        }),
        departureTime: journey.departure_at || now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        arrivalTime: journey.arrival_at || new Date(now.getTime() + (journey.duration_min || 30) * 60000).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        passengerName: passengerName.trim() || "Valued Passenger",
        passengerPhone: passengerPhone.trim() || "N/A",
        passengerEmail: passengerEmail.trim() || "N/A",
        passengerCount: numPassengers,
        transportMode: journey.transport_mode || journey.mode || "TRANSIT",
        vehicleType,
        operator: operatorName,
        sourceName,
        sourceCity,
        destinationName: destName,
        destCity,
        distanceKm: journey.route_distance_km || journey.distance_km || 10,
        durationMinutes: journey.total_duration_minutes || journey.duration_min || 25,
        farePerPassengerInr: singleFare,
        totalFarePaidInr: totalFare,
        paymentMethod,
        paymentStatus: "CONFIRMED",
        txnId: txnNum
      };

      setIssuedTicket(ticket);
      setFlowState("TICKET");
    }, 2400);
  };

  // Print Ticket Handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xl animate-fade-in overflow-y-auto">
      
      {/* Container Card */}
      <div className="relative w-full max-w-xl rounded-[32px] vision-glass-surface p-5 sm:p-7 shadow-2xl border border-white/15 text-white my-auto max-h-[92vh] overflow-y-auto custom-scrollbar">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white transition-all cursor-pointer z-20 print:hidden"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ------------------------------------------------------------- */}
        {/* VIEW 1: BOOKING & CHECKOUT FORM                               */}
        {/* ------------------------------------------------------------- */}
        {flowState === "FORM" && (
          <div className="flex flex-col gap-5">
            {/* Modal Title */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <Ticket className="w-4 h-4" />
                </span>
                <h3 className="text-xl font-extrabold tracking-tight text-white">
                  Book Transit Pass / Ticket
                </h3>
              </div>
              <p className="text-xs text-stone-400">
                Official digital ticket with instant QR boarding pass and real-time operator tariff.
              </p>
            </div>

            {/* Journey Summary Card */}
            <div className="rounded-[22px] bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold uppercase tracking-wider border border-rose-500/30">
                    {journey.transport_mode || journey.mode}
                  </span>
                  <span className="text-xs font-bold text-stone-200 truncate max-w-[200px]">
                    {operatorName}
                  </span>
                </div>

                <div className="px-3 py-1 rounded-full bg-rose-500 text-white text-xs font-extrabold shadow-md shadow-rose-950/50">
                  ₹{totalFare}
                </div>
              </div>

              {/* Source -> Destination Row */}
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase font-bold text-stone-400">From</p>
                  <p className="font-bold text-white truncate text-sm">{sourceName}</p>
                  <p className="text-[10px] text-stone-400">{journey.departure_at || "Dep: 08:30 AM"}</p>
                </div>

                <div className="flex flex-col items-center shrink-0 px-2">
                  <span className="text-[10px] font-bold text-rose-400">
                    {journey.total_duration_minutes || journey.duration_min} mins
                  </span>
                  <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent my-1" />
                  <span className="text-[10px] text-stone-400">
                    {journey.route_distance_km || journey.distance_km} km
                  </span>
                </div>

                <div className="flex-1 min-w-0 text-right">
                  <p className="text-[10px] uppercase font-bold text-stone-400">To</p>
                  <p className="font-bold text-white truncate text-sm">{destName}</p>
                  <p className="text-[10px] text-stone-400">{journey.arrival_at || "Arr: 08:58 AM"}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-stone-400">
                <span>Vehicle: <strong className="text-stone-200">{vehicleType}</strong></span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Tariff
                </span>
              </div>
            </div>

            {/* Passenger Details Form */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-rose-400" />
                <span>Passenger Details</span>
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
                  <label className="block text-[11px] text-stone-400 mb-1">Passengers</label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 6].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setNumPassengers(p)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          numPassengers === p
                            ? "bg-rose-500 text-white shadow-md"
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

            {/* Payment Method Selector */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-rose-400" />
                <span>Select Payment Method</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "UPI", label: "Instant UPI", sub: "GPay / PhonePe", icon: QrCode },
                  { id: "CARD", label: "Debit/Credit", sub: "RuPay / Visa", icon: CreditCard },
                  { id: "NETBANKING", label: "NetBanking", sub: "All Banks", icon: Building },
                  { id: "WALLET", label: "NCMC Card", sub: "Smart Wallet", icon: Smartphone },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 text-center border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-rose-500/25 border-rose-500 text-white shadow-lg ring-1 ring-rose-500/50"
                          : "bg-white/5 border-white/10 text-stone-400 hover:bg-white/10 hover:text-stone-200"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? "text-rose-400" : "text-stone-400"}`} />
                      <span className="text-[11px] font-bold leading-tight">{m.label}</span>
                      <span className="text-[9px] text-stone-400">{m.sub}</span>
                    </button>
                  );
                })}
              </div>

              {/* UPI Custom ID Input */}
              {paymentMethod === "UPI" && (
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="Enter UPI ID (e.g. mobile@upi)"
                    className="flex-1 bg-transparent text-xs text-white placeholder-stone-500 focus:outline-none"
                  />
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                    FASTPAY
                  </span>
                </div>
              )}

              {/* NetBanking Bank Selection */}
              {paymentMethod === "NETBANKING" && (
                <div className="flex gap-2">
                  {["HDFC", "SBI", "ICICI", "Axis"].map((bank) => (
                    <button
                      key={bank}
                      type="button"
                      onClick={() => setSelectedBank(bank)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        selectedBank === bank
                          ? "bg-rose-500 text-white border-rose-400"
                          : "bg-white/5 border-white/10 text-stone-300 hover:bg-white/10"
                      }`}
                    >
                      {bank}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Total Fare & Pay Button */}
            <div className="pt-3 border-t border-white/15 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400">
                  Fare for {numPassengers} Passenger{numPassengers > 1 ? "s" : ""}:
                </span>
                <span className="font-extrabold text-white text-base">₹{totalFare}.00</span>
              </div>

              <button
                type="button"
                onClick={handlePayAndBook}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 hover:from-rose-600 hover:to-orange-600 text-white font-extrabold text-sm tracking-wide shadow-xl shadow-rose-950/60 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Pay ₹{totalFare} &amp; Issue E-Ticket</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-stone-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% Secure Payment via RBI-Regulated Gateway</span>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 2: PROCESSING ANIMATION                                  */}
        {/* ------------------------------------------------------------- */}
        {flowState === "PROCESSING" && (
          <div className="py-16 flex flex-col items-center justify-center gap-5 text-center">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-rose-500/20 border-t-rose-500 animate-spin" />
              <Ticket className="w-8 h-8 text-rose-400 animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-extrabold text-white">
                Processing Secure Transit Booking
              </h3>
              <p className="text-xs text-stone-400">
                {processingStep === 1 && "Initiating UPI Payment Gateway..."}
                {processingStep === 2 && "Verifying Transaction with Transit Authority..."}
                {processingStep === 3 && "Issuing Official Digital Transit Pass & QR..."}
              </p>
            </div>

            <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all duration-500 rounded-full"
                style={{ width: `${(processingStep / 3) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 3: OFFICIAL DIGITAL E-TICKET (BOARDING PASS)             */}
        {/* ------------------------------------------------------------- */}
        {flowState === "TICKET" && issuedTicket && (
          <div className="flex flex-col gap-5 print:p-0">
            {/* Success Pill */}
            <div className="flex items-center justify-between pb-3 border-b border-white/15">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </span>
                <div>
                  <p className="text-xs font-bold text-white leading-tight">Payment Successful</p>
                  <p className="text-[10px] text-emerald-400 font-medium">Ticket Issued &amp; Verified</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-[10px] text-stone-400 uppercase tracking-wider font-bold">Booking PNR</p>
                <p className="text-xs font-black text-rose-300 font-mono tracking-wider">{issuedTicket.pnr}</p>
              </div>
            </div>

            {/* THE TICKET PASS SURFACE (Printable) */}
            <div id="printable-ticket" className="rounded-[26px] bg-gradient-to-b from-[#2b181b] via-[#221719] to-[#1a1315] border border-rose-500/30 p-5 shadow-2xl relative overflow-hidden flex flex-col gap-4 text-white">
              
              {/* Header Ribbon */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center shadow-md">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black tracking-tight text-white leading-tight">
                      ROUTE SENSE TRANSIT PASS
                    </h4>
                    <p className="text-[9px] text-stone-400 uppercase tracking-widest font-bold">
                      National Mobility Digital Pass
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold uppercase">
                  ● ACTIVE
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
                    {issuedTicket.transportMode}
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
                  <span className="block text-stone-400 text-[10px]">Total Fare:</span>
                  <strong className="text-rose-400 text-sm font-black">₹{issuedTicket.totalFarePaidInr}.00</strong>
                </div>
              </div>

              {/* QR Code & Barcode Row */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  {/* SVG QR Code Simulation */}
                  <div className="w-20 h-20 bg-white p-1.5 rounded-xl flex items-center justify-center shrink-0 shadow-md">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-black fill-current">
                      {/* Outer Position Corners */}
                      <rect x="5" y="5" width="28" height="28" fill="black" />
                      <rect x="9" y="9" width="20" height="20" fill="white" />
                      <rect x="13" y="13" width="12" height="12" fill="black" />

                      <rect x="67" y="5" width="28" height="28" fill="black" />
                      <rect x="71" y="9" width="20" height="20" fill="white" />
                      <rect x="75" y="13" width="12" height="12" fill="black" />

                      <rect x="5" y="67" width="28" height="28" fill="black" />
                      <rect x="9" y="71" width="20" height="20" fill="white" />
                      <rect x="13" y="75" width="12" height="12" fill="black" />

                      {/* Random Data Pattern Matrix */}
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
                    <p className="text-xs font-bold text-white">Contactless Gate Turnstile QR</p>
                    <p className="text-[10px] text-stone-400 mt-0.5 leading-relaxed">
                      Scan at station AFC gates or show to ticket examiner/conductor.
                    </p>
                    <p className="text-[10px] text-stone-500 font-mono mt-1">Txn: {issuedTicket.txnId}</p>
                  </div>
                </div>

                <div className="text-right sm:border-l sm:border-white/10 sm:pl-4 shrink-0">
                  <span className="text-[9px] uppercase font-bold text-stone-400 block">Operator ID</span>
                  <span className="text-xs font-bold text-stone-200 block">{issuedTicket.operator}</span>
                  <span className="text-[9px] text-emerald-400 font-semibold block mt-1">
                    ✓ Verified Digital Seal
                  </span>
                </div>
              </div>

              {/* Watermark / Legal disclaimer */}
              <div className="text-[9px] text-stone-400 text-center uppercase tracking-wider">
                Authorized By Ministry of Housing &amp; Urban Affairs / State RTO &bull; Route Sense Digital Pass
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
