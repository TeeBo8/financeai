import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { BudgetsClient } from "./budgets-client";

export const metadata: Metadata = {
  title: "Budgets - FinanceAI",
  description: "Créez et gérez vos budgets.",
};

export default async function BudgetsPage() {
  const session = await auth();
  if (!session) {
    redirect("/api/auth/signin");
  }

  return <BudgetsClient />;
} 