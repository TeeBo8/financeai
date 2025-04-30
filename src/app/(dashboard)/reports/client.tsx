"use client";

import React, { useState } from "react";
import { api } from "@/trpc/react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { ExpensesBarChart } from "@/components/reports/expenses-bar-chart";
import { MonthlySummaryChart } from "@/components/reports/monthly-summary-chart";
import { BalanceHistoryChart } from "@/components/reports/balance-history-chart";
import { NetCashFlowChart } from "@/components/reports/net-cash-flow-chart";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";
import { useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";

export function ReportsClient() {
  const searchParams = useSearchParams();
  
  // États pour l'analyse IA
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Récupérer les dates des searchParams ou utiliser des valeurs par défaut
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');
  const defaultStartDate = startOfMonth(subMonths(new Date(), 5));
  const defaultEndDate = endOfMonth(new Date());
  
  const startDate = fromParam ? new Date(fromParam) : defaultStartDate;
  const endDate = toParam ? new Date(toParam) : defaultEndDate;

  // État pour le compte sélectionné
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");

  // Récupérer les données avec tRPC
  const { data: monthlySummaries, isLoading: isLoadingMonthly } = api.report.getMonthlySummaries.useQuery({ 
    monthsToGoBack: 12 
  });

  const { data: expensesData, isLoading: isLoadingExpenses } = api.report.getExpensesByCategory.useQuery({ 
    dateFrom: startDate,
    dateTo: endDate,
  });

  const { data: balanceHistory, isLoading: isLoadingHistory } = api.report.getBalanceHistory.useQuery({
    startDate,
    endDate,
    accountId: selectedAccountId === "all" ? undefined : selectedAccountId,
  });

  const { data: accounts, isLoading: isLoadingAccounts } = api.bankAccount.getAll.useQuery();

  const handleAnalyzeReports = async () => {
    setIsAnalyzing(true);
    setAiSummary(null);
    
    try {
      // Vérifier que nous avons les données nécessaires
      if (!monthlySummaries || !expensesData) {
        throw new Error("Données manquantes pour l'analyse");
      }

      // Calculer les totaux pour la période sélectionnée
      const totalIncome = monthlySummaries.reduce((sum, month) => sum + (month.Revenus || 0), 0);
      const totalExpenses = monthlySummaries.reduce((sum, month) => sum + (month.Dépenses || 0), 0);
      const netFlow = totalIncome - totalExpenses;

      // Extraire les catégories de dépenses principales (top 3)
      const topExpenseCategories = expensesData
        .sort((a, b) => b.totalExpenses - a.totalExpenses)
        .slice(0, 3)
        .map(category => ({
          name: category.categoryName,
          amount: category.totalExpenses
        }));

      // Appeler l'API
      const response = await fetch('/api/ai/analyze-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          totalIncome,
          totalExpenses,
          netFlow,
          topExpenseCategories,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur API: ${errorText}`);
      }

      const result = await response.json();
      setAiSummary(result.summary);

    } catch (error) {
      console.error("Erreur lors de l'analyse des rapports:", error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : "Une erreur est survenue lors de l'analyse des rapports"
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

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

      {/* Bouton d'analyse IA */}
      <div className="flex justify-end">
        <Button 
          onClick={handleAnalyzeReports}
          disabled={isAnalyzing}
          className="flex items-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyse en cours...
            </>
          ) : (
            "✨ Analyser mes rapports"
          )}
        </Button>
      </div>

      {/* Résultat de l'analyse IA */}
      {aiSummary && (
        <Card>
          <CardHeader>
            <CardTitle>Analyse IA de vos rapports</CardTitle>
            <CardDescription>
              Résumé intelligent de votre situation financière
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{aiSummary}</p>
          </CardContent>
        </Card>
      )}

      {/* Filtre de date */}
      <div className="flex justify-end">
        <DatePickerWithRange
          initialFrom={startDate}
          initialTo={endDate}
        />
      </div>

      {/* Grille pour les graphiques */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Dépenses par Catégorie */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Dépenses par Catégorie</CardTitle>
            <CardDescription>
              Répartition pour la période sélectionnée.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingExpenses ? (
              <div className="flex h-[350px] items-center justify-center text-muted-foreground">
                Chargement...
              </div>
            ) : (
              <ExpensesBarChart data={expensesData ?? []} />
            )}
          </CardContent>
        </Card>

        {/* Revenus vs Dépenses Mensuels */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Revenus vs Dépenses Mensuels</CardTitle>
            <CardDescription>
              Comparaison sur les 12 derniers mois.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingMonthly ? (
              <div className="flex h-[350px] items-center justify-center text-muted-foreground">
                Chargement...
              </div>
            ) : (
              <MonthlySummaryChart data={monthlySummaries ?? []} />
            )}
          </CardContent>
        </Card>

        {/* Flux de Trésorerie Net Mensuel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Flux de Trésorerie Net Mensuel</CardTitle>
            <CardDescription>
              Différence entre revenus et dépenses par mois.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingMonthly ? (
              <div className="flex h-[350px] items-center justify-center text-muted-foreground">
                Chargement...
              </div>
            ) : (
              <NetCashFlowChart data={monthlySummaries ?? []} />
            )}
          </CardContent>
        </Card>

        {/* Historique du Solde */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <CardTitle>Historique du Solde</CardTitle>
                <CardDescription>
                  Évolution de votre solde sur la période sélectionnée.
                </CardDescription>
              </div>
              <Select
                value={selectedAccountId}
                onValueChange={setSelectedAccountId}
                disabled={isLoadingAccounts || isLoadingHistory}
              >
                <SelectTrigger className="w-full sm:w-[180px] mt-2 sm:mt-0">
                  <SelectValue placeholder="Choisir un compte..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les comptes</SelectItem>
                  {accounts?.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingHistory ? (
              <div className="flex h-[350px] items-center justify-center text-muted-foreground">
                Chargement...
              </div>
            ) : (
              <BalanceHistoryChart data={balanceHistory ?? []} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 