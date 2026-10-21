"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Compass,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  ArrowRight
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/";

  const {
    user,
    isAuthenticated,
    isLoading,
    isSupabaseActive,
    loginWithPassword,
    registerWithPassword,
    loginWithGoogle,
    resetPassword
  } = useAuth();

  const [tab, setTab] = useState<"signin" | "signup" | "forgot">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // If already logged in, redirect immediately
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      router.replace(redirectPath);
    }
  }, [isAuthenticated, isLoading, user, redirectPath, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setSubmitting(true);

    try {
      if (tab === "signin") {
        if (!email.trim() || !password) {
          throw new Error("Please enter your email and password.");
        }
        await loginWithPassword(email.trim(), password);
        router.push(redirectPath);
      } else if (tab === "signup") {
        if (!name.trim()) throw new Error("Please enter your full name.");
        if (!email.trim() || !email.includes("@")) throw new Error("Please enter a valid email address.");
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");
        if (password !== confirmPassword) throw new Error("Passwords do not match.");

        const res = await registerWithPassword(name.trim(), email.trim(), password);
        if (res.requiresVerification) {
          setSuccessMessage(res.message);
          setTab("signin");
        } else {
          router.push(redirectPath);
        }
      } else if (tab === "forgot") {
        if (!email.trim() || !email.includes("@")) throw new Error("Please enter your registered email address.");
        const res = await resetPassword(email.trim());
        if (res.success) {
          setSuccessMessage(res.message);
        } else {
          throw new Error(res.message);
        }
      }
    } catch (err: any) {
      setError(err?.message || "Authentication request failed. Please verify your details.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessMessage(null);
    setSubmitting(true);
    try {
      await loginWithGoogle();
      if (!isSupabaseActive) {
        router.push(redirectPath);
      }
    } catch (err: any) {
      setError(err?.message || "Google OAuth sign-in failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-8 px-4 font-sans text-white">
      <div className="w-full max-w-md rounded-[36px] bg-slate-900/90 backdrop-blur-3xl border border-white/20 p-6 sm:p-9 shadow-2xl relative overflow-hidden">
        {/* Top Glow Ambient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-2 bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-400 blur-sm" />

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-tr from-sky-400 via-teal-400 to-emerald-400 p-[1.5px] shadow-lg shadow-sky-950/60 flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
              <Compass className="w-6 h-6 text-sky-300" />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            ROUTE SENSE
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Mumbai Metropolitan Region Transit Intelligence Portal
          </p>

          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {isSupabaseActive
                ? "Supabase Production Auth Active"
                : "Secured Transit Authentication"}
            </span>
          </div>
        </div>

        {/* Tabs: Sign In / Create Account / Forgot */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-white/10 rounded-2xl mb-6 text-xs font-bold border border-white/10">
          <button
            type="button"
            onClick={() => { setTab("signin"); setError(null); setSuccessMessage(null); }}
            className={`py-2 rounded-xl transition-all cursor-pointer text-center ${
              tab === "signin"
                ? "bg-white text-slate-950 shadow-md font-black"
                : "text-slate-300 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setTab("signup"); setError(null); setSuccessMessage(null); }}
            className={`py-2 rounded-xl transition-all cursor-pointer text-center ${
              tab === "signup"
                ? "bg-white text-slate-950 shadow-md font-black"
                : "text-slate-300 hover:text-white"
            }`}
          >
            Register
          </button>
          <button
            type="button"
            onClick={() => { setTab("forgot"); setError(null); setSuccessMessage(null); }}
            className={`py-2 rounded-xl transition-all cursor-pointer text-center ${
              tab === "forgot"
                ? "bg-white text-slate-950 shadow-md font-black"
                : "text-slate-300 hover:text-white"
            }`}
          >
            Reset
          </button>
        </div>

        {/* Success Message Banner */}
        {successMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-snug">{successMessage}</p>
          </div>
        )}

        {/* Error Message Banner */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p className="leading-snug">{error}</p>
          </div>
        )}

        {/* Primary Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {tab === "signup" && (
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/5 border border-white/15 focus:border-sky-400 focus:outline-none text-xs text-white placeholder-slate-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/5 border border-white/15 focus:border-sky-400 focus:outline-none text-xs text-white placeholder-slate-500 transition-colors"
              />
            </div>
          </div>

          {tab !== "forgot" && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                {tab === "signin" && (
                  <button
                    type="button"
                    onClick={() => { setTab("forgot"); setError(null); }}
                    className="text-[10px] text-sky-300 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white/5 border border-white/15 focus:border-sky-400 focus:outline-none text-xs text-white placeholder-slate-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}

          {tab === "signup" && (
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/5 border border-white/15 focus:border-sky-400 focus:outline-none text-xs text-white placeholder-slate-500 transition-colors"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-full bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-400 hover:opacity-95 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-sky-950/50 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
            ) : (
              <>
                <span>
                  {tab === "signin"
                    ? "Sign In to Route Sense"
                    : tab === "signup"
                    ? "Create Account"
                    : "Send Password Reset Link"}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        {tab !== "forgot" && (
          <>
            <div className="my-5 flex items-center gap-3">
              <div className="flex-1 h-[1px] bg-white/10" />
              <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">
                Or Continue With
              </span>
              <div className="flex-1 h-[1px] bg-white/10" />
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={submitting}
              className="w-full py-2.5 rounded-full bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs flex items-center justify-center gap-2.5 shadow-md hover:scale-[1.01] active:scale-95 transition-all cursor-pointer disabled:opacity-60"
            >
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
          </>
        )}

        {/* Footer Note */}
        <p className="mt-6 text-center text-[10px] text-slate-400">
          By signing in, you agree to Route Sense Mumbai Terms of Service &amp; Commuter Privacy Policy.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center py-8 px-4 font-sans text-white">
          <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
        </div>
      }
    >
      <LoginContent />
    </React.Suspense>
  );
}
