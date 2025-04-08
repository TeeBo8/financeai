import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Budgets - FinanceAI",
  description: "Définissez et suivez vos budgets avec FinanceAI",
};

export default async function BudgetsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  return <DashboardLayout>{children}</DashboardLayout>;
} 