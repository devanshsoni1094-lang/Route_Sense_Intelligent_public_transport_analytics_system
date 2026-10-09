"use client";

import React, { useEffect, useState } from "react";
import { Users, Clock, Calendar, BarChart3 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { fetchApi } from "@/lib/api";

export default function DemandAnalyticsPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchApi<any>("/demand/patterns")
      .then((res) => setData(res))
      .catch((err) => console.warn("Using fallback demand data", err));
  }, []);

  const chartData = data?.hourly_patterns || [
    { hour: "06:00", weekday_demand: 180, weekend_demand: 90, predicted_demand: 185 },
    { hour: "08:00", weekday_demand: 680, weekend_demand: 310, predicted_demand: 670 },
    { hour: "10:00", weekday_demand: 520, weekend_demand: 340, predicted_demand: 515 },
    { hour: "12:00", weekday_demand: 390, weekend_demand: 280, predicted_demand: 400 },
    { hour: "14:00", weekday_demand: 410, weekend_demand: 290, predicted_demand: 410 },
    { hour: "16:00", weekday_demand: 580, weekend_demand: 320, predicted_demand: 590 },
    { hour: "18:00", weekday_demand: 740, weekend_demand: 360, predicted_demand: 730 },
    { hour: "20:00", weekday_demand: 340, weekend_demand: 210, predicted_demand: 350 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-400" />
            Passenger Demand Analytics
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Hourly passenger boardings, peak-demand windows, and weekday vs weekend ridership distribution.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <span className="text-xs font-medium text-slate-400">Morning Peak Window</span>
          <span className="text-xl font-bold text-sky-400 font-mono block mt-1">08:00 - 09:30 IST</span>
          <span className="text-[11px] text-slate-500">Max hourly boardings ~ 680 / hr</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <span className="text-xs font-medium text-slate-400">Evening Peak Window</span>
          <span className="text-xl font-bold text-amber-400 font-mono block mt-1">17:30 - 19:30 IST</span>
          <span className="text-[11px] text-slate-500">Max hourly boardings ~ 740 / hr</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <span className="text-xs font-medium text-slate-400">Busiest Demand Corridor</span>
          <span className="text-sm font-bold text-white block mt-1">Route 500-A Outer Ring Road</span>
          <span className="text-[11px] text-emerald-400">12,400 boardings today</span>
        </div>
      </div>

      {/* Demand Bar Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <h3 className="text-sm font-bold text-white mb-4">Hourly Ridership Profile: Weekday vs Weekend</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hour" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#f8fafc" }} />
              <Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
              <Bar dataKey="weekday_demand" name="Weekday Observed" fill="#0284c7" radius={[4, 4, 0, 0]} />
              <Bar dataKey="weekend_demand" name="Weekend Observed" fill="#64748b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="predicted_demand" name="Model Predicted" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
