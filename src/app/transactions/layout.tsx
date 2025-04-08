import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { DashboardLayout } from "~/components/layout/DashboardLayout";

export const metadata: Metadata = {
  title: "Transactions - FinanceAI",
  description: "Gérez vos transactions avec FinanceAI",
};

export default async function TransactionsLayout({
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