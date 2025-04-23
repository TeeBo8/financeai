"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { type AppRouter } from '~/server/api/root';
import { type inferRouterOutputs } from '@trpc/server';
import { DataTableColumnHeader } from "~/components/ui/data-table-column-header";
import { formatCurrency, formatDate, cn } from "~/lib/utils";
import { Badge } from "~/components/ui/badge";
// Importer les actions de ligne
import { RecurringTransactionRowActions } from "./recurring-transaction-row-actions";

type RecurringTransactionWithRelations = inferRouterOutputs<AppRouter>['recurringTransaction']['getAll'][number];

// Helper pour afficher la fréquence
const formatFrequency = (freq: string, interval: number): string => {
    let label = "";
    switch (freq?.toUpperCase()) {
        case 'DAILY': label = interval === 1 ? "Quotidien" : `Tous les ${interval} jours`; break;
        case 'WEEKLY': label = interval === 1 ? "Hebdomadaire" : `Toutes les ${interval} semaines`; break;
        case 'MONTHLY': label = interval === 1 ? "Mensuel" : `Tous les ${interval} mois`; break;
        case 'YEARLY': label = interval === 1 ? "Annuel" : `Tous les ${interval} ans`; break;
        default: label = freq;
    }
    return label;
};

export const columns: ColumnDef<RecurringTransactionWithRelations>[] = [
  {
    accessorKey: "description",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
    cell: ({ row }) => <div className="font-medium">{row.getValue("description")}</div>,
  },
  {
    accessorKey: "amount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Montant" />,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"));
      const isIncome = amount >= 0;
      return (
        <span className={cn(
          isIncome ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"
        )}>
          {formatCurrency(amount)}
        </span>
      );
    },
  },
   {
    id: "frequency", // Colonne calculée
    header: "Fréquence",
    cell: ({ row }) => {
        const frequency = row.original.frequency;
        const interval = row.original.interval;
        return <div>{formatFrequency(frequency, interval)}</div>;
    },
    enableSorting: false,
   },
   {
    accessorKey: "nextOccurrenceDate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Prochaine Occurrence" />,
    cell: ({ row }) => {
        const date = row.getValue("nextOccurrenceDate") as Date | string | null;
        return <div>{date ? formatDate(date) : "-"}</div>;
    },
   },
  { // Colonne combinée pour Compte & Catégorie pour économiser de l'espace ?
    id: "account_category",
    header: "Compte / Catégorie",
    cell: ({ row }) => {
      const accountName = row.original.bankAccount?.name ?? "N/A";
      const categoryName = row.original.category?.name;
      
      // On évite de référencer une propriété 'color' qui pourrait ne pas exister
      return (
        <div className="flex flex-col">
          <span>{accountName}</span>
          {categoryName && (
            <Badge
                variant="outline"
                className="mt-1 w-fit" // w-fit pour adapter la largeur
             >
                {categoryName}
             </Badge>
          )}
        </div>
      );
    },
    enableSorting: false,
  },
  // Ou colonnes séparées si tu préfères
  // { accessorKey: "account.name", header: "Compte" },
  // { accessorKey: "category.name", header: "Catégorie" },
   {
    accessorKey: "endDate",
    header: "Date de Fin",
    cell: ({ row }) => {
        const date = row.getValue("endDate") as Date | string | null;
        return <div>{date ? formatDate(date) : "Aucune"}</div>;
    },
    enableHiding: true, // Peut être masquée
   },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <div className="text-right">
          <RecurringTransactionRowActions recurring={row.original} />
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
]; 