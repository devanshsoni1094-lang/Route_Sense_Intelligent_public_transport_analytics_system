"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { ResolvedLocation, RouteStep } from "@/types";
import {
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Layers,
  Navigation,
  Compass,
  MapPin,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  Sun,
  Moon,
  Map as MapIcon,
  Sparkles,
  Info
} from "lucide-react";

interface InteractiveMapProps {
  origin: ResolvedLocation | null;
  destination: ResolvedLocation | null;
  selectedMode?: string;
  journeyTitle?: string;
  distanceKm?: number;
  durationMin?: number;
  coordinates?: [number, number][];
  polyline?: string;
  steps?: RouteStep[];
  highlightedStepIndex?: number | null;
  onSelectStep?: (index: number) => void;
  cartoApiKey?: string;
}

// Default CARTO Basemaps API key provided by user
const DEFAULT_CARTO_KEY = "cb1_4jk9_1_bee4b9e4f372e1ce3f9056e0";

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  origin,
  destination,
  selectedMode = "BUS",
  journeyTitle,
  distanceKm,
  durationMin,
  coordinates,
  polyline,
  steps,
  highlightedStepIndex,
  onSelectStep,
  cartoApiKey
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const waypointMarkersRef = useRef<any[]>([]);

  const [mapError, setMapError] = useState(false);
  const [mapStyle, setMapStyle] = useState<"dark" | "voyager" | "positron">("dark");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const activeCartoKey =
    cartoApiKey ||
    process.env.NEXT_PUBLIC_CARTO_API_KEY ||
    DEFAULT_CARTO_KEY;

  // Origin & destination coordinates
  const oLat = origin?.latitude && origin.latitude !== 0 ? origin.latitude : 19.0178;
  const oLng = origin?.longitude && origin.longitude !== 0 ? origin.longitude : 72.8478;
  const dLat = destination?.latitude && destination.latitude !== 0 ? destination.latitude : 18.9400;
  const dLng = destination?.longitude && destination.longitude !== 0 ? destination.longitude : 72.8353;

  // Mode Emoji
  const getModeEmoji = (mode: string) => {
    switch (mode) {
      case "TRAIN":
        return "🚆";
      case "METRO":
        return "🚇";
      case "BUS":
        return "🚌";
      case "CAB":
        return "🚖";
      case "AUTO":
        return "🛺";
      case "BIKE":
        return "🛵";
      case "CAR_PERSONAL":
        return "🚗";
      case "MOTORCYCLE_PERSONAL":
        return "🏍️";
      default:
        return "🚌";
    }
  };

  // Mode Color Accent
  const getModeColor = (mode: string) => {
    switch (mode) {
      case "TRAIN":
        return "#f43f5e";
      case "METRO":
        return "#a855f7";
      case "BUS":
        return "#f97316";
      case "CAB":
        return "#eab308";
      case "AUTO":
        return "#f59e0b";
      case "BIKE":
        return "#10b981";
      case "CAR_PERSONAL":
        return "#fb7185";
      case "MOTORCYCLE_PERSONAL":
        return "#fb923c";
      default:
        return "#f43f5e";
    }
  };

  const primaryColor = getModeColor(selectedMode);
  const vehicleEmoji = getModeEmoji(selectedMode);

  // Compute Route Points
  const getRoutePoints = useCallback((): [number, number][] => {
    if (coordinates && coordinates.length > 1) {
      return coordinates;
    }
    // Generate curved arc corridor between start and end
    const midLat = (oLat + dLat) / 2 + 0.004;
    const midLng = (oLng + dLng) / 2 - 0.003;
    return [
      [oLat, oLng],
      [midLat, midLng],
      [dLat, dLng]
    ];
  }, [coordinates, oLat, oLng, dLat, dLng]);

  // Construct CARTO Basemap URL with robust fallback
  const getTileUrl = (style: "dark" | "voyager" | "positron") => {
    switch (style) {
      case "dark":
        return "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
      case "voyager":
        return "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
      case "positron":
        return "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
    }
  };

  // Initialize Map
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    import("leaflet")
      .then((L) => {
        if (!isMounted || !mapContainerRef.current) return;
        leafletRef.current = L;

        // Fix leaflet icon paths
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png"
        });

        // Initialize Map if not present
        if (!mapInstanceRef.current) {
          const map = L.map(mapContainerRef.current, {
            zoomControl: false,
            attributionControl: true
          }).setView([oLat, oLng], 12);

          const tileLayer = L.tileLayer(getTileUrl(mapStyle), {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a> | Mumbai Transit Corridor',
            subdomains: "abcd",
            maxZoom: 20
          });

          tileLayer.on("tileerror", () => {
            // Automatic seamless fallback to OSM
            tileLayer.setUrl("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png");
          });

          tileLayer.addTo(map);

          tileLayerRef.current = tileLayer;
          mapInstanceRef.current = map;
        }

        const map = mapInstanceRef.current;
        const L_instance = leafletRef.current;

        // Update tile layer if changed
        if (tileLayerRef.current) {
          tileLayerRef.current.setUrl(getTileUrl(mapStyle));
        }

        // Clean up previous markers & layers (except tile layer)
        map.eachLayer((layer: any) => {
          if (
            layer instanceof L_instance.Marker ||
            layer instanceof L_instance.Polyline ||
            layer instanceof L_instance.CircleMarker
          ) {
            map.removeLayer(layer);
          }
        });
        waypointMarkersRef.current = [];

        // 1. Origin Beacon Marker
        const startIcon = L_instance.divIcon({
          className: "custom-beacon-start",
          html: `<div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: rgba(249, 115, 22, 0.4); animation: orangePulse 2s infinite;"></div>
            <div style="width: 14px; height: 14px; border-radius: 50%; background: #f97316; border: 2.5px solid #ffffff; box-shadow: 0 0 12px rgba(249, 115, 22, 1); display: flex; align-items: center; justify-content: center;">
              <div style="width: 4px; height: 4px; border-radius: 50%; background: #ffffff;"></div>
            </div>
          </div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const startMarker = L_instance.marker([oLat, oLng], { icon: startIcon }).addTo(map);
        startMarker.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; color: #1c1917; padding: 4px; line-height: 1.4;">
            <div style="font-weight: 800; color: #ea580c; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px;">Departure Point</div>
            <div style="font-weight: 700; font-size: 13px; color: #1c1917; margin-top: 2px;">${origin?.displayName || "Origin"}</div>
            <div style="color: #78716c; font-size: 11px;">${origin?.formattedAddress || "India"}</div>
          </div>
        `);

        // 2. Destination Beacon Marker
        const endIcon = L_instance.divIcon({
          className: "custom-beacon-end",
          html: `<div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: rgba(244, 63, 94, 0.4); animation: coralPulse 2s infinite;"></div>
            <div style="width: 14px; height: 14px; border-radius: 50%; background: #f43f5e; border: 2.5px solid #ffffff; box-shadow: 0 0 12px rgba(244, 63, 94, 1); display: flex; align-items: center; justify-content: center;">
              <div style="width: 4px; height: 4px; border-radius: 50%; background: #ffffff;"></div>
            </div>
          </div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const endMarker = L_instance.marker([dLat, dLng], { icon: endIcon }).addTo(map);
        endMarker.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; color: #1c1917; padding: 4px; line-height: 1.4;">
            <div style="font-weight: 800; color: #e11d48; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px;">Arrival Destination</div>
            <div style="font-weight: 700; font-size: 13px; color: #1c1917; margin-top: 2px;">${destination?.displayName || "Destination"}</div>
            <div style="color: #78716c; font-size: 11px;">${destination?.formattedAddress || "India"}</div>
          </div>
        `);

        const routePoints = getRoutePoints();

        // 3. Draw Active Corridor Polylines
        // Outer glow
        L_instance.polyline(routePoints, {
          color: primaryColor,
          weight: 10,
          opacity: 0.28,
          lineJoin: "round",
          lineCap: "round"
        }).addTo(map);

        // Core polyline
        L_instance.polyline(routePoints, {
          color: primaryColor,
          weight: 4.5,
          opacity: 0.95,
          lineJoin: "round",
          lineCap: "round"
        }).addTo(map);

        // 4. Waypoint markers for steps
        if (steps && steps.length > 0) {
          const stepCount = steps.length;
          const markers: any[] = [];

          steps.forEach((step, idx) => {
            const frac = idx / Math.max(1, stepCount - 1);
            const ptIdx = Math.min(routePoints.length - 1, Math.floor(routePoints.length * frac));
            const pt = routePoints[ptIdx];
            if (!pt) return;

            const isHighlighted = highlightedStepIndex === idx;

            const waypointIcon = L_instance.divIcon({
              className: `waypoint-pin-${idx}`,
              html: `<div style="position: relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                <div style="position: absolute; width: 22px; height: 22px; border-radius: 50%; background: ${isHighlighted ? primaryColor : "rgba(255,255,255,0.2)"}; opacity: 0.5; ${isHighlighted ? "animation: coralPulse 1.5s infinite;" : ""}"></div>
                <div style="width: 14px; height: 14px; border-radius: 50%; background: ${isHighlighted ? primaryColor : "#ffffff"}; border: 2px solid ${primaryColor}; box-shadow: 0 2px 6px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: ${isHighlighted ? "#fff" : "#1c1917"}; font-size: 8px; font-weight: 800;">
                  ${step.step_number || idx + 1}
                </div>
              </div>`,
              iconSize: [22, 22],
              iconAnchor: [11, 11]
            });

            const marker = L_instance.marker(pt, { icon: waypointIcon }).addTo(map);
            marker.bindPopup(`
              <div style="font-family: inherit; font-size: 12px; color: #1c1917; padding: 3px; max-width: 220px;">
                <div style="font-size: 10px; font-weight: 800; color: #e11d48; text-transform: uppercase;">Step ${step.step_number || idx + 1} &bull; ${step.mode}</div>
                <div style="font-weight: 700; margin-top: 2px; font-size: 12px;">${step.instruction}</div>
                <div style="color: #78716c; font-size: 11px; margin-top: 2px;">${step.duration_min} mins ${step.distance_km > 0 ? `&bull; ${step.distance_km} km` : ""}</div>
              </div>
            `);

            marker.on("click", () => {
              if (onSelectStep) onSelectStep(idx);
            });

            markers.push(marker);
          });

          waypointMarkersRef.current = markers;
        }

        // 5. Fit bounds to route
        const bounds = L_instance.latLngBounds(routePoints);
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
  }, [
    origin,
    destination,
    selectedMode,
    coordinates,
    polyline,
    steps,
    mapStyle,
    activeCartoKey,
    getRoutePoints,
    oLat,
    oLng,
    dLat,
    dLng,
    primaryColor,
    onSelectStep
  ]);

  // Handle Step Highlight Fly-To
  useEffect(() => {
    if (
      highlightedStepIndex !== null &&
      highlightedStepIndex !== undefined &&
      mapInstanceRef.current &&
      leafletRef.current
    ) {
      const routePoints = getRoutePoints();
      const stepCount = steps?.length || 1;
      const frac = highlightedStepIndex / Math.max(1, stepCount - 1);
      const ptIdx = Math.min(routePoints.length - 1, Math.floor(routePoints.length * frac));
      const pt = routePoints[ptIdx];

      if (pt) {
        mapInstanceRef.current.flyTo(pt, 14, {
          animate: true,
          duration: 0.8
        });

        // Open popup of matching waypoint if available
        const marker = waypointMarkersRef.current[highlightedStepIndex];
        if (marker) {
          marker.openPopup();
        }
      }
    }
  }, [highlightedStepIndex, steps, getRoutePoints]);



  // Controls
  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current && leafletRef.current) {
      const routePoints = getRoutePoints();
      const bounds = leafletRef.current.latLngBounds(routePoints);
      mapInstanceRef.current.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 16
      });
    }
  };

  // Google Maps navigation external link
  const openExternalNavigation = () => {
    const navMode =
      selectedMode === "TRAIN" || selectedMode === "METRO" || selectedMode === "BUS"
        ? "transit"
        : selectedMode === "BIKE" || selectedMode === "MOTORCYCLE_PERSONAL"
        ? "two-wheeler"
        : "driving";
    const url = `https://www.google.com/maps/dir/?api=1&origin=${oLat},${oLng}&destination=${dLat},${dLng}&travelmode=${navMode}`;
    window.open(url, "_blank");
  };

  return (
    <div
      className={`relative rounded-[28px] overflow-hidden border border-white/10 bg-[#161312] shadow-2xl transition-all duration-300 ${
        isFullscreen
          ? "fixed inset-3 sm:inset-6 z-50 rounded-[32px] ring-2 ring-rose-500/50 shadow-black/90"
          : "w-full h-full min-h-[440px]"
      }`}
    >
      {/* Map Canvas */}
      {!mapError ? (
        <div ref={mapContainerRef} className="w-full h-full min-h-[440px] z-0" />
      ) : (
        /* Spatial Corridor Fallback Diagram */
        <div className="w-full h-full min-h-[440px] flex flex-col items-center justify-center p-8 bg-[#1e1918] text-center">
          <div className="w-14 h-14 rounded-full bg-white/10 border border-white/10 flex items-center justify-center mb-3">
            <Compass className="w-6 h-6 text-rose-400" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">Spatial Corridor Active</h3>
          <p className="text-xs text-stone-400 max-w-sm mb-4">
            Corridor between {origin?.displayName || "Origin"} and {destination?.displayName || "Destination"} initialized.
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

      {/* 1. TOP HEADER OVERLAY: STATUS, TITLE & TILE STYLE SWITCHER */}
      <div className="absolute top-3.5 left-3.5 right-3.5 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        
        {/* Left Transit Badge */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="bg-stone-900/85 backdrop-blur-xl border border-white/15 px-3 py-1.5 rounded-full text-xs font-bold text-white flex items-center gap-2 shadow-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="tracking-wide uppercase text-[10px] text-emerald-300 font-mono">
              TRANSIT ROUTE MAP
            </span>
            <span className="text-stone-500 text-[10px]">&bull;</span>
            <span className="text-[11px] text-stone-200 truncate max-w-[140px] sm:max-w-none">
              {journeyTitle || `${selectedMode} Active Corridor`}
            </span>
          </div>

          {/* Quick Distance / Duration Pill */}
          {(distanceKm !== undefined || durationMin !== undefined) && (
            <div className="hidden md:flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 px-2.5 py-1.5 rounded-full text-[11px] text-stone-300 font-medium">
              {distanceKm !== undefined && <span>{distanceKm} km</span>}
              {distanceKm !== undefined && durationMin !== undefined && <span className="text-stone-600">&bull;</span>}
              {durationMin !== undefined && <span>{durationMin} mins</span>}
            </div>
          )}
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          
          {/* Map Style Pills (Night / Streets / Light) */}
          <div className="bg-stone-900/85 backdrop-blur-xl border border-white/15 p-1 rounded-full flex items-center gap-1 shadow-xl">
            <button
              onClick={() => setMapStyle("dark")}
              title="Cyber Dark Spatial Basemap"
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                mapStyle === "dark"
                  ? "bg-rose-500/90 text-white shadow-sm"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              <Moon className="w-3 h-3" />
              <span className="hidden sm:inline">Dark</span>
            </button>

            <button
              onClick={() => setMapStyle("voyager")}
              title="Detailed Streets & Rail Basemap"
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                mapStyle === "voyager"
                  ? "bg-amber-500/90 text-white shadow-sm"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              <MapIcon className="w-3 h-3" />
              <span className="hidden sm:inline">Streets</span>
            </button>

            <button
              onClick={() => setMapStyle("positron")}
              title="Clean Daylight Basemap"
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                mapStyle === "positron"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              <Sun className="w-3 h-3" />
              <span className="hidden sm:inline">Light</span>
            </button>
          </div>

          {/* Fullscreen Expand / Collapse */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Exit Fullscreen" : "Expand to Fullscreen"}
            className="p-2 rounded-full bg-stone-900/85 hover:bg-stone-800 backdrop-blur-xl border border-white/15 text-stone-300 hover:text-white transition-all shadow-xl cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-rose-400" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. FLOATING RIGHT CONTROL COLUMN (Zoom, Fit, Navigation) */}
      <div className="absolute right-3.5 bottom-14 z-20 flex flex-col gap-2">
        {/* Fit Bounds */}
        <button
          onClick={handleRecenter}
          title="Recenter & Fit Corridor"
          className="p-2.5 rounded-2xl bg-stone-900/85 hover:bg-stone-800 backdrop-blur-xl border border-white/15 text-stone-300 hover:text-white transition-all shadow-xl cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Zoom Controls */}
        <div className="flex flex-col rounded-2xl bg-stone-900/85 backdrop-blur-xl border border-white/15 shadow-xl overflow-hidden divide-y divide-white/10">
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-2.5 text-stone-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-2.5 text-stone-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        {/* Open in Google Maps Navigation */}
        <button
          onClick={openExternalNavigation}
          title="Start Turn-by-Turn GPS Navigation"
          className="p-2.5 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white border border-rose-400/40 shadow-xl transition-all cursor-pointer hover:scale-105"
        >
          <Navigation className="w-4 h-4" />
        </button>
      </div>

      {/* 3. BOTTOM OVERLAY: COORDINATES & STATUS */}
      <div className="absolute bottom-3 left-3.5 right-3.5 z-20 flex items-center justify-between gap-2 pointer-events-none">
        {/* Origin -> Destination Lat/Lng Stamp */}
        <div className="hidden sm:flex items-center gap-2 bg-stone-900/85 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-[10px] text-stone-400 font-mono shadow-lg">
          <MapPin className="w-3 h-3 text-orange-400" />
          <span>{oLat.toFixed(3)}°N, {oLng.toFixed(3)}°E</span>
          <span>➔</span>
          <MapPin className="w-3 h-3 text-rose-400" />
          <span>{dLat.toFixed(3)}°N, {dLng.toFixed(3)}°E</span>
        </div>

        {/* Live Map Connection Status Pill */}
        <div className="pointer-events-auto bg-stone-900/85 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-[10px] text-stone-300 flex items-center gap-1.5 shadow-lg">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>Transit Route Corridors Active &bull; Mumbai MMR</span>
        </div>
      </div>
    </div>
  );
};
