import React from "react";
import "./globals.css";
import { Header } from "@/components/common/Header";

export const metadata = {
  title: "Route Sense — India Public Transport Journey Planner",
  description: "Find the best public transport journeys across India with real-world distance, duration, and pricing.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen flex flex-col font-sans antialiased">
        <Header />
        <main className="flex-1 w-full bg-slate-50">
          {children}
        </main>
        <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="font-semibold text-slate-700">Route Sense — Intelligent Public Transport Analytics System</p>
            <p className="text-slate-400">Coverage across all 28 States & 8 Union Territories in India</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
