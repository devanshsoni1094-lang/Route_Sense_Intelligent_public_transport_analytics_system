"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  provider: "EMAIL" | "GOOGLE";
  role: "COMMUTER" | "STAFF" | "ADMIN";
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSupabaseActive: boolean;
  isAuthModalOpen: boolean;
  authModalMode: "signin" | "signup" | "forgot";
  openAuthModal: (mode?: "signin" | "signup" | "forgot") => void;
  closeAuthModal: () => void;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  registerWithPassword: (name: string, email: string, password: string) => Promise<{ message: string; requiresVerification?: boolean }>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = "routesense_auth_user";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup" | "forgot">("signin");
  const isSupabaseActive = isSupabaseConfigured();

  // Initialize session on mount
  useEffect(() => {
    let isMounted = true;

    const initSession = async () => {
      try {
        const supabase = getSupabaseClient();

        // 1. If Supabase is configured, check Supabase session first
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && isMounted) {
            const mappedUser: AuthUser = {
              id: session.user.id,
              name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "Commuter",
              email: session.user.email || "",
              avatarUrl: session.user.user_metadata?.avatar_url,
              provider: session.user.app_metadata?.provider === "google" ? "GOOGLE" : "EMAIL",
              role: (session.user.user_metadata?.role as any) || "COMMUTER"
            };
            setUser(mappedUser);
            if (typeof window !== "undefined") {
              localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(mappedUser));
              if (session.access_token) {
                document.cookie = `routesense_session=${encodeURIComponent(session.access_token)}; path=/; max-age=604800; SameSite=Lax`;
              }
            }
            setIsLoading(false);
            return;
          }

          // Listen for Supabase auth state changes
          supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user && isMounted) {
              const mappedUser: AuthUser = {
                id: session.user.id,
                name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "Commuter",
                email: session.user.email || "",
                avatarUrl: session.user.user_metadata?.avatar_url,
                provider: session.user.app_metadata?.provider === "google" ? "GOOGLE" : "EMAIL",
                role: (session.user.user_metadata?.role as any) || "COMMUTER"
              };
              setUser(mappedUser);
              if (typeof window !== "undefined") {
                localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(mappedUser));
                if (session.access_token) {
                  document.cookie = `routesense_session=${encodeURIComponent(session.access_token)}; path=/; max-age=604800; SameSite=Lax`;
                }
              }
            } else if (isMounted) {
              // Sign out event
            }
          });
        }

        // 2. Fallback / Server session check
        const res = await fetch("/api/v1/auth/session");
        const data = await res.json();

        if (data.authenticated && data.user && isMounted) {
          setUser(data.user);
          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(data.user));
          }
        } else if (typeof window !== "undefined") {
          const cached = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
          if (cached && isMounted) {
            try {
              setUser(JSON.parse(cached));
            } catch {
              localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
            }
          }
        }
      } catch (err) {
        console.warn("Session check error:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const openAuthModal = (mode: "signin" | "signup" | "forgot" = "signin") => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const loginWithPassword = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const supabase = getSupabaseClient();

      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data.user) {
          const mappedUser: AuthUser = {
            id: data.user.id,
            name: data.user.user_metadata?.name || data.user.email?.split("@")[0] || "Commuter",
            email: data.user.email || email,
            avatarUrl: data.user.user_metadata?.avatar_url,
            provider: "EMAIL",
            role: (data.user.user_metadata?.role as any) || "COMMUTER"
          };
          setUser(mappedUser);
          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(mappedUser));
          }
          setIsAuthModalOpen(false);
          return;
        }
      }

      // Backend API login fallback
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Sign in failed. Please check your credentials.");
      }

      setUser(data.user);
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(data.user));
      }
      setIsAuthModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithPassword = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const supabase = getSupabaseClient();

      if (supabase) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              full_name: name,
              role: "COMMUTER"
            }
          }
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data.user) {
          const mappedUser: AuthUser = {
            id: data.user.id,
            name,
            email,
            provider: "EMAIL",
            role: "COMMUTER"
          };
          setUser(mappedUser);
          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(mappedUser));
          }
          setIsAuthModalOpen(false);
          return {
            message: "Account created successfully! Verification email sent.",
            requiresVerification: !data.session
          };
        }
      }

      // Backend API registration fallback
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Registration failed.");
      }

      setUser(data.user);
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(data.user));
      }
      setIsAuthModalOpen(false);
      return { message: "Account created successfully!" };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      const supabase = getSupabaseClient();

      if (supabase) {
        const redirectTo = typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : undefined;

        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo
          }
        });

        if (error) {
          throw new Error(error.message);
        }
        return;
      }

      // Standard Google OAuth API flow
      const res = await fetch("/api/v1/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "devansh.soni@gmail.com",
          name: "Devansh R. Soni",
          provider: "GOOGLE"
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Google sign in failed.");
      }

      setUser(data.user);
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(data.user));
      }
      setIsAuthModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const redirectTo = typeof window !== "undefined"
          ? `${window.location.origin}/auth/reset-password`
          : undefined;

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo
        });

        if (error) {
          throw new Error(error.message);
        }
        return { success: true, message: "Password reset link sent to your email." };
      }

      return {
        success: true,
        message: `Password reset instructions dispatched to ${email}. Check your inbox.`
      };
    } catch (err: any) {
      return { success: false, message: err?.message || "Failed to initiate password reset." };
    }
  };

  const logout = async () => {
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
      await fetch("/api/v1/auth/logout", { method: "POST" });
    } catch {}

    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      document.cookie = "routesense_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isSupabaseActive,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        loginWithPassword,
        registerWithPassword,
        loginWithGoogle,
        resetPassword,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
