import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import ClientLayout from "./client-layout";
import { ThemeProvider } from "~/components/layout/theme-provider";

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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClientLayout>{children}</ClientLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
