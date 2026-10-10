"use client";

import React, { useState, useEffect } from "react";
import {
  Bus,
  Train,
  Car,
  Bike,
  Footprints,
  Search,
  ArrowRightLeft,
  Clock,
  IndianRupee,
  MapPin,
  CheckCircle2,
  Zap,
  Leaf,
  Sparkles,
  Navigation,
  ChevronRight,
  ShieldCheck,
  Calendar,
  History
} from "lucide-react";
import { MultiModalOption, ResolvedLocation } from "@/types";
import { fetchApi } from "@/lib/api";
import { LocationAutocomplete } from "@/components/common/LocationAutocomplete";
import { InteractiveMap } from "@/components/common/InteractiveMap";

const POPULAR_INDIAN_JOURNEYS = [
  {
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
    destination: {
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
    destination: {
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
    destination: {
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
  }
];

export default function MasterRouteSenseIndiaPage() {
  const [sourceText, setSourceText] = useState("Dadar Railway Station");
  const [sourceLoc, setSourceLoc] = useState<ResolvedLocation | null>(POPULAR_INDIAN_JOURNEYS[0].origin);

  const [destText, setDestText] = useState("Chhatrapati Shivaji Maharaj Terminus (CSMT)");
  const [destLoc, setDestLoc] = useState<ResolvedLocation | null>(POPULAR_INDIAN_JOURNEYS[0].destination);

  const [departureOption, setDepartureOption] = useState<"NOW" | "SCHEDULED">("NOW");
  const [departureTime, setDepartureTime] = useState("");

  const [loading, setLoading] = useState(false);
  const [routeOptions, setRouteOptions] = useState<MultiModalOption[]>([]);
  const [selectedMode, setSelectedMode] = useState<string>("TRAIN");

  const [recentSearches, setRecentSearches] = useState<Array<{ from: string; to: string }>>([]);

  // Load Recent Searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("routesense_recent_searches");
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const saveRecentSearch = (from: string, to: string) => {
    try {
      const updated = [{ from, to }, ...recentSearches.filter((s) => s.from !== from || s.to !== to)].slice(0, 4);
      setRecentSearches(updated);
      localStorage.setItem("routesense_recent_searches", JSON.stringify(updated));
    } catch {}
  };

  const handleSearchRoutes = async (
    sLoc: ResolvedLocation | null = sourceLoc,
    dLoc: ResolvedLocation | null = destLoc,
    sText: string = sourceText,
    dText: string = destText
  ) => {
    const originName = sLoc?.displayName || sText || "Dadar Railway Station";
    const destName = dLoc?.displayName || dText || "Chhatrapati Shivaji Maharaj Terminus";

    setLoading(true);

    let url = `/planner/route?origin=${encodeURIComponent(originName)}&destination=${encodeURIComponent(destName)}`;

    if (sLoc?.latitude && sLoc?.longitude) {
      url += `&origin_lat=${sLoc.latitude}&origin_lng=${sLoc.longitude}`;
    }
    if (dLoc?.latitude && dLoc?.longitude) {
      url += `&dest_lat=${dLoc.latitude}&dest_lng=${dLoc.longitude}`;
    }

    try {
      const res = await fetchApi<{ route_options: MultiModalOption[]; origin: ResolvedLocation; destination: ResolvedLocation }>(url);
      if (res && res.route_options && res.route_options.length > 0) {
        setRouteOptions(res.route_options);
        if (res.origin) setSourceLoc(res.origin);
        if (res.destination) setDestLoc(res.destination);
      }
      saveRecentSearch(originName, destName);
    } catch (err) {
      console.warn("Route calculation query failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearchRoutes(POPULAR_INDIAN_JOURNEYS[0].origin, POPULAR_INDIAN_JOURNEYS[0].destination);
  }, []);

  const handleSwap = () => {
    const tempText = sourceText;
    const tempLoc = sourceLoc;

    setSourceText(destText);
    setSourceLoc(destLoc);

    setDestText(tempText);
    setDestLoc(tempLoc);

    handleSearchRoutes(destLoc, tempLoc, destText, tempText);
  };

  const selectedOption = routeOptions.find((opt) => opt.mode === selectedMode) || routeOptions[0];

  const getVehicleIcon = (mode: string, sizeClass: string = "w-6 h-6") => {
    switch (mode) {
      case "BUS":
        return <Bus className={sizeClass} />;
      case "TRAIN":
        return <Train className={sizeClass} />;
      case "CAB":
        return <Car className={sizeClass} />;
      case "BIKE":
        return <Bike className={sizeClass} />;
      case "WALK":
        return <Footprints className={sizeClass} />;
      default:
        return <Navigation className={sizeClass} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Product Brand Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-xl shadow-sky-950/60 border border-sky-400/30">
              🚥
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-white tracking-wide">RouteSense India</h1>
                <span className="bg-sky-950 text-sky-400 border border-sky-800 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                  NATIONWIDE IN
                </span>
              </div>
              <p className="text-xs text-slate-400">Intelligent Public Transport Journey Planning Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-emerald-400">
            <Zap className="w-4 h-4 fill-current text-emerald-400" />
            <span>GTFS & Geospatial Active</span>
          </div>
        </header>

        {/* Main Search & Autocomplete Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Navigation className="w-4 h-4 text-sky-400" />
              Plan Your Journey Across India
            </h2>
            <span className="text-xs text-slate-400">All 28 States & 8 UTs</span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearchRoutes();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              {/* Source Autocomplete Input */}
              <div className="md:col-span-5">
                <LocationAutocomplete
                  label="Source (Starting Location)"
                  placeholder="Enter starting location or station..."
                  value={sourceText}
                  selectedLocation={sourceLoc}
                  onSelectLocation={(loc) => {
                    setSourceLoc(loc);
                    setSourceText(loc.displayName);
                  }}
                  onTextChange={setSourceText}
                  accentColor="emerald"
                />
              </div>

              {/* Swap Button */}
              <div className="md:col-span-2 flex justify-center pb-1">
                <button
                  type="button"
                  onClick={handleSwap}
                  title="Swap Source & Destination"
                  className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-all border border-slate-700 shadow-md active:scale-95"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Destination Autocomplete Input */}
              <div className="md:col-span-5">
                <LocationAutocomplete
                  label="Destination (Where do you want to go?)"
                  placeholder="Enter destination location or station..."
                  value={destText}
                  selectedLocation={destLoc}
                  onSelectLocation={(loc) => {
                    setDestLoc(loc);
                    setDestText(loc.displayName);
                  }}
                  onTextChange={setDestText}
                  accentColor="rose"
                />
              </div>
            </div>

            {/* Departure Preference & Action Row */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              
              {/* Popular Journey Shortcuts */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">Popular Indian Journeys:</span>
                {POPULAR_INDIAN_JOURNEYS.map((j, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSourceLoc(j.origin);
                      setSourceText(j.origin.displayName);
                      setDestLoc(j.destination);
                      setDestText(j.destination.displayName);
                      handleSearchRoutes(j.origin, j.destination, j.origin.displayName, j.destination.displayName);
                    }}
                    className="text-xs bg-slate-950 hover:bg-slate-800 text-sky-300 border border-slate-800 rounded-lg px-3 py-1.5 transition-colors font-medium"
                  >
                    {j.origin.displayName.split(" ")[0]} → {j.destination.displayName.split(" ")[0]}
                  </button>
                ))}
              </div>

              {/* Search Button */}
              <button
                type="submit"
                disabled={loading}
                className="bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-sm px-8 py-3.5 rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-sky-950/60 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Calculating Real Routes...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Search Best Routes</span>
                  </>
                )}
              </button>

            </div>
          </form>
        </div>

        {/* Resolved Location Metadata Bar */}
        {sourceLoc && destLoc && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>Resolved Route Corridor: <strong className="text-white">{sourceLoc.displayName} ({sourceLoc.city})</strong> → <strong className="text-white">{destLoc.displayName} ({destLoc.city})</strong></span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
              <span>IST Timezone: Asia/Kolkata</span>
              <span>•</span>
              <span className="text-sky-400 font-semibold">{sourceLoc.state} Transit Corridor</span>
            </div>
          </div>
        )}

        {/* Transport Option Mode Cards */}
        {routeOptions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                Available Transportation Options
              </h3>
              <span className="text-xs text-slate-400">Sorted by Optimal Efficiency</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {routeOptions.map((opt) => {
                const isSelected = selectedMode === opt.mode;
                return (
                  <div
                    key={opt.mode}
                    onClick={() => setSelectedMode(opt.mode)}
                    className={`cursor-pointer rounded-2xl p-4 border transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? "bg-slate-900 border-sky-500 ring-2 ring-sky-500 shadow-xl shadow-sky-950/60"
                        : "bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                    }`}
                  >
                    {/* Badge */}
                    {opt.recommended && (
                      <span className="absolute -top-2.5 right-3 bg-emerald-500 text-slate-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow tracking-wider uppercase">
                        ⭐ Recommended
                      </span>
                    )}

                    <div className="flex items-center gap-3">
                      <div
                        className={`p-3 rounded-xl border ${
                          opt.mode === "BUS"
                            ? "bg-sky-950 text-sky-400 border-sky-800"
                            : opt.mode === "TRAIN"
                            ? "bg-purple-950 text-purple-400 border-purple-800"
                            : opt.mode === "CAB"
                            ? "bg-amber-950 text-amber-400 border-amber-800"
                            : "bg-emerald-950 text-emerald-400 border-emerald-800"
                        }`}
                      >
                        {getVehicleIcon(opt.mode, "w-6 h-6")}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{opt.mode}</h4>
                        <p className="text-xs text-slate-400">{opt.next_departure}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[11px] text-slate-400 block">Travel Time</span>
                        <span className="text-lg font-extrabold text-white font-mono">{opt.duration_min} mins</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block">Verified Fare</span>
                        <span className="text-lg font-extrabold text-emerald-400 font-mono">₹{opt.fare_inr}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/40">
                      <span className="font-mono">{opt.distance_km} km</span>
                      <span className="text-sky-400 font-semibold font-mono">{opt.reliability_score_pct}% On-Time</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Vehicle Journey Details & Interactive Map Grid */}
        {selectedOption && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left 7 Cols: Detailed Itinerary */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-6">
                
                {/* Journey Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-3.5 rounded-2xl border ${
                        selectedOption.mode === "BUS"
                          ? "bg-sky-950 text-sky-400 border-sky-800"
                          : selectedOption.mode === "TRAIN"
                          ? "bg-purple-950 text-purple-400 border-purple-800"
                          : selectedOption.mode === "CAB"
                          ? "bg-amber-950 text-amber-400 border-amber-800"
                          : "bg-emerald-950 text-emerald-400 border-emerald-800"
                      }`}
                    >
                      {getVehicleIcon(selectedOption.mode, "w-7 h-7")}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{selectedOption.title}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Route: <strong className="text-slate-200">{sourceLoc?.displayName || sourceText}</strong> → <strong className="text-slate-200">{destLoc?.displayName || destText}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-2xl border border-slate-800">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase font-medium">Total Fare</span>
                      <span className="text-base font-extrabold text-emerald-400 font-mono">₹{selectedOption.fare_inr}</span>
                    </div>
                    <div className="h-6 w-px bg-slate-800 mx-1" />
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase font-medium">Duration</span>
                      <span className="text-base font-extrabold text-white font-mono">{selectedOption.duration_min} mins</span>
                    </div>
                  </div>
                </div>

                {/* Highlights Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Distance</span>
                    <span className="font-bold text-white text-sm font-mono">{selectedOption.distance_km} km</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Traffic Delay</span>
                    <span className="font-bold text-amber-400 text-sm font-mono">+{selectedOption.estimated_delay_min} mins</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">CO₂ Footprint</span>
                    <span className="font-bold text-emerald-400 text-sm font-mono">{selectedOption.co2_emissions_g}g CO₂</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Reliability</span>
                    <span className="font-bold text-purple-400 text-sm font-mono">{selectedOption.reliability_score_pct}% OTP</span>
                  </div>
                </div>

                {/* Step Timeline */}
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Step-by-Step Transit Itinerary
                  </h4>

                  <div className="space-y-3">
                    {selectedOption.steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3.5 bg-slate-950 border border-slate-800 p-4 rounded-2xl">
                        <div className="w-8 h-8 rounded-xl bg-sky-950 border border-sky-800 text-sky-400 flex items-center justify-center font-bold text-xs shrink-0 shadow">
                          {step.step_number}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-white">{step.instruction}</span>
                            <span className="text-xs font-semibold text-sky-400 font-mono">{step.duration_min} mins</span>
                          </div>
                          <p className="text-xs text-slate-400">{step.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Right 5 Cols: Interactive Leaflet Route Map */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 h-[420px] flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-sky-400" />
                    Interactive Journey Corridor Map
                  </h3>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-mono font-semibold">
                    LIVE GEOSPATIAL
                  </span>
                </div>

                <div className="flex-1 w-full rounded-2xl overflow-hidden">
                  <InteractiveMap
                    origin={sourceLoc}
                    destination={destLoc}
                    selectedMode={selectedOption.mode}
                  />
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
