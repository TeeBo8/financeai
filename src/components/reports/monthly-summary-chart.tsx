"use client";

import { formatCurrency } from "~/lib/utils"; // Réutilise l'helper existant
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid, // Pour ajouter une grille de fond
} from "recharts";
import type { TooltipProps } from "recharts";

// Type des données attendues
type MonthlySummaryData = {
  name: string; // Mois (ex: "Avr 2025")
  Revenus: number;
  Dépenses: number;
};

interface MonthlySummaryChartProps {
  data: MonthlySummaryData[];
}

// Type pour les données du tooltip
type ChartTooltipPayload = {
  name: string;
  value: number;
  payload: MonthlySummaryData;
  color: string;
};

// Tooltip personnalisé pour le BarChart
const CustomTooltip = ({ 
  active, 
  payload, 
  label 
}: TooltipProps<number, string>) => {
  if (active && payload && payload.length > 0) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <p className="mb-1 text-sm font-medium">{label}</p> {/* Nom du mois */}
        {payload.map((entry, index) => {
          const typedEntry = entry as unknown as ChartTooltipPayload;
          return (
            <div key={`item-${index}`} className="flex items-center justify-between text-xs">
              <span style={{ color: typedEntry.color }}>{typedEntry.name}:</span>
              <span className="ml-2 font-semibold">{formatCurrency(typedEntry.value)}</span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};


export function MonthlySummaryChart({ data }: MonthlySummaryChartProps) {
  // Si pas de données, affiche un message
  if (!data || data.length === 0) {
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
          data={data}
          margin={{
            top: 5,
            right: 10,
            left: 10, // Ajuste si besoin pour l'axe Y
            bottom: 5, // Espace pour les labels XAxis
          }}
          // Optionnel: Espacement entre les barres du même groupe
          // barGap={4}
          // Optionnel: Espacement entre les groupes de barres (mois)
          // barCategoryGap="20%"
        >
          {/* Grille de fond légère */}
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />

          {/* Axe X (Labels des mois) */}
          <XAxis
            dataKey="name"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            // Optionnel: Cacher les labels si trop nombreux
            // tick={data.length > 12 ? false : true}
          />
          {/* Axe Y (Montants) */}
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => formatCurrency(value)}
            // Optionnel: Définir une largeur minimale pour l'axe Y si les labels sont longs
            // width={80}
          />
          {/* Tooltip personnalisé au survol */}
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }}/>

          {/* Barre des Revenus */}
          <Bar
            dataKey="Revenus"
            // --- Essayer avec classe et currentColor ---
            className="text-primary" // Ajouter classe text-primary
            fill="currentColor"      // Utiliser currentColor
            // --- FIN ---
            radius={[4, 4, 0, 0]} // Coins arrondis en haut
          />
          {/* Barre des Dépenses */}
          <Bar
            dataKey="Dépenses"
            // --- Essayer avec classe et currentColor ---
            className="text-destructive" // Ajouter classe text-destructive
            fill="currentColor"         // Utiliser currentColor
            // --- FIN ---
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
} 