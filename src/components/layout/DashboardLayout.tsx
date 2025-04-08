"use client";

import React from "react";
import { Sidebar } from "./Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-full w-full">
      {/* Sidebar */}
      <div className="hidden w-64 shrink-0 border-r md:block">
        <Sidebar />
      </div>
      
      {/* Main Content */}
      <div className="flex w-full flex-col overflow-hidden">
        {/* Header optionnel pourrait être ajouté ici */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
} 