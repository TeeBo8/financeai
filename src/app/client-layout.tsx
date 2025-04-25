"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import { TRPCReactProvider } from "@/trpc/react";
import { GlobalTransactionDialog } from "@/components/transactions/global-transaction-dialog";
import { GlobalAccountDialog } from "@/components/accounts/global-account-dialog";
import { GlobalCategoryDialog } from "@/components/categories/global-category-dialog";
import { GlobalRecurringTransactionDialog } from "@/components/recurring/global-recurring-transaction-dialog";
// BudgetDialog a été déplacé dans BudgetsClient

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TRPCReactProvider>
        {children}
        <Toaster />
        <GlobalTransactionDialog />
        <GlobalAccountDialog />
        <GlobalCategoryDialog />
        <GlobalRecurringTransactionDialog />
        {/* BudgetDialog est maintenant géré directement dans BudgetsClient */}
      </TRPCReactProvider>
    </SessionProvider>
  );
} 