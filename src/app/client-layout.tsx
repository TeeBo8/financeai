"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "~/components/ui/sonner";
import { TRPCReactProvider } from "~/trpc/react";
import { GlobalTransactionDialog } from "~/components/transactions/global-transaction-dialog";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TRPCReactProvider>
      <SessionProvider>
        {children}
        <Toaster richColors closeButton position="top-right" />
        <GlobalTransactionDialog />
      </SessionProvider>
    </TRPCReactProvider>
  );
} 