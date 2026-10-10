"use client";

import React from "react";
import Link from "next/link";
import { Navigation, Compass, MapPin } from "lucide-react";

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo & Brand Name */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-black text-sm shadow-md group-hover:bg-sky-500 transition-colors">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 group-hover:text-sky-600 transition-colors">
              ROUTE SENSE
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">India Public Transport Journey Planner</p>
          </div>
        </Link>

        {/* User Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-4">
          <Link
            href="/"
            className="px-3 py-2 text-xs font-bold text-sky-700 bg-sky-50 rounded-lg border border-sky-200 flex items-center gap-1.5 shadow-xs"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Find Journeys</span>
          </Link>
          <Link
            href="/planner"
            className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Route Map</span>
          </Link>
        </nav>
      </div>
    </header>
  );
};
