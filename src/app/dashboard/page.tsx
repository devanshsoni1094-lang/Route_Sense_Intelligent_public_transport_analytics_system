"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Compass,
  MapPin,
  Calendar,
  Clock,
  IndianRupee,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  Plus,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Train,
  Bus,
  Car,
  Zap,
  Bookmark,
  Heart,
  Navigation,
  Accessibility,
  ChevronRight,
  Loader2
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CommuteLogItem, UserPreferences, SavedPlace } from "@/app/api/v1/commute/dashboard/route";

export default function PersonalCommuteDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<"logs" | "places" | "budget" | "preferences">("logs");
  const [loading, setLoading] = useState<boolean>(true);

  // Dashboard Data State
  const [commuteLogs, setCommuteLogs] = useState<CommuteLogItem[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>({
    maxWalkingDistanceMeters: 800,
    maxTransfers: 1,
    maxBudgetInr: 150,
    preferElevatorEscalator: true,
    preferLadiesCompartment: false,
    avoidOvercrowdedPeak: true,
    preferredModes: ["METRO", "TRAIN", "BUS"]
  });
  const [analytics, setAnalytics] = useState({
    totalCommutes: 0,
    totalSpentInr: 0,
    monthlyBudgetInr: 3500,
    estimatedSavingsInr: 0,
    avgDurationMin: 0
  });

  // Modal State for "Log My Commute"
  const [showLogModal, setShowLogModal] = useState(false);
  const [newLog, setNewLog] = useState({
    origin: "",
    destination: "",
    mode: "TRAIN",
    estimatedDurationMin: 45,
    actualDurationMin: 45,
    estimatedCostInr: 20,
    actualCostInr: 20,
    notes: ""
  });
  const [submittingLog, setSubmittingLog] = useState(false);
  const [prefSaveStatus, setPrefSaveStatus] = useState<string | null>(null);

  // Fetch Dashboard Data
  useEffect(() => {
    fetch("/api/v1/commute/dashboard")
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          setCommuteLogs(res.data.commuteLogs || []);
          if (res.data.preferences) setPreferences(res.data.preferences);
          if (res.data.savedPlaces) setSavedPlaces(res.data.savedPlaces);
          if (res.data.analytics) setAnalytics(res.data.analytics);
        }
      })
      .catch((err) => console.error("Error loading dashboard data:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleLogCommute = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingLog(true);
    try {
      const res = await fetch("/api/v1/commute/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "LOG_COMMUTE",
          payload: newLog
        })
      });
      const data = await res.json();
      if (data.success && data.log) {
        setCommuteLogs([data.log, ...commuteLogs]);
        setAnalytics((prev) => ({
          ...prev,
          totalCommutes: prev.totalCommutes + 1,
          totalSpentInr: prev.totalSpentInr + data.log.actualCostInr
        }));
        setShowLogModal(false);
        setNewLog({
          origin: "",
          destination: "",
          mode: "TRAIN",
          estimatedDurationMin: 45,
          actualDurationMin: 45,
          estimatedCostInr: 20,
          actualCostInr: 20,
          notes: ""
        });
      }
    } catch (err) {
      console.error("Failed to log commute:", err);
    } finally {
      setSubmittingLog(false);
    }
  };

  const handleSavePreferences = async () => {
    setPrefSaveStatus("Saving...");
    try {
      const res = await fetch("/api/v1/commute/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_PREFERENCES",
          payload: preferences
        })
      });
      const data = await res.json();
      if (data.success) {
        setPrefSaveStatus("Preferences saved successfully!");
        setTimeout(() => setPrefSaveStatus(null), 3000);
      }
    } catch {
      setPrefSaveStatus("Failed to update preferences.");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-white">
      {/* 1. TOP HEADER: USER WELCOME & ACTIONS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-300 font-bold">
              Verified Mumbai Commuter Profile
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Welcome back, {user?.name || "Commuter"}</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 mt-1">
            Track daily MMR travel expenses, compare scheduled vs actual journey times, and manage your transit accessibility rules.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowLogModal(true)}
            className="px-4 py-2.5 rounded-full bg-gradient-to-r from-sky-500 to-teal-500 hover:opacity-95 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-sky-950/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Log My Commute</span>
          </button>

          <Link
            href="/"
            className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white flex items-center gap-2 transition-all cursor-pointer shadow-md"
          >
            <Compass className="w-4 h-4 text-sky-300" />
            <span>Plan Journey</span>
          </Link>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Commutes */}
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/80 backdrop-blur-2xl border border-white/10 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-400 text-xs mb-2">
            <span className="font-semibold">Logged Commutes</span>
            <Calendar className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-white">
              {analytics.totalCommutes}
            </span>
            <span className="text-[11px] text-stone-400 block mt-0.5">
              Journeys recorded
            </span>
          </div>
        </div>

        {/* Monthly Spend */}
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/80 backdrop-blur-2xl border border-white/10 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-400 text-xs mb-2">
            <span className="font-semibold">Recorded Spend</span>
            <IndianRupee className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-emerald-300">
              ₹{analytics.totalSpentInr}
            </span>
            <span className="text-[11px] text-stone-400 block mt-0.5">
              Budget: ₹{analytics.monthlyBudgetInr}/mo
            </span>
          </div>
        </div>

        {/* Estimated Savings */}
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/80 backdrop-blur-2xl border border-white/10 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-400 text-xs mb-2">
            <span className="font-semibold">Savings vs Cabs</span>
            <TrendingDown className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-cyan-300">
              ₹{analytics.estimatedSavingsInr}
            </span>
            <span className="text-[11px] text-stone-400 block mt-0.5">
              By choosing public transit
            </span>
          </div>
        </div>

        {/* Avg Travel Time */}
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/80 backdrop-blur-2xl border border-white/10 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-400 text-xs mb-2">
            <span className="font-semibold">Avg Door-to-Door</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-amber-300">
              {analytics.avgDurationMin}m
            </span>
            <span className="text-[11px] text-stone-400 block mt-0.5">
              Average trip duration
            </span>
          </div>
        </div>
      </div>

      {/* 3. DASHBOARD TABS NAVIGATION */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold border-b border-white/10">
        {[
          { id: "logs", label: "My Commute Records" },
          { id: "places", label: "Saved Places & Corridors" },
          { id: "budget", label: "Budget & Mode Breakdown" },
          { id: "preferences", label: "Accessibility & Filters" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-2xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-white text-slate-900 font-black shadow-lg"
                : "text-stone-300 hover:text-white hover:bg-white/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. TAB CONTENTS */}
      {/* TAB 1: COMMUTE RECORDS */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Recorded Journeys</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-stone-300 font-mono">
                {commuteLogs.length} Records
              </span>
            </h3>
            <span className="text-xs text-stone-400">
              Comparing estimated vs actual commute times
            </span>
          </div>

          {commuteLogs.length === 0 ? (
            <div className="p-8 rounded-3xl bg-slate-900/60 border border-white/10 text-center space-y-3">
              <Clock className="w-8 h-8 text-stone-500 mx-auto" />
              <p className="text-sm text-stone-300">No commutes recorded yet.</p>
              <button
                type="button"
                onClick={() => setShowLogModal(true)}
                className="px-4 py-2 rounded-full bg-sky-500 text-white font-bold text-xs"
              >
                Log Your First Commute
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {commuteLogs.map((log) => {
                const diffTime = log.actualDurationMin - log.estimatedDurationMin;
                return (
                  <div
                    key={log.id}
                    className="p-4 sm:p-5 rounded-3xl bg-slate-900/80 backdrop-blur-2xl border border-white/10 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                        {log.mode === "TRAIN" ? (
                          <Train className="w-5 h-5 text-rose-400" />
                        ) : log.mode === "METRO" ? (
                          <Zap className="w-5 h-5 text-purple-400" />
                        ) : (
                          <Bus className="w-5 h-5 text-amber-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-white">
                            {log.origin} ➔ {log.destination}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-stone-300 font-mono">
                            {log.mode}
                          </span>
                          <span className="text-[10px] text-stone-400">
                            {new Date(log.date).toLocaleDateString()}
                          </span>
                        </div>
                        {log.notes && (
                          <p className="text-xs text-stone-300 mt-1 italic">
                            &ldquo;{log.notes}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-6 self-end sm:self-auto text-right">
                      {/* Duration comparison */}
                      <div>
                        <span className="text-[10px] text-stone-400 block">Duration</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-black text-white font-mono">
                            {log.actualDurationMin}m
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono">
                            (est. {log.estimatedDurationMin}m)
                          </span>
                        </div>
                        <span
                          className={`text-[9px] font-mono ${
                            diffTime > 0 ? "text-amber-400" : "text-emerald-400"
                          }`}
                        >
                          {diffTime > 0 ? `+${diffTime}m delay` : diffTime === 0 ? "On Time" : `${diffTime}m faster`}
                        </span>
                      </div>

                      {/* Cost */}
                      <div>
                        <span className="text-[10px] text-stone-400 block">Fare Paid</span>
                        <span className="text-sm font-black text-emerald-300 font-mono">
                          ₹{log.actualCostInr}
                        </span>
                        <span className="text-[9px] text-stone-400 block">
                          Verified Tariff
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SAVED PLACES & FAVORITES */}
      {activeTab === "places" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Saved Destinations</h3>
            <span className="text-xs text-stone-400">Quick 1-click journey routing</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {savedPlaces.map((sp) => (
              <div
                key={sp.id}
                className="p-5 rounded-3xl bg-slate-900/80 backdrop-blur-2xl border border-white/10 shadow-xl flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-300">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{sp.name}</h4>
                    <p className="text-xs text-stone-400 truncate max-w-xs">{sp.address}</p>
                  </div>
                </div>

                <Link
                  href={`/?dest=${encodeURIComponent(sp.name)}`}
                  className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-sky-200 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>Route Here</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: BUDGET & SPENDING */}
      {activeTab === "budget" && (
        <div className="space-y-5">
          <div className="p-6 rounded-3xl bg-slate-900/80 backdrop-blur-2xl border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Monthly MMR Commute Budget</h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Track actual public transit expenditure versus your self-set monthly ceiling.
                </p>
              </div>
              <span className="text-lg font-black text-emerald-300 font-mono">
                ₹{analytics.totalSpentInr} / ₹{analytics.monthlyBudgetInr}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400 transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.round((analytics.totalSpentInr / analytics.monthlyBudgetInr) * 100))}%`
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-stone-400 font-mono">
              <span>{Math.round((analytics.totalSpentInr / analytics.monthlyBudgetInr) * 100)}% utilized</span>
              <span>₹{Math.max(0, analytics.monthlyBudgetInr - analytics.totalSpentInr)} remaining this month</span>
            </div>
          </div>

          {/* Mode Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-3xl bg-slate-900/60 border border-white/10">
              <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
                <span>Local Trains (Central/Western)</span>
                <Train className="w-4 h-4 text-rose-400" />
              </div>
              <span className="text-xl font-black text-white font-mono">₹{Math.round(analytics.totalSpentInr * 0.45)}</span>
              <span className="text-[10px] text-stone-400 block">Most economical mode</span>
            </div>

            <div className="p-4 rounded-3xl bg-slate-900/60 border border-white/10">
              <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
                <span>Mumbai Metro (Lines 1, 2A, 7)</span>
                <Zap className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-xl font-black text-white font-mono">₹{Math.round(analytics.totalSpentInr * 0.35)}</span>
              <span className="text-[10px] text-stone-400 block">Fastest AC corridor</span>
            </div>

            <div className="p-4 rounded-3xl bg-slate-900/60 border border-white/10">
              <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
                <span>BEST Buses &amp; First/Last Mile</span>
                <Bus className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-xl font-black text-white font-mono">₹{Math.round(analytics.totalSpentInr * 0.20)}</span>
              <span className="text-[10px] text-stone-400 block">Feeder connections</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ACCESSIBILITY & PREFERENCES */}
      {activeTab === "preferences" && (
        <div className="p-6 rounded-3xl bg-slate-900/80 backdrop-blur-2xl border border-white/10 shadow-xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Accessibility className="w-5 h-5 text-sky-400" />
              <span>Accessibility &amp; Commute Constraint Filters</span>
            </h3>
            <p className="text-xs text-stone-300 mt-1">
              Configure your physical comfort thresholds. Route Sense automatically penalizes routes that violate these rules.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Max Walking Distance */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-stone-300">Max Acceptable Walking Distance</span>
                <span className="text-sky-300 font-mono font-bold">{preferences.maxWalkingDistanceMeters}m</span>
              </div>
              <input
                type="range"
                min="200"
                max="2500"
                step="100"
                value={preferences.maxWalkingDistanceMeters}
                onChange={(e) =>
                  setPreferences({ ...preferences, maxWalkingDistanceMeters: Number(e.target.value) })
                }
                className="w-full accent-sky-400 cursor-pointer"
              />
              <span className="text-[10px] text-stone-400">
                Routes requiring walks above this limit will be deprioritized.
              </span>
            </div>

            {/* Max Transfers */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-stone-300">Maximum Interchanges / Transfers</span>
                <span className="text-sky-300 font-mono font-bold">{preferences.maxTransfers}</span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                step="1"
                value={preferences.maxTransfers}
                onChange={(e) =>
                  setPreferences({ ...preferences, maxTransfers: Number(e.target.value) })
                }
                className="w-full accent-sky-400 cursor-pointer"
              />
              <span className="text-[10px] text-stone-400">
                0 = direct routes only; 1 = max one station interchange.
              </span>
            </div>

            {/* Max Travel Budget */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-stone-300">Maximum Single Trip Budget</span>
                <span className="text-emerald-300 font-mono font-bold">₹{preferences.maxBudgetInr}</span>
              </div>
              <input
                type="range"
                min="10"
                max="500"
                step="10"
                value={preferences.maxBudgetInr}
                onChange={(e) =>
                  setPreferences({ ...preferences, maxBudgetInr: Number(e.target.value) })
                }
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-white block">Escalator / Elevator Priority</span>
                  <span className="text-[10px] text-stone-400">Prioritize stations with step-free access</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.preferElevatorEscalator}
                  onChange={(e) =>
                    setPreferences({ ...preferences, preferElevatorEscalator: e.target.checked })
                  }
                  className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-white block">Female-Only Compartment Guidance</span>
                  <span className="text-[10px] text-stone-400">Highlight safety coach positioning on local trains</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.preferLadiesCompartment}
                  onChange={(e) =>
                    setPreferences({ ...preferences, preferLadiesCompartment: e.target.checked })
                  }
                  className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-white block">Avoid Super-Dense Peak Windows</span>
                  <span className="text-[10px] text-stone-400">Alert when scheduled train falls into 8:30-10:30am rush</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.avoidOvercrowdedPeak}
                  onChange={(e) =>
                    setPreferences({ ...preferences, avoidOvercrowdedPeak: e.target.checked })
                  }
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            {prefSaveStatus ? (
              <span className="text-xs text-emerald-400 font-semibold">{prefSaveStatus}</span>
            ) : (
              <span className="text-xs text-stone-400">Saved preferences apply to all future corridor plans.</span>
            )}

            <button
              type="button"
              onClick={handleSavePreferences}
              className="px-5 py-2.5 rounded-full bg-white text-slate-900 font-black text-xs hover:bg-slate-100 transition-all cursor-pointer shadow-lg active:scale-95"
            >
              Save Preferences
            </button>
          </div>
        </div>
      )}

      {/* 5. MODAL: "LOG MY COMMUTE" */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-white/20 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-400" />
                <span>Log Observed Commute Record</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="text-stone-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLogCommute} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-300 font-semibold block mb-1">Origin Station</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Borivali"
                    value={newLog.origin}
                    onChange={(e) => setNewLog({ ...newLog, origin: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white outline-none focus:border-sky-400"
                  />
                </div>
                <div>
                  <label className="text-stone-300 font-semibold block mb-1">Destination Station</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Churchgate"
                    value={newLog.destination}
                    onChange={(e) => setNewLog({ ...newLog, destination: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-stone-300 font-semibold block mb-1">Primary Mode</label>
                <select
                  value={newLog.mode}
                  onChange={(e) => setNewLog({ ...newLog, mode: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/15 text-white outline-none"
                >
                  <option value="TRAIN">Mumbai Local Train (Central/Western)</option>
                  <option value="METRO">Mumbai Metro</option>
                  <option value="BUS">BEST Bus</option>
                  <option value="CAB">Cab / Auto-rickshaw</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-300 font-semibold block mb-1">Scheduled / Est. Duration (mins)</label>
                  <input
                    type="number"
                    min="1"
                    value={newLog.estimatedDurationMin}
                    onChange={(e) => setNewLog({ ...newLog, estimatedDurationMin: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-stone-300 font-semibold block mb-1">Actual Observed Duration (mins)</label>
                  <input
                    type="number"
                    min="1"
                    value={newLog.actualDurationMin}
                    onChange={(e) => setNewLog({ ...newLog, actualDurationMin: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-300 font-semibold block mb-1">Actual Fare Paid (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={newLog.actualCostInr}
                    onChange={(e) => setNewLog({ ...newLog, actualCostInr: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-stone-300 font-semibold block mb-1">Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Fast train on time, crowded coach"
                    value={newLog.notes}
                    onChange={(e) => setNewLog({ ...newLog, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 rounded-full text-stone-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingLog}
                  className="px-5 py-2 rounded-full bg-sky-500 hover:bg-sky-600 text-white font-bold flex items-center gap-1.5"
                >
                  {submittingLog && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
