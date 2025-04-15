"use client";

import { formatCurrency } from "~/lib/utils";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import type { TooltipProps } from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Type des données
type BalanceHistoryData = {
  name: string; // Label XAxis (ex: '14/04/25')
  date: string; // Date complète ('YYYY-MM-DD')
  Solde: number;
};

interface BalanceHistoryChartProps {
  data: BalanceHistoryData[];
}

// Tooltip personnalisé
type ValueType = number;
type NameType = string;

const CustomTooltip = ({ active, payload }: TooltipProps<ValueType, NameType>) => {
  if (active && payload?.[0]?.payload) {
    const data = payload[0].payload as BalanceHistoryData;
    const formattedDate = format(new Date(data.date+'T00:00:00'), "eeee d MMMM yyyy", { locale: fr }); // Ajoute T00 pour éviter TZ issues
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-1 gap-1">
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              {formattedDate}
            </span>
            <span className="font-bold text-foreground">
              {formatCurrency(payload[0].value!)}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function BalanceHistoryChart({ data }: BalanceHistoryChartProps) {
  // Si pas de données, affiche un message
  if (!data || data.length < 2) {
     return (
       <div className="flex h-[350px] w-full items-center justify-center text-muted-foreground">
         Données insuffisantes pour afficher le graphique pour cette période.
       </div>
     );
  }

  // Gestion intelligente des labels XAxis pour éviter la surcharge
  const xAxisTickInterval = data.length > 30 ? Math.floor(data.length / 10) : 0;

  return (
    <div style={{ width: '100%', height: 350 }} className="text-primary">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="name"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            interval={xAxisTickInterval}
          />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => formatCurrency(value)}
            allowDecimals={false}
            width={80}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <Line
            type="monotone"
            dataKey="Solde"
            stroke="currentColor"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, style: { fill: "currentColor", opacity: 0.75 } }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 