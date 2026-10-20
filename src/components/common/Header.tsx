"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Compass,
  Bell,
  Search,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  User,
  LogOut,
  Ticket,
  ExternalLink,
  QrCode
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export const Header: React.FC = () => {
  const { user, isAuthenticated, openAuthModal, logout } = useAuth();
  const [providerStatus, setProviderStatus] = useState<{
    configured: boolean;
    status: string;
    message: string;
  } | null>(null);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchApi<{ is_configured?: boolean; configured?: boolean; status: string; message: string }>("/google-maps/status")
      .then((data) => {
        if (data) {
          setProviderStatus({
            configured: Boolean(data.is_configured ?? data.configured),
            status: data.status,
            message: data.message
          });
        }
      })
      .catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helper to get initials
  const getInitials = (name?: string, email?: string) => {
    if (name) {
      const parts = name.trim().split(" ");
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return "DS";
  };

  return (
    <header className="w-full px-6 py-4 flex items-center justify-between border-b border-white/15 text-slate-100 font-sans relative z-30">
      {/* Brand: Logo & Tagline */}
      <Link href="/" className="flex items-center gap-3 group">
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-400 via-teal-400 to-emerald-400 p-[1.5px] shadow-lg shadow-sky-950/40 group-hover:scale-105 transition-transform duration-300">
          <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
            <Compass className="w-4 h-4 text-sky-300 transform group-hover:rotate-45 transition-transform duration-500" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white group-hover:text-sky-200 transition-colors">
              ROUTE SENSE
            </h1>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-200 border border-sky-500/30 hidden sm:inline-block">
              Mumbai MMR
            </span>
          </div>
          <p className="text-[11px] text-slate-300 font-medium tracking-tight">
            Mumbai Metropolitan Region &bull; Smart Transit
          </p>
        </div>
      </Link>

      {/* Center Search Pill & Filter */}
      <div className="hidden md:flex items-center gap-2">
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-xs text-slate-200 w-72 lg:w-80 shadow-inner transition-colors">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            readOnly
            placeholder="Search corridor, station, city..."
            onClick={() => {
              const el = document.getElementById("source-input");
              if (el) el.focus();
            }}
            className="bg-transparent border-none outline-none w-full text-xs text-slate-200 placeholder-slate-400 cursor-pointer"
          />
        </div>

        <Link
          href="/verify"
          className="px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-xs text-slate-200 font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
        >
          <QrCode className="w-3.5 h-3.5 text-sky-400" />
          <span>Verify Ticket</span>
        </Link>
      </div>

      {/* Right Actions: Status, Book Pass & User Profile */}
      <div className="flex items-center gap-3">
        {/* Quick Link to Ticket Booking Section */}
        <a
          href="#booking-section"
          className="px-4 py-2 rounded-full bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-black/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-600" />
          <span>Book Ticket (QR Pay)</span>
        </a>

        {/* Transit Connectivity Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-slate-300">
          <span
            className={`w-2 h-2 rounded-full ${
              providerStatus?.configured ? "bg-emerald-400" : "bg-sky-400"
            }`}
          />
          <span className="font-medium">
            {providerStatus?.configured ? "Google Maps Connected" : "Verified Transit DB"}
          </span>
        </div>

        {/* AUTH SECTION: SIGN IN OR USER PROFILE */}
        {!isAuthenticated ? (
          <button
            type="button"
            onClick={() => openAuthModal("signin")}
            className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-extrabold text-xs flex items-center gap-2 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            {/* Google Multicolor 'G' Icon */}
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.37 7.35 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Sign In</span>
          </button>
        ) : (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 via-teal-400 to-emerald-400 p-[1.5px] shadow-md group-hover:scale-105 transition-transform">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-[11px] font-bold text-sky-200">
                  {getInitials(user?.name, user?.email)}
                </div>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 mr-1 hidden sm:block" />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-white/20 p-3 shadow-2xl animate-fade-in text-xs z-50">
                {/* User Info Header */}
                <div className="pb-3 border-b border-white/10">
                  <p className="font-extrabold text-white text-sm truncate">{user?.name}</p>
                  <p className="text-[11px] text-slate-300 truncate">{user?.email}</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">
                      {user?.provider === "GOOGLE" ? "Google Account" : "Verified Commuter"}
                    </span>
                  </div>
                </div>

                {/* Menu Links */}
                <div className="py-2 space-y-1">
                  <a
                    href="#booking-section"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <Ticket className="w-3.5 h-3.5 text-sky-400" />
                    <span>My Booked Passes</span>
                  </a>

                  <Link
                    href="/verify"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Ticket Validator Portal</span>
                  </Link>
                </div>

                {/* Sign Out */}
                <div className="pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-rose-300 hover:text-rose-200 hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
