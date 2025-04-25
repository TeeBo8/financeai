"use client";

import { formatCurrency } from "@/lib/utils";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Type des données attendues
type ExpensesData = {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  totalExpenses: number;
};

interface ExpensesPieChartProps {
  data: ExpensesData[];
}

export function ExpensesPieChart({ data }: ExpensesPieChartProps) {
  // Couleurs de fallback pour le graphique
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

  // Si pas de données, affiche un message
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[300px] w-full items-center justify-center text-muted-foreground">
        Aucune dépense trouvée pour cette période.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="totalExpenses" // La valeur numérique
            nameKey="categoryName"  // Le nom affiché dans le tooltip/légende
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.categoryColor ?? COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => {
              if (typeof value === 'number' || typeof value === 'string') {
                return formatCurrency(Number(value));
              }
              return '';
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
} 