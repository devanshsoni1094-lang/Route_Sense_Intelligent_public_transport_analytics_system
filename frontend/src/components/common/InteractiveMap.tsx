"use client";

import React, { useEffect, useRef } from "react";
import { ResolvedLocation } from "@/types";

interface InteractiveMapProps {
  origin: ResolvedLocation | null;
  destination: ResolvedLocation | null;
  selectedMode?: string;
  coordinates?: [number, number][];
  polyline?: string;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  origin,
  destination,
  selectedMode = "BUS",
  coordinates,
  polyline
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    // Dynamically load Leaflet for reliable multi-platform SSR rendering
    import("leaflet").then((L) => {
      // Fix default marker icon assets
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png"
      });

      const oLat = origin?.latitude && origin.latitude !== 0 ? origin.latitude : 19.0178;
      const oLng = origin?.longitude && origin.longitude !== 0 ? origin.longitude : 72.8478;
      const dLat = destination?.latitude && destination.latitude !== 0 ? destination.latitude : 18.9400;
      const dLng = destination?.longitude && destination.longitude !== 0 ? destination.longitude : 72.8353;

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

      // Clear previous markers & polylines
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) {
          map.removeLayer(layer);
        }
      });

      // Custom Start (Green) and End (Rose) Markers
      const startIcon = L.divIcon({
        className: "custom-map-marker-start",
        html: `<div style="background-color: #10b981; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      });

      const endIcon = L.divIcon({
        className: "custom-map-marker-end",
        html: `<div style="background-color: #f43f5e; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      });

      const startMarker = L.marker([oLat, oLng], { icon: startIcon }).addTo(map);
      startMarker.bindPopup(`<b>Start:</b> ${origin?.displayName || "Origin"}<br/>${origin?.formattedAddress || "India"}`);

      const endMarker = L.marker([dLat, dLng], { icon: endIcon }).addTo(map);
      endMarker.bindPopup(`<b>Destination:</b> ${destination?.displayName || "Destination"}<br/>${destination?.formattedAddress || "India"}`);

      // Path Styling by transport mode
      const pathColor =
        selectedMode === "BUS"
          ? "#0284c7"
          : selectedMode === "TRAIN"
          ? "#a855f7"
          : selectedMode === "METRO"
          ? "#9333ea"
          : selectedMode === "CAB"
          ? "#f59e0b"
          : selectedMode === "AUTO"
          ? "#d97706"
          : selectedMode === "BIKE"
          ? "#10b981"
          : "#64748b";

      // If detailed route coordinates are supplied from Google Routes API, draw the exact geometry
      let routePoints: [number, number][] = [];
      if (coordinates && coordinates.length > 1) {
        routePoints = coordinates;
      } else {
        const midLat = (oLat + dLat) / 2;
        const midLng = (oLng + dLng) / 2;
        routePoints = [
          [oLat, oLng],
          [midLat, midLng],
          [dLat, dLng]
        ];
      }

      const polylineLayer = L.polyline(routePoints, {
        color: pathColor,
        weight: 5,
        opacity: 0.85,
        lineJoin: "round"
      }).addTo(map);

      // Fit bounds to display entire journey
      const bounds = L.latLngBounds(routePoints);
      map.fitBounds(bounds, { padding: [40, 40] });
    });
  }, [origin, destination, selectedMode, coordinates, polyline]);

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border border-slate-200 relative shadow-inner">
      <div ref={mapContainerRef} className="w-full h-full min-h-[360px] bg-slate-100 z-0" />
      
      {/* Mode Badge Indicator */}
      <div className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-800 flex items-center gap-2 shadow-sm">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>Corridor Map: {selectedMode}</span>
      </div>
    </div>
  );
};
