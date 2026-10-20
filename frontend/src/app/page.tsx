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
  X,
  Zap,
  Activity,
  Brain,
  Coins,
  Armchair,
  Gauge,
  BarChart2
} from "lucide-react";
import { MultiModalOption, ResolvedLocation, RouteStep } from "@/types";
import { fetchApi } from "@/lib/api";
import { LocationAutocomplete } from "@/components/common/LocationAutocomplete";
import { JourneyFiveParameterAnalysis } from "@/components/analytics/JourneyFiveParameterAnalysis";
import { TravelHeroSpotlight } from "@/components/home/TravelHeroSpotlight";

// Iconic Mumbai Metropolitan Region (MMR) Commuter Corridors
const POPULAR_MUMBAI_CORRIDORS = [
  {
    label: "Dadar ➔ CSMT",
    subtext: "Central Line Fast",
    originText: "Dadar Railway Station",
    destText: "Chhatrapati Shivaji Maharaj Terminus",
    origin: {
      provider: "indian_transit_db",
      providerPlaceId: "in-bom-dadar-cr",
      displayName: "Dadar Railway Station",
      formattedAddress: "Dadar East, Mumbai, Maharashtra 400014",
      city: "Mumbai",
      state: "Maharashtra",
      countryCode: "IN",
      latitude: 19.0178,
      longitude: 72.8478,
      placeTypes: ["railway_station"],
      dataSource: "Central Railway",
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
      dataSource: "Central Railway Headquarters",
      retrievedAt: new Date().toISOString()
    } as ResolvedLocation
  },
  {
    label: "Churchgate ➔ Borivali",
    subtext: "Western Line Express",
    originText: "Churchgate Railway Station",
    destText: "Borivali Railway Station",
    origin: {
      provider: "indian_transit_db",
      providerPlaceId: "in-bom-churchgate",
      displayName: "Churchgate Railway Station",
      formattedAddress: "Churchgate, Mumbai, Maharashtra 400020",
      city: "Mumbai",
      state: "Maharashtra",
      countryCode: "IN",
      latitude: 18.9352,
      longitude: 72.8272,
      placeTypes: ["railway_station"],
      dataSource: "Western Railway",
      retrievedAt: new Date().toISOString()
    } as ResolvedLocation,
    dest: {
      provider: "indian_transit_db",
      providerPlaceId: "in-bom-borivali",
      displayName: "Borivali Railway Station",
      formattedAddress: "Borivali West, Mumbai, Maharashtra 400092",
      city: "Mumbai",
      state: "Maharashtra",
      countryCode: "IN",
      latitude: 19.2291,
      longitude: 72.8569,
      placeTypes: ["railway_station"],
      dataSource: "Western Railway",
      retrievedAt: new Date().toISOString()
    } as ResolvedLocation
  },
  {
    label: "Andheri ➔ Ghatkopar",
    subtext: "Metro Line 1 (21 min)",
    originText: "Andheri Railway Station",
    destText: "Ghatkopar Railway Station",
    origin: {
      provider: "indian_transit_db",
      providerPlaceId: "in-bom-andheri-wr",
      displayName: "Andheri Railway Station",
      formattedAddress: "Andheri West, Mumbai, Maharashtra 400058",
      city: "Mumbai",
      state: "Maharashtra",
      countryCode: "IN",
      latitude: 19.1197,
      longitude: 72.8464,
      placeTypes: ["railway_station", "metro_station"],
      dataSource: "Western Railway & Metro Line 1",
      retrievedAt: new Date().toISOString()
    } as ResolvedLocation,
    dest: {
      provider: "indian_transit_db",
      providerPlaceId: "in-bom-ghatkopar-cr",
      displayName: "Ghatkopar Railway Station",
      formattedAddress: "Ghatkopar West, Mumbai, Maharashtra 400086",
      city: "Mumbai",
      state: "Maharashtra",
      countryCode: "IN",
      latitude: 19.0863,
      longitude: 72.9082,
      placeTypes: ["railway_station", "metro_station"],
      dataSource: "Central Railway & Metro Line 1",
      retrievedAt: new Date().toISOString()
    } as ResolvedLocation
  },
  {
    label: "BKC ➔ Nariman Point",
    subtext: "Coastal Road & Taxi",
    originText: "Bandra Kurla Complex (BKC)",
    destText: "Nariman Point Business District",
    origin: {
      provider: "indian_transit_db",
      providerPlaceId: "in-bom-bkc",
      displayName: "Bandra Kurla Complex (BKC)",
      formattedAddress: "Bandra East, Mumbai, Maharashtra 400051",
      city: "Mumbai",
      state: "Maharashtra",
      countryCode: "IN",
      latitude: 19.0657,
      longitude: 72.8687,
      placeTypes: ["locality", "metro_station"],
      dataSource: "MMRDA Financial Hub",
      retrievedAt: new Date().toISOString()
    } as ResolvedLocation,
    dest: {
      provider: "indian_transit_db",
      providerPlaceId: "in-bom-nariman-point",
      displayName: "Nariman Point Business District",
      formattedAddress: "Nariman Point, Mumbai, Maharashtra 400021",
      city: "Mumbai",
      state: "Maharashtra",
      countryCode: "IN",
      latitude: 18.9269,
      longitude: 72.8228,
      placeTypes: ["locality", "landmark"],
      dataSource: "South Mumbai Financial CBD",
      retrievedAt: new Date().toISOString()
    } as ResolvedLocation
  },
  {
    label: "Thane ➔ CSMT",
    subtext: "Central Express (34 km)",
    originText: "Thane Railway Station",
    destText: "Chhatrapati Shivaji Maharaj Terminus",
    origin: {
      provider: "indian_transit_db",
      providerPlaceId: "in-bom-thane-cr",
      displayName: "Thane Railway Station",
      formattedAddress: "Thane West, Thane, Maharashtra 400601",
      city: "Thane",
      state: "Maharashtra",
      countryCode: "IN",
      latitude: 19.1860,
      longitude: 72.9759,
      placeTypes: ["railway_station"],
      dataSource: "Central Railway",
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
      placeTypes: ["railway_station"],
      dataSource: "Central Railway",
      retrievedAt: new Date().toISOString()
    } as ResolvedLocation
  },
  {
    label: "Vashi ➔ Kurla",
    subtext: "Harbour Line Trans-Creek",
    originText: "Vashi Railway Station",
    destText: "Kurla Junction Railway Station",
    origin: {
      provider: "indian_transit_db",
      providerPlaceId: "in-bom-vashi",
      displayName: "Vashi Railway Station",
      formattedAddress: "Sector 30A, Vashi, Navi Mumbai, Maharashtra 400703",
      city: "Navi Mumbai",
      state: "Maharashtra",
      countryCode: "IN",
      latitude: 19.0645,
      longitude: 72.9984,
      placeTypes: ["railway_station"],
      dataSource: "CIDCO & Harbour Railway",
      retrievedAt: new Date().toISOString()
    } as ResolvedLocation,
    dest: {
      provider: "indian_transit_db",
      providerPlaceId: "in-bom-kurla-cr",
      displayName: "Kurla Junction Railway Station",
      formattedAddress: "Kurla East/West, Mumbai, Maharashtra 400070",
      city: "Mumbai",
      state: "Maharashtra",
      countryCode: "IN",
      latitude: 19.0652,
      longitude: 72.8794,
      placeTypes: ["railway_station"],
      dataSource: "Central & Harbour Railway",
      retrievedAt: new Date().toISOString()
    } as ResolvedLocation
  },
  {
    label: "Colaba ➔ Bandra Bandstand",
    subtext: "Sea Link & Kaali-Peeli",
    originText: "Colaba & Gateway of India",
    destText: "Bandra Bandstand & Sea Link Entry",
    origin: {
      provider: "indian_transit_db",
      providerPlaceId: "in-bom-colaba",
      displayName: "Colaba & Gateway of India",
      formattedAddress: "Apollo Bandar, Colaba, Mumbai, Maharashtra 400001",
      city: "Mumbai",
      state: "Maharashtra",
      countryCode: "IN",
      latitude: 18.9220,
      longitude: 72.8347,
      placeTypes: ["landmark"],
      dataSource: "Mumbai Port & Heritage",
      retrievedAt: new Date().toISOString()
    } as ResolvedLocation,
    dest: {
      provider: "indian_transit_db",
      providerPlaceId: "in-bom-bandra-bandstand",
      displayName: "Bandra Bandstand & Sea Link Entry",
      formattedAddress: "Bandstand, Bandra West, Mumbai, Maharashtra 400050",
      city: "Mumbai",
      state: "Maharashtra",
      countryCode: "IN",
      latitude: 19.0435,
      longitude: 72.8193,
      placeTypes: ["landmark"],
      dataSource: "Bandra Coastal Promenade",
      retrievedAt: new Date().toISOString()
    } as ResolvedLocation
  },
  {
    label: "Aarey JVLR ➔ BKC",
    subtext: "Metro Line 3 Aqua Line",
    originText: "Aarey JVLR Metro Station (Line 3 Aqua Line)",
    destText: "Bandra Kurla Complex (BKC)",
    origin: {
      provider: "indian_transit_db",
      providerPlaceId: "in-bom-metro-aarey",
      displayName: "Aarey JVLR Metro Station (Line 3 Aqua Line)",
      formattedAddress: "Jogeshwari-Vikhroli Link Road, Mumbai 400065",
      city: "Mumbai",
      state: "Maharashtra",
      countryCode: "IN",
      latitude: 19.1352,
      longitude: 72.8770,
      placeTypes: ["metro_station"],
      dataSource: "MMRC Mumbai Metro Line 3",
      retrievedAt: new Date().toISOString()
    } as ResolvedLocation,
    dest: {
      provider: "indian_transit_db",
      providerPlaceId: "in-bom-bkc",
      displayName: "Bandra Kurla Complex (BKC)",
      formattedAddress: "Bandra East, Mumbai, Maharashtra 400051",
      city: "Mumbai",
      state: "Maharashtra",
      countryCode: "IN",
      latitude: 19.0657,
      longitude: 72.8687,
      placeTypes: ["locality", "metro_station"],
      dataSource: "MMRDA Financial Hub",
      retrievedAt: new Date().toISOString()
    } as ResolvedLocation
  }
];

// Top Mumbai Transit Undertakings
const TOP_MUMBAI_OPERATORS = [
  {
    name: "Central & Western Railway",
    subtitle: "Local Train II (₹5-₹30) & I (₹65-₹235)",
    icon: "🚆",
    color: "from-rose-500 to-red-600",
    category: "LOCAL_TRAIN"
  },
  {
    name: "BEST Undertaking",
    subtitle: "Non-AC (₹10-₹60) & AC Electric (₹12-₹65)",
    icon: "🚌",
    color: "from-amber-500 to-orange-600",
    category: "BEST_BUS"
  },
  {
    name: "Mumbai RTO Taxi & Auto",
    subtitle: "Kaali-Peeli (₹33 + ₹21.90) | Auto (₹27 + ₹18.22)",
    icon: "🚖",
    color: "from-yellow-500 to-amber-600",
    category: "TAXI_AUTO"
  },
  {
    name: "Mumbai Metro (MMOPL & MMRC)",
    subtitle: "Line 1, 2A, 7 & Line 3 Aqua Line (₹10-₹60)",
    icon: "🚇",
    color: "from-purple-500 to-indigo-600",
    category: "METRO"
  },
  {
    name: "Uber & Ola Mumbai",
    subtitle: "UberGo (~₹184) / Ola Mini (~₹173)",
    icon: "🚗",
    color: "from-blue-500 to-cyan-600"
  },
  {
    name: "Rapido Mumbai",
    subtitle: "Bike Taxi (~₹50) & Auto Lite (₹12-₹15/km)",
    icon: "🛵",
    color: "from-emerald-500 to-teal-600"
  }
];

export default function HomePage() {
  // Primary 2 Mumbai Inputs
  const [sourceText, setSourceText] = useState("Dadar Railway Station");
  const [sourceLoc, setSourceLoc] = useState<ResolvedLocation | null>(POPULAR_MUMBAI_CORRIDORS[0].origin);

  const [destText, setDestText] = useState("Chhatrapati Shivaji Maharaj Terminus");
  const [destLoc, setDestLoc] = useState<ResolvedLocation | null>(POPULAR_MUMBAI_CORRIDORS[0].dest);

  // Search State
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Results State
  const [routeOptions, setRouteOptions] = useState<MultiModalOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<MultiModalOption | null>(null);
  const [highlightedStepIndex, setHighlightedStepIndex] = useState<number | null>(null);

  // Three Smart Filters: SPEED (Fastest Route), CHEAPEST (Lowest Fare), COMFORT (Cabs & AC)
  const [smartFilter, setSmartFilter] = useState<"SPEED" | "CHEAPEST" | "COMFORT">("SPEED");

  // Mumbai-Exclusive Filter Pills
  const [activeCategory, setActiveCategory] = useState<
    "ALL" | "LOCAL_TRAIN" | "BEST_BUS" | "METRO" | "TAXI_AUTO" | "CABS" | "BIKES" | "PERSONAL"
  >("ALL");

  // Secondary Settings (Mumbai Commuters & Fuel Prices)
  const [passengers, setPassengers] = useState(1);
  const [fuelPrice, setFuelPrice] = useState(104.21); // Mumbai Petrol ₹104.21/L
  const [carEfficiency, setCarEfficiency] = useState(14.5);
  const [bikeEfficiency, setBikeEfficiency] = useState(45.0);

  // Helper to sort options based on active smart filter
  const sortJourneyOptions = (options: MultiModalOption[], filter: "SPEED" | "CHEAPEST" | "COMFORT") => {
    return [...options].sort((a, b) => {
      if (filter === "CHEAPEST") {
        const priceA = a.quoted_price_inr ?? a.fare_inr ?? 9999;
        const priceB = b.quoted_price_inr ?? b.fare_inr ?? 9999;
        return priceA - priceB;
      }
      if (filter === "COMFORT") {
        const scoreA = a.comfort_score ?? 60;
        const scoreB = b.comfort_score ?? 60;
        return scoreB - scoreA;
      }
      // Default: SPEED (Fastest travel time using neural duration if available)
      const durA = a.neural_duration_min ?? a.total_duration_minutes ?? a.duration_min ?? 999;
      const durB = b.neural_duration_min ?? b.total_duration_minutes ?? b.duration_min ?? 999;
      return durA - durB;
    });
  };

  const handleSmartFilterChange = (filter: "SPEED" | "CHEAPEST" | "COMFORT") => {
    setSmartFilter(filter);
    const reSorted = sortJourneyOptions(filteredOptions, filter);
    if (reSorted.length > 0) {
      setSelectedOption(reSorted[0]);
    }
  };

  // Execute Search strictly within Mumbai Metropolitan Region
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
      setValidationError("Please enter a starting Mumbai location.");
      return;
    }
    if (!cleanDestText) {
      setValidationError("Please enter a destination Mumbai location.");
      return;
    }
    if (cleanSourceText.toLowerCase() === cleanDestText.toLowerCase()) {
      setValidationError("Origin and destination must be different stations or stops.");
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

    // Always fallback safely to genuine Mumbai coordinates
    if (!activeSourceLoc) {
      activeSourceLoc = {
        provider: "indian_transit_db",
        providerPlaceId: `bom-src-${Date.now()}`,
        displayName: cleanSourceText,
        formattedAddress: `${cleanSourceText}, Mumbai, Maharashtra, India`,
        city: "Mumbai",
        state: "Maharashtra",
        countryCode: "IN",
        latitude: 19.0178,
        longitude: 72.8478,
        placeTypes: ["locality"],
        dataSource: "Route Sense Mumbai Location Index",
        retrievedAt: new Date().toISOString()
      };
      setSourceLoc(activeSourceLoc);
    }
    if (!activeDestLoc) {
      activeDestLoc = {
        provider: "indian_transit_db",
        providerPlaceId: `bom-dest-${Date.now()}`,
        displayName: cleanDestText,
        formattedAddress: `${cleanDestText}, Mumbai, Maharashtra, India`,
        city: "Mumbai",
        state: "Maharashtra",
        countryCode: "IN",
        latitude: 18.9400,
        longitude: 72.8353,
        placeTypes: ["locality"],
        dataSource: "Route Sense Mumbai Location Index",
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

    url += `&passengers=${passengers}&fuel_price=${fuelPrice}&car_eff=${carEfficiency}&bike_eff=${bikeEfficiency}&sort_by=${smartFilter}`;

    try {
      const res = await fetchApi<{
        route_options: MultiModalOption[];
        origin: ResolvedLocation;
        destination: ResolvedLocation;
      }>(url);

      if (res && res.route_options && res.route_options.length > 0) {
        setRouteOptions(res.route_options);
        const sorted = sortJourneyOptions(res.route_options, smartFilter);
        setSelectedOption(sorted[0] || res.route_options[0]);
        if (res.origin) setSourceLoc(res.origin);
        if (res.destination) setDestLoc(res.destination);
      } else {
        setRouteOptions([]);
        setSelectedOption(null);
        setApiError("No transit routes found between these Mumbai locations.");
      }
    } catch (err: any) {
      console.error("Mumbai route search failure:", err);
      setApiError(err?.message || "Mumbai transit routing temporarily unavailable. Please retry.");
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

  // Auto-search initial Mumbai corridor
  useEffect(() => {
    executeSearch();
  }, []);

  // Filter options strictly by Mumbai transit modes
  const filteredOptions = routeOptions.filter((opt) => {
    const id = (opt.journey_id || "").toUpperCase();
    const mode = opt.transport_mode || opt.mode;
    const title = (opt.title || "").toLowerCase();
    const cat = (opt.vehicle_category || "").toLowerCase();

    if (activeCategory === "ALL") return true;
    if (activeCategory === "LOCAL_TRAIN") {
      return id.includes("LOCAL") || mode === "TRAIN" || title.includes("local") || cat.includes("suburban");
    }
    if (activeCategory === "BEST_BUS") {
      return id.includes("BEST") || mode === "BUS" || title.includes("best") || cat.includes("best");
    }
    if (activeCategory === "METRO") {
      return id.includes("METRO") || mode === "METRO" || title.includes("metro");
    }
    if (activeCategory === "TAXI_AUTO") {
      return id.includes("TAXI") || id.includes("AUTO") || id.includes("METERED") || mode === "AUTO";
    }
    if (activeCategory === "CABS") {
      return (
        id.includes("CAB") ||
        id.includes("UBER-GO") ||
        id.includes("OLA-MINI") ||
        id.includes("SEDAN") ||
        id.includes("SUV")
      );
    }
    if (activeCategory === "BIKES") {
      return (id.includes("BIKE") || mode === "BIKE") && !id.includes("PERSONAL");
    }
    if (activeCategory === "PERSONAL") {
      return id.includes("PERSONAL") || mode === "CAR_PERSONAL" || mode === "MOTORCYCLE_PERSONAL";
    }
    return true;
  });

  // Apply Smart Filters sorting (SPEED, CHEAPEST, COMFORT)
  const sortedAndFilteredOptions = sortJourneyOptions(filteredOptions, smartFilter);

  const recommendedOption = sortedAndFilteredOptions.find((o) => o.recommended) || sortedAndFilteredOptions[0] || routeOptions[0];

  return (
    <div className="w-full flex flex-col gap-6 font-sans animate-in fade-in duration-500">
      
      {/* 1. GREETING & MUMBAI CATEGORY PILLS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
              MMR REAL-TIME COMMUTER TRANSIT ENGINE
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <span>Route Sense Mumbai</span>
            <span className="text-sm font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/20">
              MMR Only
            </span>
          </h2>
          <p className="text-xs text-stone-300 mt-0.5">
            Accurate fares, travel times &amp; scheduled transit routes exclusively for Mumbai, Thane &amp; Navi Mumbai.
          </p>
        </div>

        {/* Category Pills matching the image's top capsule pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: "ALL", label: "All Mumbai Fares", emoji: "⚡" },
            { id: "LOCAL_TRAIN", label: "Mumbai Local (II & I)", emoji: "🚆" },
            { id: "BEST_BUS", label: "BEST Bus (Non-AC/AC)", emoji: "🚌" },
            { id: "METRO", label: "Metro (Lines 1, 2A, 7, 3)", emoji: "🚇" },
            { id: "TAXI_AUTO", label: "Kaali-Peeli & Auto", emoji: "🚖" },
            { id: "CABS", label: "Uber & Ola Cabs", emoji: "🚗" }
          ].map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer hover:scale-105 active:scale-95 ${
                  isActive
                    ? "bg-white text-slate-900 border border-white shadow-lg font-extrabold scale-105"
                    : "bg-white/10 text-slate-200 hover:bg-white/20 border border-white/15"
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. HERO ROW: SPOTLIGHT CARD (ANIMATED TRAVELING BOY + 5s QUOTES) + TOP MUMBAI OPERATORS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Hero Spotlight Card: Animated Traveling Boy Theme & 5s Quotes Carousel */}
        <TravelHeroSpotlight
          recommendedOption={recommendedOption}
          routeOptions={routeOptions}
          onGetPass={(opt) => {
            setSelectedOption(opt);
            document.getElementById("journey-analysis")?.scrollIntoView({ behavior: "smooth" });
          }}
        />

        {/* Right Card: Top Mumbai Transit Operators */}
        <div className="lg:col-span-4 rounded-[30px] vision-card p-5 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Mumbai Operators</span>
              <span className="text-[10px] text-sky-300 bg-sky-500/20 px-1.5 py-0.5 rounded-full font-mono">
                RTO Sept 2026
              </span>
            </h4>
            <span
              onClick={() => setActiveCategory("ALL")}
              className="text-xs font-semibold text-sky-300 hover:text-sky-200 cursor-pointer"
            >
              See all &gt;
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
            {TOP_MUMBAI_OPERATORS.slice(0, 4).map((op, idx) => (
              <div
                key={idx}
                onClick={() => setActiveCategory(op.category as any)}
                className="flex items-center justify-between p-2 rounded-2xl hover:bg-white/10 transition-colors cursor-pointer group active:scale-98"
                title={`Filter by ${op.name}`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${op.color} flex items-center justify-center text-sm shadow-md shrink-0 group-hover:scale-110 transition-transform`}>
                    {op.icon}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors">
                      {op.name}
                    </p>
                    <p className="text-[10px] text-slate-300">{op.subtitle}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors group-hover:translate-x-1" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. MUMBAI SEARCH FORM: THE TWO REQUIRED INPUTS */}
      <div id="journey-planner" className="w-full rounded-[28px] vision-card p-4 sm:p-5 shadow-2xl">
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
              label="Starting Station / Landmark"
              placeholder="e.g. Dadar, Churchgate, Andheri, Borivali, BKC, Thane..."
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
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-stone-300 hover:text-white transition-all shadow-md cursor-pointer hover:rotate-180 duration-300 active:scale-90"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>

          {/* Destination Input */}
          <div className="flex-1 w-full">
            <LocationAutocomplete
              label="Destination Station / Stop"
              placeholder="e.g. CSMT, Nariman Point, Bandra, Powai, Ghatkopar, Vashi..."
              value={destText}
              selectedLocation={destLoc}
              onSelectLocation={setDestLoc}
              onTextChange={setDestText}
              accentColor="rose"
              errorMessage={validationError && !destText ? validationError : undefined}
            />
          </div>

          {/* Find Journeys Button */}
          <div className="w-full md:w-auto shrink-0 mt-5">
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-7 py-3 rounded-full bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 hover:from-rose-600 hover:to-orange-600 text-white font-bold text-xs tracking-wider uppercase shadow-lg shadow-rose-950/50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Calculating Mumbai Fares...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 text-white" />
                  <span>Find Mumbai Journeys</span>
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

        {/* Quick Mumbai Corridor Suggestions */}
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between flex-wrap gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-amber-300 flex items-center gap-1">
              <span>📍</span>
              <span>Popular Mumbai Corridors:</span>
            </span>
            {POPULAR_MUMBAI_CORRIDORS.map((corridor, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSourceText(corridor.originText);
                  setSourceLoc(corridor.origin);
                  setDestText(corridor.destText);
                  setDestLoc(corridor.dest);
                  executeSearch(corridor.origin, corridor.dest, corridor.originText, corridor.destText);
                }}
                className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-stone-300 hover:text-white transition-all cursor-pointer hover:border-rose-400/40 hover:scale-105 active:scale-95"
              >
                <span>{corridor.label}</span>
                <span className="text-[10px] text-stone-400 ml-1">({corridor.subtext})</span>
              </button>
            ))}
          </div>

          {/* Quick Commuter Passengers Count */}
          <div className="flex items-center gap-2 text-xs text-stone-300">
            <span className="text-stone-400 text-[11px] font-semibold">Commuters:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 4, 6].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPassengers(p)}
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    passengers === p
                      ? "bg-white text-slate-900 shadow-md font-extrabold"
                      : "bg-white/10 text-slate-300 hover:bg-white/15"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. JOURNEY OPTIONS GRID */}
      <div id="journey-passes" className="w-full">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span>Available Mumbai Transit Corridors</span>
            <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-semibold">
              {sortedAndFilteredOptions.length} Verified Options
            </span>
          </h3>

          <span
            onClick={() => {
              setActiveCategory("ALL");
              setSmartFilter("SPEED");
            }}
            className="text-xs font-semibold text-sky-300 hover:text-sky-200 cursor-pointer"
          >
            Reset Filters &gt;
          </span>
        </div>

        {/* 3 Smart Filters Selector Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 mb-4 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shrink-0 shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>Three Smart Filters</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 text-stone-300 font-mono">
                  Real-Time MMR
                </span>
              </h4>
              <p className="text-[11px] text-stone-300">
                Prioritize routes by highest comfort, maximum speed, or lowest fare.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            {/* Speed Filter Button */}
            <button
              type="button"
              onClick={() => handleSmartFilterChange("SPEED")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                smartFilter === "SPEED"
                  ? "bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-orange-950/50 scale-105 ring-2 ring-amber-300"
                  : "bg-white/10 hover:bg-white/15 text-stone-300 border border-white/10"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Speed (Fastest)</span>
            </button>

            {/* Cheapest Filter Button */}
            <button
              type="button"
              onClick={() => handleSmartFilterChange("CHEAPEST")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                smartFilter === "CHEAPEST"
                  ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 text-white shadow-emerald-950/50 scale-105 ring-2 ring-emerald-300"
                  : "bg-white/10 hover:bg-white/15 text-stone-300 border border-white/10"
              }`}
            >
              <Coins className="w-3.5 h-3.5 text-emerald-300" />
              <span>Cheapest (Lowest Fare)</span>
            </button>

            {/* Comfort Filter Button */}
            <button
              type="button"
              onClick={() => handleSmartFilterChange("COMFORT")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                smartFilter === "COMFORT"
                  ? "bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 text-white shadow-purple-950/50 scale-105 ring-2 ring-purple-300"
                  : "bg-white/10 hover:bg-white/15 text-stone-300 border border-white/10"
              }`}
            >
              <Armchair className="w-3.5 h-3.5 text-purple-300" />
              <span>Comfort (Cabs &amp; AC)</span>
            </button>
          </div>
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

        {/* Cards Grid */}
        {loading ? (
          <div className="py-16 text-center text-stone-400 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-rose-400" />
            <p className="text-xs font-medium">Computing live Mumbai suburban tariffs & traffic corridors...</p>
          </div>
        ) : sortedAndFilteredOptions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {sortedAndFilteredOptions.map((opt, idx) => {
              const isSelected = selectedOption?.journey_id === opt.journey_id;
              const mode = opt.transport_mode || opt.mode;

              // Color accents per Mumbai mode
              const gradientMap: Record<string, string> = {
                TRAIN: "from-sky-950/80 via-blue-950/60 to-slate-900",
                METRO: "from-indigo-950/80 via-purple-950/60 to-slate-900",
                BUS: "from-teal-950/80 via-emerald-950/60 to-slate-900",
                CAB: "from-slate-900 via-sky-950/60 to-slate-900",
                AUTO: "from-amber-950/80 via-yellow-950/60 to-slate-900",
                BIKE: "from-emerald-950/80 via-teal-950/60 to-slate-900",
                CAR_PERSONAL: "from-slate-900 via-indigo-950/60 to-slate-900",
                MOTORCYCLE_PERSONAL: "from-slate-900 via-sky-950/60 to-slate-900"
              };

              return (
                <div
                  key={opt.journey_id || idx}
                  onClick={() => setSelectedOption(opt)}
                  className={`rounded-[24px] vision-card p-3.5 flex flex-col justify-between transition-all cursor-pointer relative group ${
                    isSelected
                      ? "ring-2 ring-sky-400 shadow-2xl bg-white/15 scale-[1.02]"
                      : "hover:scale-[1.01] hover:bg-white/8"
                  }`}
                >
                  {/* Top Preview Banner */}
                  <div
                    className={`rounded-[18px] min-h-[118px] w-full bg-gradient-to-br ${
                      gradientMap[mode] || "from-stone-900 to-stone-950"
                    } border border-white/10 p-3 flex flex-col justify-between overflow-hidden relative shadow-inner mb-3`}
                  >
                    <div className="flex items-center justify-between relative z-10">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-stone-200 border border-white/15">
                        {mode === "TRAIN"
                          ? "🚆 MUMBAI LOCAL"
                          : mode === "METRO"
                          ? "🚇 MUMBAI METRO"
                          : mode === "BUS"
                          ? "🚌 BEST BUS"
                          : mode === "CAB"
                          ? "🚖 KAALI-PEELI / CAB"
                          : mode === "AUTO"
                          ? "🛺 METERED AUTO"
                          : mode === "BIKE"
                          ? "🛵 BIKE TAXI"
                          : "🚗 PERSONAL"}
                      </span>

                      {opt.recommended && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-gradient-to-r from-sky-400 to-emerald-400 text-slate-950 shadow-sm">
                          RECOMMENDED
                        </span>
                      )}
                    </div>

                    <div className="relative z-10 flex flex-col gap-1 mt-2">
                      <p className="text-white font-extrabold text-xs drop-shadow-sm truncate">
                        {opt.title}
                      </p>
                      
                      <div className="flex items-center gap-1.5 text-[10px] text-stone-200 font-medium flex-wrap">
                        <span>{opt.total_duration_minutes ?? opt.duration_min} mins</span>
                        <span>&bull;</span>
                        <span>{opt.route_distance_km ?? opt.distance_km} km</span>
                        <span>&bull;</span>
                        <span>{opt.transfers && opt.transfers > 0 ? `${opt.transfers} xfer` : "Direct"}</span>
                      </div>

                      {/* Deep Learning Neural Network Prediction */}
                      {opt.neural_duration_min && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-950/80 border border-indigo-400/40 text-[9px] text-indigo-200 font-mono shadow-sm mt-0.5 w-fit">
                          <Brain className="w-3 h-3 text-indigo-400 shrink-0 animate-pulse" />
                          <span>AI Neural: ~{opt.neural_duration_min}m ({opt.neural_confidence_pct ?? 92}% conf)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Operator & Price Row */}
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <p className="text-xs font-bold text-white truncate">{opt.title}</p>
                      {opt.smart_filter_tag && (
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                          opt.smart_filter_tag === "SPEED"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : opt.smart_filter_tag === "CHEAPEST"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                        }`}>
                          {opt.smart_filter_tag}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-stone-400 mb-2">
                      <span className="truncate">{opt.operator}</span>
                      {opt.comfort_score && (
                        <span className="text-[10px] font-semibold text-stone-300 shrink-0">
                          🛋️ {opt.comfort_score}/100
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-stone-400 font-medium">
                          Verified Fare
                        </span>
                        <span className="text-[9px] text-emerald-400">
                          {opt.traffic_status || "Live MMR Traffic"}
                        </span>
                      </div>

                      {/* Price Pill Button (Selects & Scrolls to 5-Parameter Analysis) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOption(opt);
                          document.getElementById("journey-analysis")?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white text-white hover:text-slate-900 border border-white/20 font-black text-xs transition-all shadow-sm cursor-pointer flex items-center gap-1 active:scale-95"
                      >
                        <span>₹{opt.quoted_price_inr ?? opt.fare_inr}</span>
                        <span className="text-[10px] text-sky-300 font-medium">
                          &bull; Analyze &rarr;
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-stone-400 vision-card rounded-[24px]">
            No transit options found for this category. Click &quot;All Mumbai Fares&quot; to see all options.
          </div>
        )}
      </div>

      {/* 5. TOP 5 PARAMETERS MULTI-CRITERIA JOURNEY ANALYSIS DASHBOARD */}
      <div id="journey-analysis" className="w-full">
        <JourneyFiveParameterAnalysis
          selectedOption={selectedOption}
          allOptions={routeOptions}
          origin={sourceLoc}
          destination={destLoc}
          onSelectOption={(opt) => setSelectedOption(opt)}
        />
      </div>

      {/* 6. ACTIVE CORRIDOR ITINERARY & TURN-BY-TURN WAYPOINTS */}
      <div id="corridor-itinerary" className="w-full rounded-[28px] vision-card p-5 sm:p-7 shadow-xl border border-white/10 mt-2 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider font-mono">
                Active Mumbai Corridor Waypoints
              </span>
            </div>
            <h4 className="text-base sm:text-lg font-black text-white">
              {selectedOption?.title || "Selected Mumbai Route"}
            </h4>
          </div>

          <div className="text-right flex items-baseline gap-2">
            <span className="text-xs text-stone-400">Total Fare:</span>
            <span className="text-2xl font-black text-emerald-400">
              ₹{selectedOption?.quoted_price_inr ?? selectedOption?.fare_inr ?? 0}
            </span>
          </div>
        </div>

        {/* Comprehensive Journey Comparison Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 mb-5 text-xs">
          {/* Travel Time */}
          <div className="flex flex-col gap-0.5 p-2.5 rounded-xl bg-black/20 border border-white/5">
            <span className="text-[10px] text-stone-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>Travel Time</span>
            </span>
            <span className="text-sm font-black text-white">
              {selectedOption?.total_duration_minutes ?? selectedOption?.duration_min ?? 0} mins
            </span>
            {selectedOption?.neural_duration_min && (
              <span className="text-[9px] text-indigo-300 font-mono flex items-center gap-0.5">
                <Brain className="w-2.5 h-2.5 text-indigo-400" />
                <span>Neural: ~{selectedOption.neural_duration_min}m</span>
              </span>
            )}
          </div>

          {/* Distance */}
          <div className="flex flex-col gap-0.5 p-2.5 rounded-xl bg-black/20 border border-white/5">
            <span className="text-[10px] text-stone-400 flex items-center gap-1">
              <Navigation className="w-3 h-3 text-rose-400" />
              <span>Distance</span>
            </span>
            <span className="text-sm font-black text-white">
              {selectedOption?.route_distance_km ?? selectedOption?.distance_km ?? 0} km
            </span>
            <span className="text-[9px] text-stone-400">
              Corridor route
            </span>
          </div>

          {/* Verified Fare */}
          <div className="flex flex-col gap-0.5 p-2.5 rounded-xl bg-black/20 border border-white/5">
            <span className="text-[10px] text-stone-400 flex items-center gap-1">
              <Coins className="w-3 h-3 text-emerald-400" />
              <span>Verified Fare</span>
            </span>
            <span className="text-sm font-black text-emerald-300">
              ₹{selectedOption?.quoted_price_inr ?? selectedOption?.fare_inr ?? 0}
            </span>
            <span className="text-[9px] text-stone-400 truncate">
              {selectedOption?.price_type || "Regulated Tariff"}
            </span>
          </div>

          {/* Transfers */}
          <div className="flex flex-col gap-0.5 p-2.5 rounded-xl bg-black/20 border border-white/5">
            <span className="text-[10px] text-stone-400 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-cyan-400" />
              <span>Transfers</span>
            </span>
            <span className="text-sm font-black text-white">
              {selectedOption?.transfers && selectedOption.transfers > 0
                ? `${selectedOption.transfers} Interchange${selectedOption.transfers > 1 ? "s" : ""}`
                : "Direct (0)"}
            </span>
            <span className="text-[9px] text-stone-400">
              {selectedOption?.steps ? `${selectedOption.steps.length} segments` : "Point to point"}
            </span>
          </div>

          {/* Traffic Buffer */}
          <div className="flex flex-col gap-0.5 p-2.5 rounded-xl bg-black/20 border border-white/5">
            <span className="text-[10px] text-stone-400 flex items-center gap-1">
              <Activity className="w-3 h-3 text-orange-400" />
              <span>Traffic Buffer</span>
            </span>
            <span className="text-xs font-bold text-amber-300 truncate">
              {selectedOption?.traffic_status || "Flowing Normally"}
            </span>
            <span className="text-[9px] text-stone-400">
              Delay: +{selectedOption?.estimated_delay_min ?? 0} min
            </span>
          </div>

          {/* Comfort Score */}
          <div className="flex flex-col gap-0.5 p-2.5 rounded-xl bg-black/20 border border-white/5">
            <span className="text-[10px] text-stone-400 flex items-center gap-1">
              <Armchair className="w-3 h-3 text-purple-400" />
              <span>Comfort Score</span>
            </span>
            <span className="text-sm font-black text-purple-300">
              {selectedOption?.comfort_score ?? 60}/100
            </span>
            <span className="text-[9px] text-emerald-400 font-semibold flex items-center gap-1">
              <Leaf className="w-2.5 h-2.5" />
              <span>{selectedOption?.co2_emissions_g ?? 50}g CO₂</span>
            </span>
          </div>
        </div>

        {/* Turn-by-Turn Waypoints Grid */}
        {selectedOption?.steps && selectedOption.steps.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-300 pb-1 border-b border-white/10">
              <span className="font-bold text-white flex items-center gap-2">
                <Navigation className="w-3.5 h-3.5 text-sky-400" />
                <span>Turn-by-Turn Waypoints &amp; Station Steps:</span>
              </span>
              <span className="text-[10px] text-sky-300 bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/20 font-mono">
                {selectedOption.steps.length} Route Segments
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-96 overflow-y-auto pr-1">
              {selectedOption.steps.map((st, i) => (
                <div
                  key={i}
                  onClick={() => setHighlightedStepIndex(i)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                    highlightedStepIndex === i
                      ? "bg-sky-950/70 border-sky-400 text-white shadow-lg ring-1 ring-sky-400/50 scale-[1.01]"
                      : "bg-white/5 border-white/10 hover:bg-white/10 text-slate-300"
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center justify-center text-[10px] font-black shrink-0">
                    {st.step_number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white leading-snug">{st.instruction}</p>
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                      <span className="px-1.5 py-0.2 rounded bg-white/10 font-mono text-[9px] text-sky-300">{st.mode}</span>
                      <span>&bull;</span>
                      <span>{st.duration_min} mins</span>
                      {st.distance_km > 0 && (
                        <>
                          <span>&bull;</span>
                          <span>{st.distance_km} km</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Provenance note */}
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[10px] text-stone-400 gap-2">
          <span>Source: {selectedOption?.source_name || "MMR Official Tariff & Google Routes Engine"}</span>
          <span>Mumbai Metropolitan Region Authority (MMRDA) &amp; Railway Operations</span>
        </div>
      </div>

    </div>
  );
}
