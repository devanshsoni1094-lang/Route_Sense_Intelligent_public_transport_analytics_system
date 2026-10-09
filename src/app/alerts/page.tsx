"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, UserCheck, ShieldAlert, FileText } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { AnomalyAlert } from "@/types";

const mockAlerts: AnomalyAlert[] = [
  {
    id: "ALT-2026-001",
    severity: "CRITICAL",
    alert_type: "DELAY_SPIKE",
    route_id: "R-500A",
    observed_value: "18.5 min delay",
    threshold_value: "5.0 min tolerance",
    evidence: { delay_spike_min: 18.5, congestion_corridor: "Bellandur EcoSpace Flyover" },
    suggested_action: "Deploy 2 standby feeder buses from Central Depot 25.",
    status: "NEW",
    timestamp: new Date().toISOString()
  },
  {
    id: "ALT-2026-002",
    severity: "HIGH",
    alert_type: "UNEXPECTED_GAP",
    route_id: "R-335E",
    observed_value: "28 min headway gap",
    threshold_value: "12 min scheduled headway",
    evidence: { missing_trips: 1, location: "Kundalahalli Gate" },
    suggested_action: "Adjust departure frequency at KBS Terminal.",
    status: "ACKNOWLEDGED",
    assigned_to: "manager",
    timestamp: new Date().toISOString()
  },
  {
    id: "ALT-2026-003",
    severity: "MEDIUM",
    alert_type: "STALE_FEED",
    route_id: "R-201",
    observed_value: "940 sec since ping",
    threshold_value: "300 sec stale limit",
    evidence: { last_ping: "15 mins ago" },
    suggested_action: "Check vehicle GPS unit power connection.",
    status: "RESOLVED",
    assigned_to: "analyst",
    timestamp: new Date().toISOString()
  }
];

export default function ServiceAlertsPage() {
  const [alerts, setAlerts] = useState<AnomalyAlert[]>(mockAlerts);

  const loadAlerts = () => {
    fetchApi<AnomalyAlert[]>("/alerts/anomalies")
      .then((res) => setAlerts(res))
      .catch((err) => console.warn("Using fallback anomaly alerts", err));
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleUpdateStatus = (id: string, newStatus: string) => {
    fetchApi(`/alerts/anomalies/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status: newStatus, assigned_to: "manager" })
    })
      .then(() => {
        setAlerts((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: newStatus as any, assigned_to: "manager" } : a))
        );
      })
      .catch(() => {
        setAlerts((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: newStatus as any } : a))
        );
      });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Service Reliability & Anomaly Alerts
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated detection of missing GPS feeds, service gaps, delay spikes, and abnormal corridor speeds.
          </p>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {alerts.map((a) => (
          <div key={a.id} className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border ${
                  a.severity === 'CRITICAL' ? 'bg-red-950 text-red-400 border-red-800' : 
                  a.severity === 'HIGH' ? 'bg-amber-950 text-amber-400 border-amber-800' : 'bg-blue-950 text-blue-400 border-blue-800'
                }`}>
                  {a.severity} SEVERITY
                </span>
                <span className="font-mono text-xs font-bold text-white">{a.id}</span>
                <span className="text-xs text-slate-400">• {a.alert_type}</span>
                {a.route_id && (
                  <span className="text-xs font-mono text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800">
                    Route {a.route_id}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  a.status === 'NEW' ? 'bg-red-950 text-red-400' :
                  a.status === 'ACKNOWLEDGED' ? 'bg-amber-950 text-amber-400' : 'bg-emerald-950 text-emerald-400'
                }`}>
                  Status: {a.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <p><span className="text-slate-400 font-semibold">Observed Measurement:</span> <strong className="text-white">{a.observed_value}</strong></p>
                <p><span className="text-slate-400 font-semibold">Configured Threshold:</span> <span className="text-slate-300">{a.threshold_value}</span></p>
              </div>
              <div className="space-y-1">
                <p><span className="text-slate-400 font-semibold">Suggested Action:</span> <span className="text-emerald-400 font-medium">{a.suggested_action}</span></p>
                {a.assigned_to && <p><span className="text-slate-400 font-semibold">Assigned Owner:</span> <span className="text-sky-400">{a.assigned_to}</span></p>}
              </div>
            </div>

            {/* Lifecycle Action Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              {a.status === "NEW" && (
                <button
                  onClick={() => handleUpdateStatus(a.id, "ACKNOWLEDGED")}
                  className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-3 py-1 rounded transition-colors"
                >
                  Acknowledge Alert
                </button>
              )}
              {a.status !== "RESOLVED" && (
                <button
                  onClick={() => handleUpdateStatus(a.id, "RESOLVED")}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded transition-colors"
                >
                  Mark Resolved
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
