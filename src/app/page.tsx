"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bus,
  Train,
  Car,
  Bike,
  Footprints,
  Search,
  ArrowUpDown,
  Navigation,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Sparkles,
  MapPin,
  CheckCircle2,
  Info,
  Clock,
  Compass,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Leaf,
  ExternalLink,
  RefreshCw,
  X
} from "lucide-react";
import { MultiModalOption, ResolvedLocation, RouteStep } from "@/types";
import { fetchApi } from "@/lib/api";
import { LocationAutocomplete } from "@/components/common/LocationAutocomplete";
import { InteractiveMap } from "@/components/common/InteractiveMap";

// Verified Initial Indian Hubs for instant exploration
const POPULAR_INDIAN_HUBS = [
  {
    label: "Mumbai (Dadar ➔ CSMT)",
    originText: "Dadar Railway Station",
    destText: "Chhatrapati Shivaji Maharaj Terminus",
    origin: {
      provider: "indian_transit_db",
      providerPlaceId: "in-bom-dadar-rail",
      displayName: "Dadar Railway Station",
      formattedAddress: "Dadar East, Mumbai, Maharashtra 400014",
      city: "Mumbai",
      state: "Maharashtra",
      countryCode: "IN",
      latitude: 19.0178,
      longitude: 72.8478,
      placeTypes: ["railway_station"],
      dataSource: "Indian Railways",
      retrievedAt: new Date().toISOString()
    } as ResolvedLocation,
    dest: {
      provider: "indian_transit_db",
      providerPlaceId: "in-bom-csmt",
      displayName: "Chhatrapati Shivaji Maharaj Terminus (CSMT)",
      formattedAddress: "Fort, Mumbai, Maharashtra 400001",
      city: "Mumbai",
      state: "Maharashtra",
      countryCode: "IN",
      latitude: 18.9400,
      longitude: 72.8353,
      placeTypes: ["railway_station", "landmark"],
      dataSource: "Central Railway",
      retrievedAt: new Date().toISOString()
    } as ResolvedLocation
  },
  {
    label: "Bengaluru (Silk Board ➔ Hebbal)",
    originText: "Central Silk Board TTMC",
    destText: "Hebbal Bus Station",
    origin: {
      provider: "indian_transit_db",
      providerPlaceId: "in-blr-silk-board",
      displayName: "Central Silk Board TTMC",
      formattedAddress: "Silk Board Junction, Bengaluru, Karnataka 560068",
      city: "Bengaluru",
      state: "Karnataka",
      countryCode: "IN",
      latitude: 12.9172,
      longitude: 77.6228,
      placeTypes: ["bus_terminal"],
      dataSource: "BMTC",
      retrievedAt: new Date().toISOString()
    } as ResolvedLocation,
    dest: {
      provider: "indian_transit_db",
      providerPlaceId: "in-blr-hebbal",
      displayName: "Hebbal Bus Station",
      formattedAddress: "Hebbal, Bengaluru, Karnataka 560024",
      city: "Bengaluru",
      state: "Karnataka",
      countryCode: "IN",
      latitude: 13.0359,
      longitude: 77.5970,
      placeTypes: ["bus_terminal"],
      dataSource: "BMTC",
      retrievedAt: new Date().toISOString()
    } as ResolvedLocation
  },
  {
    label: "Delhi (NDLS ➔ Rajiv Chowk)",
    originText: "New Delhi Railway Station (NDLS)",
    destText: "Rajiv Chowk Metro Station",
    origin: {
      provider: "indian_transit_db",
      providerPlaceId: "in-del-ndls",
      displayName: "New Delhi Railway Station (NDLS)",
      formattedAddress: "Paharganj, New Delhi, Delhi 110055",
      city: "New Delhi",
      state: "Delhi",
      countryCode: "IN",
      latitude: 28.6430,
      longitude: 77.2194,
      placeTypes: ["railway_station"],
      dataSource: "Northern Railway",
      retrievedAt: new Date().toISOString()
    } as ResolvedLocation,
    dest: {
      provider: "indian_transit_db",
      providerPlaceId: "in-del-rajiv-chowk",
      displayName: "Rajiv Chowk Metro Station",
      formattedAddress: "Connaught Place, New Delhi, Delhi 110001",
      city: "New Delhi",
      state: "Delhi",
      countryCode: "IN",
      latitude: 28.6328,
      longitude: 77.2197,
      placeTypes: ["metro_station"],
      dataSource: "DMRC",
      retrievedAt: new Date().toISOString()
    } as ResolvedLocation
  },
  {
    label: "Intercity (Mumbai ➔ Pune)",
    originText: "Mumbai CSMT",
    destText: "Pune Junction Railway Station",
    origin: {
      provider: "indian_transit_db",
      providerPlaceId: "in-bom-csmt",
      displayName: "Mumbai CSMT",
      formattedAddress: "Fort, Mumbai, Maharashtra 400001",
      city: "Mumbai",
      state: "Maharashtra",
      countryCode: "IN",
      latitude: 18.9400,
      longitude: 72.8353,
      placeTypes: ["railway_station"],
      dataSource: "Central Railway",
      retrievedAt: new Date().toISOString()
    } as ResolvedLocation,
    dest: {
      provider: "indian_transit_db",
      providerPlaceId: "in-pun-junction",
      displayName: "Pune Junction Railway Station",
      formattedAddress: "Pune Junction, Agarkar Nagar, Pune, Maharashtra 411001",
      city: "Pune",
      state: "Maharashtra",
      countryCode: "IN",
      latitude: 18.5289,
      longitude: 73.8744,
      placeTypes: ["railway_station"],
      dataSource: "Central Railway",
      retrievedAt: new Date().toISOString()
    } as ResolvedLocation
  }
];

export default function HomePage() {
  // Primary 2 inputs
  const [sourceText, setSourceText] = useState("Dadar Railway Station");
  const [sourceLoc, setSourceLoc] = useState<ResolvedLocation | null>(POPULAR_INDIAN_HUBS[0].origin);

  const [destText, setDestText] = useState("Chhatrapati Shivaji Maharaj Terminus");
  const [destLoc, setDestLoc] = useState<ResolvedLocation | null>(POPULAR_INDIAN_HUBS[0].dest);

  // Search State
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Results State
  const [routeOptions, setRouteOptions] = useState<MultiModalOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<MultiModalOption | null>(null);
  const [expandedOptionId, setExpandedOptionId] = useState<string | null>(null);
  const [highlightedStepIndex, setHighlightedStepIndex] = useState<number | null>(null);

  // Filters & Advanced Settings (Optional / Secondary)
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [passengers, setPassengers] = useState(1);
  const [fuelPrice, setFuelPrice] = useState(104.21);
  const [carEfficiency, setCarEfficiency] = useState(15.0);
  const [bikeEfficiency, setBikeEfficiency] = useState(45.0);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<"ALL" | "TRANSIT" | "CAB_AUTO" | "PERSONAL">("ALL");

  // Diagnostics & Status
  const [providerStatus, setProviderStatus] = useState<{
    is_configured: boolean;
    status: string;
    message: string;
  } | null>(null);
  const [trafficStatus, setTrafficStatus] = useState<string | null>(null);

  // Execute Search Function
  const executeSearch = async (
    sLoc: ResolvedLocation | null = sourceLoc,
    dLoc: ResolvedLocation | null = destLoc,
    sText: string = sourceText,
    dText: string = destText
  ) => {
    if (loading) return;

    setValidationError(null);
    setApiError(null);

    const cleanSourceText = sText.trim();
    const cleanDestText = dText.trim();

    // Validation
    if (!cleanSourceText) {
      setValidationError("Please enter a starting location.");
      return;
    }
    if (!cleanDestText) {
      setValidationError("Please enter a destination location.");
      return;
    }
    if (cleanSourceText.toLowerCase() === cleanDestText.toLowerCase()) {
      setValidationError("Source and destination must be different.");
      return;
    }

    setLoading(true);

    let activeSourceLoc = sLoc;
    let activeDestLoc = dLoc;

    // Resolve Origin if not resolved
    if (!activeSourceLoc || activeSourceLoc.latitude === 0) {
      try {
        const res = await fetchApi<{ location: ResolvedLocation }>(
          `/location/resolve?q=${encodeURIComponent(cleanSourceText)}`
        );
        if (res && res.location && res.location.latitude !== 0) {
          activeSourceLoc = res.location;
          setSourceLoc(activeSourceLoc);
        }
      } catch (err) {
        console.warn("Could not resolve starting location", err);
      }
    }

    // Resolve Destination if not resolved
    if (!activeDestLoc || activeDestLoc.latitude === 0) {
      try {
        const res = await fetchApi<{ location: ResolvedLocation }>(
          `/location/resolve?q=${encodeURIComponent(cleanDestText)}`
        );
        if (res && res.location && res.location.latitude !== 0) {
          activeDestLoc = res.location;
          setDestLoc(activeDestLoc);
        }
      } catch (err) {
        console.warn("Could not resolve destination location", err);
      }
    }

    if (!activeSourceLoc) {
      setValidationError("Please select a verified starting location from suggestions.");
      setLoading(false);
      return;
    }
    if (!activeDestLoc) {
      setValidationError("Please select a verified destination location from suggestions.");
      setLoading(false);
      return;
    }

    const originName = activeSourceLoc.displayName || cleanSourceText;
    const destName = activeDestLoc.displayName || cleanDestText;

    let url = `/planner/route?origin=${encodeURIComponent(originName)}&destination=${encodeURIComponent(destName)}`;

    if (activeSourceLoc.latitude && activeSourceLoc.longitude) {
      url += `&origin_lat=${activeSourceLoc.latitude}&origin_lng=${activeSourceLoc.longitude}`;
    }
    if (activeDestLoc.latitude && activeDestLoc.longitude) {
      url += `&dest_lat=${activeDestLoc.latitude}&dest_lng=${activeDestLoc.longitude}`;
    }

    url += `&passengers=${passengers}&fuel_price=${fuelPrice}&car_eff=${carEfficiency}&bike_eff=${bikeEfficiency}`;

    try {
      const res = await fetchApi<{
        route_options: MultiModalOption[];
        origin: ResolvedLocation;
        destination: ResolvedLocation;
        google_maps_status?: { is_configured: boolean; status: string; message: string };
        traffic_status?: string;
      }>(url);

      if (res && res.route_options && res.route_options.length > 0) {
        setRouteOptions(res.route_options);
        setSelectedOption(res.route_options[0]);
        setExpandedOptionId(res.route_options[0].journey_id || null);
        if (res.origin) setSourceLoc(res.origin);
        if (res.destination) setDestLoc(res.destination);
        if (res.google_maps_status) setProviderStatus(res.google_maps_status);
        if (res.traffic_status) setTrafficStatus(res.traffic_status);
      } else {
        setRouteOptions([]);
        setSelectedOption(null);
        setApiError("No supported journey route was found between these Indian locations.");
      }
    } catch (err: any) {
      console.error("Search API Failure:", err);
      setApiError("Journey routing is temporarily unavailable. Please retry or adjust points.");
    } finally {
      setLoading(false);
    }
  };

  // Swap locations handler
  const handleSwapLocations = () => {
    const tempText = sourceText;
    const tempLoc = sourceLoc;
    setSourceText(destText);
    setSourceLoc(destLoc);
    setDestText(tempText);
    setDestLoc(tempLoc);
    if (destLoc && tempLoc) {
      executeSearch(destLoc, tempLoc, destText, tempText);
    }
  };

  // Initial load auto-search
  useEffect(() => {
    executeSearch();
  }, []);

  // Filtered route options
  const filteredOptions = routeOptions.filter((opt) => {
    if (activeCategoryFilter === "ALL") return true;
    if (activeCategoryFilter === "TRANSIT") return ["TRAIN", "METRO", "BUS"].includes(opt.transport_mode || opt.mode);
    if (activeCategoryFilter === "CAB_AUTO") return ["CAB", "AUTO", "BIKE"].includes(opt.transport_mode || opt.mode);
    if (activeCategoryFilter === "PERSONAL") return ["CAR_PERSONAL", "MOTORCYCLE_PERSONAL"].includes(opt.transport_mode || opt.mode);
    return true;
  });

  const getPriceBadgeStyle = (priceType?: string) => {
    switch (priceType) {
      case "LIVE_PROVIDER_QUOTE":
        return "bg-emerald-950/80 text-emerald-400 border-emerald-800/80";
      case "API_TRANSIT_FARE":
        return "bg-cyan-950/80 text-cyan-400 border-cyan-800/80";
      case "OFFICIAL_TARIFF":
        return "bg-sky-950/80 text-sky-400 border-sky-800/80";
      case "ESTIMATED_FARE":
        return "bg-amber-950/80 text-amber-400 border-amber-800/80";
      case "ESTIMATED_OPERATING_COST":
        return "bg-indigo-950/80 text-indigo-400 border-indigo-800/80";
      case "HISTORICAL_REFERENCE":
        return "bg-purple-950/80 text-purple-400 border-purple-800/80";
      default:
        return "bg-slate-900 text-slate-400 border-slate-800";
    }
  };

  const getPriceLabel = (priceType?: string) => {
    switch (priceType) {
      case "LIVE_PROVIDER_QUOTE":
        return "Live Quote";
      case "API_TRANSIT_FARE":
        return "Google Fare";
      case "OFFICIAL_TARIFF":
        return "Official Tariff";
      case "ESTIMATED_FARE":
        return "Estimated Fare";
      case "ESTIMATED_OPERATING_COST":
        return "Fuel Cost";
      case "HISTORICAL_REFERENCE":
        return "Rail Benchmark";
      case "PRICE_UNAVAILABLE":
        return "Fare Unavailable";
      default:
        return "Tariff";
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "TRAIN":
        return <Train className="w-5 h-5 text-purple-400" />;
      case "METRO":
        return <Train className="w-5 h-5 text-violet-400" />;
      case "BUS":
        return <Bus className="w-5 h-5 text-sky-400" />;
      case "CAB":
        return <Car className="w-5 h-5 text-amber-400" />;
      case "AUTO":
        return <Car className="w-5 h-5 text-orange-400" />;
      case "BIKE":
        return <Bike className="w-5 h-5 text-emerald-400" />;
      case "CAR_PERSONAL":
        return <Car className="w-5 h-5 text-cyan-400" />;
      case "MOTORCYCLE_PERSONAL":
        return <Bike className="w-5 h-5 text-teal-400" />;
      default:
        return <Compass className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full flex flex-col lg:flex-row bg-[#070b14] overflow-hidden">
      {/* 1. LEFT SPATIAL PANEL: Search & Journey Options */}
      <div className="w-full lg:w-[480px] xl:w-[520px] shrink-0 bg-[#090d16]/95 lg:bg-[#090d16]/90 backdrop-blur-2xl border-b lg:border-b-0 lg:border-r border-slate-800/80 p-4 sm:p-6 flex flex-col z-20 shadow-2xl overflow-y-auto max-h-none lg:max-h-[calc(100vh-4rem)]">
        {/* Spatial Title & Tagline */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <h2 className="text-sm font-bold tracking-widest text-cyan-400 uppercase font-mono">
              ROUTE SENSE INDIA
            </h2>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Find the best way to get there.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Real Google Places, Routes API geometry, and verified multimodal transport tariffs.
          </p>
        </div>

        {/* 2. THE SEARCH FORM: EXACTLY TWO REQUIRED INPUTS */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            executeSearch();
          }}
          className="space-y-3 bg-[#0c1220]/80 p-4 rounded-3xl border border-slate-800 shadow-xl"
        >
          {/* Source Input */}
          <LocationAutocomplete
            label="Source"
            placeholder="Enter city, state, area, address or starting point"
            value={sourceText}
            selectedLocation={sourceLoc}
            onSelectLocation={setSourceLoc}
            onTextChange={setSourceText}
            accentColor="emerald"
            errorMessage={validationError && !sourceText ? validationError : undefined}
          />

          {/* Subtle Swap Locations Button */}
          <div className="flex justify-center -my-1 relative z-10">
            <button
              type="button"
              onClick={handleSwapLocations}
              title="Swap source and destination"
              className="p-2 rounded-full bg-slate-900 border border-slate-700 hover:border-cyan-500/80 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-all shadow-md cursor-pointer hover:rotate-180 duration-300"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Destination Input */}
          <LocationAutocomplete
            label="Destination"
            placeholder="Enter city, state, area, address or landmark"
            value={destText}
            selectedLocation={destLoc}
            onSelectLocation={setDestLoc}
            onTextChange={setDestText}
            accentColor="rose"
            errorMessage={validationError && !destText ? validationError : undefined}
          />

          {/* Validation Error Banner */}
          {validationError && (
            <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Primary Action Button: Find Journeys */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-600 via-sky-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white font-bold text-sm tracking-wide shadow-lg shadow-cyan-950/50 hover:shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Finding journeys...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4 text-white" />
                <span>Find Journeys</span>
              </>
            )}
          </button>

          {/* Optional Collapsible Settings (Passengers, Fuel price, Efficiency) */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 font-medium transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3 h-3 text-cyan-400" />
              <span>{showAdvancedSettings ? "Hide Preferences" : "Vehicle & Pricing Preferences"}</span>
              {showAdvancedSettings ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showAdvancedSettings && (
              <div className="mt-2 p-3 rounded-2xl bg-[#090d16] border border-slate-800 space-y-2.5 text-xs text-slate-300 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Passengers:</span>
                  <div className="flex items-center gap-2">
                    {[1, 2, 4, 6].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPassengers(p)}
                        className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${
                          passengers === p
                            ? "bg-cyan-600 text-white"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Fuel (₹/Litre):</span>
                  <input
                    type="number"
                    value={fuelPrice}
                    onChange={(e) => setFuelPrice(parseFloat(e.target.value) || 104.21)}
                    step="0.5"
                    className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-0.5 text-right text-xs text-white"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Car Mileage (km/L):</span>
                  <input
                    type="number"
                    value={carEfficiency}
                    onChange={(e) => setCarEfficiency(parseFloat(e.target.value) || 15.0)}
                    step="1"
                    className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-0.5 text-right text-xs text-white"
                  />
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Quick Indian Hub Suggestions */}
        <div className="mt-4 mb-4">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Suggested Corridors
          </p>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_INDIAN_HUBS.map((hub, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSourceText(hub.originText);
                  setSourceLoc(hub.origin);
                  setDestText(hub.destText);
                  setDestLoc(hub.dest);
                  executeSearch(hub.origin, hub.dest, hub.originText, hub.destText);
                }}
                className="text-[11px] font-medium px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
              >
                {hub.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. JOURNEY RESULTS COMPARISON LIST */}
        <div className="flex-1 flex flex-col mt-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>Available Options</span>
              <span className="px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px]">
                {filteredOptions.length}
              </span>
            </h3>

            {/* Mode Category Filter Pills */}
            <div className="flex items-center gap-1 text-[10px] font-medium">
              {(["ALL", "TRANSIT", "CAB_AUTO", "PERSONAL"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategoryFilter(cat)}
                  className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                    activeCategoryFilter === cat
                      ? "bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {cat === "ALL" ? "All" : cat === "TRANSIT" ? "Transit" : cat === "CAB_AUTO" ? "Cab/Auto" : "Personal"}
                </button>
              ))}
            </div>
          </div>

          {/* API Error Banner with Retry */}
          {apiError && (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800 text-xs text-rose-300 mb-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-rose-200 mb-1">{apiError}</p>
                <button
                  onClick={() => executeSearch()}
                  className="mt-2 px-3 py-1 bg-rose-900/80 hover:bg-rose-800 rounded-lg text-white font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry Search</span>
                </button>
              </div>
            </div>
          )}

          {/* Journey Options List */}
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              <p className="text-xs font-medium">Computing optimal routes across India...</p>
            </div>
          ) : filteredOptions.length > 0 ? (
            <div className="space-y-3">
              {filteredOptions.map((opt) => {
                const isSelected = selectedOption?.journey_id === opt.journey_id;
                const isExpanded = expandedOptionId === opt.journey_id;
                const modeKey = opt.transport_mode || opt.mode;

                return (
                  <div
                    key={opt.journey_id || Math.random()}
                    onClick={() => {
                      setSelectedOption(opt);
                      setExpandedOptionId(isExpanded ? null : opt.journey_id || null);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? "bg-slate-900/95 border-cyan-500/80 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/30"
                        : "bg-[#0b101d]/80 border-slate-800/80 hover:border-slate-700 hover:bg-[#0e1424]"
                    }`}
                  >
                    {/* Top Row: Mode, Title, Price */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 shrink-0 mt-0.5">
                          {getModeIcon(modeKey)}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-white">{opt.title}</span>
                            {opt.recommended && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                                Recommended
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{opt.operator}</p>
                        </div>
                      </div>

                      {/* Quoted Price */}
                      <div className="text-right shrink-0">
                        <div className="text-base sm:text-lg font-black text-white">
                          ₹{opt.quoted_price_inr ?? opt.fare_inr}
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded border inline-block mt-0.5 ${getPriceBadgeStyle(
                            opt.price_type
                          )}`}
                        >
                          {getPriceLabel(opt.price_type)}
                        </span>
                      </div>
                    </div>

                    {/* Middle Row: Duration, Distance, Departure */}
                    <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800/60">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 font-semibold text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{opt.total_duration_minutes ?? opt.duration_min} mins</span>
                        </span>
                        <span>•</span>
                        <span>{opt.route_distance_km ?? opt.distance_km} km</span>
                        {opt.transfers !== undefined && (
                          <>
                            <span>•</span>
                            <span>{opt.transfers === 0 ? "Direct" : `${opt.transfers} transfers`}</span>
                          </>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400">
                        {opt.departure_at ? `Departs ${opt.departure_at}` : opt.next_departure}
                      </div>
                    </div>

                    {/* 4. EXPANDABLE ITINERARY & FARE BREAKDOWN DRAWER */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-800 text-xs space-y-3 animate-fadeIn">
                        {/* Traffic & Environmental Impact */}
                        <div className="flex items-center justify-between text-[11px] p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                          <span className="text-slate-400">
                            Condition: <strong className="text-slate-200">{opt.traffic_status}</strong>
                          </span>
                          <span className="text-emerald-400 flex items-center gap-1 font-medium">
                            <Leaf className="w-3 h-3" />
                            <span>{opt.co2_emissions_g}g CO₂</span>
                          </span>
                        </div>

                        {/* Itinerary Steps */}
                        {opt.steps && opt.steps.length > 0 && (
                          <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                              Itinerary Steps
                            </p>
                            <div className="space-y-2">
                              {opt.steps.map((st, i) => (
                                <div
                                  key={i}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setHighlightedStepIndex(i);
                                  }}
                                  className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition-colors cursor-pointer ${
                                    highlightedStepIndex === i
                                      ? "bg-cyan-950/50 border-cyan-700/80 text-white"
                                      : "bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/40 text-slate-300"
                                  }`}
                                >
                                  <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-cyan-400 shrink-0">
                                    {st.step_number}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-xs">{st.instruction}</p>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                      <span>{st.mode}</span>
                                      <span>•</span>
                                      <span>{st.duration_min} mins</span>
                                      {st.distance_km > 0 && (
                                        <>
                                          <span>•</span>
                                          <span>{st.distance_km} km</span>
                                        </>
                                      )}
                                      {st.detail && (
                                        <>
                                          <span>•</span>
                                          <span className="italic truncate">{st.detail}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Assumptions & Provenance */}
                        {opt.assumptions && opt.assumptions.length > 0 && (
                          <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800 text-[11px] text-slate-400">
                            <p className="font-bold text-slate-300 mb-1">Calculation Provenance:</p>
                            <ul className="list-disc pl-4 space-y-0.5">
                              {opt.assumptions.map((asm, idx) => (
                                <li key={idx}>{asm}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Compass className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-xs">No routes match the selected filter category.</p>
            </div>
          )}
        </div>
      </div>

      {/* 2. RIGHT SPATIAL PANEL: FULL-VIEWPORT MAP CANVAS */}
      <div className="flex-1 h-[460px] lg:h-auto relative bg-[#070b14] overflow-hidden p-2 sm:p-4">
        <InteractiveMap
          origin={sourceLoc}
          destination={destLoc}
          selectedMode={selectedOption?.transport_mode || selectedOption?.mode || "BUS"}
          coordinates={selectedOption?.coordinates}
          polyline={selectedOption?.polyline}
          steps={selectedOption?.steps}
          highlightedStepIndex={highlightedStepIndex}
          onSelectStep={setHighlightedStepIndex}
        />
      </div>
    </div>
  );
}
