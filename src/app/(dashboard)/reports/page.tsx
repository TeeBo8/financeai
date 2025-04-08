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
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Import helper pour formater
const formatCurrency = (amount: string | number | null | undefined): string => {
    if (amount === null || amount === undefined) return '';
    const numberAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
    if (isNaN(numberAmount)) return '';
    return numberAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
};

export default function ReportsPage() {
    // État pour la plage de dates sélectionnée
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });

    // Requête tRPC pour obtenir les données du rapport
    const expensesQuery = api.report.getExpensesByCategory.useQuery(
        { // Input pour la requête
           dateFrom: dateRange?.from,
           dateTo: dateRange?.to,
        },
        { // Options de la requête
            enabled: !!dateRange?.from && !!dateRange?.to, // Lance la requête seulement si les dates sont définies
        }
    );

    // Couleurs de fallback pour le graphique
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

    return (
        <div className="space-y-6 p-4 md:p-6">
            <h1 className="text-2xl font-semibold">Rapports</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Dépenses par Catégorie</CardTitle>
                    <CardDescription>
                        Visualisation de la répartition de vos dépenses par catégorie pour la période sélectionnée.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Sélecteur de Plage de Dates */}
                    <div className='max-w-xs'> {/* Limite la largeur du sélecteur */}
                         <DatePickerWithRange
                            date={dateRange}
                            onDateChange={setDateRange} // Met à jour l'état quand la plage change
                        />
                    </div>

                    {/* Affichage Chargement / Erreur / Données */}
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

                     {/* Graphique */}
                    {expensesQuery.data && expensesQuery.data.length > 0 && (
                        <div className="mt-4">
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={expensesQuery.data}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="totalExpenses" // La valeur numérique
                                            nameKey="categoryName"  // Le nom affiché dans le tooltip/légende
                                        >
                                            {expensesQuery.data.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.categoryColor ?? COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            formatter={(value) => {
                                                if (typeof value === 'number' || typeof value === 'string') {
                                                    return formatCurrency(value);
                                                }
                                                return '';
                                            }}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {expensesQuery.data && expensesQuery.data.length === 0 && !expensesQuery.isLoading && (
                        <p className="text-center text-muted-foreground py-10">
                            Aucune dépense trouvée pour cette période et ces catégories.
                        </p>
                    )}

                </CardContent>
            </Card>
        </div>
    );
} 