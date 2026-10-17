"use client";

import React, { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";

export const ClientProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      {children}
      <AuthModal />
    </AuthProvider>
  );
};
