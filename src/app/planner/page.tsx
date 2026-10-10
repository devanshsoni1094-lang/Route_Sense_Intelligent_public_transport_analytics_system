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
  Users,
  SlidersHorizontal,
  Info,
  Fuel,
  TrendingDown
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

export default function RoutePlannerPage() {
  const [sourceText, setSourceText] = useState("Dadar Railway Station");
  const [sourceLoc, setSourceLoc] = useState<ResolvedLocation | null>(POPULAR_INDIAN_JOURNEYS[0].origin);

  const [destText, setDestText] = useState("Chhatrapati Shivaji Maharaj Terminus (CSMT)");
  const [destLoc, setDestLoc] = useState<ResolvedLocation | null>(POPULAR_INDIAN_JOURNEYS[0].destination);

  const [passengers, setPassengers] = useState(1);
  const [sortBy, setSortBy] = useState<"BALANCED" | "CHEAPEST" | "FASTEST" | "LEAST_WALKING">("BALANCED");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [fuelPrice, setFuelPrice] = useState(104.21);
  const [carEff, setCarEff] = useState(15.0);

  const [loading, setLoading] = useState(false);
  const [routeOptions, setRouteOptions] = useState<MultiModalOption[]>([]);
  const [selectedMode, setSelectedMode] = useState<string>("TRAIN");
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);

  const handleSearchRoutes = async (
    sLoc: ResolvedLocation | null = sourceLoc,
    dLoc: ResolvedLocation | null = destLoc,
    sText: string = sourceText,
    dText: string = destText,
    pCount: number = passengers,
    sBy: string = sortBy,
    fPrice: number = fuelPrice,
    cEff: number = carEff
  ) => {
    const originName = sLoc?.displayName || sText || "Dadar Railway Station";
    const destName = dLoc?.displayName || dText || "Chhatrapati Shivaji Maharaj Terminus";

    setLoading(true);

    let url = `/planner/route?origin=${encodeURIComponent(originName)}&destination=${encodeURIComponent(destName)}&passengers=${pCount}&sort_by=${sBy}&fuel_price=${fPrice}&car_eff=${cEff}`;

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

  const selectedOption = routeOptions.find((opt) => opt.mode === selectedMode || opt.transport_mode === selectedMode) || routeOptions[0];

  const getVehicleIcon = (mode: string, sizeClass: string = "w-6 h-6") => {
    switch (mode) {
      case "BUS":
        return <Bus className={sizeClass} />;
      case "TRAIN":
      case "METRO":
        return <Train className={sizeClass} />;
      case "CAB":
      case "CAR_PERSONAL":
        return <Car className={sizeClass} />;
      case "BIKE":
      case "AUTO":
      case "MOTORCYCLE_PERSONAL":
        return <Bike className={sizeClass} />;
      case "WALK":
        return <Footprints className={sizeClass} />;
      default:
        return <Navigation className={sizeClass} />;
    }
  };

  const renderPriceBadge = (priceType?: string) => {
    switch (priceType) {
      case "LIVE_PROVIDER_QUOTE":
        return <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md">LIVE QUOTE</span>;
      case "OFFICIAL_TARIFF":
        return <span className="bg-sky-950 text-sky-400 border border-sky-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md">OFFICIAL TARIFF</span>;
      case "API_TRANSIT_FARE":
        return <span className="bg-purple-950 text-purple-400 border border-purple-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md">TRANSIT FARE</span>;
      case "ESTIMATED_OPERATING_COST":
        return <span className="bg-amber-950 text-amber-400 border border-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md">FUEL OPERATING COST</span>;
      default:
        return <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md">VERIFIED FARE</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans">
      {/* Main Search & Autocomplete Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <Navigation className="w-4 h-4 text-sky-400" />
            Route Sense — India Journey & Fare Comparison Engine
          </h2>
          <span className="text-xs text-sky-400 font-mono font-semibold">Asia/Kolkata (IST)</span>
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
                className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-all border border-slate-700 shadow-md active:scale-95 cursor-pointer"
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

          {/* Controls Bar: Passenger Count, Sort By, Advanced Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
            <div className="sm:col-span-4 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-sky-400" />
                Passengers:
              </span>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setPassengers(num);
                      handleSearchRoutes(sourceLoc, destLoc, sourceText, destText, num);
                    }}
                    className={`w-7 h-7 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                      passengers === num
                        ? "bg-sky-500 text-slate-950 shadow"
                        : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="sm:col-span-5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                Sort Options:
              </span>
              <select
                value={sortBy}
                onChange={(e) => {
                  const s = e.target.value as any;
                  setSortBy(s);
                  handleSearchRoutes(sourceLoc, destLoc, sourceText, destText, passengers, s);
                }}
                className="bg-slate-900 text-xs font-bold text-slate-200 border border-slate-800 rounded-lg px-2 py-1 outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="BALANCED">Best Balance</option>
                <option value="CHEAPEST">Cheapest Fare (INR)</option>
                <option value="FASTEST">Fastest Duration</option>
                <option value="LEAST_WALKING">Least Walking</option>
              </select>
            </div>

            <div className="sm:col-span-3 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
                <span>{showAdvanced ? "Hide Controls" : "Vehicle Config"}</span>
              </button>
            </div>
          </div>

          {/* Advanced Fuel & Mileage Panel */}
          {showAdvanced && (
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
                <Fuel className="w-4 h-4" />
                Personal Vehicle Fuel & Efficiency Calculator Settings
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Current Petrol/Fuel Price (₹ / Litre)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={fuelPrice}
                    onChange={(e) => setFuelPrice(parseFloat(e.target.value) || 104.21)}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Car Mileage Efficiency (km / Litre)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={carEff}
                    onChange={(e) => setCarEff(parseFloat(e.target.value) || 15.0)}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {/* Popular Journey Shortcuts */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Quick Corridor:</span>
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
                  className="text-xs bg-slate-950 hover:bg-slate-800 text-sky-300 border border-slate-800 rounded-lg px-3 py-1.5 transition-colors font-medium cursor-pointer"
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

      {/* Option Cards */}
      {routeOptions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Available Journey Options ({passengers} Passenger{passengers > 1 ? "s" : ""})
            </h3>
            <span className="text-xs text-slate-400 font-mono">Real-time Normalized Pricing</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {routeOptions.map((opt, idx) => {
              const currentModeKey = opt.transport_mode || opt.mode;
              const isSelected = selectedMode === currentModeKey || selectedMode === opt.mode;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedMode(currentModeKey)}
                  className={`cursor-pointer rounded-2xl p-4 border transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? "bg-slate-900 border-sky-500 ring-2 ring-sky-500 shadow-xl shadow-sky-950/60"
                      : "bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                  }`}
                >
                  {opt.recommended && (
                    <span className="absolute -top-2.5 right-3 bg-emerald-500 text-slate-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow uppercase">
                      ⭐ Recommended
                    </span>
                  )}

                  <div className="flex items-center gap-3">
                    <div
                      className={`p-3 rounded-xl border ${
                        currentModeKey === "BUS"
                          ? "bg-sky-950 text-sky-400 border-sky-800"
                          : currentModeKey === "TRAIN" || currentModeKey === "METRO"
                          ? "bg-purple-950 text-purple-400 border-purple-800"
                          : currentModeKey === "CAB" || currentModeKey === "CAR_PERSONAL"
                          ? "bg-amber-950 text-amber-400 border-amber-800"
                          : "bg-emerald-950 text-emerald-400 border-emerald-800"
                      }`}
                    >
                      {getVehicleIcon(currentModeKey, "w-6 h-6")}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white leading-tight">{opt.title.split("(")[0]}</h4>
                      <div className="mt-1 flex items-center gap-1.5">
                        {renderPriceBadge(opt.price_type)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Travel Time</span>
                      <span className="text-lg font-extrabold text-white font-mono">{opt.duration_min || opt.total_duration_minutes} mins</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Verified Fare</span>
                      <span className="text-lg font-extrabold text-emerald-400 font-mono">₹{opt.fare_inr || opt.quoted_price_inr}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/40">
                    <span className="font-mono">{opt.distance_km || opt.route_distance_km} km</span>
                    <span className="text-sky-400 font-semibold font-mono">{opt.reliability_score_pct}% Reliability</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Option Details & Interactive Map */}
      {selectedOption && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-3.5 rounded-2xl border ${
                      selectedOption.mode === "BUS"
                        ? "bg-sky-950 text-sky-400 border-sky-800"
                        : selectedOption.mode === "TRAIN" || selectedOption.mode === "METRO"
                        ? "bg-purple-950 text-purple-400 border-purple-800"
                        : selectedOption.mode === "CAB" || selectedOption.mode === "CAR_PERSONAL"
                        ? "bg-amber-950 text-amber-400 border-amber-800"
                        : "bg-emerald-950 text-emerald-400 border-emerald-800"
                    }`}
                  >
                    {getVehicleIcon(selectedOption.mode, "w-7 h-7")}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{selectedOption.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Operator: <strong className="text-slate-200">{selectedOption.operator || "Public Transit"}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-2xl border border-slate-800">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Total Fare</span>
                    <span className="text-base font-extrabold text-emerald-400 font-mono">₹{selectedOption.fare_inr || selectedOption.quoted_price_inr}</span>
                  </div>
                  <div className="h-6 w-px bg-slate-800 mx-1" />
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Duration</span>
                    <span className="text-base font-extrabold text-white font-mono">{selectedOption.duration_min || selectedOption.total_duration_minutes} mins</span>
                  </div>
                </div>
              </div>

              {/* Fare Provenance & Assumptions Accordion */}
              {selectedOption.assumptions && selectedOption.assumptions.length > 0 && (
                <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Fare Provenance & Audit Trace
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">{selectedOption.source_name || "Official Tariff"}</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside pt-1">
                    {selectedOption.assumptions.map((asm, aIdx) => (
                      <li key={aIdx}>{asm}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Step-by-Step Itinerary */}
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

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 h-[420px] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-sky-400" />
                  Interactive Journey Corridor Map
                </h3>
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
  );
}
