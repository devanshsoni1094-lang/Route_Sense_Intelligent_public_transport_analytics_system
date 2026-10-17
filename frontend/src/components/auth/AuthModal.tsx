"use client";

import React, { useState } from "react";
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowRight
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalMode,
    closeAuthModal,
    openAuthModal,
    loginWithPassword,
    registerWithPassword,
    loginWithGoogle,
    isLoading
  } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">(authModalMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Sync mode with context
  React.useEffect(() => {
    setMode(authModalMode);
    setError(null);
  }, [authModalMode]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === "signin") {
        await loginWithPassword(email, password);
      } else {
        await registerWithPassword(name, email, password);
      }
    } catch (err: any) {
      setError(err?.message || "Authentication failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDirectGoogleSignIn = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await loginWithGoogle({
        email: email && email.includes("@") ? email : "devansh.soni@gmail.com",
        name: name || "Devansh R. Soni",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
        googleId: "google_direct_auth_2026"
      });
    } catch (err: any) {
      setError(err?.message || "Google sign in failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-md rounded-[32px] bg-stone-900/95 border border-white/15 p-6 sm:p-8 shadow-2xl text-white my-auto overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-2 bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 blur-sm" />

        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-stone-400 hover:text-white transition-all cursor-pointer z-10"
          title="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-black uppercase tracking-wider mb-2 font-mono">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>ROUTE SENSE ACCOUNT</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            {mode === "signin" ? "Welcome Back to Mumbai" : "Create Route Sense Account"}
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            {mode === "signin"
              ? "Sign in to manage booked transit passes, e-tickets, and fast checkout."
              : "Register to save your commute corridors and instant contactless booking."}
          </p>
        </div>

        {/* DIRECT SIGN IN WITH GOOGLE BUTTON */}
        <div className="space-y-3 mb-5">
          <button
            type="button"
            onClick={handleDirectGoogleSignIn}
            disabled={submitting || isLoading}
            className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-stone-100 text-stone-900 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-3 shadow-lg hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-75"
          >
            {/* Google Multicolor 'G' Logo */}
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
              or use email &amp; password
            </span>
            <div className="flex-1 h-px bg-white/10" />
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-2xl bg-black/40 p-1 mb-5 border border-white/5 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setError(null);
            }}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
              mode === "signin"
                ? "bg-white/15 text-white shadow-md border border-white/10"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError(null);
            }}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
              mode === "signup"
                ? "bg-white/15 text-white shadow-md border border-white/10"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === "signup" && (
            <div>
              <label className="block text-[11px] font-bold text-stone-300 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Devansh R. Soni"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-stone-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold text-stone-300 uppercase tracking-wider">
                Password
              </label>
              {mode === "signin" && (
                <button
                  type="button"
                  onClick={() => fillDemoAccount("devansh.soni@gmail.com", "Password@123")}
                  className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                >
                  Quick Demo Pass?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder={mode === "signup" ? "Create a strong password (6+ chars)" : "Enter your password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-rose-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || isLoading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-rose-950/50 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 mt-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{mode === "signin" ? "Signing In..." : "Creating Account..."}</span>
              </>
            ) : (
              <>
                <span>{mode === "signin" ? "Sign In to Account" : "Register & Continue"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Commuter Logins */}
        <div className="mt-5 pt-4 border-t border-white/10">
          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-2">
            One-Click Test Accounts:
          </p>
          <div className="flex flex-wrap gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                fillDemoAccount("devansh.soni@gmail.com", "Password@123");
              }}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-stone-300 font-medium transition-colors cursor-pointer"
            >
              Devansh (Commuter)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                fillDemoAccount("conductor.shinde@best.gov.in", "Password@123");
              }}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-stone-300 font-medium transition-colors cursor-pointer"
            >
              V. K. Shinde (Conductor)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
