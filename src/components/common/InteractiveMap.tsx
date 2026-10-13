"use client";

import React, { useEffect, useRef, useState } from "react";
import { ResolvedLocation, RouteStep } from "@/types";
import { Maximize2, Minimize2, ZoomIn, ZoomOut, Layers, Navigation, Compass, MapPin } from "lucide-react";

interface InteractiveMapProps {
  origin: ResolvedLocation | null;
  destination: ResolvedLocation | null;
  selectedMode?: string;
  coordinates?: [number, number][];
  polyline?: string;
  steps?: RouteStep[];
  highlightedStepIndex?: number | null;
  onSelectStep?: (index: number) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  origin,
  destination,
  selectedMode = "BUS",
  coordinates,
  polyline,
  steps,
  highlightedStepIndex,
  onSelectStep
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [mapError, setMapError] = useState(false);
  const [mapStyle, setMapStyle] = useState<"dark" | "voyager">("dark");

  const oLat = origin?.latitude && origin.latitude !== 0 ? origin.latitude : 19.0178;
  const oLng = origin?.longitude && origin.longitude !== 0 ? origin.longitude : 72.8478;
  const dLat = destination?.latitude && destination.latitude !== 0 ? destination.latitude : 18.9400;
  const dLng = destination?.longitude && destination.longitude !== 0 ? destination.longitude : 72.8353;

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    import("leaflet")
      .then((L) => {
        if (!isMounted || !mapContainerRef.current) return;

        // Leaflet icon fix
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png"
        });

        // Initialize Map if not already initialized
        if (!mapInstanceRef.current) {
          const map = L.map(mapContainerRef.current, {
            zoomControl: false,
            attributionControl: true
          }).setView([oLat, oLng], 12);

          const tileUrl =
            mapStyle === "dark"
              ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

          L.tileLayer(tileUrl, {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
            subdomains: "abcd",
            maxZoom: 19
          }).addTo(map);

          mapInstanceRef.current = map;
        }

        const map = mapInstanceRef.current;

        // Clear previous vector layers & markers
        map.eachLayer((layer: any) => {
          if (layer instanceof L.Marker || layer instanceof L.Polyline || layer instanceof L.CircleMarker) {
            map.removeLayer(layer);
          }
        });

        // Update tile layer if style changed
        map.eachLayer((layer: any) => {
          if (layer instanceof L.TileLayer) {
            map.removeLayer(layer);
          }
        });
        const activeTileUrl =
          mapStyle === "dark"
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

        L.tileLayer(activeTileUrl, {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a> | Routes via Google Platform',
          subdomains: "abcd",
          maxZoom: 19
        }).addTo(map);

        // Custom pulsing origin beacon (Emerald)
        const startIcon = L.divIcon({
          className: "custom-beacon-start",
          html: `<div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background: rgba(16, 185, 129, 0.35); animation: beaconPulse 2s infinite;"></div>
            <div style="width: 14px; height: 14px; border-radius: 50%; background: #10b981; border: 2.5px solid #ffffff; box-shadow: 0 0 10px rgba(16, 185, 129, 0.8);"></div>
          </div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        // Custom pulsing destination beacon (Rose)
        const endIcon = L.divIcon({
          className: "custom-beacon-end",
          html: `<div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background: rgba(244, 63, 94, 0.35); animation: rosePulse 2s infinite;"></div>
            <div style="width: 14px; height: 14px; border-radius: 50%; background: #f43f5e; border: 2.5px solid #ffffff; box-shadow: 0 0 10px rgba(244, 63, 94, 0.8);"></div>
          </div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const startMarker = L.marker([oLat, oLng], { icon: startIcon }).addTo(map);
        startMarker.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; color: #0f172a; line-height: 1.4;">
            <div style="font-weight: 700; color: #059669; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px;">Departure Point</div>
            <div style="font-weight: 600; font-size: 13px;">${origin?.displayName || "Origin"}</div>
            <div style="color: #64748b; font-size: 11px;">${origin?.formattedAddress || "India"}</div>
          </div>
        `);

        const endMarker = L.marker([dLat, dLng], { icon: endIcon }).addTo(map);
        endMarker.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; color: #0f172a; line-height: 1.4;">
            <div style="font-weight: 700; color: #e11d48; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px;">Destination Point</div>
            <div style="font-weight: 600; font-size: 13px;">${destination?.displayName || "Destination"}</div>
            <div style="color: #64748b; font-size: 11px;">${destination?.formattedAddress || "India"}</div>
          </div>
        `);

        // Mode-specific route colors
        const modeColorMap: Record<string, string> = {
          TRAIN: "#a855f7",
          METRO: "#8b5cf6",
          BUS: "#0284c7",
          CAB: "#f59e0b",
          AUTO: "#d97706",
          BIKE: "#10b981",
          CAR_PERSONAL: "#38bdf8",
          MOTORCYCLE_PERSONAL: "#14b8a6"
        };
        const primaryColor = modeColorMap[selectedMode] || "#06b6d4";

        let routePoints: [number, number][] = [];
        if (coordinates && coordinates.length > 1) {
          routePoints = coordinates;
        } else {
          // Curvature estimate connecting points
          const midLat = (oLat + dLat) / 2 + 0.003;
          const midLng = (oLng + dLng) / 2 - 0.003;
          routePoints = [
            [oLat, oLng],
            [midLat, midLng],
            [dLat, dLng]
          ];
        }

        // Draw glowing corridor: Background glow polyline
        L.polyline(routePoints, {
          color: primaryColor,
          weight: 9,
          opacity: 0.25,
          lineJoin: "round",
          lineCap: "round"
        }).addTo(map);

        // Draw crisp core polyline
        const corePolyline = L.polyline(routePoints, {
          color: primaryColor,
          weight: 4.5,
          opacity: 0.95,
          lineJoin: "round",
          lineCap: "round"
        }).addTo(map);

        // Transfer / Waypoint stop dots if steps exist
        if (steps && steps.length > 1) {
          const stepCount = steps.length;
          for (let i = 1; i < stepCount; i++) {
            const frac = i / stepCount;
            const ptIdx = Math.min(routePoints.length - 1, Math.floor(routePoints.length * frac));
            const pt = routePoints[ptIdx];
            if (pt) {
              const stopMarker = L.circleMarker(pt, {
                radius: 4.5,
                fillColor: "#ffffff",
                fillOpacity: 1,
                color: primaryColor,
                weight: 2
              }).addTo(map);

              stopMarker.bindPopup(`
                <div style="font-size: 11px; font-weight: 600; color: #0f172a;">
                  Step ${i}: ${steps[i - 1]?.instruction || "Transfer Station"}
                </div>
              `);
            }
          }
        }

        // Fit bounds to route
        const bounds = L.latLngBounds(routePoints);
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 16
        });
      })
      .catch((err) => {
        console.error("Leaflet map initialization error:", err);
        setMapError(true);
      });

    return () => {
      isMounted = false;
    };
  }, [origin, destination, selectedMode, coordinates, polyline, steps, mapStyle]);

  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      if (coordinates && coordinates.length > 1) {
        import("leaflet").then((L) => {
          mapInstanceRef.current.fitBounds(L.latLngBounds(coordinates), { padding: [50, 50] });
        });
      } else {
        mapInstanceRef.current.setView([oLat, oLng], 12);
      }
    }
  };

  const toggleMapStyle = () => {
    setMapStyle((prev) => (prev === "dark" ? "voyager" : "dark"));
  };

  return (
    <div className="w-full h-full relative rounded-3xl overflow-hidden border border-slate-800/80 bg-[#090e17] shadow-2xl">
      {/* Map Canvas */}
      {!mapError ? (
        <div ref={mapContainerRef} className="w-full h-full min-h-[420px] lg:min-h-full z-0" />
      ) : (
        /* Spatial Corridor Fallback Diagram (Section 4.3 graceful degradation) */
        <div className="w-full h-full min-h-[420px] flex flex-col items-center justify-center p-8 bg-[#090d16] text-center">
          <div className="w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-800/80 flex items-center justify-center mb-4">
            <Compass className="w-8 h-8 text-cyan-400" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Spatial Corridor Active</h3>
          <p className="text-xs text-slate-400 max-w-sm mb-6">
            Detailed journey route between {origin?.displayName || "Origin"} and {destination?.displayName || "Destination"} calculated via Google Routes API.
          </p>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{origin?.displayName || "Start"}</span>
            </div>
            <span className="text-slate-600">┈┈┈ ➔ ┈┈┈</span>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>{destination?.displayName || "End"}</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Spatial Controls Overlay */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        {/* Active Mode Pill */}
        <div className="bg-[#090d16]/90 backdrop-blur-md border border-slate-800/90 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-200 flex items-center gap-2 shadow-xl">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="tracking-wide uppercase text-[11px] text-cyan-400 font-mono">
            {selectedMode} CORRIDOR
          </span>
        </div>

        {/* Spatial Zoom & Layer Buttons */}
        <div className="flex flex-col rounded-xl bg-[#090d16]/90 backdrop-blur-md border border-slate-800/90 shadow-xl overflow-hidden">
          <button
            onClick={handleZoomIn}
            title="Zoom in"
            className="p-2.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 transition-colors border-b border-slate-800/60"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom out"
            className="p-2.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 transition-colors border-b border-slate-800/60"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleRecenter}
            title="Fit to route"
            className="p-2.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 transition-colors border-b border-slate-800/60"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={toggleMapStyle}
            title={mapStyle === "dark" ? "Switch to light map" : "Switch to dark spatial map"}
            className="p-2.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 transition-colors"
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Subtle Geographic Coordinates Pill at bottom left */}
      <div className="absolute bottom-4 left-4 z-20 hidden sm:flex items-center gap-3 bg-[#090d16]/80 backdrop-blur-md border border-slate-800/80 px-3 py-1 rounded-lg text-[10px] text-slate-400 font-mono">
        <span>IN-GEO: {oLat.toFixed(4)}°N, {oLng.toFixed(4)}°E</span>
        <span>➔</span>
        <span>{dLat.toFixed(4)}°N, {dLng.toFixed(4)}°E</span>
      </div>
    </div>
  );
};
