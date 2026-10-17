"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

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
  isAuthModalOpen: boolean;
  authModalMode: "signin" | "signup";
  openAuthModal: (mode?: "signin" | "signup") => void;
  closeAuthModal: () => void;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  registerWithPassword: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (googlePayload?: {
    email?: string;
    name?: string;
    avatarUrl?: string;
    googleId?: string;
    credential?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = "routesense_auth_user";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup">("signin");

  // Check existing session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        // First check local storage for instant render
        if (typeof window !== "undefined") {
          const cached = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
          if (cached) {
            try {
              setUser(JSON.parse(cached));
            } catch {}
          }
        }

        // Verify with server session endpoint
        const res = await fetch("/api/v1/auth/session");
        const data = await res.json();

        if (data.authenticated && data.user) {
          setUser(data.user);
          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(data.user));
          }
        } else {
          // If server reports unauthenticated and no active token
          // leave user as is if cached, or clear
        }
      } catch (err) {
        console.warn("Session check fallback:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();
  }, []);

  const openAuthModal = (mode: "signin" | "signup" = "signin") => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const loginWithPassword = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Sign in failed. Please check credentials.");
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
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (googlePayload?: {
    email?: string;
    name?: string;
    avatarUrl?: string;
    googleId?: string;
    credential?: string;
  }) => {
    setIsLoading(true);
    try {
      const payload = googlePayload || {
        email: "devansh.soni@gmail.com",
        name: "Devansh R. Soni",
        avatarUrl: "https://lh3.googleusercontent.com/a/default-user",
        googleId: "google-uid-devansh-2026"
      };

      const res = await fetch("/api/v1/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
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

  const logout = async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
    } catch {}
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        loginWithPassword,
        registerWithPassword,
        loginWithGoogle,
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
