"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navigation, Compass, MapPin, Sparkles, ShieldCheck, AlertCircle, Info, ExternalLink } from "lucide-react";
import { fetchApi } from "@/lib/api";

export const Header: React.FC = () => {
  const [providerStatus, setProviderStatus] = useState<{
    configured: boolean;
    status: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    // Check provider diagnostic status
    fetchApi<{ is_configured: boolean; status: string; message: string }>("/google-maps/status")
      .then((data) => {
        if (data) {
          setProviderStatus({
            configured: data.is_configured,
            status: data.status,
            message: data.message
          });
        }
      })
      .catch(() => {
        // Safe fallback
      });
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-[#070b14]/90 backdrop-blur-md border-b border-slate-800/80 transition-all font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand identity with spatial depth icon */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-teal-400 p-[1px] shadow-lg shadow-cyan-950/50 group-hover:shadow-cyan-500/20 transition-all duration-300">
            <div className="w-full h-full bg-[#090d16] rounded-[11px] flex items-center justify-center">
              <Navigation className="w-5 h-5 text-cyan-400 transform group-hover:-rotate-12 transition-transform duration-300" />
            </div>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#070b14] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-wider text-white group-hover:text-cyan-400 transition-colors">
                ROUTE SENSE
              </h1>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 hidden sm:inline-block">
                India Spatial
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium tracking-tight">
              Intelligent Public Transport & Mobility Intelligence
            </p>
          </div>
        </Link>

        {/* Spatial Status Indicators & Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Provider connectivity status badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                providerStatus?.configured ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}
            />
            <span className="text-slate-300 font-medium">
              {providerStatus?.configured ? "Google Maps Platform Active" : "Verified Transit Database"}
            </span>
            <span className="text-slate-500 text-[11px]">| Asia/Kolkata</span>
          </div>

          <Link
            href="/"
            className="px-3.5 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 rounded-xl border border-cyan-800/80 transition-all flex items-center gap-1.5 shadow-sm hover:shadow-cyan-500/10"
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>Find Journeys</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
