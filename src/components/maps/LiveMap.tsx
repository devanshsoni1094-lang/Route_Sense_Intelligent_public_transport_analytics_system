"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import { VehicleTelemetry } from "@/types";

interface LiveMapProps {
  vehicles: VehicleTelemetry[];
  selectedVehicleId?: string;
  onSelectVehicle?: (id: string) => void;
}

// Custom Bus Marker Icons
const createBusIcon = (status: string) => {
  let color = "#10b981"; // Green = ON_TIME
  if (status === "DELAYED") color = "#f59e0b"; // Amber = DELAYED
  if (status === "STALE") color = "#ef4444"; // Red = STALE

  return L.divIcon({
    className: "custom-bus-icon",
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.4); color: white; font-weight: bold; font-size: 10px;">🚌</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

export default function LiveMap({ vehicles, selectedVehicleId, onSelectVehicle }: LiveMapProps) {
  const center: [number, number] = [12.9716, 77.5946]; // Bengaluru default

  return (
    <div className="w-full h-[520px] rounded-lg overflow-hidden border border-slate-800 shadow-inner">
      <MapContainer center={center} zoom={12} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {vehicles.map((v) => (
          <Marker
            key={v.vehicle_id}
            position={[v.latitude, v.longitude]}
            icon={createBusIcon(v.status)}
            eventHandlers={{
              click: () => onSelectVehicle && onSelectVehicle(v.vehicle_id),
            }}
          >
            <Popup>
              <div className="text-slate-900 text-xs font-sans space-y-1">
                <p className="font-bold text-sm text-sky-700">{v.vehicle_number}</p>
                <p><strong>Route:</strong> {v.route_name || v.route_id}</p>
                <p><strong>Speed:</strong> {v.speed_kmh} km/h</p>
                <p><strong>Delay:</strong> {v.delay_minutes} min</p>
                <p><strong>Status:</strong> <span className={`font-bold ${v.status === 'ON_TIME' ? 'text-emerald-600' : 'text-amber-600'}`}>{v.status}</span></p>
                <p className="text-[10px] text-slate-500">Updated: {new Date(v.last_updated).toLocaleTimeString()}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
