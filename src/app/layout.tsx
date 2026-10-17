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
      <body className="min-h-screen bg-[#151211] text-stone-100 flex flex-col items-center justify-start p-2 sm:p-4 md:p-6 lg:p-8 font-sans antialiased selection:bg-rose-500/30 selection:text-rose-200">
        <ClientProviders>
          {/* 1. TOP VISIONOS BROWSER CAPSULE BAR (Matching uploaded image) */}
        <div className="w-full max-w-6xl mb-4 px-4 py-2.5 rounded-full bg-stone-900/70 backdrop-blur-2xl border border-white/10 shadow-2xl flex items-center justify-between text-stone-300 text-xs select-none">
          {/* Left Browser Controls */}
          <div className="flex items-center gap-3">
            <button title="Toggle Sidebar" className="p-1 hover:text-white transition-colors cursor-pointer">
              <Sidebar className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 text-stone-400">
              <button title="Back" className="p-1 hover:text-white transition-colors cursor-pointer">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button title="Forward" className="p-1 hover:text-white transition-colors cursor-pointer opacity-50 cursor-not-allowed">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <span className="text-[11px] font-semibold text-stone-400 px-1 border-l border-white/10 pl-2.5">
              AA
            </span>
          </div>

          {/* Center Address & Security Pill */}
          <div className="flex items-center gap-2 px-6 py-1.5 rounded-full bg-white/5 border border-white/10 text-stone-200 font-medium text-xs shadow-inner">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span className="tracking-wide text-[11px]">routesense.spatial.in</span>
            <RotateCw className="w-3 h-3 text-stone-400 hover:text-white cursor-pointer ml-1 transition-colors" />
          </div>

          {/* Right Window & Share Controls */}
          <div className="flex items-center gap-3 text-stone-300">
            <button title="Share" className="p-1 hover:text-white transition-colors cursor-pointer">
              <Share2 className="w-4 h-4" />
            </button>
            <button title="New Tab" className="p-1 hover:text-white transition-colors cursor-pointer">
              <Plus className="w-4 h-4" />
            </button>
            <button title="All Tabs" className="p-1 hover:text-white transition-colors cursor-pointer">
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. SPATIAL WORKSPACE WRAPPER (Window + Left Vertical Dock) */}
        <div className="w-full max-w-6xl relative flex items-start gap-4">
          
          {/* LEFT FLOATING VERTICAL DOCK (Matching uploaded image) */}
          <aside className="hidden md:flex flex-col items-center gap-3 p-2 rounded-full bg-stone-900/80 backdrop-blur-3xl border border-white/10 shadow-2xl shrink-0 sticky top-20 z-30">
            {/* Active Home Button (Glowing Orange/Coral Badge) */}
            <a
              href="/"
              title="Home"
              className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-600 via-rose-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-950/60 hover:scale-105 transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" />
            </a>

            {/* Navigation Icons */}
            <a
              href="#search-corridor"
              title="Search Corridors"
              className="w-9 h-9 rounded-full hover:bg-white/10 text-stone-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <Compass className="w-4 h-4" />
            </a>

            <a
              href="#transit-passes"
              title="Transit Passes"
              className="w-9 h-9 rounded-full hover:bg-white/10 text-stone-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <Ticket className="w-4 h-4" />
            </a>

            <a
              href="#spatial-map"
              title="Spatial Map"
              className="w-9 h-9 rounded-full hover:bg-white/10 text-stone-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <MapPin className="w-4 h-4" />
            </a>

            <a
              href="#analytics"
              title="Mobility Intelligence"
              className="w-9 h-9 rounded-full hover:bg-white/10 text-stone-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <BarChart2 className="w-4 h-4" />
            </a>

            <div className="w-4 h-[1px] bg-white/10 my-1" />

            <button
              type="button"
              title="Settings"
              className="w-9 h-9 rounded-full hover:bg-white/10 text-stone-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
          </aside>

          {/* MAIN FLOATING SPATIAL GLASS WINDOW */}
          <main className="flex-1 w-full rounded-[32px] sm:rounded-[36px] vision-glass-surface overflow-hidden flex flex-col shadow-vision-window relative z-20">
            {/* Window Internal Header */}
            <Header />

            {/* Main Page Canvas */}
            <div className="flex-1 w-full p-4 sm:p-6 lg:p-8">
              {children}
            </div>

            {/* Window Internal Subtle Footer */}
            <footer className="px-6 py-4 border-t border-white/10 bg-black/20 flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-400 gap-2">
              <p className="font-medium">
                Route Sense &bull; Spatial Mobility Intelligence Platform for India
              </p>
              <div className="flex items-center gap-3">
                <span>Coverage: 28 States & 8 UTs</span>
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
