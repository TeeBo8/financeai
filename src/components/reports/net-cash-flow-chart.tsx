"use client";

import { formatCurrency, getCssVariableValue } from "@/lib/utils";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
} from "recharts";
import type { TooltipProps } from "recharts";
import React from "react";

// Type des données attendues
type MonthlySummaryData = {
  name: string; // Mois (ex: "Avr 2025")
  Revenus: number;
  Dépenses: number;
};

interface NetCashFlowChartProps {
  data: MonthlySummaryData[];
}

// Type pour les données du tooltip
type ChartTooltipPayload = {
  name: string;
  value: number;
  payload: MonthlySummaryData & { netFlow: number };
  color: string;
};

// Tooltip personnalisé pour le BarChart
const CustomTooltip = ({ 
  active, 
  payload, 
  label 
}: TooltipProps<number, string>) => {
  if (active && payload && payload.length > 0) {
    const typedEntry = payload[0] as unknown as ChartTooltipPayload;
    const netFlow = typedEntry.payload.netFlow;
    const color = netFlow >= 0 ? getCssVariableValue('--primary') : getCssVariableValue('--destructive');
    
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <p className="mb-1 text-sm font-medium">{label}</p>
        <div className="flex items-center justify-between text-xs">
          <span style={{ color }}>Flux net:</span>
          <span className="ml-2 font-semibold" style={{ color }}>
            {formatCurrency(netFlow)}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export function NetCashFlowChart({ data }: NetCashFlowChartProps) {
  // Calcul du flux net pour chaque mois
  const processedData = data.map(item => ({
    ...item,
    netFlow: item.Revenus - item.Dépenses
  }));

  // Récupérer les couleurs calculées
  const primaryColor = React.useMemo(() => getCssVariableValue('--primary'), []);
  const destructiveColor = React.useMemo(() => getCssVariableValue('--destructive'), []);

  // Si pas de données, affiche un message
  if (!processedData || processedData.length === 0) {
    return (
      <div className="flex h-[350px] w-full items-center justify-center text-muted-foreground">
        Aucune donnée à afficher pour la période sélectionnée.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 350 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={processedData}
          margin={{
            top: 5,
            right: 10,
            left: 10,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          
          <XAxis
            dataKey="name"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => formatCurrency(value)}
          />
          
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }}/>
          
          <Bar
            dataKey="netFlow"
            radius={[4, 4, 0, 0]}
          >
            {processedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.netFlow >= 0 ? primaryColor : destructiveColor}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
} 