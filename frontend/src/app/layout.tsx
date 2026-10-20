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
        {/* SPATIAL WORKSPACE WRAPPER (Window + Left Vertical Dock) */}
        <div className="w-full max-w-6xl relative flex items-start gap-4">
          
          {/* LEFT FLOATING VERTICAL DOCK (Clean, Minimal, 100% Functional) */}
          <aside className="hidden md:flex flex-col items-center gap-3 p-2 rounded-full bg-stone-900/80 backdrop-blur-3xl border border-white/10 shadow-2xl shrink-0 sticky top-12 z-30">
            {/* Active Home Button */}
            <a
              href="/"
              title="Home — Mumbai Transit Overview"
              className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-600 via-rose-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-950/60 hover:scale-105 transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" />
            </a>

            {/* Plan Journey */}
            <a
              href="#journey-planner"
              title="Search Corridors & Fares"
              className="w-9 h-9 rounded-full hover:bg-white/10 text-stone-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <Compass className="w-4 h-4" />
            </a>

            {/* Book E-Ticket & Pass */}
            <a
              href="#booking-section"
              title="Book Bus & Train E-Ticket (QR Pay)"
              className="w-9 h-9 rounded-full hover:bg-white/10 text-stone-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <Ticket className="w-4 h-4" />
            </a>

            {/* Verify Ticket Validator Portal */}
            <a
              href="/verify"
              title="Ticket Verification Portal"
              className="w-9 h-9 rounded-full hover:bg-white/10 text-stone-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <Lock className="w-4 h-4" />
            </a>
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
