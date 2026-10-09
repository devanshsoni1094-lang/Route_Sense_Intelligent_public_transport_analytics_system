"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Radio, Search, Filter, RefreshCw, ShieldAlert, Navigation } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { VehicleTelemetry } from "@/types";

const LiveMap = dynamic(() => import("@/components/maps/LiveMap"), {
  ssr: false,
  loading: () => <div className="h-[520px] bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center text-slate-400 text-xs">Loading Interactive GIS Map...</div>
});

const mockVehicles: VehicleTelemetry[] = [
  { vehicle_id: "KA-01-F-1001", vehicle_number: "KA-01-F-1001", route_id: "R-500A", route_name: "500-A", latitude: 12.9172, longitude: 77.6228, speed_kmh: 28.5, heading_deg: 45, delay_minutes: 14.2, status: "DELAYED", last_updated: new Date().toISOString(), is_simulated: true },
  { vehicle_id: "KA-01-F-1002", vehicle_number: "KA-01-F-1002", route_id: "R-335E", route_name: "335-E", latitude: 12.9778, longitude: 77.5713, speed_kmh: 34.0, heading_deg: 90, delay_minutes: 1.5, status: "ON_TIME", last_updated: new Date().toISOString(), is_simulated: true },
  { vehicle_id: "KA-01-F-1003", vehicle_number: "KA-01-F-1003", route_id: "R-201", route_name: "201", latitude: 12.9252, longitude: 77.5735, speed_kmh: 0.0, heading_deg: 0, delay_minutes: 0.5, status: "ON_TIME", last_updated: new Date().toISOString(), is_simulated: true },
  { vehicle_id: "KA-01-F-1004", vehicle_number: "KA-01-F-1004", route_id: "R-V500D", route_name: "V-500D", latitude: 13.0358, longitude: 77.5970, speed_kmh: 48.0, heading_deg: 180, delay_minutes: 2.1, status: "ON_TIME", last_updated: new Date().toISOString(), is_simulated: true },
];

export default function LiveOperationsPage() {
  const [vehicles, setVehicles] = useState<VehicleTelemetry[]>(mockVehicles);
  const [search, setSearch] = useState("");
  const [selectedRoute, setSelectedRoute] = useState("ALL");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>();

  const loadData = () => {
    fetchApi<VehicleTelemetry[]>("/live/telemetry")
      .then((res) => setVehicles(res))
      .catch((err) => console.warn("Using fallback live telemetry", err));
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const filtered = vehicles.filter((v) => {
    const matchesSearch = v.vehicle_number.toLowerCase().includes(search.toLowerCase()) || (v.route_name && v.route_name.toLowerCase().includes(search.toLowerCase()));
    const matchesRoute = selectedRoute === "ALL" || v.route_id === selectedRoute;
    return matchesSearch && matchesRoute;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            <h2 className="text-lg font-bold text-white tracking-wide">Live Operations Command Centre</h2>
            <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded">
              SIMULATED TELEMETRY FEED
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Near-real-time vehicle locations, speed telemetry, and schedule-versus-actual delay tracking.
          </p>
        </div>
        <button onClick={loadData} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-md text-xs font-medium transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Positions
        </button>
      </div>

      {/* Map & synchronized sidebar layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map View */}
        <div className="lg:col-span-2 space-y-4">
          <LiveMap vehicles={filtered} selectedVehicleId={selectedVehicleId} onSelectVehicle={setSelectedVehicleId} />
        </div>

        {/* Synchronized Table List */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4 flex flex-col h-[520px]">
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search bus number or route..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
            <select
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">All Routes</option>
              <option value="R-500A">500-A (Silk Board - Hebbal)</option>
              <option value="R-335E">335-E (Majestic - ITPL)</option>
              <option value="R-201">201 (Majestic - Banashankari)</option>
              <option value="R-V500D">V-500D (Vayu Vajra AC)</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filtered.map((v) => (
              <div
                key={v.vehicle_id}
                onClick={() => setSelectedVehicleId(v.vehicle_id)}
                className={`p-3 rounded-md border transition-all cursor-pointer ${
                  selectedVehicleId === v.vehicle_id
                    ? "bg-sky-950 border-sky-500"
                    : "bg-slate-950 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-white">{v.vehicle_number}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    v.status === 'ON_TIME' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-amber-950 text-amber-400 border-amber-800'
                  }`}>
                    {v.status}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Route: <strong className="text-slate-200">{v.route_name || v.route_id}</strong></span>
                  <span>Speed: <strong className="text-slate-200">{v.speed_kmh} km/h</strong></span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Delay: <strong className="text-amber-400">+{v.delay_minutes} min</strong></span>
                  <span className="font-mono">{new Date(v.last_updated).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
