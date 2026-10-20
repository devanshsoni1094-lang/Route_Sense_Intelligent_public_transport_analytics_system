import React from "react";
import "./globals.css";
import { Header } from "@/components/common/Header";
import { ClientProviders } from "@/components/providers/ClientProviders";
import {
  Home,
  Compass,
  MapPin,
  Ticket,
  BarChart2,
  Settings,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Share2,
  Plus,
  LayoutGrid,
  Lock,
  Sidebar
} from "lucide-react";

export const metadata = {
  title: "Route Sense — Spatial Mobility Intelligence Platform for India",
  description: "VisionOS-inspired Spatial Mobility Intelligence Platform. Real Google Places, Google Routes, multimodal transit passes, and corridor visualization across India.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen text-slate-100 flex flex-col items-center justify-start p-1.5 sm:p-2.5 md:p-3 lg:p-4 font-sans antialiased selection:bg-sky-500/30 selection:text-sky-200 w-full overflow-x-hidden">
        <ClientProviders>
        {/* FULL 16:9 WIDESCREEN WORKSPACE WRAPPER */}
        <div className="w-full max-w-[1920px] 2xl:max-w-full relative flex items-start gap-3 sm:gap-4 mx-auto px-1 sm:px-2">
          
          {/* LEFT FLOATING VERTICAL DOCK (Clean, Minimal, 100% Functional) */}
          <aside className="hidden md:flex flex-col items-center gap-3 p-2 rounded-full bg-slate-900/60 backdrop-blur-3xl border border-white/20 shadow-2xl shrink-0 sticky top-6 z-30">
            {/* Active Home Button */}
            <a
              href="/"
              title="Home — Mumbai Transit Overview"
              className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-500 via-teal-500 to-emerald-400 text-white flex items-center justify-center shadow-lg shadow-sky-950/60 hover:scale-105 transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" />
            </a>

            {/* Plan Journey */}
            <a
              href="#journey-planner"
              title="Search Corridors & Fares"
              className="w-9 h-9 rounded-full hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <Compass className="w-4 h-4" />
            </a>

            {/* 5-Parameter Journey Analysis */}
            <a
              href="#journey-analysis"
              title="5-Parameter Journey Analysis"
              className="w-9 h-9 rounded-full hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <BarChart2 className="w-4 h-4" />
            </a>

            {/* Spatial Route Map */}
            <a
              href="#spatial-map"
              title="Spatial Corridor Map"
              className="w-9 h-9 rounded-full hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <MapPin className="w-4 h-4" />
            </a>
          </aside>

          {/* MAIN FLOATING SPATIAL GLASS WINDOW (Full 16:9 Widescreen Canvas) */}
          <main className="flex-1 w-full rounded-[28px] sm:rounded-[36px] vision-glass-surface overflow-hidden flex flex-col shadow-vision-window relative z-20 min-h-[96vh]">
            {/* Window Internal Header */}
            <Header />

            {/* Main Page Canvas */}
            <div className="flex-1 w-full p-3 sm:p-5 md:p-6 lg:p-8 xl:p-10 2xl:p-12">
              {children}
            </div>

            {/* Window Internal Subtle Footer */}
            <footer className="px-6 py-4 border-t border-white/10 bg-black/20 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
              <p className="font-medium">
                Route Sense &bull; Mumbai Metropolitan Region (MMR) Smart Public Transit
              </p>
              <div className="flex items-center gap-3">
                <span>Coverage: Mumbai MMR (BEST Bus, Mumbai Local Trains &amp; Metro)</span>
                <span>&bull;</span>
                <span>Currency: INR (₹)</span>
                <span>&bull;</span>
                <span>Asia/Kolkata</span>
              </div>
            </footer>
          </main>
        </div>
        </ClientProviders>
      </body>
    </html>
  );
}
