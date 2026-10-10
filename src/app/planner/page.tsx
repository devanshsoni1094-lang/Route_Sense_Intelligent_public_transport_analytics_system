"use client";

import React, { useState } from "react";
import {
  Bus,
  Train,
  Car,
  Bike,
  Footprints,
  Search,
  ArrowRightLeft,
  Clock,
  IndianRupee,
  MapPin,
  CheckCircle2,
  Zap,
  Leaf,
  Sparkles,
  Navigation,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { MultiModalOption } from "@/types";
import { fetchApi } from "@/lib/api";

const POPULAR_ROUTES = [
  { origin: "Central Silk Board", destination: "Hebbal Bus Station" },
  { origin: "Majestic Railway Station", destination: "ITPL Whitefield" },
  { origin: "Electronic City", destination: "Indiranagar 100ft Road" },
  { origin: "Kempegowda Airport", destination: "MG Road Metro" },
];

const DEFAULT_OPTIONS: MultiModalOption[] = [
  {
    mode: "BUS",
    title: "BMTC Express Bus (Route 500-A)",
    duration_min: 48,
    estimated_delay_min: 14,
    fare_inr: 35,
    distance_km: 28.5,
    co2_emissions_g: 450,
    reliability_score_pct: 85,
    occupancy_level: "MODERATE",
    next_departure: "Leaves in 6 mins",
    recommended: true,
    steps: [
      { step_number: 1, instruction: "Walk to Central Silk Board Bus Stand", mode: "WALK", detail: "2 mins walk (200m)", duration_min: 2, distance_km: 0.2 },
      { step_number: 2, instruction: "Board Bus 500-A towards Hebbal", mode: "BUS", detail: "Passes HSR, Bellandur, Marathahalli & KR Puram", duration_min: 44, distance_km: 27.8 },
      { step_number: 3, instruction: "Alight at Hebbal Bus Stop", mode: "WALK", detail: "2 mins walk to destination", duration_min: 2, distance_km: 0.5 }
    ]
  },
  {
    mode: "TRAIN",
    title: "Namma Metro + Train Shuttle",
    duration_min: 42,
    estimated_delay_min: 2,
    fare_inr: 45,
    distance_km: 31.0,
    co2_emissions_g: 220,
    reliability_score_pct: 95,
    occupancy_level: "MODERATE",
    next_departure: "Leaves in 4 mins",
    recommended: false,
    steps: [
      { step_number: 1, instruction: "Take Metro Yellow Line from Silk Board", mode: "TRAIN", detail: "12 mins to RV Road", duration_min: 12, distance_km: 8.5 },
      { step_number: 2, instruction: "Switch to Metro Green Line", mode: "TRAIN", detail: "16 mins to Majestic", duration_min: 16, distance_km: 11.2 },
      { step_number: 3, instruction: "Take Train Shuttle to Hebbal Railway Station", mode: "TRAIN", detail: "Direct rail corridor", duration_min: 14, distance_km: 11.3 }
    ]
  },
  {
    mode: "CAB",
    title: "Taxi / Taxi Cab (Uber / Ola)",
    duration_min: 52,
    estimated_delay_min: 18,
    fare_inr: 480,
    distance_km: 29.2,
    co2_emissions_g: 3800,
    reliability_score_pct: 80,
    occupancy_level: "LOW",
    next_departure: "Available Now (3 mins pickup)",
    recommended: false,
    steps: [
      { step_number: 1, instruction: "Cab pickup at Silk Board Junction", mode: "CAB", detail: "AC Sedan driver arriving", duration_min: 3, distance_km: 0.1 },
      { step_number: 2, instruction: "Drive via Outer Ring Road", mode: "CAB", detail: "Heavy morning traffic near Bellandur", duration_min: 46, distance_km: 28.6 },
      { step_number: 3, instruction: "Drop-off at Hebbal Destination", mode: "CAB", detail: "Direct door-to-door arrival", duration_min: 3, distance_km: 0.5 }
    ]
  },
  {
    mode: "BIKE",
    title: "Bike Taxi (Rapido / Personal Bike)",
    duration_min: 36,
    estimated_delay_min: 5,
    fare_inr: 160,
    distance_km: 28.0,
    co2_emissions_g: 1100,
    reliability_score_pct: 90,
    occupancy_level: "LOW",
    next_departure: "Available Now (2 mins pickup)",
    recommended: false,
    steps: [
      { step_number: 1, instruction: "Rider pickup at Silk Board Flyover", mode: "BIKE", detail: "Helmet provided", duration_min: 2, distance_km: 0.1 },
      { step_number: 2, instruction: "Ride via Outer Ring Road Service Lane", mode: "BIKE", detail: "Avoids main traffic jams easily", duration_min: 32, distance_km: 27.4 },
      { step_number: 3, instruction: "Drop-off at Hebbal Gate", mode: "BIKE", detail: "Fastest road option", duration_min: 2, distance_km: 0.5 }
    ]
  }
];

export default function RoutePlannerPage() {
  const [origin, setOrigin] = useState("Central Silk Board");
  const [destination, setDestination] = useState("Hebbal Bus Station");
  const [loading, setLoading] = useState(false);
  const [routeOptions, setRouteOptions] = useState<MultiModalOption[]>(DEFAULT_OPTIONS);
  const [selectedMode, setSelectedMode] = useState<"BUS" | "TRAIN" | "CAB" | "BIKE">("BUS");

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!origin.trim() || !destination.trim()) return;

    setLoading(true);
    try {
      const res = await fetchApi<{ route_options: MultiModalOption[] }>(
        `/planner/route?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`
      );
      if (res && res.route_options && res.route_options.length > 0) {
        setRouteOptions(res.route_options);
      }
    } catch (err) {
      console.warn("Using default route options", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const selectedOption = routeOptions.find((opt) => opt.mode === selectedMode) || routeOptions[0];

  const getVehicleIcon = (mode: string, sizeClass: string = "w-6 h-6") => {
    switch (mode) {
      case "BUS":
        return <Bus className={sizeClass} />;
      case "TRAIN":
        return <Train className={sizeClass} />;
      case "CAB":
        return <Car className={sizeClass} />;
      case "BIKE":
        return <Bike className={sizeClass} />;
      case "WALK":
        return <Footprints className={sizeClass} />;
      default:
        return <Navigation className={sizeClass} />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Big Simple Search Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Navigation className="w-4 h-4 text-sky-400" />
          Where do you want to go?
        </h2>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            
            {/* Origin Input */}
            <div className="sm:col-span-5 relative">
              <label className="block text-xs font-medium text-slate-400 mb-1">From (Start Point)</label>
              <div className="relative">
                <MapPin className="w-5 h-5 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="Enter starting location..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-xl pl-10 pr-3 py-3 text-sm text-white font-semibold placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Swap Button */}
            <div className="sm:col-span-2 flex justify-center pt-2 sm:pt-5">
              <button
                type="button"
                onClick={handleSwap}
                title="Swap locations"
                className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-all border border-slate-700 shadow"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Destination Input */}
            <div className="sm:col-span-5 relative">
              <label className="block text-xs font-medium text-slate-400 mb-1">To (Destination)</label>
              <div className="relative">
                <MapPin className="w-5 h-5 text-rose-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Enter destination..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-xl pl-10 pr-3 py-3 text-sm text-white font-semibold placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

          </div>

          {/* Popular Route Shortcuts */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-medium font-sans">Try popular routes:</span>
              {POPULAR_ROUTES.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setOrigin(p.origin);
                    setDestination(p.destination);
                  }}
                  className="text-xs bg-slate-950 hover:bg-slate-800 text-sky-300 border border-slate-800 rounded-lg px-3 py-1.5 transition-colors font-medium"
                >
                  {p.origin.split(" ")[0]} → {p.destination.split(" ")[0]}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-900/30 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>Searching...</span>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Find Best Routes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 4 Super Clear Vehicle Option Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Choose Your Transport Mode
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {routeOptions.map((opt) => {
            const isSelected = selectedMode === opt.mode;
            return (
              <div
                key={opt.mode}
                onClick={() => setSelectedMode(opt.mode)}
                className={`cursor-pointer rounded-2xl p-4 border transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? "bg-slate-900 border-sky-500 ring-2 ring-sky-500 shadow-xl shadow-sky-950/50"
                    : "bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                }`}
              >
                {/* Recommended Badge */}
                {opt.recommended && (
                  <span className="absolute -top-2.5 right-3 bg-emerald-500 text-slate-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow tracking-wider uppercase">
                    ⭐ Recommended
                  </span>
                )}

                <div className="flex items-center gap-3">
                  <div
                    className={`p-3 rounded-xl border ${
                      opt.mode === "BUS"
                        ? "bg-sky-950 text-sky-400 border-sky-800"
                        : opt.mode === "TRAIN"
                        ? "bg-purple-950 text-purple-400 border-purple-800"
                        : opt.mode === "CAB"
                        ? "bg-amber-950 text-amber-400 border-amber-800"
                        : "bg-emerald-950 text-emerald-400 border-emerald-800"
                    }`}
                  >
                    {getVehicleIcon(opt.mode, "w-6 h-6")}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{opt.mode}</h4>
                    <p className="text-xs text-slate-400">{opt.next_departure}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Travel Time</span>
                    <span className="text-lg font-extrabold text-white">{opt.duration_min} mins</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Ticket / Fare</span>
                    <span className="text-lg font-extrabold text-emerald-400">₹{opt.fare_inr}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/40">
                  <span>{opt.distance_km} km</span>
                  <span className="text-sky-400 font-semibold">{opt.reliability_score_pct}% On-Time</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Vehicle Step-by-Step Guide */}
      {selectedOption && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
          
          {/* Mode Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-3.5 rounded-xl border ${
                  selectedOption.mode === "BUS"
                    ? "bg-sky-950 text-sky-400 border-sky-800"
                    : selectedOption.mode === "TRAIN"
                    ? "bg-purple-950 text-purple-400 border-purple-800"
                    : selectedOption.mode === "CAB"
                    ? "bg-amber-950 text-amber-400 border-amber-800"
                    : "bg-emerald-950 text-emerald-400 border-emerald-800"
                }`}
              >
                {getVehicleIcon(selectedOption.mode, "w-7 h-7")}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{selectedOption.title}</h3>
                <p className="text-xs text-slate-400">
                  From <strong className="text-slate-200">{origin}</strong> to <strong className="text-slate-200">{destination}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase">Total Fare</span>
                <span className="text-base font-extrabold text-emerald-400">₹{selectedOption.fare_inr}</span>
              </div>
              <div className="h-6 w-px bg-slate-800 mx-1" />
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase">Total Time</span>
                <span className="text-base font-extrabold text-white">{selectedOption.duration_min} mins</span>
              </div>
            </div>
          </div>

          {/* Quick Trip Highlights Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Total Distance</span>
              <span className="font-bold text-white text-sm">{selectedOption.distance_km} km</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Traffic Status</span>
              <span className="font-bold text-amber-400 text-sm">+{selectedOption.estimated_delay_min} mins delay</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Carbon Footprint</span>
              <span className="font-bold text-emerald-400 text-sm">{selectedOption.co2_emissions_g}g CO₂</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Service Reliability</span>
              <span className="font-bold text-purple-400 text-sm">{selectedOption.reliability_score_pct}% On-Time</span>
            </div>
          </div>

          {/* Step-by-Step Instructions */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Step-by-Step Journey Guide
            </h4>

            <div className="space-y-3 pl-2">
              {selectedOption.steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 bg-slate-950 border border-slate-800 p-3.5 rounded-xl">
                  <div className="w-7 h-7 rounded-lg bg-sky-950 border border-sky-800 text-sky-400 flex items-center justify-center font-bold text-xs shrink-0">
                    {step.step_number}
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">{step.instruction}</span>
                      <span className="text-xs font-semibold text-sky-400">{step.duration_min} mins</span>
                    </div>
                    <p className="text-xs text-slate-400">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
