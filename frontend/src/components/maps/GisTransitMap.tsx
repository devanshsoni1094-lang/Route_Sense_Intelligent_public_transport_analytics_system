"use client";

import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

export interface ScheduledCorridorStop {
  id: string;
  name: string;
  line: string;
  latitude: number;
  longitude: number;
  zone: string;
}

interface GisTransitMapProps {
  stops?: ScheduledCorridorStop[];
  selectedStopId?: string;
  onSelectStop?: (id: string) => void;
}

const DEFAULT_MUMBAI_STOPS: ScheduledCorridorStop[] = [
  { id: "csmt", name: "CSMT (Chhatrapati Shivaji Maharaj Terminus)", line: "Central Line Fast", latitude: 18.9400, longitude: 72.8353, zone: "South Mumbai" },
  { id: "byculla", name: "Byculla Station", line: "Central Line", latitude: 18.9754, longitude: 72.8335, zone: "Central Mumbai" },
  { id: "dadar-cr", name: "Dadar Central Junction", line: "Central & Western Interchange", latitude: 19.0178, longitude: 72.8478, zone: "Central Hub" },
  { id: "kurla", name: "Kurla Junction", line: "Harbour & Central", latitude: 19.0652, longitude: 72.8794, zone: "Eastern Suburban" },
  { id: "ghatkopar", name: "Ghatkopar Station & Metro 1", line: "Central & Metro Line 1", latitude: 19.0863, longitude: 72.9082, zone: "Eastern Suburban" },
  { id: "thane", name: "Thane Central Terminus", line: "Trans-Harbour & Central", latitude: 19.1860, longitude: 72.9758, zone: "Thane MMR" },
  { id: "churchgate", name: "Churchgate Station", line: "Western Line Terminus", latitude: 18.9352, longitude: 72.8272, zone: "South Mumbai" },
  { id: "bandra", name: "Bandra Terminus & Sea Link", line: "Western Line", latitude: 19.0544, longitude: 72.8402, zone: "Western Suburban" },
  { id: "andheri", name: "Andheri Station & Metro 1", line: "Western & Metro Line 1", latitude: 19.1197, longitude: 72.8464, zone: "Western Suburban" },
  { id: "borivali", name: "Borivali Express Junction", line: "Western Line Express", latitude: 19.2291, longitude: 72.8569, zone: "North Western MMR" },
];

const createStationIcon = (isSelected: boolean) => {
  return L.divIcon({
    className: "custom-station-icon",
    html: `<div style="background-color: ${isSelected ? '#e11d48' : '#0284c7'}; width: 20px; height: 20px; border-radius: 50%; border: 2.5px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.5); color: white; font-weight: 800; font-size: 9px;">🚉</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

export default function GisTransitMap({ stops = DEFAULT_MUMBAI_STOPS, selectedStopId, onSelectStop }: GisTransitMapProps) {
  const center: [number, number] = [19.0760, 72.8777]; // Mumbai MMR geographical center

  return (
    <div className="w-full h-[520px] rounded-lg overflow-hidden border border-slate-800 shadow-inner">
      <MapContainer center={center} zoom={11} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &bull; Route Sense Mumbai MMR'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {stops.map((s) => {
          const isSelected = selectedStopId === s.id;
          return (
            <Marker
              key={s.id}
              position={[s.latitude, s.longitude]}
              icon={createStationIcon(isSelected)}
              eventHandlers={{
                click: () => onSelectStop && onSelectStop(s.id),
              }}
            >
              <Popup>
                <div className="text-slate-900 text-xs font-sans space-y-1">
                  <p className="font-bold text-sm text-sky-800">{s.name}</p>
                  <p><strong>Corridor:</strong> {s.line}</p>
                  <p><strong>Zone:</strong> {s.zone}</p>
                  <p className="text-[10px] text-slate-500 font-mono">Location: {s.latitude.toFixed(4)}°N, {s.longitude.toFixed(4)}°E</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
