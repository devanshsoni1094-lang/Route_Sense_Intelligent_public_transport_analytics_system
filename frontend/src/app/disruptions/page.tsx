"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CloudRain,
  Train,
  Bus,
  Car,
  Compass,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  RefreshCw,
  Info,
  Waves,
  Zap,
  Navigation
} from "lucide-react";
import { DisruptionAlert, DisruptionService } from "@/lib/disruptions/disruptionService";

export default function DisruptionsPage() {
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");
  const [disruptions, setDisruptions] = useState<DisruptionAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch live disruptions from the verified API
    fetch(`/api/v1/disruptions?mode=${selectedFilter === "ALL" ? "" : selectedFilter}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.disruptions) {
          setDisruptions(data.disruptions);
        } else {
          setDisruptions(DisruptionService.getDisruptionsByMode(selectedFilter));
        }
      })
      .catch(() => {
        setDisruptions(DisruptionService.getDisruptionsByMode(selectedFilter));
      })
      .finally(() => setLoading(false));
  }, [selectedFilter]);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "SEVERE":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40";
      case "HIGH":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "MODERATE":
        return "bg-sky-500/20 text-sky-300 border-sky-500/40";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/40";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "RAILWAY_BLOCK":
        return <Train className="w-5 h-5 text-rose-400" />;
      case "MONSOON_FLOODING":
        return <Waves className="w-5 h-5 text-cyan-400" />;
      case "BUS_DIVERSION":
        return <Bus className="w-5 h-5 text-amber-400" />;
      case "TRAFFIC_CONGESTION":
        return <Car className="w-5 h-5 text-orange-400" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-white">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-rose-300 font-bold">
              MMR Real-Time Corridor Status
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <CloudRain className="w-7 h-7 text-sky-400" />
            <span>Disruption &amp; Monsoon Intelligence</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-2xl">
            Live railway mega-blocks, waterlogging track alerts, and BEST bus diversions across the Mumbai Metropolitan Region with verified commuter workarounds.
          </p>
        </div>

        <Link
          href="/"
          className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white flex items-center gap-2 self-start sm:self-auto transition-all cursor-pointer shadow-md"
        >
          <Compass className="w-4 h-4 text-sky-300" />
          <span>Back to Journey Planner</span>
        </Link>
      </div>

      {/* Monsoon High Tide & IMD Weather Advisory Alert Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-sky-950/80 via-blue-950/60 to-slate-900/90 border border-sky-500/30 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center shrink-0">
              <Waves className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-sky-300 tracking-wider font-mono">
                  IMD Mumbai Official Alert
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-500/30 font-bold">
                  High Tide 4.48m
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white mt-0.5">
                Low-Lying Track Waterlogging Precaution Active
              </h2>
              <p className="text-xs text-stone-300 mt-1 max-w-2xl">
                BMC &amp; Central Railway have positioned suction pumps at Sion, Kurla, and Chunabhatti. Elevated Metro Lines (1, 2A, 7) and Eastern Freeway are operating with 100% full capacity.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
            <a
              href="https://mausam.imd.gov.in/mumbai"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-full bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/30 text-sky-200 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <span>IMD Radar Feed</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
        {[
          { id: "ALL", label: "All Active Disruptions", icon: AlertTriangle },
          { id: "TRAIN", label: "Railway Mega-Blocks", icon: Train },
          { id: "METRO", label: "Metro Corridors", icon: Zap },
          { id: "BUS", label: "BEST Bus Diversions", icon: Bus },
          { id: "ROAD", label: "Road Traffic & Flyovers", icon: Car }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              className={`px-3.5 py-2 rounded-2xl border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                isActive
                  ? "bg-white text-slate-900 border-white shadow-lg font-black"
                  : "bg-white/5 hover:bg-white/10 text-stone-300 border-white/10"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Disruptions List */}
      <div className="grid grid-cols-1 gap-4">
        {disruptions.map((alert) => (
          <div
            key={alert.id}
            className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 backdrop-blur-2xl border border-white/10 shadow-xl space-y-4 hover:border-white/20 transition-all"
          >
            {/* Header: Title, Category & Severity */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  {getCategoryIcon(alert.category)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                      {alert.corridor}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${getSeverityBadge(alert.severity)}`}>
                      {alert.severity} IMPACT
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold font-mono">
                      {alert.status}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white mt-1">
                    {alert.title}
                  </h3>
                </div>
              </div>

              {/* Timing */}
              <div className="text-xs text-stone-400 flex items-center gap-1.5 self-start sm:self-auto font-mono">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                <span>
                  {new Date(alert.effectiveFrom).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} &ndash;{" "}
                  {new Date(alert.effectiveTo).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-stone-200 leading-relaxed">
              {alert.description}
            </p>

            {/* Affected Stations Chips */}
            {alert.affectedStations.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <span className="text-stone-400 text-[11px] font-semibold">Affected Nodes:</span>
                {alert.affectedStations.map((st, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-stone-300 text-[11px]"
                  >
                    {st}
                  </span>
                ))}
              </div>
            )}

            {/* Recommended Alternative Commuter Route Card */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5">
                  <Navigation className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-emerald-300 uppercase tracking-wide text-[10px]">
                      Recommended Alternative
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-200 font-mono text-[9px]">
                      {alert.recommendedAlternative.suggestedMode}
                    </span>
                  </div>
                  <p className="text-stone-200 text-xs mt-0.5">
                    {alert.recommendedAlternative.summary}
                  </p>
                </div>
              </div>

              <div className="self-end sm:self-auto text-right shrink-0">
                <span className="text-[10px] text-stone-400 block">Buffer:</span>
                <span className="text-xs font-bold text-amber-300 font-mono">
                  +{alert.recommendedAlternative.additionalTimeMin} mins
                </span>
              </div>
            </div>

            {/* Official Source Provenance Footer */}
            <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-stone-400 gap-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                <span>Verified by: {alert.source.authority}</span>
                {alert.source.bulletinRef && (
                  <span className="font-mono text-stone-500">({alert.source.bulletinRef})</span>
                )}
              </div>

              {alert.source.url && (
                <a
                  href={alert.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-300 hover:text-sky-200 flex items-center gap-1 font-semibold"
                >
                  <span>Official Release</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
