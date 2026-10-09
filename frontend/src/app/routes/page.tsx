"use client";

import React, { useEffect, useState } from "react";
import { GitCommit, Search, Filter, ArrowUpDown, AlertCircle, CheckCircle } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { fetchApi } from "@/lib/api";
import { RoutePerformance } from "@/types";

const mockRoutePerf: RoutePerformance[] = [
  { route_id: "R-500A", route_short_name: "500-A", route_long_name: "Silk Board to Hebbal ORR Express", origin: "Central Silk Board", destination: "Hebbal", distance_km: 28.5, scheduled_trips: 32, completed_trips: 30, otp_pct: 58.4, mean_delay_min: 14.2, median_delay_min: 11.5, p90_delay_min: 22.0, headway_regularity_pct: 68.2, passenger_boardings: 12400, status_label: "UNDERPERFORMING" },
  { route_id: "R-335E", route_short_name: "335-E", route_long_name: "KBS Majestic to ITPL Whitefield", origin: "Majestic", destination: "ITPL", distance_km: 24.2, scheduled_trips: 24, completed_trips: 23, otp_pct: 64.1, mean_delay_min: 9.8, median_delay_min: 7.2, p90_delay_min: 15.4, headway_regularity_pct: 74.0, passenger_boardings: 8900, status_label: "UNDERPERFORMING" },
  { route_id: "R-201", route_short_name: "201", route_long_name: "Majestic to Banashankari TTMC", origin: "Majestic", destination: "Banashankari", distance_km: 14.0, scheduled_trips: 20, completed_trips: 20, otp_pct: 88.5, mean_delay_min: 2.4, median_delay_min: 1.8, p90_delay_min: 4.8, headway_regularity_pct: 91.5, passenger_boardings: 6200, status_label: "NORMAL" },
  { route_id: "R-V500D", route_short_name: "V-500D", route_long_name: "Vayu Vajra AC Airport Express", origin: "Electronic City", destination: "KIAS Airport", distance_km: 54.0, scheduled_trips: 16, completed_trips: 16, otp_pct: 94.2, mean_delay_min: 1.8, median_delay_min: 1.2, p90_delay_min: 3.5, headway_regularity_pct: 96.0, passenger_boardings: 3100, status_label: "NORMAL" }
];

export default function RouteAnalyticsPage() {
  const [routes, setRoutes] = useState<RoutePerformance[]>(mockRoutePerf);
  const [search, setSearch] = useState("");
  const [selectedRoute, setSelectedRoute] = useState<RoutePerformance | null>(mockRoutePerf[0]);

  useEffect(() => {
    fetchApi<RoutePerformance[]>("/routes/performance")
      .then((res) => {
        setRoutes(res);
        if (res.length > 0) setSelectedRoute(res[0]);
      })
      .catch((err) => console.warn("Using fallback route performance", err));
  }, []);

  const filtered = routes.filter((r) => 
    r.route_short_name.toLowerCase().includes(search.toLowerCase()) || 
    r.route_long_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
            <GitCommit className="w-5 h-5 text-sky-400" />
            Route Performance Analytics
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Corridor-level OTP, delay distribution, headway regularity, and travel time variance.
          </p>
        </div>
        <div className="relative w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search route name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Route Cards Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
          <h3 className="text-sm font-bold text-white">Route Performance Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Route</th>
                  <th className="py-2.5 px-3">Corridor</th>
                  <th className="py-2.5 px-3 text-right">OTP (%)</th>
                  <th className="py-2.5 px-3 text-right">Mean Delay</th>
                  <th className="py-2.5 px-3 text-right">Regularity</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((r) => (
                  <tr
                    key={r.route_id}
                    onClick={() => setSelectedRoute(r)}
                    className={`cursor-pointer transition-colors ${
                      selectedRoute?.route_id === r.route_id ? "bg-sky-950/60" : "hover:bg-slate-800/50"
                    }`}
                  >
                    <td className="py-3 px-3 font-mono font-bold text-sky-400">{r.route_short_name}</td>
                    <td className="py-3 px-3 font-medium text-slate-200">{r.route_long_name}</td>
                    <td className={`py-3 px-3 text-right font-mono font-bold ${r.otp_pct >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>{r.otp_pct}%</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-300">+{r.mean_delay_min} m</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-300">{r.headway_regularity_pct}%</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                        r.status_label === 'NORMAL' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-red-950 text-red-400 border-red-800'
                      }`}>
                        {r.status_label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Selected Route Drilldown */}
        {selectedRoute && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-[10px] font-mono text-sky-400 uppercase tracking-wider">Route Drilldown</span>
              <h3 className="text-base font-bold text-white">{selectedRoute.route_short_name}</h3>
              <p className="text-xs text-slate-400">{selectedRoute.route_long_name}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Distance</span>
                <span className="text-sm font-bold text-slate-200 font-mono">{selectedRoute.distance_km} km</span>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Boardings</span>
                <span className="text-sm font-bold text-slate-200 font-mono">{selectedRoute.passenger_boardings.toLocaleString()}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Median Delay</span>
                <span className="text-sm font-bold text-amber-400 font-mono">+{selectedRoute.median_delay_min} min</span>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 block">90th Percentile Delay</span>
                <span className="text-sm font-bold text-red-400 font-mono">+{selectedRoute.p90_delay_min} min</span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Scheduled Trips:</span>
                <span className="font-bold font-mono text-slate-200">{selectedRoute.scheduled_trips}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Completed Trips:</span>
                <span className="font-bold font-mono text-emerald-400">{selectedRoute.completed_trips}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Headway Regularity Score:</span>
                <span className="font-bold font-mono text-sky-400">{selectedRoute.headway_regularity_pct}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
