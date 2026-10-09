"use client";

import React from "react";
import { Activity, ShieldAlert, RefreshCw, User, Database, Building2 } from "lucide-react";

interface HeaderProps {
  operatingMode?: string;
  agencyName?: string;
  dataFreshnessSeconds?: number;
  onRefresh?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  operatingMode = "DEMO DATA",
  agencyName = "Bengaluru Metropolitan Transport Corporation (BMTC)",
  dataFreshnessSeconds = 45,
  onRefresh
}) => {
  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 text-white px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Left Identity */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-9 rounded-lg bg-sky-600 flex items-center justify-center font-extrabold text-white text-xs tracking-wider shadow-md">
            RS
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide text-slate-100 flex items-center gap-2">
              RouteSense
              <span className="text-[10px] text-slate-400 font-normal">| Public Transport Analytics</span>
              <span className="text-[10px] bg-sky-950 text-sky-400 font-mono px-2 py-0.5 rounded border border-sky-800">
                v1.0.0
              </span>
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-slate-400" />
              {agencyName} • <span className="text-slate-400">Asia/Kolkata (IST)</span>
            </p>
          </div>
        </div>
      </div>

      {/* Right Environment & Status */}
      <div className="flex items-center space-x-4">
        {/* Operating Status Banner Badge */}
        <div className="flex items-center space-x-2 bg-amber-950/80 border border-amber-500/40 text-amber-300 px-3 py-1 rounded-full text-xs font-semibold tracking-wide animate-pulse">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span>{operatingMode} MODE</span>
        </div>

        {/* Data Freshness Indicator */}
        <div className="text-xs text-slate-300 flex items-center space-x-1.5 bg-slate-800 px-3 py-1 rounded-md border border-slate-700">
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span>Ingestion Freshness:</span>
          <span className="font-mono text-emerald-400 font-medium">{dataFreshnessSeconds}s ago</span>
        </div>

        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition-colors border border-slate-700"
            title="Refresh Operational Metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {/* User Role Badge */}
        <div className="flex items-center space-x-2 pl-3 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <User className="w-4 h-4" />
          </div>
          <div className="text-left hidden md:block">
            <p className="text-xs font-medium text-slate-200">Ops Director</p>
            <p className="text-[10px] text-sky-400">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
};
