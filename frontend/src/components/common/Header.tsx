"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  Bell,
  SlidersHorizontal,
  Search,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  MapPin,
  CheckCircle2
} from "lucide-react";
import { fetchApi } from "@/lib/api";

export const Header: React.FC = () => {
  const [providerStatus, setProviderStatus] = useState<{
    configured: boolean;
    status: string;
    message: string;
  } | null>(null);

  useEffect(() => {
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
      .catch(() => {});
  }, []);

  return (
    <header className="w-full px-6 py-4 flex items-center justify-between border-b border-white/10 text-stone-100 font-sans">
      {/* Brand: Logo & Tagline matching the image's top left */}
      <Link href="/" className="flex items-center gap-3 group">
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-500 via-rose-500 to-amber-400 p-[1.5px] shadow-lg shadow-orange-950/40 group-hover:scale-105 transition-transform duration-300">
          <div className="w-full h-full rounded-full bg-[#201c1a] flex items-center justify-center">
            <Compass className="w-4 h-4 text-orange-400 transform group-hover:rotate-45 transition-transform duration-500" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white group-hover:text-rose-300 transition-colors">
              ROUTE SENSE
            </h1>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 hidden sm:inline-block">
              Mumbai MMR
            </span>
          </div>
          <p className="text-[11px] text-stone-400 font-medium tracking-tight">
            Mumbai Metropolitan Region &bull; Live Transit
          </p>
        </div>
      </Link>

      {/* Center Search Pill & Filter matching the uploaded image */}
      <div className="hidden md:flex items-center gap-2">
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-xs text-stone-200 w-72 lg:w-80 shadow-inner transition-colors">
          <Search className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          <input
            type="text"
            readOnly
            placeholder="Search corridor, station, city..."
            onClick={() => {
              const el = document.getElementById("source-input");
              if (el) el.focus();
            }}
            className="bg-transparent border-none outline-none w-full text-xs text-stone-200 placeholder-stone-400 cursor-pointer"
          />
        </div>

        <button
          type="button"
          className="px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-xs text-stone-300 font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
        >
          <span>Filter</span>
          <ChevronDown className="w-3 h-3 text-stone-400" />
        </button>
      </div>

      {/* Right Actions: Status, Notifications & Avatar */}
      <div className="flex items-center gap-3">
        {/* Live Connectivity Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-stone-300">
          <span
            className={`w-2 h-2 rounded-full ${
              providerStatus?.configured ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
            }`}
          />
          <span className="font-medium">
            {providerStatus?.configured ? "Google Maps Connected" : "Verified Transit DB"}
          </span>
        </div>

        {/* Notification Bell Pill */}
        <button
          type="button"
          title="Notifications"
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-stone-300 hover:text-white transition-colors relative cursor-pointer"
        >
          <Bell className="w-3.5 h-3.5" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 ring-2 ring-[#221e1d]" />
        </button>

        {/* User Profile Avatar with Coral Ring */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 via-orange-500 to-amber-400 p-[1.5px] cursor-pointer shadow-md hover:scale-105 transition-transform">
          <div className="w-full h-full rounded-full bg-[#241f1d] flex items-center justify-center text-[11px] font-bold text-rose-200">
            DS
          </div>
        </div>
      </div>
    </header>
  );
};
