"use client";

import React, { useEffect, useState } from "react";
import { Lightbulb, CheckCircle2, XCircle, ChevronRight, BarChart2 } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { Recommendation } from "@/types";

const mockRecs: Recommendation[] = [
  {
    id: "REC-2026-001",
    route_id: "R-500A",
    problem_title: "Severe Peak Hour Congestion Bottleneck at Bellandur-Marathahalli",
    proposed_action: "Increase peak frequency from 10-min to 6-min headway between 08:00-10:30 AM and short-turn 4 buses at Marathahalli Bridge.",
    supporting_metrics: { mean_delay_min: 14.2, otp_pct: 58.4, peak_occupancy_rate: 1.15, observations_count: 420 },
    expected_benefit: "Reduces passenger wait time by 32% and improves Corridor OTP from 58.4% to 81.0%.",
    estimated_effort: "MEDIUM",
    confidence_level: "HIGH",
    status: "PENDING_REVIEW"
  },
  {
    id: "REC-2026-002",
    route_id: "R-335E",
    problem_title: "Off-Peak Excess Layover & Vehicle Idling at ITPL Terminal",
    proposed_action: "Reallocate 3 idle vehicles during 12:00-15:00 to feeder Route 201 to cover metro connection demand.",
    supporting_metrics: { layover_time_min: 38.0, target_layover_min: 15.0, utilization_pct: 52.0 },
    expected_benefit: "Increases fleet utilization efficiency by 18% with zero extra fuel burn.",
    estimated_effort: "LOW",
    confidence_level: "HIGH",
    status: "APPROVED",
    reviewed_by: "admin"
  }
];

export default function RecommendationsPage() {
  const [recs, setRecs] = useState<Recommendation[]>(mockRecs);

  useEffect(() => {
    fetchApi<Recommendation[]>("/recommendations")
      .then((res) => setRecs(res))
      .catch((err) => console.warn("Using fallback recommendations", err));
  }, []);

  const handleReview = (id: string, action: "APPROVE" | "REJECT") => {
    fetchApi(`/recommendations/${id}/review`, {
      method: "POST",
      body: JSON.stringify({ action, reviewed_by: "Ops Director" })
    })
      .then(() => {
        setRecs((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: action === "APPROVE" ? "APPROVED" : "REJECTED", reviewed_by: "Ops Director" } : r))
        );
      })
      .catch(() => {
        setRecs((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: action === "APPROVE" ? "APPROVED" : "REJECTED" } : r))
        );
      });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            Route & Service Optimization Recommendations
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Human-in-the-loop decision-support recommendations backed by operational telemetry data.
          </p>
        </div>
      </div>

      {/* Recommendations Cards List */}
      <div className="space-y-4">
        {recs.map((r) => (
          <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-sky-400">{r.id}</span>
                <span className="text-xs text-slate-300 font-semibold">• Route {r.route_id}</span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                  Effort: {r.estimated_effort}
                </span>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-mono">
                  Confidence: {r.confidence_level}
                </span>
              </div>
              <div>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border uppercase ${
                  r.status === 'APPROVED' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' :
                  r.status === 'REJECTED' ? 'bg-red-950 text-red-400 border-red-800' : 'bg-amber-950 text-amber-400 border-amber-800'
                }`}>
                  Status: {r.status}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <h3 className="text-sm font-bold text-white">{r.problem_title}</h3>
              <p className="text-slate-300"><span className="text-slate-400 font-semibold">Proposed Action:</span> {r.proposed_action}</p>
              
              <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1">
                <p className="text-emerald-400 font-medium"><span className="text-slate-400">Expected Benefit:</span> {r.expected_benefit}</p>
                <p className="text-slate-400 text-[11px]"><span className="font-semibold text-slate-300">Supporting Metrics:</span> {JSON.stringify(r.supporting_metrics)}</p>
              </div>
            </div>

            {/* Review Action Buttons */}
            {r.status === "PENDING_REVIEW" && (
              <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
                <button
                  onClick={() => handleReview(r.id, "APPROVE")}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-1.5 rounded transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve Recommendation
                </button>
                <button
                  onClick={() => handleReview(r.id, "REJECT")}
                  className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-4 py-1.5 rounded transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Reject Recommendation
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
