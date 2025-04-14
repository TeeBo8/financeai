import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import { SummaryCard } from "~/components/dashboard/summary-card";
import { AddTransactionButton } from "~/components/dashboard/add-transaction-button";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PiggyBank,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Tableau de bord - FinanceAI",
  description: "Gérez vos finances personnelles avec FinanceAI",
};

// Helper pour formater en Euro
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

// Helper pour formater le pourcentage et déterminer la couleur
function formatPercentageChange(change: number | null | undefined): {
  text: string;
  className: string;
} {
  if (change === null || change === undefined || isNaN(change)) {
    return { text: "-", className: "text-muted-foreground" };
  }

  const formatted = `${change > 0 ? "+" : ""}${change.toFixed(1)}%`;
  let className = "text-muted-foreground";

  if (change > 0) {
    className = "text-green-600 dark:text-green-400";
  } else if (change < 0) {
    className = "text-red-600 dark:text-red-400";
  }

  return { text: formatted, className };
}

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session) {
    redirect("/api/auth/signin");
  }
  
  // Appeler les procédures tRPC côté serveur
  const [totalBalance, summary] = await Promise.all([
    api.dashboard.getTotalBalance(),
    api.dashboard.getCurrentMonthSummary(),
  ]);

  // Formatage des changements pour les footers des cartes
  const expensesPerc = formatPercentageChange(summary.expensesChange);
  const incomePerc = formatPercentageChange(summary.incomeChange);
  const savingsPerc = formatPercentageChange(summary.savingsChange);

  // Détermine la couleur pour les dépenses (inversée: baisse = vert, hausse = rouge)
  let expensesClassName = "text-muted-foreground";
  if (summary.expensesChange !== null && summary.expensesChange !== undefined && !isNaN(summary.expensesChange)) {
    if (summary.expensesChange < 0) expensesClassName = "text-green-600 dark:text-green-400"; // Baisse des dépenses = bien
    else if (summary.expensesChange > 0) expensesClassName = "text-red-600 dark:text-red-400"; // Hausse des dépenses = mal
  }
  
  const expensesFooterText = (
    <span className={expensesClassName}>
      {expensesPerc.text} par rapport au mois dernier
    </span>
  );

  const incomeFooterText = (
    <span className={incomePerc.className}>
      {incomePerc.text} par rapport au mois dernier
    </span>
  );
  
  const savingsFooterText = (
    <span className={savingsPerc.className}>
      {savingsPerc.text} par rapport au mois dernier
    </span>
  );
  
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Tableau de bord
          </h1>
          <p className="text-muted-foreground">
            Bienvenue sur votre tableau de bord FinanceAI, {session.user.name ?? ""}!
          </p>
        </div>
        {/* Ajout du bouton Client ici */}
        <AddTransactionButton />
      </div>

      {/* Grille pour les cartes résumé */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Solde total"
          value={formatCurrency(totalBalance)}
          icon={<DollarSign />}
          footerText="Solde net sur tous les comptes"
        />
        <SummaryCard
          title="Revenus du mois"
          value={formatCurrency(summary.income)}
          icon={<TrendingUp />}
          footerText={incomeFooterText}
        />
        <SummaryCard
          title="Dépenses du mois"
          value={formatCurrency(summary.expenses)}
          icon={<TrendingDown />}
          footerText={expensesFooterText}
        />
        <SummaryCard
          title="Économies du mois"
          value={formatCurrency(summary.savings)}
          icon={<PiggyBank />}
          footerText={savingsFooterText}
        />
      </div>
    </div>
  );
} 