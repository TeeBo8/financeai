"use client";

import React, { useState } from 'react';
import { api } from '~/trpc/react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { DatePickerWithRange } from '~/components/ui/date-range-picker';
import { startOfMonth, endOfMonth } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { ExpensesPieChart } from '~/components/reports/expenses-pie-chart';
import { MonthlySummaryChart } from '~/components/reports/monthly-summary-chart';

export default function ReportsPage() {
    // État pour la plage de dates sélectionnée pour le PieChart
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });

    // Nombre de mois à afficher pour le graphique mensuel
    const defaultBarMonths = 12;

    // Requête tRPC pour obtenir les données du rapport de dépenses par catégorie
    const expensesQuery = api.report.getExpensesByCategory.useQuery(
        { // Input pour la requête
           dateFrom: dateRange?.from,
           dateTo: dateRange?.to,
        },
        { // Options de la requête
            enabled: !!dateRange?.from && !!dateRange?.to, // Lance la requête seulement si les dates sont définies
        }
    );

    // Requête tRPC pour obtenir les données du résumé mensuel
    const monthlySummariesQuery = api.report.getMonthlySummaries.useQuery(
        { // Input pour la requête
            monthsToGoBack: defaultBarMonths
        },
        { // Options de la requête
            enabled: true, // Lance la requête immédiatement
        }
    );

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                    Rapports
                </h1>
                <p className="text-muted-foreground">
                    Analysez vos finances avec des visualisations détaillées.
                </p>
            </div>

            {/* Sélecteur de Plage de Dates */}
            <div className="flex justify-end">
                <DatePickerWithRange
                    date={dateRange}
                    onDateChange={setDateRange} // Met à jour l'état quand la plage change
                />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Carte pour le PieChart existant */}
                <Card>
                    <CardHeader>
                        <CardTitle>Dépenses par Catégorie</CardTitle>
                        <CardDescription>
                            Répartition pour la période sélectionnée.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {expensesQuery.isLoading && (
                            <div className='flex justify-center items-center h-60'>
                                <Skeleton className="h-48 w-48 rounded-full" /> {/* Skeleton pour le pie chart */}
                            </div>
                        )}

                        {expensesQuery.error && (
                            <p className="text-center text-red-600">
                                Erreur lors du chargement des données: {expensesQuery.error.message}
                            </p>
                        )}

                        {expensesQuery.data && (
                            <ExpensesPieChart data={expensesQuery.data} />
                        )}
                    </CardContent>
                </Card>

                {/* Nouvelle Carte pour le BarChart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Revenus vs Dépenses Mensuels</CardTitle>
                        <CardDescription>
                            Comparaison sur les {defaultBarMonths} derniers mois.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {monthlySummariesQuery.isLoading && (
                            <div className='flex justify-center items-center h-60'>
                                <Skeleton className="h-48 w-full" /> {/* Skeleton pour le bar chart */}
                            </div>
                        )}

                        {monthlySummariesQuery.error && (
                            <p className="text-center text-red-600">
                                Erreur lors du chargement des données: {monthlySummariesQuery.error.message}
                            </p>
                        )}

                        {monthlySummariesQuery.data && (
                            <MonthlySummaryChart data={monthlySummariesQuery.data} />
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 