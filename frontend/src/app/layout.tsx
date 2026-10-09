import React from "react";
import "./globals.css";
import { Header } from "@/components/common/Header";
import { Sidebar } from "@/components/common/Sidebar";

export const metadata = {
  title: "RouteSense — Intelligent Public Transport Analytics Platform",
  description: "From Transport Data to Intelligent Decisions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans antialiased">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 bg-slate-950 p-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
