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

        // Custom pulsing origin beacon (Warm Coral / Orange)
        const startIcon = L.divIcon({
          className: "custom-beacon-start",
          html: `<div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background: rgba(249, 115, 22, 0.4); animation: orangePulse 2s infinite;"></div>
            <div style="width: 14px; height: 14px; border-radius: 50%; background: #f97316; border: 2.5px solid #ffffff; box-shadow: 0 0 10px rgba(249, 115, 22, 0.9);"></div>
          </div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        // Custom pulsing destination beacon (Rose / Coral)
        const endIcon = L.divIcon({
          className: "custom-beacon-end",
          html: `<div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background: rgba(244, 63, 94, 0.4); animation: coralPulse 2s infinite;"></div>
            <div style="width: 14px; height: 14px; border-radius: 50%; background: #f43f5e; border: 2.5px solid #ffffff; box-shadow: 0 0 10px rgba(244, 63, 94, 0.9);"></div>
          </div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const startMarker = L.marker([oLat, oLng], { icon: startIcon }).addTo(map);
        startMarker.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; color: #1c1917; line-height: 1.4;">
            <div style="font-weight: 700; color: #ea580c; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px;">Departure Point</div>
            <div style="font-weight: 600; font-size: 13px;">${origin?.displayName || "Origin"}</div>
            <div style="color: #78716c; font-size: 11px;">${origin?.formattedAddress || "India"}</div>
          </div>
        `);

        const endMarker = L.marker([dLat, dLng], { icon: endIcon }).addTo(map);
        endMarker.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; color: #1c1917; line-height: 1.4;">
            <div style="font-weight: 700; color: #e11d48; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px;">Destination Point</div>
            <div style="font-weight: 600; font-size: 13px;">${destination?.displayName || "Destination"}</div>
            <div style="color: #78716c; font-size: 11px;">${destination?.formattedAddress || "India"}</div>
          </div>
        `);

        // Mode-specific route colors with VisionOS coral/rose palette
        const modeColorMap: Record<string, string> = {
          TRAIN: "#f43f5e",
          METRO: "#ec4899",
          BUS: "#f97316",
          CAB: "#fbbf24",
          AUTO: "#f59e0b",
          BIKE: "#10b981",
          CAR_PERSONAL: "#fb7185",
          MOTORCYCLE_PERSONAL: "#fb923c"
        };
        const primaryColor = modeColorMap[selectedMode] || "#f43f5e";

        let routePoints: [number, number][] = [];
        if (coordinates && coordinates.length > 1) {
          routePoints = coordinates;
        } else {
          const midLat = (oLat + dLat) / 2 + 0.003;
          const midLng = (oLng + dLng) / 2 - 0.003;
          routePoints = [
            [oLat, oLng],
            [midLat, midLng],
            [dLat, dLng]
          ];
        }

        // Draw glowing corridor: Outer diffused warm glow
        L.polyline(routePoints, {
          color: primaryColor,
          weight: 9,
          opacity: 0.3,
          lineJoin: "round",
          lineCap: "round"
        }).addTo(map);

        // Draw crisp core polyline
        L.polyline(routePoints, {
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
                <div style="font-size: 11px; font-weight: 600; color: #1c1917;">
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
    <div className="w-full h-full relative rounded-[28px] overflow-hidden border border-white/10 bg-[#1a1615] shadow-2xl">
      {/* Map Canvas */}
      {!mapError ? (
        <div ref={mapContainerRef} className="w-full h-full min-h-[380px] lg:min-h-full z-0" />
      ) : (
        /* Spatial Corridor Fallback Diagram */
        <div className="w-full h-full min-h-[380px] flex flex-col items-center justify-center p-8 bg-[#1e1918] text-center">
          <div className="w-14 h-14 rounded-full bg-white/10 border border-white/10 flex items-center justify-center mb-3">
            <Compass className="w-6 h-6 text-rose-400" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">Spatial Corridor Active</h3>
          <p className="text-xs text-stone-400 max-w-sm mb-4">
            Route between {origin?.displayName || "Origin"} and {destination?.displayName || "Destination"} computed via Google Routes API.
          </p>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-950/60 border border-orange-800 text-orange-300">
              <span className="w-2 h-2 rounded-full bg-orange-400" />
              <span>{origin?.displayName || "Start"}</span>
            </div>
            <span className="text-stone-600">┈┈┈ ➔ ┈┈┈</span>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-800 text-rose-300">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>{destination?.displayName || "End"}</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Spatial Controls Overlay */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        {/* Active Mode Pill */}
        <div className="bg-stone-900/80 backdrop-blur-xl border border-white/15 px-3.5 py-1.5 rounded-full text-xs font-bold text-stone-200 flex items-center gap-2 shadow-xl">
          <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
          <span className="tracking-wide uppercase text-[10px] text-rose-300 font-mono">
            {selectedMode} CORRIDOR
          </span>
        </div>

        {/* VisionOS Glass Controls */}
        <div className="flex flex-col rounded-2xl bg-stone-900/80 backdrop-blur-2xl border border-white/15 shadow-xl overflow-hidden divide-y divide-white/10">
          <button
            onClick={handleZoomIn}
            title="Zoom in"
            className="p-2.5 text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom out"
            className="p-2.5 text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleRecenter}
            title="Fit to route"
            className="p-2.5 text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={toggleMapStyle}
            title={mapStyle === "dark" ? "Switch to light map" : "Switch to dark spatial map"}
            className="p-2.5 text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Geographic Coordinates Pill */}
      <div className="absolute bottom-3 left-3 z-20 hidden sm:flex items-center gap-2 bg-stone-900/80 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-[10px] text-stone-400 font-mono">
        <span>{oLat.toFixed(3)}°N, {oLng.toFixed(3)}°E</span>
        <span>➔</span>
        <span>{dLat.toFixed(3)}°N, {dLng.toFixed(3)}°E</span>
      </div>
    </div>
  );
};
