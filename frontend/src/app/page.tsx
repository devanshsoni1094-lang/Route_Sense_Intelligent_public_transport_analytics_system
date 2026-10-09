"use client";

import React, { useEffect, useState } from "react";
import { 
  Bus, CheckCircle2, Clock, Users, Gauge, AlertTriangle, 
  TrendingUp, ShieldAlert, ArrowUpRight, ChevronRight, HelpCircle
} from "lucide-react";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, BarChart, Bar, CartesianGrid 
} from "recharts";
import { fetchApi } from "@/lib/api";
import { ExecutiveKpiData } from "@/types";

const mockFallbackData: ExecutiveKpiData = {
  operating_mode: "DEMO DATA",
  agency_name: "Bengaluru Metropolitan Transport Corporation (BMTC)",
  scheduled_trips: 120,
  completed_trips: 115,
  completion_rate_pct: 95.8,
  on_time_performance_pct: 78.4,
  mean_delay_min: 4.2,
  passenger_boardings: 24850,
  fleet_utilization_pct: 91.4,
  active_disruptions_count: 2,
  data_freshness_seconds: 45,
  forecasted_demand_next_24h: 26800,
  insights: [
    {
      id: "INS-001",
      title: "Severe Delay Hotspot at Bellandur EcoSpace Flyover",
      description: "Observed severe delay spike averaging +14.2 min on Route 500-A between 08:30 and 10:15 AM.",
      route_id: "R-500A",
      stop_name: "Bellandur EcoSpace",
      time_window: "08:30 - 10:15 IST",
      suspected_cause: "Corridor traffic bottleneck merging Outer Ring Road express lanes into flyover construction zone.",
      supporting_records_count: 420,
      evidence_summary: "420 vehicle telemetry observations recorded speeds < 12 km/h over 3.2 km stretch."
    }
  ],
  top_performing_routes: [
    { route_id: "R-V500D", route_short_name: "V-500D", route_long_name: "Vayu Vajra AC Airport Express", otp_pct: 94.2, mean_delay_min: 1.8, status_label: "NORMAL" },
    { route_id: "R-201", route_short_name: "201", route_long_name: "Majestic to Banashankari TTMC", otp_pct: 88.5, mean_delay_min: 2.4, status_label: "NORMAL" }
  ],
  underperforming_routes: [
    { route_id: "R-500A", route_short_name: "500-A", route_long_name: "Silk Board to Hebbal ORR", otp_pct: 58.4, mean_delay_min: 14.2, status_label: "UNDERPERFORMING" },
    { route_id: "R-335E", route_short_name: "335-E", route_long_name: "KBS to ITPL Whitefield", otp_pct: 64.1, mean_delay_min: 9.8, status_label: "UNDERPERFORMING" }
  ]
};

const chartData = [
  { time: "06:00", scheduled: 40, actual: 38, delay: 1.5 },
  { time: "08:00", scheduled: 120, actual: 110, delay: 8.4 },
  { time: "10:00", scheduled: 95, actual: 92, delay: 5.2 },
  { time: "12:00", scheduled: 70, actual: 68, delay: 2.1 },
  { time: "14:00", scheduled: 75, actual: 74, delay: 2.8 },
  { time: "16:00", scheduled: 110, actual: 102, delay: 6.9 },
  { time: "18:00", scheduled: 130, actual: 118, delay: 11.2 },
  { time: "20:00", scheduled: 85, actual: 82, delay: 4.1 },
];

export default function OverviewPage() {
  const [data, setData] = useState<ExecutiveKpiData>(mockFallbackData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi<ExecutiveKpiData>("/dashboard/kpis")
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Using fallback demo KPI data", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-wide">Executive Intelligence Dashboard</h2>
            <span className="bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
              {data.operating_mode} MODE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational decision-support overview for citywide service performance and corridor reliability.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Ingestion Source</span>
            <span className="text-xs font-semibold text-sky-400 font-mono">BMTC GTFS Schedule + Simulated GPS</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: On-Time Performance */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">On-Time Performance (OTP)</span>
            <div className="p-2 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-800">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white font-mono">{data.on_time_performance_pct}%</span>
            <span className="text-xs text-emerald-400 font-medium">Target ≥ 80%</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Within [-1 min early, +5 min late] tolerance window.</p>
        </div>

        {/* Card 2: Mean Delay */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Mean Operational Delay</span>
            <div className="p-2 rounded-md bg-amber-950/80 text-amber-400 border border-amber-800">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white font-mono">{data.mean_delay_min} min</span>
            <span className="text-xs text-amber-400 font-medium">Observed across trips</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Arithmetic mean of schedule deviations.</p>
        </div>

        {/* Card 3: Passenger Boardings */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Passenger Boardings</span>
            <div className="p-2 rounded-md bg-sky-950/80 text-sky-400 border border-sky-800">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white font-mono">{data.passenger_boardings.toLocaleString()}</span>
            <span className="text-xs text-sky-400 font-medium">Today</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Forecasted 24h: {data.forecasted_demand_next_24h.toLocaleString()}</p>
        </div>

        {/* Card 4: Fleet Utilization */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Fleet Utilization</span>
            <div className="p-2 rounded-md bg-purple-950/80 text-purple-400 border border-purple-800">
              <Gauge className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white font-mono">{data.fleet_utilization_pct}%</span>
            <span className="text-xs text-purple-400 font-medium">32 / 35 Buses Active</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Trip Completion: {data.completion_rate_pct}%</p>
        </div>
      </div>

      {/* Main Charts & Evidence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Trend Chart & Route Performance */}
        <div className="lg:col-span-2 space-y-6">
          {/* Trend Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Scheduled vs Actual Trips & Delay Trend</h3>
                <p className="text-xs text-slate-400">Hourly breakdown of trip completion and average corridor delays (IST)</p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorScheduled" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#f8fafc" }} />
                  <Area type="monotone" dataKey="scheduled" name="Scheduled Trips" stroke="#0284c7" fillOpacity={1} fill="url(#colorScheduled)" />
                  <Area type="monotone" dataKey="actual" name="Completed Trips" stroke="#10b981" fillOpacity={1} fill="url(#colorActual)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Underperforming Routes Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Routes Requiring Operational Intervention
              </h3>
              <span className="text-xs text-slate-400">Sorted by lowest OTP</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Route Code</th>
                    <th className="py-2.5 px-3">Route Corridor</th>
                    <th className="py-2.5 px-3 text-right">OTP (%)</th>
                    <th className="py-2.5 px-3 text-right">Mean Delay</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {data.underperforming_routes.map((r) => (
                    <tr key={r.route_id} className="hover:bg-slate-800/50">
                      <td className="py-3 px-3 font-mono font-bold text-sky-400">{r.route_short_name}</td>
                      <td className="py-3 px-3 font-medium text-slate-200">{r.route_long_name}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-amber-400">{r.otp_pct}%</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300">+{r.mean_delay_min} min</td>
                      <td className="py-3 px-3 text-center">
                        <span className="bg-red-950 text-red-400 border border-red-800 text-[10px] px-2 py-0.5 rounded font-semibold">
                          {r.status_label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (1 col): Evidence-Backed Operational Insights */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sky-400" />
                Evidence-Backed Insights
              </h3>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                Verified Records
              </span>
            </div>

            <div className="space-y-4">
              {data.insights.map((ins) => (
                <div key={ins.id} className="bg-slate-950 border border-slate-800 rounded-md p-3.5 space-y-2">
                  <div className="flex items-start justify-between">
                    <h4 className="text-xs font-bold text-slate-100">{ins.title}</h4>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{ins.description}</p>
                  
                  <div className="bg-slate-900 rounded p-2 text-[10px] space-y-1 text-slate-300 border border-slate-800">
                    <p><span className="font-semibold text-slate-400">Suspected Cause:</span> {ins.suspected_cause}</p>
                    <p><span className="font-semibold text-slate-400">Evidence Summary:</span> {ins.evidence_summary}</p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>Window: {ins.time_window}</span>
                    <span className="text-sky-400 font-mono font-medium">{ins.supporting_records_count} records</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
