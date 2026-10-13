"use client";

import React, { useState, useEffect } from "react";
import {
  Bus,
  Train,
  Car,
  Bike,
  Search,
  ArrowUpDown,
  Navigation,
  AlertCircle,
  Loader2,
  Sparkles,
  MapPin,
  CheckCircle2,
  Clock,
  Compass,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Leaf,
  ChevronRight,
  Ticket,
  ShieldCheck,
  RefreshCw,
  X
} from "lucide-react";
import { MultiModalOption, ResolvedLocation, RouteStep } from "@/types";
import { fetchApi } from "@/lib/api";
import { LocationAutocomplete } from "@/components/common/LocationAutocomplete";
import { InteractiveMap } from "@/components/common/InteractiveMap";
import { BookingModal } from "@/components/booking/BookingModal";

// Popular Indian Corridors
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

// Top Transit Operators list matching the uploaded image's "Top Artist" section
const TOP_OPERATORS = [
  { name: "BEST Undertaking", subtitle: "Bus Non-AC (₹10-₹60) & AC (₹12-₹65)", icon: "🚌", color: "from-amber-500 to-orange-600" },
  { name: "Central Railway", subtitle: "Mumbai Local II (₹5-₹30) & I (₹65-₹235)", icon: "🚆", color: "from-rose-500 to-red-600" },
  { name: "Mumbai RTO Taxi & Auto", subtitle: "Kaali-Peeli Taxi & Auto (Sept 2026)", icon: "🚖", color: "from-yellow-500 to-amber-600" },
  { name: "Uber & Ola", subtitle: "UberGo (~₹184) / Ola Mini (~₹173)", icon: "🚗", color: "from-blue-500 to-cyan-600" },
  { name: "Rapido", subtitle: "Bike Taxi (~₹50) & Auto Lite (₹12-₹15/km)", icon: "🛵", color: "from-emerald-500 to-teal-600" },
  { name: "Indian Railways (IRCTC)", subtitle: "UTS & Express 2S / SL / 3A / 2A / 1A", icon: "🚂", color: "from-purple-500 to-indigo-600" },
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
  const [highlightedStepIndex, setHighlightedStepIndex] = useState<number | null>(null);

  // Booking Modal State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingJourney, setBookingJourney] = useState<MultiModalOption | null>(null);

  // Category Filter Pill (matching image's top pills & bottom dock)
  const [activeCategory, setActiveCategory] = useState<"ALL" | "MUMBAI" | "CABS" | "AUTOS" | "BIKES" | "EXPRESS" | "PERSONAL">("ALL");

  // Secondary Settings
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [passengers, setPassengers] = useState(1);
  const [fuelPrice, setFuelPrice] = useState(104.21);
  const [carEfficiency, setCarEfficiency] = useState(15.0);
  const [bikeEfficiency, setBikeEfficiency] = useState(45.0);

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
        console.warn("Could not resolve source location", err);
      }
    }

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

    // Always provide valid fallback location so search never blocks user
    if (!activeSourceLoc) {
      activeSourceLoc = {
        provider: "indian_transit_db",
        providerPlaceId: `custom-src-${Date.now()}`,
        displayName: cleanSourceText,
        formattedAddress: `${cleanSourceText}, India`,
        city: "Mumbai",
        state: "Maharashtra",
        countryCode: "IN",
        latitude: 19.0178,
        longitude: 72.8478,
        placeTypes: ["locality"],
        dataSource: "RouteSense Indian Location Index",
        retrievedAt: new Date().toISOString()
      };
      setSourceLoc(activeSourceLoc);
    }
    if (!activeDestLoc) {
      activeDestLoc = {
        provider: "indian_transit_db",
        providerPlaceId: `custom-dest-${Date.now()}`,
        displayName: cleanDestText,
        formattedAddress: `${cleanDestText}, India`,
        city: "Mumbai",
        state: "Maharashtra",
        countryCode: "IN",
        latitude: 18.9400,
        longitude: 72.8353,
        placeTypes: ["locality"],
        dataSource: "RouteSense Indian Location Index",
        retrievedAt: new Date().toISOString()
      };
      setDestLoc(activeDestLoc);
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
      }>(url);

      if (res && res.route_options && res.route_options.length > 0) {
        setRouteOptions(res.route_options);
        setSelectedOption(res.route_options[0]);
        if (res.origin) setSourceLoc(res.origin);
        if (res.destination) setDestLoc(res.destination);
      } else {
        setRouteOptions([]);
        setSelectedOption(null);
        setApiError("No supported route found between these locations.");
      }
    } catch (err: any) {
      console.error("Route search failure:", err);
      setApiError("Journey routing temporarily unavailable. Please retry.");
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

  // Auto-search initial hub
  useEffect(() => {
    executeSearch();
  }, []);

  // Filter options based on active category
  const filteredOptions = routeOptions.filter((opt) => {
    const id = opt.journey_id || "";
    const mode = opt.transport_mode || opt.mode;
    const title = (opt.title || "").toLowerCase();
    const cat = (opt.vehicle_category || "").toLowerCase();

    if (activeCategory === "ALL") return true;
    if (activeCategory === "MUMBAI") {
      return (
        id.includes("MUMBAI-LOCAL") ||
        id.includes("BEST-BUS") ||
        id.includes("METRO") ||
        title.includes("best") ||
        title.includes("local train") ||
        cat.includes("best") ||
        cat.includes("suburban")
      );
    }
    if (activeCategory === "CABS") {
      return id.includes("CAB") || id.includes("TAXI") || id.includes("UBER-GO") || id.includes("OLA-MINI");
    }
    if (activeCategory === "AUTOS") {
      return id.includes("AUTO") || mode === "AUTO";
    }
    if (activeCategory === "BIKES") {
      return id.includes("BIKE") && !id.includes("PERSONAL");
    }
    if (activeCategory === "EXPRESS") {
      return id.includes("EXPRESS-TRAIN") || id.includes("INTERCITY") || title.includes("uts") || title.includes("irctc");
    }
    if (activeCategory === "PERSONAL") {
      return id.includes("PERSONAL") || mode === "CAR_PERSONAL" || mode === "MOTORCYCLE_PERSONAL";
    }
    return true;
  });

  const recommendedOption = routeOptions.find((o) => o.recommended) || routeOptions[0];

  return (
    <div className="w-full flex flex-col gap-6 font-sans">
      
      {/* 1. GREETING & CATEGORY PILLS (Matching uploaded image top section) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Hello, Commuter
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Compare verified fares, travel times & carbon metrics across India.
          </p>
        </div>

        {/* Category Pills matching the image's top capsule pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: "ALL", label: "All Fares", emoji: "⚡" },
            { id: "MUMBAI", label: "BEST & Local Rail", emoji: "🚆" },
            { id: "CABS", label: "Cabs & Taxi", emoji: "🚖" },
            { id: "AUTOS", label: "Auto Rickshaws", emoji: "🛺" },
            { id: "BIKES", label: "Bike Taxis", emoji: "🛵" },
            { id: "EXPRESS", label: "Express Trains", emoji: "🚂" },
            { id: "PERSONAL", label: "Personal Vehicle", emoji: "🔋" },
          ].map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                  isActive
                    ? "bg-[#fce7df] text-stone-900 border border-[#fce7df] shadow-md scale-105"
                    : "bg-white/10 text-stone-300 hover:bg-white/15 border border-white/10"
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. HERO ROW: SPOTLIGHT CARD + TOP OPERATORS (Matching uploaded image hero section) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Hero Spotlight Card (Matching "Tupac Shakur Live Concert" card) */}
        <div className="lg:col-span-8 rounded-[30px] bg-gradient-to-r from-purple-800 via-rose-600 to-amber-500 p-6 sm:p-7 text-white relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[240px]">
          {/* Background Ambient Glow & Shapes */}
          <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-amber-400/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full bg-purple-900/40 blur-3xl pointer-events-none" />

          {/* Top Tag & Header */}
          <div className="relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-md border border-white/20 text-rose-200 inline-block mb-3">
              RECOMMENDED PASS
            </span>
            <h3 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white drop-shadow-md">
              {recommendedOption?.title || "MUMBAI SUBURBAN EXPRESS"}
            </h3>
            <p className="text-xs sm:text-sm text-rose-100 max-w-md mt-1 drop-shadow-sm font-medium">
              {recommendedOption?.operator || "Central Railway"} &bull; {recommendedOption?.total_duration_minutes ?? recommendedOption?.duration_min ?? 28} mins &bull; {recommendedOption?.route_distance_km ?? recommendedOption?.distance_km ?? 10.3} km
            </p>
          </div>

          {/* Bottom Action Button (Deep Rose/Burgundy Pill matching "Get the pass") */}
          <div className="relative z-10 mt-6 flex items-center justify-between">
            <button
              onClick={() => {
                if (recommendedOption) {
                  setSelectedOption(recommendedOption);
                  setBookingJourney(recommendedOption);
                  setIsBookingOpen(true);
                }
              }}
              className="px-5 py-2.5 rounded-full bg-[#881337] hover:bg-[#9f1239] text-white font-extrabold text-xs tracking-wide shadow-lg shadow-black/40 hover:scale-105 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Ticket className="w-3.5 h-3.5 text-rose-200" />
              <span>Get the pass &bull; ₹{recommendedOption?.quoted_price_inr ?? recommendedOption?.fare_inr ?? 15}</span>
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-rose-100 bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-md">
              <Leaf className="w-3.5 h-3.5 text-emerald-300" />
              <span>{recommendedOption?.co2_emissions_g ?? 70}g CO₂</span>
            </div>
          </div>
        </div>

        {/* Right Card: Top Transit Operators (Matching "Top Artist" section) */}
        <div className="lg:col-span-4 rounded-[30px] vision-card p-5 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-white">Top Operators</h4>
            <span className="text-xs font-semibold text-amber-400 hover:text-amber-300 cursor-pointer">
              See more &gt;
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
            {TOP_OPERATORS.slice(0, 4).map((op, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-2xl hover:bg-white/10 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${op.color} flex items-center justify-center text-sm shadow-md shrink-0`}>
                    {op.icon}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white group-hover:text-rose-300 transition-colors">
                      {op.name}
                    </p>
                    <p className="text-[10px] text-stone-400">{op.subtitle}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-500 group-hover:text-white transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. SEARCH FORM: THE TWO REQUIRED INPUTS (VisionOS Command Bar) */}
      <div id="search-corridor" className="w-full rounded-[28px] vision-card p-4 sm:p-5 shadow-2xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            executeSearch();
          }}
          className="flex flex-col md:flex-row items-center gap-3"
        >
          {/* Source Input */}
          <div className="flex-1 w-full">
            <LocationAutocomplete
              inputId="source-input"
              label="Source"
              placeholder="Enter city, station, locality or starting point"
              value={sourceText}
              selectedLocation={sourceLoc}
              onSelectLocation={setSourceLoc}
              onTextChange={setSourceText}
              accentColor="orange"
              errorMessage={validationError && !sourceText ? validationError : undefined}
            />
          </div>

          {/* Swap Button Pill */}
          <div className="flex items-center justify-center self-center shrink-0 -my-1 md:my-0 mt-5 md:mt-5">
            <button
              type="button"
              onClick={handleSwapLocations}
              title="Swap source and destination"
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-stone-300 hover:text-white transition-all shadow-md cursor-pointer hover:rotate-180 duration-300"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>

          {/* Destination Input */}
          <div className="flex-1 w-full">
            <LocationAutocomplete
              label="Destination"
              placeholder="Enter city, landmark, station or destination"
              value={destText}
              selectedLocation={destLoc}
              onSelectLocation={setDestLoc}
              onTextChange={setDestText}
              accentColor="rose"
              errorMessage={validationError && !destText ? validationError : undefined}
            />
          </div>

          {/* Find Journeys Button (Warm Coral Gradient Pill) */}
          <div className="w-full md:w-auto shrink-0 mt-5">
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-7 py-3 rounded-full bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 hover:from-rose-600 hover:to-orange-600 text-white font-bold text-xs tracking-wider uppercase shadow-lg shadow-rose-950/50 hover:scale-105 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 text-white" />
                  <span>Find Journeys</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="mt-3 p-2.5 rounded-2xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Quick Corridor Suggestions */}
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between flex-wrap gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-stone-400">Popular Corridors:</span>
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
                className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-stone-300 hover:text-white transition-all cursor-pointer"
              >
                {hub.label}
              </button>
            ))}
          </div>

          {/* Preferences Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            className="text-stone-400 hover:text-stone-200 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3 h-3 text-rose-400" />
            <span>{showAdvancedSettings ? "Hide Settings" : "Vehicle & Fuel Settings"}</span>
            {showAdvancedSettings ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Optional Settings Drawer */}
        {showAdvancedSettings && (
          <div className="mt-3 p-3.5 rounded-2xl bg-black/30 border border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-stone-300">
            <div>
              <span className="block text-stone-400 text-[11px] mb-1">Passengers:</span>
              <div className="flex items-center gap-1.5">
                {[1, 2, 4, 6].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPassengers(p)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      passengers === p
                        ? "bg-rose-500 text-white"
                        : "bg-white/10 text-stone-300 hover:bg-white/15"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-stone-400 text-[11px] mb-1">Fuel Price (₹/Litre):</span>
              <input
                type="number"
                value={fuelPrice}
                onChange={(e) => setFuelPrice(parseFloat(e.target.value) || 104.21)}
                className="w-full bg-white/10 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white"
              />
            </div>

            <div>
              <span className="block text-stone-400 text-[11px] mb-1">Car Mileage (km/L):</span>
              <input
                type="number"
                value={carEfficiency}
                onChange={(e) => setCarEfficiency(parseFloat(e.target.value) || 15.0)}
                className="w-full bg-white/10 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* 4. JOURNEY PASSES GRID (Matching uploaded image "Concert Pass" section) */}
      <div id="journey-passes" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span>Available Journey Passes</span>
            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold">
              {filteredOptions.length} Options
            </span>
          </h3>

          <span className="text-xs font-semibold text-amber-400 hover:text-amber-300 cursor-pointer">
            See more &gt;
          </span>
        </div>

        {/* API Error Banner */}
        {apiError && (
          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>{apiError}</span>
            </div>
            <button
              onClick={() => executeSearch()}
              className="px-3 py-1 bg-rose-900 rounded-full font-bold text-white hover:bg-rose-800 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Cards Carousel / Grid */}
        {loading ? (
          <div className="py-16 text-center text-stone-400 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-rose-400" />
            <p className="text-xs font-medium">Computing live routes across India...</p>
          </div>
        ) : filteredOptions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredOptions.map((opt, idx) => {
              const isSelected = selectedOption?.journey_id === opt.journey_id;
              const mode = opt.transport_mode || opt.mode;

              // Color accents per mode
              const gradientMap: Record<string, string> = {
                TRAIN: "from-rose-950/80 via-purple-950/60 to-stone-900",
                METRO: "from-purple-950/80 via-indigo-950/60 to-stone-900",
                BUS: "from-orange-950/80 via-amber-950/60 to-stone-900",
                CAB: "from-amber-950/80 via-yellow-950/60 to-stone-900",
                AUTO: "from-yellow-950/80 via-orange-950/60 to-stone-900",
                BIKE: "from-emerald-950/80 via-teal-950/60 to-stone-900",
                CAR_PERSONAL: "from-rose-950/80 via-stone-900 to-stone-900",
                MOTORCYCLE_PERSONAL: "from-orange-950/80 via-stone-900 to-stone-900",
              };

              return (
                <div
                  key={opt.journey_id || idx}
                  onClick={() => setSelectedOption(opt)}
                  className={`rounded-[24px] vision-card p-3.5 flex flex-col justify-between transition-all cursor-pointer relative group ${
                    isSelected
                      ? "ring-2 ring-rose-500/80 shadow-2xl bg-white/10 scale-[1.02]"
                      : "hover:scale-[1.01] hover:bg-white/8"
                  }`}
                >
                  {/* Top Preview Banner (Matching the illustration banners in the image) */}
                  <div className={`rounded-[18px] h-28 w-full bg-gradient-to-br ${gradientMap[mode] || "from-stone-900 to-stone-950"} border border-white/10 p-3 flex flex-col justify-between overflow-hidden relative shadow-inner mb-3`}>
                    <div className="flex items-center justify-between relative z-10">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-stone-200 border border-white/15">
                        {mode === "TRAIN" ? "🚆 RAIL" : mode === "METRO" ? "🚇 METRO" : mode === "BUS" ? "🚌 BUS" : mode === "CAB" ? "🚖 CAB" : mode === "AUTO" ? "🛺 AUTO" : mode === "BIKE" ? "🛵 BIKE" : "🚗 DRIVE"}
                      </span>

                      {opt.recommended && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-rose-500 text-white shadow-sm">
                          TOP CHOICE
                        </span>
                      )}
                    </div>

                    <div className="relative z-10">
                      <p className="text-white font-extrabold text-xs drop-shadow-sm truncate">
                        {opt.title}
                      </p>
                      <p className="text-[10px] text-stone-300 font-medium">
                        {opt.total_duration_minutes ?? opt.duration_min} mins &bull; {opt.route_distance_km ?? opt.distance_km} km
                      </p>
                    </div>
                  </div>

                  {/* Operator & Price Row (Matching "Start From" + "$120.99" / "PURCHASED" pill) */}
                  <div>
                    <p className="text-xs font-bold text-white truncate">{opt.title}</p>
                    <p className="text-[11px] text-stone-400 truncate mb-3">{opt.operator}</p>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <span className="text-[11px] text-stone-400 font-medium">
                        Start From
                      </span>

                      {/* Price Pill Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOption(opt);
                          setBookingJourney(opt);
                          setIsBookingOpen(true);
                        }}
                        className="px-3 py-1 rounded-full bg-[#3d1519] hover:bg-rose-500 border border-rose-500/40 text-rose-200 hover:text-white font-black text-xs transition-colors shadow-sm cursor-pointer flex items-center gap-1"
                      >
                        <span>₹{opt.quoted_price_inr ?? opt.fare_inr}</span>
                        <span className="text-[10px] text-rose-300 font-medium">&bull; Book</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-stone-400 vision-card rounded-[24px]">
            No transit options found for this filter.
          </div>
        )}
      </div>

      {/* 5. SPATIAL MAP & SELECTED JOURNEY ITINERARY ROW */}
      <div id="spatial-map" className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-2">
        
        {/* Left Itinerary Breakdown */}
        <div className="lg:col-span-5 rounded-[28px] vision-card p-5 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                  Active Corridor
                </span>
                <h4 className="text-sm font-black text-white">
                  {selectedOption?.title || "Selected Itinerary"}
                </h4>
              </div>

              <div className="text-right">
                <span className="text-lg font-black text-white">
                  ₹{selectedOption?.quoted_price_inr ?? selectedOption?.fare_inr ?? 0}
                </span>
              </div>
            </div>

            {/* Condition Pill */}
            <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-stone-300 flex items-center justify-between mb-4">
              <span>Traffic: <strong>{selectedOption?.traffic_status || "Standard Traffic"}</strong></span>
              <span className="text-emerald-400 font-bold">{selectedOption?.co2_emissions_g ?? 50}g CO₂</span>
            </div>

            {/* Steps */}
            {selectedOption?.steps && selectedOption.steps.length > 0 && (
              <>
                <div className="mb-2 flex items-center justify-between text-[11px] text-stone-400">
                  <span className="font-semibold text-stone-300">Turn-by-Turn Waypoints:</span>
                  <span className="text-[10px] text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 font-medium">
                    Tap step to focus live map
                  </span>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {selectedOption.steps.map((st, i) => (
                    <div
                      key={i}
                      onClick={() => setHighlightedStepIndex(i)}
                      className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                        highlightedStepIndex === i
                          ? "bg-rose-950/60 border-rose-500/80 text-white shadow-md ring-1 ring-rose-500/40"
                          : "bg-white/5 border-white/10 hover:bg-white/10 text-stone-300"
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {st.step_number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold">{st.instruction}</p>
                        <p className="text-[10px] text-stone-400 mt-0.5">
                          {st.mode} &bull; {st.duration_min} mins {st.distance_km > 0 && `&bull; ${st.distance_km} km`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {/* Book Online Ticket Button */}
            {selectedOption && (
              <button
                type="button"
                onClick={() => {
                  setBookingJourney(selectedOption);
                  setIsBookingOpen(true);
                }}
                className="w-full mt-4 py-2.5 rounded-full bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs tracking-wider uppercase shadow-lg shadow-rose-950/50 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Ticket className="w-4 h-4 text-white" />
                <span>Book Online Ticket &bull; ₹{selectedOption.quoted_price_inr ?? selectedOption.fare_inr ?? 0}</span>
              </button>
            )}
          </div>

          {/* Provenance note */}
          <div className="mt-4 pt-3 border-t border-white/10 text-[10px] text-stone-400">
            Source: {selectedOption?.source_name || "Google Routes API + Tariff Database"}
          </div>
        </div>

        {/* Right Spatial Map Canvas */}
        <div className="lg:col-span-7 h-[460px] lg:h-auto min-h-[460px] rounded-[28px] overflow-hidden shadow-2xl">
          <InteractiveMap
            origin={sourceLoc}
            destination={destLoc}
            selectedMode={selectedOption?.transport_mode || selectedOption?.mode || "BUS"}
            journeyTitle={selectedOption?.title}
            distanceKm={selectedOption?.route_distance_km ?? selectedOption?.distance_km}
            durationMin={selectedOption?.total_duration_minutes ?? selectedOption?.duration_min}
            coordinates={selectedOption?.coordinates}
            polyline={selectedOption?.polyline}
            steps={selectedOption?.steps}
            highlightedStepIndex={highlightedStepIndex}
            onSelectStep={setHighlightedStepIndex}
            cartoApiKey="cb1_4jk9_1_bee4b9e4f372e1ce3f9056e0"
          />
        </div>
      </div>

      {/* 6. BOTTOM FLOATING DOCK (Matching uploaded image bottom pill dock) */}
      <div className="w-full flex justify-center mt-4">
        <div className="px-3 py-1.5 rounded-full bg-stone-900/80 backdrop-blur-2xl border border-white/15 shadow-2xl flex items-center gap-1.5 text-xs text-stone-300 flex-wrap justify-center">
          {[
            { id: "ALL", label: "All Fares" },
            { id: "MUMBAI", label: "BEST & Local Rail" },
            { id: "CABS", label: "Cabs & Taxi" },
            { id: "AUTOS", label: "Auto Rickshaws" },
            { id: "BIKES", label: "Bike Taxis" },
            { id: "EXPRESS", label: "Express Trains" },
            { id: "PERSONAL", label: "Personal Vehicle" },
          ].map((dockItem) => {
            const isActive = activeCategory === dockItem.id;
            return (
              <button
                key={dockItem.id}
                onClick={() => setActiveCategory(dockItem.id as any)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-white/20 text-white shadow-sm"
                    : "text-stone-400 hover:text-white"
                }`}
              >
                {dockItem.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 7. ONLINE BOOKING & E-TICKET MODAL */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        journey={bookingJourney || selectedOption}
        originLocation={sourceLoc}
        destLocation={destLoc}
        passengersCount={passengers}
      />

    </div>
  );
}
