import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { ExpensesPieChart } from "~/components/reports/expenses-pie-chart";
import { DatePickerWithRange } from "~/components/ui/date-range-picker";
import { MonthlySummaryChart } from "~/components/reports/monthly-summary-chart";
import { BalanceHistoryChart } from "~/components/reports/balance-history-chart";
// Création d'un composant temporaire pour éviter le problème d'importation
// À supprimer quand le problème de résolution de modules sera résolu
import { subMonths, startOfDay, endOfDay } from "date-fns";

export const metadata: Metadata = {
  title: "Rapports - FinanceAI",
  description: "Analysez vos finances avec des visualisations détaillées",
};

// Helper pour parser les dates des searchParams
const parseDateParam = (param: string | string[] | undefined, defaultDate: Date): Date => {
  if (typeof param === "string") {
    try {
      // Tente de parser la date (ex: "YYYY-MM-DD")
      const parsed = new Date(param + "T00:00:00");
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    } catch { /* Ignore parsing error, use default */ }
  }
  return defaultDate;
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session) {
    redirect("/api/auth/signin");
  }

  // --- Gestion des Dates ---
  const now = new Date();
  const defaultMonthsHistory = 3;
  const defaultEndDate = endOfDay(now);
  const defaultStartDate = startOfDay(subMonths(now, defaultMonthsHistory));

  // Dans Next.js 15, searchParams est une Promise qu'il faut attendre
  const params = await searchParams;
  
  // Lit les dates des searchParams OU utilise les défauts
  const startDate = parseDateParam(params?.from, defaultStartDate);
  const endDate = parseDateParam(params?.to, defaultEndDate);

  // Mois par défaut pour le BarChart
  const defaultBarMonths = 12;

  // --- Appels tRPC ---
  const expensesData = await api.report.getExpensesByCategory({
    dateFrom: startDate,
    dateTo: endDate,
  });

  const monthlySummaries = await api.report.getMonthlySummaries({
    monthsToGoBack: defaultBarMonths,
  });

  const balanceHistory = await api.report.getBalanceHistory({
    startDate,
    endDate,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Rapports
        </h1>
        <p className="text-muted-foreground">
          Analysez vos finances avec des visualisations détaillées.
        </p>
      </div>

      {/* Filtre de date */}
      <div className="flex justify-end">
        <DatePickerWithRange
          initialFrom={startDate}
          initialTo={endDate}
        />
      </div>

      {/* Grille pour les graphiques */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Carte PieChart */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Dépenses par Catégorie</CardTitle>
            <CardDescription>
              Répartition pour la période sélectionnée.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExpensesPieChart data={expensesData} />
          </CardContent>
        </Card>

        {/* Carte BarChart */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Revenus vs Dépenses Mensuels</CardTitle>
            <CardDescription>
              Comparaison sur les {defaultBarMonths} derniers mois.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MonthlySummaryChart data={monthlySummaries} />
          </CardContent>
        </Card>

        {/* Nouvelle Carte pour l'Historique du Solde */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Historique du Solde</CardTitle>
            <CardDescription>
              Évolution de votre solde total sur la période sélectionnée.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BalanceHistoryChart data={balanceHistory} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 