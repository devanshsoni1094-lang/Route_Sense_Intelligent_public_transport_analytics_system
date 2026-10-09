"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Map, Layers, Filter } from "lucide-react";
import { fetchApi } from "@/lib/api";

const GisMap = dynamic(() => import("@/components/maps/LiveMap"), {
  ssr: false,
  loading: () => <div className="h-[560px] bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center text-slate-400 text-xs">Loading GIS Map Layers...</div>
});

export default function GisPage() {
  const [gisData, setGisData] = useState<any>(null);

  useEffect(() => {
    fetchApi<any>("/gis/layers")
      .then((res) => setGisData(res))
      .catch((err) => console.warn("Using fallback GIS layers", err));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
            <Map className="w-5 h-5 text-sky-400" />
            Interactive Geographic Intelligence (GIS)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Spatial analytics for transport route geometries, stop locations, delay heatmaps, and corridor coverage.
          </p>
        </div>
      </div>

      {/* Map Component */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
        <GisMap vehicles={[]} />
      </div>
    </div>
  );
}
