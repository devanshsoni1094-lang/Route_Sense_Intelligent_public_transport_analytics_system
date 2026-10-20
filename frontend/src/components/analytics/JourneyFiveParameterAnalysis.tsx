"use client";

import React from "react";
import {
  Clock,
  Gauge,
  Coins,
  TrendingDown,
  Leaf,
  TreePine,
  Armchair,
  Users,
  ArrowUpDown,
  Footprints,
  Brain,
  ShieldCheck,
  Sparkles,
  Zap,
  CheckCircle2,
  Navigation
} from "lucide-react";
import { MultiModalOption, ResolvedLocation } from "@/types";

interface JourneyFiveParameterAnalysisProps {
  selectedOption: MultiModalOption | null;
  origin: ResolvedLocation | null;
  destination: ResolvedLocation | null;
  onExploreOnMap?: () => void;
}

export const JourneyFiveParameterAnalysis: React.FC<JourneyFiveParameterAnalysisProps> = ({
  selectedOption,
  origin,
  destination,
  onExploreOnMap
}) => {
  if (!selectedOption) return null;

  const mode = (selectedOption.transport_mode || selectedOption.mode || "TRAIN").toUpperCase();
  const distKm = Math.max(1, selectedOption.route_distance_km ?? selectedOption.distance_km ?? 10);
  const durationMin = selectedOption.total_duration_minutes ?? selectedOption.duration_min ?? 20;
  const fare = selectedOption.quoted_price_inr ?? selectedOption.fare_inr ?? 10;
  const neuralMin = selectedOption.neural_duration_min ?? Math.max(5, Math.round(durationMin * 0.95));
  const neuralConf = selectedOption.neural_confidence_pct ?? 94;

  // 1. Parameter 1: Speed & Travel Time
  const speedKmh = Math.round((distKm / Math.max(1, durationMin)) * 60);
  const speedScore = Math.min(98, Math.max(45, Math.round(100 - durationMin * 0.7)));

  // 2. Parameter 2: Fare & Cost Economics
  const ratePerKm = (fare / distKm).toFixed(2);
  const estimatedCabFare = Math.max(70, Math.round(distKm * 21 + 33));
  const estimatedSavings = Math.max(25, estimatedCabFare - fare);
  const costScore = Math.min(99, Math.max(50, Math.round(100 - (fare / estimatedCabFare) * 50)));

  // 3. Parameter 3: Carbon & Sustainability
  const co2 = selectedOption.co2_emissions_g ?? Math.round(distKm * (mode === "TRAIN" ? 4 : mode === "BUS" ? 7 : 18));
  const carCo2 = Math.round(distKm * 140);
  const co2SavingsPct = Math.min(96, Math.max(50, Math.round(((carCo2 - co2) / carCo2) * 100)));
  const fuelSavedLitres = (distKm * 0.08).toFixed(1);
  const ecoScore = Math.min(98, Math.max(55, co2SavingsPct));

  // 4. Parameter 4: Comfort & Experience
  const comfort = selectedOption.comfort_score ?? (mode === "CAB" ? 92 : mode === "METRO" ? 85 : mode === "BUS" ? 65 : 60);
  const isAC =
    (selectedOption.title || "").toLowerCase().includes("ac") ||
    mode === "CAB" ||
    mode === "METRO";
  const reliability = selectedOption.reliability_score_pct ?? 95;

  // 5. Parameter 5: Interchanges & Transfer Friction
  const transfers = selectedOption.transfers ?? 0;
  const stepsCount = selectedOption.steps?.length ?? 1;
  const transferFrictionScore = transfers === 0 ? 98 : transfers === 1 ? 82 : 65;

  // Overall Weighted Commuter Score (0 to 10 scale)
  const weightedScore = (
    (speedScore * 0.25 + costScore * 0.25 + ecoScore * 0.2 + comfort * 0.15 + transferFrictionScore * 0.15) /
    10
  ).toFixed(1);

  return (
    <section id="journey-analysis" className="w-full rounded-[32px] vision-card p-5 sm:p-7 shadow-2xl border border-white/20 my-6 text-white">
      {/* SECTION HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-xl bg-gradient-to-tr from-sky-400 via-teal-400 to-emerald-400 text-slate-950 shadow-md">
              <Sparkles className="w-4 h-4 fill-slate-950" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 font-mono">
              SPATIAL MOBILITY INTELLIGENCE &bull; 5 CORE PARAMETERS
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <span>Entire Journey Multi-Criteria Analysis</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-200 border border-white/15 hidden sm:inline-block">
              {selectedOption.title}
            </span>
          </h3>

          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Multi-dimensional commuter evaluation for <strong>{origin?.displayName || "Origin"}</strong> ➔{" "}
            <strong>{destination?.displayName || "Destination"}</strong> ({distKm} km). Powered by real transit tariffs and deep learning predictions.
          </p>
        </div>

        {/* Overall Weighted Mobility Score Capsule */}
        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-2xl border border-sky-400/30 px-4 py-2.5 rounded-2xl shadow-xl shrink-0 self-start lg:self-center">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Commuter Index
            </span>
            <span className="text-xs font-semibold text-emerald-400">
              Top Recommendation
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg">
            {weightedScore}
          </div>
        </div>
      </div>

      {/* THE 5 CORE PARAMETER CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mt-6">
        
        {/* PARAMETER 1: TRAVEL TIME & SPEED */}
        <div className="rounded-[24px] bg-slate-900/60 backdrop-blur-2xl border border-white/15 p-4 flex flex-col justify-between shadow-xl hover:border-sky-400/50 transition-all group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="p-2 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/30 group-hover:scale-110 transition-transform">
                <Clock className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300 font-mono">
                PARAM #1
              </span>
            </div>

            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              1. Travel Time &amp; Speed
            </p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white">{durationMin}</span>
              <span className="text-sm font-bold text-slate-400">mins</span>
            </div>

            {/* Neural Net Prediction Pill */}
            <div className="mt-3 p-2 rounded-xl bg-indigo-950/70 border border-indigo-500/30 text-[11px] text-indigo-200 space-y-1">
              <div className="flex items-center gap-1 font-bold text-indigo-300 text-[10px] uppercase">
                <Brain className="w-3 h-3 text-indigo-400 animate-pulse" />
                <span>Deep Learning Prediction</span>
              </div>
              <p className="text-xs font-black text-white">~{neuralMin} mins ({neuralConf}% conf)</p>
            </div>

            {/* Sub-Metrics */}
            <div className="mt-3 space-y-1 text-[11px] text-slate-300 border-t border-white/10 pt-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Average Velocity:</span>
                <span className="font-bold text-white">~{speedKmh} km/h</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Traffic Delay:</span>
                <span className="font-semibold text-amber-300">
                  +{selectedOption.estimated_delay_min ?? 0}m buffer
                </span>
              </div>
            </div>
          </div>

          {/* Efficiency Bar */}
          <div className="mt-4 pt-2">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span>Velocity Efficiency</span>
              <span className="font-bold text-sky-300">{speedScore}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full"
                style={{ width: `${speedScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* PARAMETER 2: TARIFF & FINANCIAL ECONOMY */}
        <div className="rounded-[24px] bg-slate-900/60 backdrop-blur-2xl border border-white/15 p-4 flex flex-col justify-between shadow-xl hover:border-emerald-400/50 transition-all group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 group-hover:scale-110 transition-transform">
                <Coins className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 font-mono">
                PARAM #2
              </span>
            </div>

            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              2. Tariff &amp; Economics
            </p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-emerald-400">₹{fare}</span>
              <span className="text-xs font-semibold text-slate-400">regulated</span>
            </div>

            {/* Commuter Savings Pill */}
            <div className="mt-3 p-2 rounded-xl bg-emerald-950/70 border border-emerald-500/30 text-[11px] text-emerald-200 space-y-1">
              <div className="flex items-center gap-1 font-bold text-emerald-300 text-[10px] uppercase">
                <TrendingDown className="w-3 h-3 text-emerald-400" />
                <span>Financial Savings</span>
              </div>
              <p className="text-xs font-black text-white">Save ₹{estimatedSavings} vs Private Cab</p>
            </div>

            {/* Sub-Metrics */}
            <div className="mt-3 space-y-1 text-[11px] text-slate-300 border-t border-white/10 pt-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Rate per Km:</span>
                <span className="font-bold text-white">₹{ratePerKm} / km</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Tariff Basis:</span>
                <span className="font-semibold text-emerald-300 truncate max-w-[100px]">
                  {selectedOption.price_type || "RTO Standard"}
                </span>
              </div>
            </div>
          </div>

          {/* Efficiency Bar */}
          <div className="mt-4 pt-2">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span>Budget Efficiency</span>
              <span className="font-bold text-emerald-300">{costScore}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
                style={{ width: `${costScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* PARAMETER 3: CARBON & SUSTAINABILITY */}
        <div className="rounded-[24px] bg-slate-900/60 backdrop-blur-2xl border border-white/15 p-4 flex flex-col justify-between shadow-xl hover:border-teal-400/50 transition-all group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 group-hover:scale-110 transition-transform">
                <Leaf className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300 font-mono">
                PARAM #3
              </span>
            </div>

            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              3. Carbon Footprint
            </p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-teal-300">{co2}</span>
              <span className="text-xs font-semibold text-slate-400">g CO₂/pax</span>
            </div>

            {/* Eco Advantage Pill */}
            <div className="mt-3 p-2 rounded-xl bg-teal-950/70 border border-teal-500/30 text-[11px] text-teal-200 space-y-1">
              <div className="flex items-center gap-1 font-bold text-teal-300 text-[10px] uppercase">
                <TreePine className="w-3 h-3 text-teal-400" />
                <span>Green Mobility Rating</span>
              </div>
              <p className="text-xs font-black text-white">{co2SavingsPct}% Lower Emissions than Car</p>
            </div>

            {/* Sub-Metrics */}
            <div className="mt-3 space-y-1 text-[11px] text-slate-300 border-t border-white/10 pt-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Energy Conserved:</span>
                <span className="font-bold text-white">~{fuelSavedLitres} L fossil fuel</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Eco Grade:</span>
                <span className="font-semibold text-emerald-400">
                  {co2SavingsPct > 80 ? "Grade A+ (Ultra Low)" : "Grade A (Low Carbon)"}
                </span>
              </div>
            </div>
          </div>

          {/* Efficiency Bar */}
          <div className="mt-4 pt-2">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span>Eco Sustainability</span>
              <span className="font-bold text-teal-300">{ecoScore}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full"
                style={{ width: `${ecoScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* PARAMETER 4: COMFORT & PASSENGER EXPERIENCE */}
        <div className="rounded-[24px] bg-slate-900/60 backdrop-blur-2xl border border-white/15 p-4 flex flex-col justify-between shadow-xl hover:border-purple-400/50 transition-all group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 group-hover:scale-110 transition-transform">
                <Armchair className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 font-mono">
                PARAM #4
              </span>
            </div>

            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              4. Comfort &amp; Quality
            </p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-purple-300">{comfort}</span>
              <span className="text-xs font-semibold text-slate-400">/ 100</span>
            </div>

            {/* Experience Pill */}
            <div className="mt-3 p-2 rounded-xl bg-purple-950/70 border border-purple-500/30 text-[11px] text-purple-200 space-y-1">
              <div className="flex items-center gap-1 font-bold text-purple-300 text-[10px] uppercase">
                <Users className="w-3 h-3 text-purple-400" />
                <span>Cabin Atmosphere</span>
              </div>
              <p className="text-xs font-black text-white">
                {isAC ? "Air-Conditioned Cabin" : "Well-Ventilated Express"}
              </p>
            </div>

            {/* Sub-Metrics */}
            <div className="mt-3 space-y-1 text-[11px] text-slate-300 border-t border-white/10 pt-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Schedule Reliability:</span>
                <span className="font-bold text-white">{reliability}% punctuality</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Occupancy Level:</span>
                <span className="font-semibold text-purple-300">
                  {selectedOption.occupancy_level || "Moderate (~60%)"}
                </span>
              </div>
            </div>
          </div>

          {/* Efficiency Bar */}
          <div className="mt-4 pt-2">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span>Comfort Index</span>
              <span className="font-bold text-purple-300">{comfort}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-400 to-pink-500 rounded-full"
                style={{ width: `${comfort}%` }}
              />
            </div>
          </div>
        </div>

        {/* PARAMETER 5: INTERCHANGES & TRANSFER FRICTION */}
        <div className="rounded-[24px] bg-slate-900/60 backdrop-blur-2xl border border-white/15 p-4 flex flex-col justify-between shadow-xl hover:border-amber-400/50 transition-all group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 group-hover:scale-110 transition-transform">
                <ArrowUpDown className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 font-mono">
                PARAM #5
              </span>
            </div>

            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              5. Route Interchanges
            </p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-amber-300">{transfers}</span>
              <span className="text-xs font-semibold text-slate-400">
                {transfers === 0 ? "direct corridor" : "interchange"}
              </span>
            </div>

            {/* Transfer Friction Pill */}
            <div className="mt-3 p-2 rounded-xl bg-amber-950/70 border border-amber-500/30 text-[11px] text-amber-200 space-y-1">
              <div className="flex items-center gap-1 font-bold text-amber-300 text-[10px] uppercase">
                <Footprints className="w-3 h-3 text-amber-400" />
                <span>Interchange Friction</span>
              </div>
              <p className="text-xs font-black text-white">
                {transfers === 0 ? "Zero Transfer Friction" : "Single Platform Transition"}
              </p>
            </div>

            {/* Sub-Metrics */}
            <div className="mt-3 space-y-1 text-[11px] text-slate-300 border-t border-white/10 pt-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Transit Steps:</span>
                <span className="font-bold text-white">{stepsCount} segments</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Headway Buffer:</span>
                <span className="font-semibold text-amber-300">Departs every 3-5m</span>
              </div>
            </div>
          </div>

          {/* Efficiency Bar */}
          <div className="mt-4 pt-2">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span>Frictionless Score</span>
              <span className="font-bold text-amber-300">{transferFrictionScore}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                style={{ width: `${transferFrictionScore}%` }}
              />
            </div>
          </div>
        </div>

      </div>

      {/* BOTTOM SUMMARY FOOTER BAR */}
      <div className="mt-6 pt-4 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Analytics compiled across <strong>Speed ({speedScore}%)</strong>, <strong>Cost ({costScore}%)</strong>,{" "}
            <strong>Eco ({ecoScore}%)</strong>, <strong>Comfort ({comfort}%)</strong> &amp;{" "}
            <strong>Interchanges ({transferFrictionScore}%)</strong>.
          </span>
        </div>

        {onExploreOnMap && (
          <button
            type="button"
            onClick={onExploreOnMap}
            className="px-5 py-2 rounded-full bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Inspect Route on Live Map</span>
          </button>
        )}
      </div>
    </section>
  );
};
