"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { ResolvedLocation, RouteStep } from "@/types";
import {
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Navigation,
  Compass,
  MapPin,
  RotateCcw,
  Sun,
  Moon,
  Map as MapIcon,
  Play,
  Pause,
  Layers,
  Radio,
  ShieldCheck
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

// User-provided CARTO API key for high-performance live authenticated maps
const DEFAULT_CARTO_KEY = "cb1_4jk9_1_bee4b9e4f372e1ce3f9056e0";

/**
 * Interpolate position along a sequence of route points
 */
function getInterpolatedPosition(points: [number, number][], t: number): [number, number] {
  if (!points || points.length === 0) return [19.0178, 72.8478];
  if (points.length === 1 || t <= 0) return points[0];
  if (t >= 1) return points[points.length - 1];

  const totalSegments = points.length - 1;
  const rawIndex = t * totalSegments;
  const idx = Math.min(points.length - 2, Math.floor(rawIndex));
  const frac = rawIndex - idx;

  const p1 = points[idx];
  const p2 = points[idx + 1];

  const lat = p1[0] + (p2[0] - p1[0]) * frac;
  const lng = p1[1] + (p2[1] - p1[1]) * frac;
  return [lat, lng];
}

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
  const liveVehicleMarkerRef = useRef<any>(null);

  const [mapError, setMapError] = useState(false);
  const [mapStyle, setMapStyle] = useState<"dark" | "voyager" | "positron">("dark");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Live Corridor Tracking State
  const [isLiveRunning, setIsLiveRunning] = useState(false);
  const [liveProgress, setLiveProgress] = useState(0); // 0 to 1
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 4>(1);

  const activeCartoKey =
    cartoApiKey ||
    process.env.NEXT_PUBLIC_CARTO_API_KEY ||
    DEFAULT_CARTO_KEY;

  // Origin & destination coordinates
  const oLat = origin?.latitude && origin.latitude !== 0 ? origin.latitude : 19.0178;
  const oLng = origin?.longitude && origin.longitude !== 0 ? origin.longitude : 72.8478;
  const dLat = destination?.latitude && destination.latitude !== 0 ? destination.latitude : 18.9400;
  const dLng = destination?.longitude && destination.longitude !== 0 ? destination.longitude : 72.8353;

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
        return "#0284c7";
    }
  };

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
      default:
        return "🚌";
    }
  };

  const primaryColor = getModeColor(selectedMode);
  const modeEmoji = getModeEmoji(selectedMode);

  // Compute Planned Route Points with natural Mumbai corridor curvature
  const getRoutePoints = useCallback((): [number, number][] => {
    if (coordinates && coordinates.length > 1) {
      return coordinates;
    }
    // Generate curved multi-segment corridor following Mumbai's coastal geography
    const points: [number, number][] = [];
    const stepsCount = 12;
    for (let i = 0; i <= stepsCount; i++) {
      const frac = i / stepsCount;
      const arc = Math.sin(frac * Math.PI) * 0.0055;
      const lat = oLat + (dLat - oLat) * frac;
      const lng = oLng + (dLng - oLng) * frac - arc;
      points.push([lat, lng]);
    }
    return points;
  }, [coordinates, oLat, oLng, dLat, dLng]);

  // Construct Authenticated CARTO Basemap URL
  const getTileUrl = (style: "dark" | "voyager" | "positron") => {
    const key = activeCartoKey || DEFAULT_CARTO_KEY;
    const keyParam = `?api_key=${key}`;
    switch (style) {
      case "dark":
        return `https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png${keyParam}`;
      case "voyager":
        return `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png${keyParam}`;
      case "positron":
        return `https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png${keyParam}`;
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

        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png"
        });

        if (!mapInstanceRef.current) {
          const map = L.map(mapContainerRef.current, {
            zoomControl: false,
            attributionControl: true
          }).setView([oLat, oLng], 12);

          const tileLayer = L.tileLayer(getTileUrl(mapStyle), {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a> &bull; Route Sense Live Mumbai Maps',
            subdomains: "abcd",
            maxZoom: 20
          });

          tileLayer.on("tileerror", () => {
            tileLayer.setUrl("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png");
          });

          tileLayer.addTo(map);

          tileLayerRef.current = tileLayer;
          mapInstanceRef.current = map;
        }

        const map = mapInstanceRef.current;
        const L_instance = leafletRef.current;

        if (tileLayerRef.current) {
          tileLayerRef.current.setUrl(getTileUrl(mapStyle));
        }

        // Clean up previous markers & layers (except tile layer and live vehicle marker)
        map.eachLayer((layer: any) => {
          if (
            (layer instanceof L_instance.Marker ||
              layer instanceof L_instance.Polyline ||
              layer instanceof L_instance.CircleMarker) &&
            layer !== liveVehicleMarkerRef.current
          ) {
            map.removeLayer(layer);
          }
        });
        waypointMarkersRef.current = [];

        // 1. Origin Departure Marker
        const startIcon = L_instance.divIcon({
          className: "custom-beacon-start",
          html: `<div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 30px; height: 30px; border-radius: 50%; background: rgba(249, 115, 22, 0.45); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 16px; height: 16px; border-radius: 50%; background: #f97316; border: 2.5px solid #ffffff; box-shadow: 0 0 14px rgba(249, 115, 22, 1); display: flex; align-items: center; justify-content: center;">
              <div style="width: 5px; height: 5px; border-radius: 50%; background: #ffffff;"></div>
            </div>
          </div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        const startMarker = L_instance.marker([oLat, oLng], { icon: startIcon }).addTo(map);
        startMarker.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; color: #0f172a; padding: 4px; line-height: 1.4;">
            <div style="font-weight: 800; color: #ea580c; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px;">Departure Point</div>
            <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-top: 2px;">${origin?.displayName || "Origin"}</div>
            <div style="color: #64748b; font-size: 11px;">${origin?.formattedAddress || "Mumbai MMR"}</div>
          </div>
        `);

        // 2. Destination Arrival Marker
        const endIcon = L_instance.divIcon({
          className: "custom-beacon-end",
          html: `<div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 30px; height: 30px; border-radius: 50%; background: rgba(244, 63, 94, 0.45); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 16px; height: 16px; border-radius: 50%; background: #f43f5e; border: 2.5px solid #ffffff; box-shadow: 0 0 14px rgba(244, 63, 94, 1); display: flex; align-items: center; justify-content: center;">
              <div style="width: 5px; height: 5px; border-radius: 50%; background: #ffffff;"></div>
            </div>
          </div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        const endMarker = L_instance.marker([dLat, dLng], { icon: endIcon }).addTo(map);
        endMarker.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; color: #0f172a; padding: 4px; line-height: 1.4;">
            <div style="font-weight: 800; color: #e11d48; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px;">Arrival Destination</div>
            <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-top: 2px;">${destination?.displayName || "Destination"}</div>
            <div style="color: #64748b; font-size: 11px;">${destination?.formattedAddress || "Mumbai MMR"}</div>
          </div>
        `);

        const routePoints = getRoutePoints();

        // 3. Draw Planned Corridor Polylines (Glowing Multi-layer)
        L_instance.polyline(routePoints, {
          color: primaryColor,
          weight: 10,
          opacity: 0.35,
          lineJoin: "round",
          lineCap: "round"
        }).addTo(map);

        L_instance.polyline(routePoints, {
          color: primaryColor,
          weight: 4.5,
          opacity: 0.95,
          lineJoin: "round",
          lineCap: "round"
        }).addTo(map);

        // 4. Waypoint markers for itinerary steps & interchange stops
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
              html: `<div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background: ${isHighlighted ? primaryColor : "rgba(255,255,255,0.25)"}; opacity: 0.6;"></div>
                <div style="width: 16px; height: 16px; border-radius: 50%; background: ${isHighlighted ? primaryColor : "#ffffff"}; border: 2px solid ${primaryColor}; box-shadow: 0 2px 8px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: ${isHighlighted ? "#fff" : "#0f172a"}; font-size: 9px; font-weight: 800;">
                  ${step.step_number || idx + 1}
                </div>
              </div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            });

            const marker = L_instance.marker(pt, { icon: waypointIcon }).addTo(map);
            marker.bindPopup(`
              <div style="font-family: inherit; font-size: 12px; color: #0f172a; padding: 4px; max-width: 220px;">
                <div style="font-size: 10px; font-weight: 800; color: #0284c7; text-transform: uppercase;">Step ${step.step_number || idx + 1} &bull; ${step.mode}</div>
                <div style="font-weight: 700; margin-top: 2px; font-size: 12px; color: #0f172a;">${step.instruction}</div>
                <div style="color: #64748b; font-size: 11px; margin-top: 2px;">${step.duration_min} mins ${step.distance_km > 0 ? `&bull; ${step.distance_km} km` : ""}</div>
              </div>
            `);

            marker.on("click", () => {
              if (onSelectStep) onSelectStep(idx);
            });

            markers.push(marker);
          });

          waypointMarkersRef.current = markers;
        }

        // 5. Fit bounds with auto-invalidation
        const bounds = L_instance.latLngBounds(routePoints);
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 16
        });

        // Ensure Leaflet recalculates canvas size after DOM attachment
        setTimeout(() => {
          if (map) {
            map.invalidateSize();
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
          }
        }, 250);
      })
      .catch((err) => {
        console.error("Leaflet live map initialization error:", err);
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

  // Live Corridor Simulation Animation Loop
  useEffect(() => {
    if (!isLiveRunning) return;

    const interval = setInterval(() => {
      setLiveProgress((prev) => {
        const step = 0.004 * playbackSpeed;
        const next = prev + step;
        if (next >= 1) {
          setIsLiveRunning(false);
          return 1;
        }
        return next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isLiveRunning, playbackSpeed]);

  // Update Live Vehicle Marker along the corridor
  useEffect(() => {
    if (!mapInstanceRef.current || !leafletRef.current) return;
    const L_instance = leafletRef.current;
    const map = mapInstanceRef.current;
    const routePoints = getRoutePoints();

    if (routePoints.length < 2) return;

    const currentPos = getInterpolatedPosition(routePoints, liveProgress);

    if (!liveVehicleMarkerRef.current) {
      const vehicleDivIcon = L_instance.divIcon({
        className: "live-vehicle-beacon",
        html: `
          <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: ${primaryColor}40; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: ${primaryColor}25; border: 1.5px solid ${primaryColor};"></div>
            <div style="width: 26px; height: 26px; border-radius: 50%; background: #090d16; border: 2.5px solid ${primaryColor}; box-shadow: 0 0 14px ${primaryColor}; display: flex; align-items: center; justify-content: center; font-size: 13px;">
              ${modeEmoji}
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      const marker = L_instance.marker(currentPos, {
        icon: vehicleDivIcon,
        zIndexOffset: 1000
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; color: #0f172a; padding: 4px; line-height: 1.4;">
          <div style="font-weight: 800; color: #0284c7; text-transform: uppercase; font-size: 10px;">Live Transit Vehicle</div>
          <div style="font-weight: 700; font-size: 13px; margin-top: 1px;">${journeyTitle || selectedMode}</div>
          <div style="color: #64748b; font-size: 10px;">CARTO Authenticated &bull; cb1_4jk9_1_bee4b9e4f372e1ce3f9056e0</div>
        </div>
      `);

      liveVehicleMarkerRef.current = marker;
    } else {
      liveVehicleMarkerRef.current.setLatLng(currentPos);
    }

    if (isLiveRunning && steps && steps.length > 0 && onSelectStep) {
      const stepIdx = Math.min(steps.length - 1, Math.floor(liveProgress * steps.length));
      onSelectStep(stepIdx);
    }
  }, [
    liveProgress,
    isLiveRunning,
    getRoutePoints,
    primaryColor,
    modeEmoji,
    selectedMode,
    journeyTitle,
    steps,
    onSelectStep
  ]);

  // Reset live tracking when origin, destination or mode changes
  useEffect(() => {
    setLiveProgress(0);
    setIsLiveRunning(false);
    if (liveVehicleMarkerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(liveVehicleMarkerRef.current);
      liveVehicleMarkerRef.current = null;
    }
  }, [origin, destination, selectedMode]);

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

        const marker = waypointMarkersRef.current[highlightedStepIndex];
        if (marker) {
          marker.openPopup();
        }
      }
    }
  }, [highlightedStepIndex, steps, getRoutePoints]);

  // Resize invalidation on fullscreen toggle
  useEffect(() => {
    if (mapInstanceRef.current) {
      const timer = setTimeout(() => {
        mapInstanceRef.current.invalidateSize();
        if (leafletRef.current) {
          const routePoints = getRoutePoints();
          const bounds = leafletRef.current.latLngBounds(routePoints);
          mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        }
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isFullscreen, getRoutePoints]);

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
      className={`relative rounded-[28px] overflow-hidden border border-white/10 bg-[#0f172a] shadow-2xl transition-all duration-300 ${
        isFullscreen
          ? "fixed inset-3 sm:inset-6 z-50 rounded-[32px] ring-2 ring-sky-500/50 shadow-black/95"
          : "w-full h-full min-h-[440px]"
      }`}
    >
      {/* Map Canvas */}
      {!mapError ? (
        <div ref={mapContainerRef} className="w-full h-full min-h-[440px] z-0" />
      ) : (
        <div className="w-full h-full min-h-[440px] flex flex-col items-center justify-center p-8 bg-slate-900 text-center">
          <div className="w-14 h-14 rounded-full bg-white/10 border border-white/10 flex items-center justify-center mb-3">
            <Compass className="w-6 h-6 text-sky-400" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">Live Corridor Overview</h3>
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

      {/* 1. TOP HEADER OVERLAY: CORRIDOR TITLE & BASEMAP SWITCHER */}
      <div className="absolute top-3.5 left-3.5 right-3.5 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left Transit Badge */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-white/15 px-3 py-1.5 rounded-full text-xs font-bold text-white flex items-center gap-2 shadow-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="tracking-wide uppercase text-[10px] text-emerald-300 font-mono">
              LIVE CORRIDOR MAP
            </span>
            <span className="text-stone-500 text-[10px]">&bull;</span>
            <span className="text-[11px] text-stone-200 truncate max-w-[150px] sm:max-w-none">
              {journeyTitle || `${selectedMode} Live Corridor`}
            </span>
          </div>

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
          <div className="bg-slate-900/90 backdrop-blur-xl border border-white/15 p-1 rounded-full flex items-center gap-1 shadow-xl">
            <button
              onClick={() => setMapStyle("dark")}
              title="Cyber Dark Spatial Basemap"
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                mapStyle === "dark"
                  ? "bg-sky-500 text-white shadow-sm"
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
                  ? "bg-amber-500 text-white shadow-sm"
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

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Exit Fullscreen" : "Expand to Fullscreen"}
            className="p-2 rounded-full bg-slate-900/90 hover:bg-slate-800 backdrop-blur-xl border border-white/15 text-stone-300 hover:text-white transition-all shadow-xl cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-sky-400" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. LIVE CORRIDOR SIMULATION CONTROLLER (CARTO Authenticated) */}
      <div className="absolute top-16 left-3.5 right-3.5 z-20 pointer-events-auto">
        <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/20 p-2 sm:p-2.5 rounded-2xl shadow-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-white">
          {/* Left: Play/Pause, Reset & CARTO Status */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (liveProgress >= 1) setLiveProgress(0);
                setIsLiveRunning(!isLiveRunning);
              }}
              className={`px-3.5 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95 ${
                isLiveRunning
                  ? "bg-amber-400 hover:bg-amber-300 text-slate-950"
                  : "bg-gradient-to-r from-emerald-400 to-teal-400 hover:opacity-95 text-slate-950"
              }`}
            >
              {isLiveRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                  <span>Pause Inspection</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                  <span>{liveProgress > 0 && liveProgress < 1 ? "Resume Corridor" : "Inspect Live Corridor"}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsLiveRunning(false);
                setLiveProgress(0);
              }}
              title="Reset to Start"
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-sky-500/15 border border-sky-500/30 text-[10px] text-sky-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>CARTO Live: {activeCartoKey.slice(0, 14)}... [Active]</span>
            </div>
          </div>

          {/* Right: Progress Slider & Speed Toggles */}
          <div className="flex items-center gap-2 flex-1 max-w-xs justify-end">
            <div className="flex-1 min-w-[80px] flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.005"
                value={liveProgress}
                onChange={(e) => setLiveProgress(parseFloat(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer h-1.5 bg-white/20 rounded-lg"
              />
              <span className="text-[10px] font-mono text-slate-300 w-8 text-right">
                {Math.round(liveProgress * 100)}%
              </span>
            </div>

            <div className="flex items-center rounded-lg bg-white/10 p-0.5 border border-white/10 text-[10px] font-bold">
              {[1, 2, 4].map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => setPlaybackSpeed(spd as 1 | 2 | 4)}
                  className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                    playbackSpeed === spd
                      ? "bg-white text-slate-900 font-extrabold shadow-sm"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. FLOATING RIGHT CONTROL COLUMN (Zoom, Fit, Navigation) */}
      <div className="absolute right-3.5 bottom-12 z-20 flex flex-col gap-2">
        <button
          onClick={handleRecenter}
          title="Recenter & Fit Corridor"
          className="p-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 backdrop-blur-xl border border-white/15 text-stone-300 hover:text-white transition-all shadow-xl cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="flex flex-col rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-white/15 shadow-xl overflow-hidden divide-y divide-white/10">
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

        <button
          onClick={openExternalNavigation}
          title="Open in Google Maps Navigation"
          className="p-2.5 rounded-2xl bg-gradient-to-tr from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 text-white border border-sky-400/40 shadow-xl transition-all cursor-pointer hover:scale-105"
        >
          <Navigation className="w-4 h-4" />
        </button>
      </div>

      {/* 4. BOTTOM OVERLAY: COORDINATES & STATUS */}
      <div className="absolute bottom-3 left-3.5 right-3.5 z-20 flex items-center justify-between gap-2 pointer-events-none">
        <div className="hidden sm:flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-[10px] text-stone-400 font-mono shadow-lg">
          <MapPin className="w-3 h-3 text-orange-400" />
          <span>{oLat.toFixed(3)}°N, {oLng.toFixed(3)}°E</span>
          <span>➔</span>
          <MapPin className="w-3 h-3 text-rose-400" />
          <span>{dLat.toFixed(3)}°N, {dLng.toFixed(3)}°E</span>
        </div>

        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-[10px] text-stone-300 flex items-center gap-1.5 shadow-lg">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>CARTO Key: cb1_4jk9_1_bee4b9e4f372e1ce3f9056e0 &bull; Live Mumbai MMR</span>
        </div>
      </div>
    </div>
  );
};
