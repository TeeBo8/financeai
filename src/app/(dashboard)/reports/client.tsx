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
import { ExpensesBarChart } from "@/components/reports/expenses-bar-chart";
import { MonthlySummaryChart } from "@/components/reports/monthly-summary-chart";
import { BalanceHistoryChart } from "@/components/reports/balance-history-chart";
import { NetCashFlowChart } from "@/components/reports/net-cash-flow-chart";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";
import { useSearchParams } from "next/navigation";

export function ReportsClient() {
  const searchParams = useSearchParams();
  
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