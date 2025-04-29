"use client";

import { formatCurrency } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// Type des données attendues
type ExpensesData = {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  totalExpenses: number;
};

interface ExpensesBarChartProps {
  data: ExpensesData[];
}

export function ExpensesBarChart({ data }: ExpensesBarChartProps) {
  // Si pas de données, affiche un message
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[300px] w-full items-center justify-center text-muted-foreground">
        Aucune dépense trouvée pour cette période.
      </div>
    );
  }

  // Trier les données par montant décroissant
  const sortedData = [...data].sort((a, b) => b.totalExpenses - a.totalExpenses);

  return (
    <div style={{ width: '100%', height: Math.max(300, sortedData.length * 40) }}>
      <ResponsiveContainer>
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          {/* Grille de fond */}
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            horizontal={false}
          />
          
          {/* Axe X (Montants) */}
          <XAxis
            type="number"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatCurrency}
          />
          
          {/* Axe Y (Catégories) */}
          <YAxis
            type="category"
            dataKey="categoryName"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={120}
            interval={0}
          />
          
          {/* Tooltip personnalisé */}
          <Tooltip
            formatter={(value) => {
              if (typeof value === 'number' || typeof value === 'string') {
                return formatCurrency(Number(value));
              }
              return '';
            }}
            cursor={{ fill: 'hsl(var(--muted))' }}
          />
          
          {/* Barre pour chaque catégorie */}
          <Bar
            dataKey="totalExpenses"
            barSize={20}
            radius={[4, 4, 4, 4]} // Coins arrondis
          >
            {sortedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.categoryColor ?? 'hsl(var(--primary))'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
} 