"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Train,
  Bus,
  Plane,
  Building,
  Navigation,
  Loader2,
  X,
  Crosshair
} from "lucide-react";
import { ResolvedLocation, PlaceCategory } from "@/types";
import { fetchApi } from "@/lib/api";

interface LocationAutocompleteProps {
  label: string;
  placeholder: string;
  value: string;
  selectedLocation: ResolvedLocation | null;
  onSelectLocation: (loc: ResolvedLocation) => void;
  onTextChange: (text: string) => void;
  accentColor?: "emerald" | "rose" | "sky";
}

export const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  label,
  placeholder,
  value,
  selectedLocation,
  onSelectLocation,
  onTextChange,
  accentColor = "sky"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ResolvedLocation[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [geoLoading, setGeoLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Autocomplete Suggestions
  const fetchSuggestions = (queryText: string) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();

    if (!queryText || queryText.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    setIsOpen(true);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetchApi<{ results: ResolvedLocation[] }>(
          `/location/autocomplete?q=${encodeURIComponent(queryText)}`
        );
        if (res && res.results) {
          setSuggestions(res.results);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.warn("Autocomplete query failed", err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 250);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onTextChange(val);
    fetchSuggestions(val);
  };

  const handleSelect = (loc: ResolvedLocation) => {
    onSelectLocation(loc);
    onTextChange(loc.displayName);
    setIsOpen(false);
    setSuggestions([]);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelect(suggestions[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetchApi<{ location: ResolvedLocation }>(
            `/location/resolve?q=${latitude},${longitude}`
          );
          if (res && res.location) {
            const loc = {
              ...res.location,
              displayName: "My Current Location",
              latitude,
              longitude
            };
            handleSelect(loc);
          }
        } catch {
          const fallbackLoc: ResolvedLocation = {
            provider: "indian_transit_db",
            providerPlaceId: `geo-${Date.now()}`,
            displayName: "Current Location",
            formattedAddress: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}, India`,
            city: "Current Area",
            state: "India",
            countryCode: "IN",
            latitude,
            longitude,
            placeTypes: ["locality"],
            dataSource: "Browser Geolocation",
            retrievedAt: new Date().toISOString()
          };
          handleSelect(fallbackLoc);
        } finally {
          setGeoLoading(false);
        }
      },
      (err) => {
        console.warn("Geolocation permission denied or error", err);
        setGeoLoading(false);
        alert("Unable to access current location. Please type your location manually.");
      }
    );
  };

  const getCategoryIcon = (placeTypes: PlaceCategory[]) => {
    if (placeTypes.includes("railway_station")) return <Train className="w-4 h-4 text-sky-400" />;
    if (placeTypes.includes("metro_station")) return <Train className="w-4 h-4 text-purple-400" />;
    if (placeTypes.includes("bus_terminal")) return <Bus className="w-4 h-4 text-amber-400" />;
    if (placeTypes.includes("airport")) return <Plane className="w-4 h-4 text-emerald-400" />;
    if (placeTypes.includes("landmark")) return <Building className="w-4 h-4 text-rose-400" />;
    return <MapPin className="w-4 h-4 text-slate-400" />;
  };

  const iconColor =
    accentColor === "emerald"
      ? "text-emerald-400"
      : accentColor === "rose"
      ? "text-rose-400"
      : "text-sky-400";

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex items-center justify-between mb-1">
        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          {label}
        </label>
        <button
          type="button"
          onClick={handleGeolocation}
          disabled={geoLoading}
          className="text-[10px] text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 transition-colors"
        >
          {geoLoading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Crosshair className="w-3 h-3" />
          )}
          <span>Use My Location</span>
        </button>
      </div>

      <div className="relative">
        <MapPin className={`w-5 h-5 ${iconColor} absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none`} />

        <input
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => value.trim().length >= 2 && fetchSuggestions(value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-xl pl-10 pr-9 py-3 text-sm text-white font-semibold placeholder-slate-500 focus:outline-none transition-colors"
        />

        {loading ? (
          <Loader2 className="w-4 h-4 text-slate-400 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
        ) : value ? (
          <button
            type="button"
            onClick={() => {
              onTextChange("");
              setSuggestions([]);
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto divide-y divide-slate-800/80">
          {suggestions.length > 0 ? (
            suggestions.map((loc, idx) => {
              const isHighlighted = idx === selectedIndex;
              return (
                <div
                  key={loc.providerPlaceId || idx}
                  onClick={() => handleSelect(loc)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 cursor-pointer transition-colors flex items-start gap-3 ${
                    isHighlighted ? "bg-slate-800 text-white" : "hover:bg-slate-800/50 text-slate-200"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">{getCategoryIcon(loc.placeTypes)}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white truncate">{loc.displayName}</span>
                      {loc.city && (
                        <span className="text-[10px] font-mono bg-slate-950 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800 shrink-0">
                          {loc.city}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {loc.secondaryAddress || loc.formattedAddress}
                    </p>
                  </div>
                </div>
              );
            })
          ) : !loading ? (
            <div className="p-4 text-center text-xs text-slate-400">
              No matching Indian locations found. Try searching by city, station name, or locality.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
