"use client";

import { formatCurrency } from "~/lib/utils";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipProps } from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Définit le type des données attendues par le graphique
type BalanceTrendData = {
  name: string; // Label pour l'axe X (ex: '14/04')
  date: string; // Date complète ('YYYY-MM-DD')
  Solde: number;
};

interface BalanceChartProps {
  data: BalanceTrendData[];
}

// Types pour TooltipProps
type ValueType = number;
type NameType = string;

// Un composant pour personnaliser le Tooltip
const CustomTooltip = ({ 
  active, 
  payload,
  label: _ // Renommé en utilisant le destructuring
}: TooltipProps<ValueType, NameType>) => {
  // Vérification plus explicite pour éviter les erreurs de type
  if (!active || !payload || payload.length === 0) {
    return null;
  }
  
  // À ce stade, on sait que payload existe et a au moins un élément
  const firstPayload = payload[0];
  if (!firstPayload?.payload) {
    return null;
  }

  const data = firstPayload.payload as BalanceTrendData;
  const formattedDate = format(new Date(data.date), "eeee d MMMM yyyy", { locale: fr }); // Format long
  
  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <div className="grid grid-cols-1 gap-1">
        <div className="flex flex-col">
          <span className="text-[0.70rem] uppercase text-muted-foreground">
            {formattedDate}
          </span>
          <span className="font-bold text-foreground">
            {formatCurrency(firstPayload.value!)}
          </span>
        </div>
      </div>
    </div>
  );
};

export function BalanceChart({ data }: BalanceChartProps) {
  // Si pas de données ou pas assez, affiche un message
  if (!data || data.length < 2) {
    return (
       <div className="flex h-[350px] w-full items-center justify-center text-muted-foreground">
         Données insuffisantes pour afficher le graphique.
       </div>
     );
  }

  return (
    // Hauteur fixe pour le conteneur du graphique
    <div style={{ width: '100%', height: 350 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 10,  // Remettons une petite marge droite standard
            left: 10,   // Remettons une petite marge gauche standard
            bottom: 20, // Augmenter la marge basse pour descendre l'axe X
          }}
        >
          {/* Axe X (Labels des jours) */}
          <XAxis
            dataKey="name" // Utilise les labels 'dd/MM'
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            interval={0} // Force l'affichage de tous les ticks/labels
            padding={{ left: 20, right: 20 }} // Ajoute du padding interne à l'axe X
          />
          {/* Axe Y (Solde) - ULTRA SIMPLIFIÉ */}
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickFormatter={(value) => {
              if (typeof value === 'number' && !isNaN(value)) {
                return formatCurrency(value);
              }
              return '';
            }}
            tickLine={false}
            axisLine={false}
          />
          {/* Tooltip personnalisé au survol */}
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }}/>
          {/* La ligne du graphique */}
          <Line
            type="monotone" // Style de ligne (courbe)
            dataKey="Solde" // La donnée à afficher
            stroke="hsl(var(--primary))" // Utilise la couleur primaire du thème shadcn
            strokeWidth={2}
            dot={false} // Cache les points sur la ligne
            activeDot={{ // Style du point au survol
               r: 6,
               style: { fill: "hsl(var(--primary))", opacity: 0.75 }
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 