"use client";

import React, { useState, useEffect } from "react";
import {
  Bus,
  Train,
  Car,
  Bike,
  Footprints,
  Search,
  ArrowRightLeft,
  Clock,
  ShieldCheck,
  Leaf,
  Users,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  MapPin,
  ChevronRight,
  TrendingUp,
  BarChart2,
  IndianRupee,
  Navigation
} from "lucide-react";
import { MultiModalOption, RouteStep } from "@/types";
import { fetchApi } from "@/lib/api";

const PRESET_ROUTES = [
  { origin: "Central Silk Board TTMC", destination: "Hebbal Bus Station" },
  { origin: "KBS Majestic Station", destination: "ITPL Whitefield Tech Park" },
  { origin: "Electronic City Phase 1", destination: "Indiranagar 100ft Road" },
  { origin: "Kempegowda Int'l Airport", destination: "MG Road Metro Station" },
];

const MOCK_ROUTE_OPTIONS: MultiModalOption[] = [
  {
    mode: "BUS",
    title: "BMTC Bus Express Line (Route 500-A)",
    duration_min: 48,
    estimated_delay_min: 14.2,
    fare_inr: 35,
    distance_km: 28.5,
    co2_emissions_g: 450,
    reliability_score_pct: 78.4,
    occupancy_level: "HIGH",
    next_departure: "In 6 mins (08:35 IST)",
    recommended: true,
    steps: [
      {
        step_number: 1,
        instruction: "Walk to Central Silk Board TTMC Bus Platform 3",
        mode: "WALK",
        detail: "200m • 3 mins walk",
        duration_min: 3,
        distance_km: 0.2
      },
      {
        step_number: 2,
        instruction: "Board BMTC Bus 500-A (Outer Ring Road Express)",
        mode: "BUS",
        detail: "Passes through HSR Layout, Bellandur, Marathahalli, KR Puram",
        duration_min: 42,
        distance_km: 27.8
      },
      {
        step_number: 3,
        instruction: "Alight at Hebbal Bus Stop & Walk to Destination",
        mode: "WALK",
        detail: "500m • 3 mins walk",
        duration_min: 3,
        distance_km: 0.5
      }
    ]
  },
  {
    mode: "TRAIN",
    title: "Namma Metro Line + Suburban Railway Shuttle",
    duration_min: 42,
    estimated_delay_min: 2.0,
    fare_inr: 45,
    distance_km: 31.0,
    co2_emissions_g: 220,
    reliability_score_pct: 94.5,
    occupancy_level: "MODERATE",
    next_departure: "In 4 mins (08:33 IST)",
    recommended: false,
    steps: [
      {
        step_number: 1,
        instruction: "Board Namma Metro Yellow Line at Silk Board Station",
        mode: "TRAIN",
        detail: "Towards RV Road Interchange Station",
        duration_min: 12,
        distance_km: 8.5
      },
      {
        step_number: 2,
        instruction: "Switch to Green Line Metro towards Nagasandra",
        mode: "TRAIN",
        detail: "Get off at Majestic Interchange Station",
        duration_min: 16,
        distance_km: 11.2
      },
      {
        step_number: 3,
        instruction: "Take Suburban Train Shuttle to Hebbal Railway Station",
        mode: "TRAIN",
        detail: "Direct Rail Corridor (94.5% On-Time Reliability)",
        duration_min: 14,
        distance_km: 11.3
      }
    ]
  },
  {
    mode: "CAB",
    title: "City Taxi / Cab Ride (Uber / Ola / Rapido)",
    duration_min: 52,
    estimated_delay_min: 18.0,
    fare_inr: 480,
    distance_km: 29.2,
    co2_emissions_g: 3800,
    reliability_score_pct: 82.0,
    occupancy_level: "LOW",
    next_departure: "Available Now (Pickup in 3 mins)",
    recommended: false,
    steps: [
      {
        step_number: 1,
        instruction: "Pickup at Silk Board Junction Flyover Taxi Bay",
        mode: "CAB",
        detail: "Driver arriving in AC Sedan",
        duration_min: 3,
        distance_km: 0.1
      },
      {
        step_number: 2,
        instruction: "Drive via Outer Ring Road & Bellandur EcoSpace Flyover",
        mode: "CAB",
        detail: "High peak hour traffic delay observed near Marathahalli bottleneck",
        duration_min: 46,
        distance_km: 28.6
      },
      {
        step_number: 3,
        instruction: "Drop-off at Hebbal Junction Destination Gate",
        mode: "CAB",
        detail: "Direct door-to-door arrival",
        duration_min: 3,
        distance_km: 0.5
      }
    ]
  },
  {
    mode: "BIKE",
    title: "Two-Wheeler / Bike Taxi (Rapido / Personal Bike)",
    duration_min: 36,
    estimated_delay_min: 5.0,
    fare_inr: 160,
    distance_km: 28.0,
    co2_emissions_g: 1100,
    reliability_score_pct: 88.0,
    occupancy_level: "LOW",
    next_departure: "Available Now (Pickup in 2 mins)",
    recommended: false,
    steps: [
      {
        step_number: 1,
        instruction: "Rider pickup at Silk Board Flyover Ramp",
        mode: "BIKE",
        detail: "Helmet provided by captain",
        duration_min: 2,
        distance_km: 0.1
      },
      {
        step_number: 2,
        instruction: "Navigate service lane traffic along Outer Ring Road",
        mode: "BIKE",
        detail: "Easily filters through Bellandur traffic congestion",
        duration_min: 32,
        distance_km: 27.4
      },
      {
        step_number: 3,
        instruction: "Arrival at Hebbal Destination Gate",
        mode: "BIKE",
        detail: "Fastest road option during peak morning hours",
        duration_min: 2,
        distance_km: 0.5
      }
    ]
  }
];

export default function RoutePlannerPage() {
  const [origin, setOrigin] = useState("Central Silk Board TTMC");
  const [destination, setDestination] = useState("Hebbal Bus Station");
  const [loading, setLoading] = useState(false);
  const [routeOptions, setRouteOptions] = useState<MultiModalOption[]>(MOCK_ROUTE_OPTIONS);
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
      console.warn("Using fallback multi-modal route planner data", err);
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

  const getModeIcon = (mode: string, className: string = "w-5 h-5") => {
    switch (mode) {
      case "BUS":
        return <Bus className={className} />;
      case "TRAIN":
        return <Train className={className} />;
      case "CAB":
        return <Car className={className} />;
      case "BIKE":
        return <Bike className={className} />;
      case "WALK":
        return <Footprints className={className} />;
      default:
        return <Navigation className={className} />;
    }
  };

  const getOccupancyColor = (level: string) => {
    switch (level) {
      case "LOW":
        return "bg-emerald-950 text-emerald-400 border-emerald-800";
      case "MODERATE":
        return "bg-amber-950 text-amber-400 border-amber-800";
      case "HIGH":
        return "bg-red-950 text-red-400 border-red-800";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-950 text-sky-400 border border-sky-800 rounded-lg">
              <Navigation className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-wide">Multi-Modal Route Planner</h1>
            <span className="bg-sky-950 text-sky-400 border border-sky-800 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
              GTFS-RT Telemetry Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Compare door-to-door public transport, rail, ride-hailing and two-wheeler options with real-time fare, delay, CO₂ footprint and reliability metrics.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>AI Multi-Modal Optimization Engine</span>
        </div>
      </div>

      {/* Origin & Destination Search Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Origin Input */}
            <div className="md:col-span-5 relative">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                Source (Origin)
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="Enter origin location..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-md pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-medium"
                />
              </div>
            </div>

            {/* Swap Button */}
            <div className="md:col-span-2 flex justify-center pt-4 md:pt-5">
              <button
                type="button"
                onClick={handleSwap}
                title="Swap Origin & Destination"
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-colors border border-slate-700 shadow-sm"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Destination Input */}
            <div className="md:col-span-5 relative">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                Destination
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-rose-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Enter destination location..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-md pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Quick Presets & Search Action */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-400 mr-1 font-medium">Quick Presets:</span>
              {PRESET_ROUTES.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setOrigin(p.origin);
                    setDestination(p.destination);
                  }}
                  className="text-[11px] bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded px-2.5 py-1 transition-colors"
                >
                  {p.origin.split(" ")[0]} → {p.destination.split(" ")[0]}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold px-5 py-2.5 rounded-md flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Computing Optimal Routes...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Find Available Vehicles & Routes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 4 Transport Vehicle Mode Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {routeOptions.map((opt) => {
          const isSelected = selectedMode === opt.mode;
          return (
            <div
              key={opt.mode}
              onClick={() => setSelectedMode(opt.mode)}
              className={`cursor-pointer rounded-lg p-4 border transition-all relative ${
                isSelected
                  ? "bg-slate-900 border-sky-500 shadow-lg shadow-sky-950/50 ring-1 ring-sky-500"
                  : "bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
              }`}
            >
              {/* Recommended Tag */}
              {opt.recommended && (
                <span className="absolute -top-2.5 right-3 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow tracking-wider uppercase flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Recommended
                </span>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2.5 rounded-lg border ${
                      opt.mode === "BUS"
                        ? "bg-sky-950 text-sky-400 border-sky-800"
                        : opt.mode === "TRAIN"
                        ? "bg-purple-950 text-purple-400 border-purple-800"
                        : opt.mode === "CAB"
                        ? "bg-amber-950 text-amber-400 border-amber-800"
                        : "bg-emerald-950 text-emerald-400 border-emerald-800"
                    }`}
                  >
                    {getModeIcon(opt.mode, "w-5 h-5")}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">{opt.mode}</h3>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{opt.title.split("(")[0]}</p>
                  </div>
                </div>
              </div>

              {/* Main Metrics Comparison */}
              <div className="mt-3 grid grid-cols-2 gap-2 pt-3 border-t border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block">Duration</span>
                  <span className="text-base font-bold text-white font-mono">{opt.duration_min} min</span>
                  <span className="text-[10px] text-amber-400 block font-mono">
                    +{opt.estimated_delay_min}m delay
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Fare</span>
                  <span className="text-base font-bold text-emerald-400 font-mono">₹{opt.fare_inr}</span>
                  <span className="text-[10px] text-slate-400 block font-mono">{opt.distance_km} km</span>
                </div>
              </div>

              {/* Footer Badges */}
              <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800/60">
                <span className="flex items-center gap-1 text-slate-300">
                  <Leaf className="w-3 h-3 text-emerald-400" />
                  {opt.co2_emissions_g}g CO₂
                </span>
                <span className="font-mono text-sky-400 font-semibold">{opt.reliability_score_pct}% OTP</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Vehicle Mode Deep-Dive Detail View */}
      {selectedOption && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 Cols): Itinerary & Metrics Breakdown */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mode Detail Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-3 rounded-lg border ${
                      selectedOption.mode === "BUS"
                        ? "bg-sky-950 text-sky-400 border-sky-800"
                        : selectedOption.mode === "TRAIN"
                        ? "bg-purple-950 text-purple-400 border-purple-800"
                        : selectedOption.mode === "CAB"
                        ? "bg-amber-950 text-amber-400 border-amber-800"
                        : "bg-emerald-950 text-emerald-400 border-emerald-800"
                    }`}
                  >
                    {getModeIcon(selectedOption.mode, "w-6 h-6")}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-white">{selectedOption.title}</h2>
                      {selectedOption.recommended && (
                        <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded">
                          BEST OVERALL
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Departure Schedule: <span className="text-sky-400 font-mono font-medium">{selectedOption.next_departure}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded border ${getOccupancyColor(selectedOption.occupancy_level)}`}>
                    Occupancy: {selectedOption.occupancy_level}
                  </span>
                </div>
              </div>

              {/* Detailed Key Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                    <span>Travel Time</span>
                  </div>
                  <p className="text-lg font-bold text-white font-mono">{selectedOption.duration_min} min</p>
                  <p className="text-[10px] text-amber-400 mt-0.5 font-mono">+{selectedOption.estimated_delay_min} min traffic delay</p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                    <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Estimated Fare</span>
                  </div>
                  <p className="text-lg font-bold text-emerald-400 font-mono">₹{selectedOption.fare_inr}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Distance: {selectedOption.distance_km} km</p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                    <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                    <span>CO₂ Footprint</span>
                  </div>
                  <p className="text-lg font-bold text-white font-mono">{selectedOption.co2_emissions_g}g</p>
                  <p className="text-[10px] text-emerald-400 mt-0.5">
                    {selectedOption.mode === "CAB" ? "Higher emissions" : "Eco-friendly option"}
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                    <span>Reliability Score</span>
                  </div>
                  <p className="text-lg font-bold text-purple-400 font-mono">{selectedOption.reliability_score_pct}%</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">GTFS telemetry confidence</p>
                </div>
              </div>

              {/* Step-by-Step Itinerary Timeline */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-sky-400" />
                  Turn-by-Turn Route Itinerary
                </h3>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
                  {selectedOption.steps.map((step, idx) => (
                    <div key={idx} className="relative flex items-start justify-between gap-4">
                      {/* Node Circle */}
                      <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-slate-950 border-2 border-sky-500 flex items-center justify-center text-[10px] font-bold text-white font-mono shadow">
                        {step.step_number}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{step.instruction}</span>
                          <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                            {step.mode}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{step.detail}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono font-bold text-sky-400 block">{step.duration_min} mins</span>
                        <span className="text-[10px] font-mono text-slate-400 block">{step.distance_km} km</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (1 Col): Corridor Visual Map Preview & Analytical Summary */}
          <div className="space-y-6">
            {/* Visual Corridor Preview */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-sky-400" />
                  Corridor Preview & Live Status
                </h3>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-mono font-semibold">
                  LIVE TELEMETRY
                </span>
              </div>

              {/* Graphic Map Simulation Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 relative overflow-hidden h-52 flex flex-col justify-between">
                {/* Background Map Grid Graphic */}
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

                <div className="relative z-10 flex items-center justify-between text-xs font-medium text-slate-300">
                  <div className="bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded text-[11px]">
                    <span className="text-slate-400 block text-[9px]">ORIGIN NODE</span>
                    <span className="font-bold text-emerald-400">{origin}</span>
                  </div>
                  <div className="h-0.5 bg-gradient-to-r from-emerald-500 via-sky-500 to-rose-500 flex-1 mx-3 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-sky-400 rounded-full animate-ping" />
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded text-[11px] text-right">
                    <span className="text-slate-400 block text-[9px]">DESTINATION NODE</span>
                    <span className="font-bold text-rose-400">{destination}</span>
                  </div>
                </div>

                <div className="relative z-10 bg-slate-900/90 border border-slate-800 rounded-md p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Selected Vehicle:</span>
                    <span className="font-bold text-white font-mono">{selectedOption.mode} • {selectedOption.title.split("(")[0]}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Corridor Traffic Congestion:</span>
                    <span className="font-semibold text-amber-400">Moderate Bottleneck (Outer Ring Rd)</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Avg Corridor Speed:</span>
                    <span className="font-mono text-sky-400 font-bold">34.2 km/h</span>
                  </div>
                </div>

                <div className="relative z-10 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>GPS Telemetry Updated 12s ago</span>
                  <span className="text-emerald-400 font-mono font-semibold">99.8% Signal Quality</span>
                </div>
              </div>
            </div>

            {/* Mode Comparison Analytics Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-purple-400" />
                  Multi-Modal Tradeoff Matrix
                </h3>
              </div>

              <div className="space-y-3">
                {routeOptions.map((opt) => (
                  <div key={opt.mode} className="bg-slate-950 border border-slate-800 rounded-md p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        {getModeIcon(opt.mode, "w-3.5 h-3.5")}
                        {opt.mode}
                      </span>
                      <span className="font-mono font-bold text-sky-400">{opt.duration_min} min</span>
                    </div>

                    {/* Comparative Progress Bar */}
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          opt.mode === "BUS"
                            ? "bg-sky-500"
                            : opt.mode === "TRAIN"
                            ? "bg-purple-500"
                            : opt.mode === "CAB"
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(100, (opt.duration_min / 60) * 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                      <span>Fare: <strong className="text-emerald-400 font-mono">₹{opt.fare_inr}</strong></span>
                      <span>CO₂: <strong className="text-slate-300 font-mono">{opt.co2_emissions_g}g</strong></span>
                      <span>OTP: <strong className="text-purple-400 font-mono">{opt.reliability_score_pct}%</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
