"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { GlobalTransactionDialog } from "@/components/transactions/global-transaction-dialog";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex h-screen w-full">
      {/* Sidebar Desktop */}
      <div className="hidden w-64 shrink-0 border-r md:block h-full">
        <Sidebar isMobile={false} />
      </div>
      
      {/* Main Content */}
      <div className="flex w-full flex-col overflow-hidden">
        {/* Header Mobile */}
        <header className="flex h-14 items-center gap-4 border-b px-4 md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Ouvrir le menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <Sidebar isMobile={true} />
            </SheetContent>
          </Sheet>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">FinanceAI</h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Dialogue global de transaction contrôlé par le store Zustand */}
      <GlobalTransactionDialog />
    </div>
  );
} 