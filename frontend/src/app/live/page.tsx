"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Train, Bus, Search, Filter, ShieldCheck, MapPin, Clock, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";
import { ScheduledCorridorStop } from "@/components/maps/LiveMap";

const LiveMap = dynamic(() => import("@/components/maps/LiveMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[520px] bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center text-slate-400 text-xs">
      Loading Public Transit Corridor Map...
    </div>
  )
});

interface PublicTransitCorridor {
  route_id: string;
  route_name: string;
  operator: string;
  mode: "TRAIN" | "BUS" | "METRO";
  frequency_peak: string;
  operating_hours: string;
  total_stops: number;
  fare_range: string;
  origin: string;
  destination: string;
}

const MUMBAI_SCHEDULED_CORRIDORS: PublicTransitCorridor[] = [
  {
    route_id: "CR-FAST",
    route_name: "Central Railway Fast Suburban",
    operator: "Central Railway (CR)",
    mode: "TRAIN",
    frequency_peak: "Every 3–4 mins",
    operating_hours: "04:00 AM – 01:30 AM",
    total_stops: 18,
    fare_range: "₹5 – ₹30 (II) / ₹65 – ₹235 (I)",
    origin: "CSMT",
    destination: "Kalyan / Karjat / Kasara"
  },
  {
    route_id: "WR-EXPRESS",
    route_name: "Western Railway Slow & Fast Line",
    operator: "Western Railway (WR)",
    mode: "TRAIN",
    frequency_peak: "Every 2–3 mins",
    operating_hours: "03:45 AM – 01:45 AM",
    total_stops: 37,
    fare_range: "₹5 – ₹30 (II) / ₹65 – ₹235 (I)",
    origin: "Churchgate",
    destination: "Borivali / Virar / Dahanu Road"
  },
  {
    route_id: "METRO-L3",
    route_name: "Metro Line 3 (Aqua Underground Line)",
    operator: "Mumbai Metro Rail Corporation (MMRC)",
    mode: "METRO",
    frequency_peak: "Every 6 mins",
    operating_hours: "06:30 AM – 10:30 PM",
    total_stops: 27,
    fare_range: "₹10 – ₹50",
    origin: "Aarey JVLR",
    destination: "BKC / Cuffe Parade"
  },
  {
    route_id: "BEST-EXPRESS",
    route_name: "BEST Electric Air-Conditioned Express",
    operator: "BEST Undertaking",
    mode: "BUS",
    frequency_peak: "Every 8–10 mins",
    operating_hours: "05:00 AM – 11:30 PM",
    total_stops: 42,
    fare_range: "₹12 – ₹65 (AC Electric)",
    origin: "Colaba Depot",
    destination: "Borivali / Thane / Vashi"
  },
  {
    route_id: "HARBOUR-LINE",
    route_name: "Harbour Line Trans-Creek Corridor",
    operator: "Central Railway (Harbour)",
    mode: "TRAIN",
    frequency_peak: "Every 5 mins",
    operating_hours: "04:15 AM – 01:15 AM",
    total_stops: 24,
    fare_range: "₹5 – ₹30 (II)",
    origin: "CSMT / Vadala Road",
    destination: "Panvel / Goregaon"
  }
];

export default function LiveOperationsPage() {
  const [corridors] = useState<PublicTransitCorridor[]>(MUMBAI_SCHEDULED_CORRIDORS);
  const [search, setSearch] = useState("");
  const [selectedMode, setSelectedMode] = useState("ALL");
  const [selectedRouteId, setSelectedRouteId] = useState<string>("CR-FAST");

  const filtered = corridors.filter((c) => {
    const matchesSearch =
      c.route_name.toLowerCase().includes(search.toLowerCase()) ||
      c.operator.toLowerCase().includes(search.toLowerCase()) ||
      c.origin.toLowerCase().includes(search.toLowerCase()) ||
      c.destination.toLowerCase().includes(search.toLowerCase());
    const matchesMode = selectedMode === "ALL" || c.mode === selectedMode;
    return matchesSearch && matchesMode;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Train className="w-5 h-5 text-rose-400" />
            <h2 className="text-lg font-bold text-white tracking-wide">
              Mumbai Transit Corridors &amp; Schedules
            </h2>
            <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded">
              VERIFIED TARIFF TIMETABLES
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Official operational schedules, interchange junctions, and regulated fares across Mumbai Metropolitan Region (MMR).
            Live vehicle tracking has been retired in compliance with transit policy.
          </p>
        </div>

        <Link
          href="/#booking-section"
          className="flex items-center gap-1.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white px-4 py-2 rounded-full text-xs font-bold transition-all shadow-md shrink-0"
        >
          <span>Book Verified Pass</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Map & synchronized sidebar layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map View */}
        <div className="lg:col-span-2 space-y-4">
          <LiveMap />
        </div>

        {/* Synchronized Corridor Schedule List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 flex flex-col h-[520px] shadow-xl">
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search line, station, operator..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
            >
              <option value="ALL">All Modes (Train, Metro, Bus)</option>
              <option value="TRAIN">Suburban Local Train (CR / WR / Harbour)</option>
              <option value="METRO">Mumbai Metro Lines</option>
              <option value="BUS">BEST Electric Express</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {filtered.map((c) => (
              <div
                key={c.route_id}
                onClick={() => setSelectedRouteId(c.route_id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  selectedRouteId === c.route_id
                    ? "bg-rose-950/40 border-rose-500 shadow-md ring-1 ring-rose-500/50"
                    : "bg-slate-950 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">{c.route_name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-slate-800 text-stone-300 border-white/10 font-mono">
                    {c.mode}
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-slate-400">
                  <span>Operator: <strong className="text-slate-200">{c.operator}</strong></span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>{c.frequency_peak}</span>
                  </span>
                  <span className="text-emerald-400 font-semibold">{c.fare_range}</span>
                </div>
                <div className="mt-1 text-[10px] text-slate-500">
                  {c.origin} ➔ {c.destination} ({c.operating_hours})
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
