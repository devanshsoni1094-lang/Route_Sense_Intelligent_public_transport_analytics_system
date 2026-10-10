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
  Navigation,
  ChevronRight,
  ShieldCheck,
  Users,
  SlidersHorizontal,
  Info,
  Fuel,
  TrendingDown,
  AlertCircle,
  Loader2,
  Sparkles
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

export default function HomePage() {
  const [sourceText, setSourceText] = useState("Dadar Railway Station");
  const [sourceLoc, setSourceLoc] = useState<ResolvedLocation | null>(POPULAR_INDIAN_JOURNEYS[0].origin);

  const [destText, setDestText] = useState("Chhatrapati Shivaji Maharaj Terminus (CSMT)");
  const [destLoc, setDestLoc] = useState<ResolvedLocation | null>(POPULAR_INDIAN_JOURNEYS[0].destination);

  const [departureMode, setDepartureMode] = useState<"NOW" | "SCHEDULED">("NOW");
  const [passengers, setPassengers] = useState(1);
  const [sortBy, setSortBy] = useState<"BALANCED" | "CHEAPEST" | "FASTEST" | "LEAST_WALKING">("BALANCED");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [fuelPrice, setFuelPrice] = useState(104.21);
  const [carEff, setCarEff] = useState(15.0);

  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [routeOptions, setRouteOptions] = useState<MultiModalOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<MultiModalOption | null>(null);

  const executeSearch = async (
    sLoc: ResolvedLocation | null = sourceLoc,
    dLoc: ResolvedLocation | null = destLoc,
    sText: string = sourceText,
    dText: string = destText,
    pCount: number = passengers,
    sBy: string = sortBy
  ) => {
    setValidationError(null);
    setApiError(null);

    const cleanSourceText = sText.trim();
    const cleanDestText = dText.trim();

    // Validation Rules
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

    const originName = sLoc?.displayName || cleanSourceText;
    const destName = dLoc?.displayName || cleanDestText;

    let url = `/planner/route?origin=${encodeURIComponent(originName)}&destination=${encodeURIComponent(destName)}&passengers=${pCount}&sort_by=${sBy}&fuel_price=${fuelPrice}&car_eff=${carEff}`;

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
        setSelectedOption(res.route_options[0]);
        if (res.origin) setSourceLoc(res.origin);
        if (res.destination) setDestLoc(res.destination);
      } else {
        setRouteOptions([]);
        setSelectedOption(null);
        setApiError("No direct routes found between these locations. Try searching another station or city.");
      }
    } catch (err: any) {
      console.error("Search API Failure:", err);
      setApiError("Unable to calculate journey options. Please verify your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeSearch(POPULAR_INDIAN_JOURNEYS[0].origin, POPULAR_INDIAN_JOURNEYS[0].destination);
  }, []);

  const handleSwap = () => {
    const tempText = sourceText;
    const tempLoc = sourceLoc;

    setSourceText(destText);
    setSourceLoc(destLoc);

    setDestText(tempText);
    setDestLoc(tempLoc);

    executeSearch(destLoc, tempLoc, destText, tempText);
  };

  const getVehicleIcon = (mode: string, sizeClass: string = "w-5 h-5") => {
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
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-md">LIVE QUOTE</span>;
      case "OFFICIAL_TARIFF":
        return <span className="bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold px-2 py-0.5 rounded-md">OFFICIAL TARIFF</span>;
      case "API_TRANSIT_FARE":
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-md">TRANSIT FARE</span>;
      case "ESTIMATED_OPERATING_COST":
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-md">FUEL OPERATING COST</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-md">VERIFIED FARE</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-600 text-white rounded-xl shadow-md">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight leading-tight">
                Route Sense
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">India Public Transport & Mobility Intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live System Active
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 mt-6 space-y-6">
        {/* Main Journey Search Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Search className="w-4 h-4 text-sky-600" />
              Find the Best Way to Get There
            </h2>
            <span className="text-xs text-slate-500 font-medium">All 28 Indian States & 8 UTs</span>
          </div>

          {/* Validation Error Banner */}
          {validationError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Form Container */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              executeSearch();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Source Autocomplete Input */}
              <div className="md:col-span-5">
                <LocationAutocomplete
                  label="Enter starting location"
                  placeholder="e.g. Dadar Station, Silk Board, NDLS..."
                  value={sourceText}
                  selectedLocation={sourceLoc}
                  onSelectLocation={setSourceLoc}
                  onTextChange={setSourceText}
                  accentColor="emerald"
                />
              </div>

              {/* Swap Button */}
              <div className="md:col-span-2 flex justify-center pt-5">
                <button
                  type="button"
                  onClick={handleSwap}
                  title="Swap locations"
                  className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full border border-slate-200 transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1 text-xs font-bold"
                >
                  <ArrowRightLeft className="w-4 h-4 text-slate-600" />
                  <span className="md:hidden">Swap Locations</span>
                </button>
              </div>

              {/* Destination Autocomplete Input */}
              <div className="md:col-span-5">
                <LocationAutocomplete
                  label="Enter destination"
                  placeholder="e.g. CSMT, Hebbal, Rajiv Chowk..."
                  value={destText}
                  selectedLocation={destLoc}
                  onSelectLocation={setDestLoc}
                  onTextChange={setDestText}
                  accentColor="rose"
                />
              </div>
            </div>

            {/* Quick Controls Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
              {/* Departure Selector */}
              <div className="sm:col-span-4 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-600" />
                  Departure:
                </span>
                <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setDepartureMode("NOW")}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                      departureMode === "NOW"
                        ? "bg-sky-600 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Now
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepartureMode("SCHEDULED")}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                      departureMode === "SCHEDULED"
                        ? "bg-sky-600 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Later
                  </button>
                </div>
              </div>

              {/* Passenger Selector */}
              <div className="sm:col-span-4 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-sky-600" />
                  Passengers:
                </span>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setPassengers(num);
                        executeSearch(sourceLoc, destLoc, sourceText, destText, num);
                      }}
                      className={`w-7 h-7 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        passengers === num
                          ? "bg-sky-600 text-white shadow-sm"
                          : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* More Options Toggle */}
              <div className="sm:col-span-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-sky-600" />
                  <span>{showAdvanced ? "Hide More Options" : "More Options"}</span>
                </button>
              </div>
            </div>

            {/* Collapsible Advanced Preferences */}
            {showAdvanced && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <TrendingDown className="w-4 h-4 text-emerald-600" />
                    Sort & Vehicle Preferences
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                      Sort Options
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => {
                        const s = e.target.value as any;
                        setSortBy(s);
                        executeSearch(sourceLoc, destLoc, sourceText, destText, passengers, s);
                      }}
                      className="w-full bg-white border border-slate-300 text-xs font-bold text-slate-800 rounded-lg p-2 outline-none focus:border-sky-500 cursor-pointer"
                    >
                      <option value="BALANCED">Best Overall Balance</option>
                      <option value="CHEAPEST">Cheapest Fare (INR)</option>
                      <option value="FASTEST">Fastest Duration</option>
                      <option value="LEAST_WALKING">Least Walking</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                      Petrol Price (₹/L)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={fuelPrice}
                      onChange={(e) => setFuelPrice(parseFloat(e.target.value) || 104.21)}
                      className="w-full bg-white border border-slate-300 text-xs font-semibold text-slate-800 rounded-lg p-2 outline-none focus:border-sky-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                      Car Mileage (km/L)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={carEff}
                      onChange={(e) => setCarEff(parseFloat(e.target.value) || 15.0)}
                      className="w-full bg-white border border-slate-300 text-xs font-semibold text-slate-800 rounded-lg p-2 outline-none focus:border-sky-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Quick Shortcuts */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Popular:</span>
                {POPULAR_INDIAN_JOURNEYS.map((j, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSourceLoc(j.origin);
                      setSourceText(j.origin.displayName);
                      setDestLoc(j.destination);
                      setDestText(j.destination.displayName);
                      executeSearch(j.origin, j.destination, j.origin.displayName, j.destination.displayName);
                    }}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1 transition-colors font-semibold cursor-pointer"
                  >
                    {j.origin.displayName.split(" ")[0]} → {j.destination.displayName.split(" ")[0]}
                  </button>
                ))}
              </div>

              {/* Primary Action Button: FIND JOURNEYS */}
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-extrabold text-sm px-8 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Finding available journeys…</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Find Journeys</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* API Error State */}
        {apiError && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs font-semibold text-amber-800 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>{apiError}</span>
            </div>
            <button
              type="button"
              onClick={() => executeSearch()}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 transition-colors shrink-0 cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Results Section */}
        {routeOptions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Available Journeys ({routeOptions.length} Options)
              </h3>
              <span className="text-xs text-slate-500 font-medium">Sorted by {sortBy.toLowerCase()}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {routeOptions.map((opt, idx) => {
                const isSelected = selectedOption?.mode === opt.mode || selectedOption?.transport_mode === opt.transport_mode;
                return (
                  <div
                    key={idx}
                    className={`bg-white border rounded-2xl p-5 shadow-sm transition-all space-y-4 relative ${
                      isSelected ? "border-sky-500 ring-2 ring-sky-100" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {opt.recommended && (
                      <span className="absolute top-4 right-4 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase">
                        Recommended
                      </span>
                    )}

                    <div className="flex items-start gap-3.5">
                      <div className="p-3 bg-slate-100 text-slate-700 rounded-xl border border-slate-200">
                        {getVehicleIcon(opt.transport_mode || opt.mode, "w-6 h-6")}
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-900">{opt.title}</h4>
                        <p className="text-xs text-slate-500 font-medium">{opt.operator || "Public Transit"}</p>
                        <div className="mt-1 flex items-center gap-1.5">
                          {renderPriceBadge(opt.price_type)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-center">
                      <div>
                        <span className="text-[11px] text-slate-400 block font-medium">Estimated Price</span>
                        <span className="text-base font-extrabold text-emerald-600 font-mono">₹{opt.fare_inr || opt.quoted_price_inr}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block font-medium">Travel Time</span>
                        <span className="text-base font-extrabold text-slate-800 font-mono">{opt.duration_min || opt.total_duration_minutes} mins</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block font-medium">Distance</span>
                        <span className="text-base font-extrabold text-slate-800 font-mono">{opt.distance_km || opt.route_distance_km} km</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-slate-500 font-medium">{opt.next_departure}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedOption(opt)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-sky-600 text-white shadow-sm"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {isSelected ? "Viewing Details" : "View Journey"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Journey Itinerary & Map View */}
        {selectedOption && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{selectedOption.title} Itinerary</h3>
                    <p className="text-xs text-slate-500">Step-by-Step Transit Instructions</p>
                  </div>
                  <span className="text-sm font-extrabold text-emerald-600 font-mono">₹{selectedOption.fare_inr || selectedOption.quoted_price_inr}</span>
                </div>

                {/* Provenance trace */}
                {selectedOption.assumptions && selectedOption.assumptions.length > 0 && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Fare Provenance: {selectedOption.source_name || "Official Tariff"}
                    </span>
                    <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                      {selectedOption.assumptions.map((asm, aIdx) => (
                        <li key={aIdx}>{asm}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Steps */}
                <div className="space-y-3">
                  {selectedOption.steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {step.step_number}
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{step.instruction}</span>
                          <span className="text-xs font-semibold text-sky-700 font-mono">{step.duration_min} mins</span>
                        </div>
                        <p className="text-xs text-slate-500">{step.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Interactive Map View */}
            <div className="lg:col-span-5">
              <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm space-y-3 h-[420px] flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase">
                    <MapPin className="w-4 h-4 text-sky-600" />
                    Interactive Map Corridor
                  </h3>
                </div>
                <div className="flex-1 w-full rounded-xl overflow-hidden border border-slate-200">
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
      </main>
    </div>
  );
}
