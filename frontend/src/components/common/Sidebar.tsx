"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Radio,
  GitCommit,
  Users,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Map,
  UploadCloud,
  FileSpreadsheet,
  Settings,
  Navigation
} from "lucide-react";

const navigationItems = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Route Planner", href: "/planner", icon: Navigation },
  { name: "Live Operations", href: "/live", icon: Radio },
  { name: "Route Analytics", href: "/routes", icon: GitCommit },
  { name: "Passenger Demand", href: "/demand", icon: Users },
  { name: "Predictions", href: "/predictions", icon: TrendingUp },
  { name: "Reliability & Alerts", href: "/alerts", icon: AlertTriangle },
  { name: "Optimization", href: "/recommendations", icon: Lightbulb },
  { name: "Geographic Intelligence", href: "/gis", icon: Map },
  { name: "Data Sources", href: "/ingestion", icon: UploadCloud },
  { name: "Reports", href: "/reports", icon: FileSpreadsheet },
  { name: "Administration", href: "/admin", icon: Settings },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="py-4">
        <div className="px-4 mb-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Decision Modules
        </div>
        <nav className="space-y-1 px-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-sky-600 text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Institutional Branding Footer */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400 bg-slate-950/50">
        <p className="font-semibold text-slate-300">RouteSense Enterprise</p>
        <p>From Transport Data to Intelligent Decisions.</p>
        <p className="mt-1 text-[10px] text-slate-400">© 2026 Public Transport Authority</p>
      </div>
    </aside>
  );
};
