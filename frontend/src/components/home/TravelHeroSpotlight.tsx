"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Ticket,
  Compass,
  Star,
  MapPin,
  ArrowRight,
  Play,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Train,
  Bus
} from "lucide-react";
import { MultiModalOption } from "@/types";

interface TravelHeroSpotlightProps {
  recommendedOption: MultiModalOption | null;
  routeOptions?: MultiModalOption[];
  onGetPass: (option: MultiModalOption) => void;
}

const POSITIVE_TRAVEL_QUOTES = [
  {
    quote: "Safar khoobsurat hai manzil se bhi.",
    thought: "The true soul of Mumbai lives in the Sea Link breeze, the clatter of the local train tracks, and the golden dusk over Marine Drive.",
    tag: "SPIRIT OF AAMCHI MUMBAI",
    location: "Bandra-Worli Sea Link"
  },
  {
    quote: "Not all those who wander are lost.",
    thought: "Catch the fast local train from Churchgate, watch the Arabian coast shimmer at twilight, and feel the heartbeat of maximum city.",
    tag: "MUMBAI LOCAL VIBES",
    location: "Western Railway Fast Line"
  },
  {
    quote: "Travel is the only thing you buy that makes you richer.",
    thought: "Richest is the commuter who sips cutting chai at Dadar station, feels the cool wind at the window, and moves with millions in harmony.",
    tag: "PULSE OF THE CITY",
    location: "Dadar Central Junction"
  },
  {
    quote: "Wherever you go, go with all your heart.",
    thought: "Step aboard the red BEST electric bus or gliding Metro Line 3. In Mumbai, every commuter carries a universe of dreams.",
    tag: "HEART OF MUMBAI",
    location: "BEST Electric Corridor"
  },
  {
    quote: "A journey of a thousand miles begins with a single step.",
    thought: "From a ₹5 local train pass to an ocean bridge drive across Atal Setu, every journey across Mumbai takes you closer to your ambitions.",
    tag: "MAXIMUM DREAMS",
    location: "Coastal Road & Atal Setu"
  }
];

export const TravelHeroSpotlight: React.FC<TravelHeroSpotlightProps> = ({
  recommendedOption,
  routeOptions = [],
  onGetPass
}) => {
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [fadeAnim, setFadeAnim] = useState(true);

  // Cycle quote every 6 seconds
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setFadeAnim(false);
      setTimeout(() => {
        setCurrentQuoteIndex((prev) => (prev + 1) % POSITIVE_TRAVEL_QUOTES.length);
        setFadeAnim(true);
      }, 250);
    }, 6000);

    return () => clearInterval(timer);
  }, [isPaused]);

  const activeQuote = POSITIVE_TRAVEL_QUOTES[currentQuoteIndex];

  const handlePrev = () => {
    setFadeAnim(false);
    setTimeout(() => {
      setCurrentQuoteIndex((prev) => (prev === 0 ? POSITIVE_TRAVEL_QUOTES.length - 1 : prev - 1));
      setFadeAnim(true);
    }, 200);
  };

  const handleNext = () => {
    setFadeAnim(false);
    setTimeout(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % POSITIVE_TRAVEL_QUOTES.length);
      setFadeAnim(true);
    }, 200);
  };

  const activePass =
    recommendedOption ||
    (routeOptions && routeOptions[0]) || {
      journey_id: "RS-LOCAL-CRW",
      title: "Mumbai Local Train (UTS Suburban)",
      operator: "Central & Western Suburban Railway",
      transport_mode: "TRAIN",
      mode: "TRAIN",
      quoted_price_inr: 10,
      fare_inr: 10,
      route_distance_km: 12,
      total_duration_minutes: 20
    };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="lg:col-span-8 rounded-[36px] bg-slate-900/60 backdrop-blur-3xl border border-white/20 p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[380px] transition-all duration-700"
    >
      {/* Scenic Glow Overlays matching the clean Voyavera aesthetic */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-sky-500/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

      {/* TOP & HERO SECTION */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        
        {/* Left Column: Heading, Subtitle & Action Buttons */}
        <div className="flex-1 min-w-0 max-w-2xl xl:max-w-3xl">
          {/* Tag Pill: EXPLORE • DISCOVER • COMMUTE */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[11px] font-bold uppercase tracking-[0.22em] text-sky-200 mb-4 shadow-sm">
            <Compass className="w-3.5 h-3.5 text-sky-400" />
            <span>EXPLORE &bull; DISCOVER &bull; COMMUTE</span>
          </div>

          {/* Grand Voyavera Headline */}
          <h2 className="text-3xl sm:text-5xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight text-white leading-[1.08] drop-shadow-sm font-sans">
            The Metropolis <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-sky-100 to-sky-300">
              Awaits You
            </span>
          </h2>

          {/* Subtitle */}
          <p className="mt-3 text-xs sm:text-sm text-slate-200/90 font-normal leading-relaxed max-w-lg">
            Experience intelligent Mumbai transit with verified BEST bus &amp; suburban railway fares, traffic-aware schedules, and authenticated digital e-tickets.
          </p>

          {/* Action Buttons: Pure White Pill + Frosted Circular Action */}
          <div className="mt-6 flex flex-wrap items-center gap-4">
            {/* Primary Action: White Pill Button */}
            <a
              href="#journey-planner"
              className="px-6 py-3 rounded-full bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs tracking-wide shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>Explore Corridors</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>

            {/* Secondary Action: Frosted Play Circle Button */}
            <button
              type="button"
              onClick={() => onGetPass(activePass as any)}
              className="group flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-xl transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-white/20 group-hover:bg-sky-400/30 flex items-center justify-center text-white transition-all shadow-sm">
                <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
              </div>
              <div className="text-left pr-2">
                <p className="text-xs font-bold text-white leading-tight">Instant E-Pass</p>
                <p className="text-[10px] text-sky-300">
                  ₹{recommendedOption?.quoted_price_inr ?? recommendedOption?.fare_inr ?? 10} &bull; QR Pay
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Right Floating Preview Card (Matches the floating Switzerland card in Voyavera) */}
        <div className="hidden sm:flex flex-col rounded-3xl vision-card p-3.5 bg-slate-900/50 backdrop-blur-2xl border border-white/20 shadow-2xl w-64 xl:w-72 2xl:w-80 shrink-0 hover:scale-[1.02] transition-transform">
          {/* Card Image Banner */}
          <div className="w-full h-28 xl:h-32 rounded-2xl overflow-hidden relative bg-gradient-to-tr from-sky-900 via-indigo-900 to-emerald-800">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-85"
              style={{ backgroundImage: "url('/images/voyavera-bg.jpg')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />
            
            {/* Top Star Rating Pill */}
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-[10px] font-bold text-amber-300 flex items-center gap-1 shadow-sm">
              <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
              <span>4.9</span>
            </div>

            {/* Bottom Caption on Image */}
            <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-200">
                MMR Fast Corridor
              </span>
              <span className="text-[10px] font-mono text-emerald-300 font-bold bg-emerald-500/20 px-1.5 py-0.2 rounded">
                Live
              </span>
            </div>
          </div>

          {/* Card Body */}
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-white">Mumbai Coastal &amp; Rail</h4>
              <span className="text-xs font-black text-emerald-300">
                ₹{recommendedOption?.quoted_price_inr ?? 10}
              </span>
            </div>
            <p className="text-[10px] text-slate-300 line-clamp-2">
              Scenic Arabian Sea vistas &amp; high-speed suburban EMU express connectivity.
            </p>
            <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-white/10">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-sky-400" />
                <span>Mumbai, MH</span>
              </span>
              <span className="font-semibold text-slate-300">100% Verified</span>
            </div>
          </div>
        </div>

      </div>

      {/* ROTATING INSPIRATIONAL TRAVEL QUOTE CAROUSEL */}
      <div className="relative z-10 mt-6 pt-4 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div
          className={`flex items-start sm:items-center gap-2.5 transition-all duration-300 ${
            fadeAnim ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
          }`}
        >
          <span className="text-base shrink-0">🌊</span>
          <div>
            <p className="text-xs font-semibold text-white drop-shadow-sm">
              &ldquo;{activeQuote.quote}&rdquo;
            </p>
            <p className="text-[10px] text-slate-300/80 font-medium line-clamp-1">
              {activeQuote.location} &bull; {activeQuote.thought}
            </p>
          </div>
        </div>

        {/* Carousel Arrow Controls */}
        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
          <div className="hidden sm:flex items-center gap-1 mr-2">
            {POSITIVE_TRAVEL_QUOTES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentQuoteIndex(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  currentQuoteIndex === idx ? "bg-sky-400 w-4" : "bg-white/30 w-1.5 hover:bg-white/60"
                }`}
                title={`Quote ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md rounded-full p-0.5 border border-white/15">
            <button
              type="button"
              onClick={handlePrev}
              title="Previous Quote"
              className="p-1 rounded-full hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              title="Next Quote"
              className="p-1 rounded-full hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* FLOATING STATS PILL BAR (Voyavera bottom capsule bar) */}
      <div className="relative z-10 mt-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-extrabold text-white">100+</span>
          <span className="text-[11px] text-slate-300">Mumbai MMR Hubs</span>
        </div>

        <div className="h-3 w-[1px] bg-white/20 hidden sm:block" />

        <div className="flex items-center gap-2">
          <span className="font-extrabold text-white">15M+</span>
          <span className="text-[11px] text-slate-300">Daily Commuters</span>
        </div>

        <div className="h-3 w-[1px] bg-white/20 hidden sm:block" />

        <div className="flex items-center gap-2">
          <span className="font-extrabold text-sky-300">₹5</span>
          <span className="text-[11px] text-slate-300">Suburban Starting Fare</span>
        </div>

        <div className="h-3 w-[1px] bg-white/20 hidden sm:block" />

        <div className="flex items-center gap-1.5 text-emerald-300 font-semibold text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>100% Authenticated QR Passes</span>
        </div>
      </div>

      {/* Bottom Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 overflow-hidden">
        <div
          key={currentQuoteIndex}
          className="h-full bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-400"
          style={{
            animation: isPaused ? "none" : "quoteProgressBar 6s linear forwards"
          }}
        />
      </div>
    </div>
  );
};
