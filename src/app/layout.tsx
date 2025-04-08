import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "~/components/ui/sonner";

import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "FinanceAI",
  description: "Gérez vos finances personnelles avec IA",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${geist.variable}`} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <TRPCReactProvider>
          <div className="flex h-screen overflow-hidden">
            {/* Le contenu principal sera rendu ici */}
            {children}
          </div>
          <Toaster richColors closeButton position="top-right" />
        </TRPCReactProvider>
      </body>
    </html>
  );
}
