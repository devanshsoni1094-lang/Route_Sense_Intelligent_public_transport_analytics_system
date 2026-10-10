"use client";

import React, { useEffect, useRef } from "react";
import { ResolvedLocation } from "@/types";

interface InteractiveMapProps {
  origin: ResolvedLocation | null;
  destination: ResolvedLocation | null;
  selectedMode?: string;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  origin,
  destination,
  selectedMode = "BUS"
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    // Dynamically load Leaflet for SSR safety
    import("leaflet").then((L) => {
      // Fix default marker icon issues in webpack/nextjs
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png"
      });

      const oLat = origin?.latitude || 19.0178;
      const oLng = origin?.longitude || 72.8478;
      const dLat = destination?.latitude || 18.9400;
      const dLng = destination?.longitude || 72.8353;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current).setView([oLat, oLng], 12);

        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19
        }).addTo(map);

        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;

      // Clear previous layers
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) {
          map.removeLayer(layer);
        }
      });

      // Custom Green Start Marker
      const startIcon = L.divIcon({
        className: "custom-map-marker-start",
        html: `<div style="background-color: #10b981; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      // Custom Red End Marker
      const endIcon = L.divIcon({
        className: "custom-map-marker-end",
        html: `<div style="background-color: #f43f5e; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const startMarker = L.marker([oLat, oLng], { icon: startIcon }).addTo(map);
      startMarker.bindPopup(`<b>Start:</b> ${origin?.displayName || "Origin Location"}<br/>${origin?.city || "India"}`);

      const endMarker = L.marker([dLat, dLng], { icon: endIcon }).addTo(map);
      endMarker.bindPopup(`<b>Destination:</b> ${destination?.displayName || "Destination Location"}<br/>${destination?.city || "India"}`);

      // Midpoint / Transfer Node
      const midLat = (oLat + dLat) / 2;
      const midLng = (oLng + dLng) / 2;

      // Route Line Polyline
      const pathColor =
        selectedMode === "BUS"
          ? "#0284c7"
          : selectedMode === "TRAIN"
          ? "#a855f7"
          : selectedMode === "CAB"
          ? "#f59e0b"
          : "#10b981";

      const polyline = L.polyline(
        [
          [oLat, oLng],
          [midLat, midLng],
          [dLat, dLng]
        ],
        { color: pathColor, weight: 5, opacity: 0.8, dashArray: selectedMode === "CAB" ? "5, 10" : undefined }
      ).addTo(map);

      // Fit Bounds to show full journey
      const bounds = L.latLngBounds([[oLat, oLng], [dLat, dLng]]);
      map.fitBounds(bounds, { padding: [40, 40] });
    });
  }, [origin, destination, selectedMode]);

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border border-slate-800 relative shadow-inner">
      <div ref={mapContainerRef} className="w-full h-full min-h-[280px] bg-slate-950 z-0" />
      
      {/* Mode Badge Indicator */}
      <div className="absolute top-3 right-3 z-10 bg-slate-900/90 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-2 shadow">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>Map Layer: {selectedMode} Route Corridor</span>
      </div>
    </div>
  );
};
