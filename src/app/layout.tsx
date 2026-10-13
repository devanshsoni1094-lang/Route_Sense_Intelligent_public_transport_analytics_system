import React from "react";
import "./globals.css";
import { Header } from "@/components/common/Header";

export const metadata = {
  title: "Route Sense — Intelligent Public Transport and Mobility Intelligence Platform",
  description: "Spatial mobility intelligence platform for India. Real Google Places, Google Routes, transit timetables, multimodal fares, and corridor visualization across India.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#070b14] text-slate-100 min-h-screen flex flex-col font-sans antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        <Header />
        <main className="flex-1 w-full bg-[#070b14]">
          {children}
        </main>
        <footer className="bg-[#05080f] border-t border-slate-900 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="font-medium text-slate-400">
              Route Sense — Intelligent Public Transport & Mobility Intelligence Platform
            </p>
            <div className="flex items-center gap-3 text-slate-500 text-[11px]">
              <span>Coverage: 28 States & 8 Union Territories</span>
              <span>•</span>
              <span>Default Timezone: Asia/Kolkata</span>
              <span>•</span>
              <span>Currency: INR (₹)</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
