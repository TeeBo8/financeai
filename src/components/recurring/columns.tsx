"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { type AppRouter } from "@/server/api/root";
import { type inferRouterOutputs } from '@trpc/server';
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
// Importer les actions de ligne
import { RecurringTransactionRowActions } from "./recurring-transaction-row-actions";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
    cell: ({ row }) => (
      <div className="font-medium truncate max-w-[140px] sm:max-w-none">
        {row.getValue("description")}
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Montant" />
    ),
    cell: ({ row }) => {
      const amountValue = row.getValue("amount");
      const amount = typeof amountValue === 'string' ? parseFloat(amountValue) : amountValue as number;
      const formatted = formatCurrency(amount);
      const textColor = amount < 0 ? "text-destructive" : "text-green-600 dark:text-green-400";

      return <div className={`text-right font-medium ${textColor}`}>{formatted}</div>;
    },
    sortingFn: "alphanumeric",
    enableSorting: true,
  },
  {
    accessorKey: "frequency",
    header: ({ column }) => (
      <div className="hidden sm:table-cell">
        <DataTableColumnHeader column={column} title="Fréquence" />
      </div>
    ),
    cell: ({ row }) => {
      const frequency = row.getValue("frequency");
      const interval = row.original.interval;
      return <div className="hidden sm:table-cell">{formatFrequency(frequency as string, interval)}</div>;
    },
    enableSorting: true,
  },
  {
    accessorKey: "accountOrCategory",
    header: ({ column }) => (
      <div className="hidden sm:table-cell">
        <DataTableColumnHeader column={column} title="Compte/Catégorie" />
      </div>
    ),
    cell: ({ row }) => {
      const account = row.original.bankAccount;
      const category = row.original.category;
      
      if (account) {
        return <div className="hidden sm:table-cell">{account.name}</div>;
      } else if (category) {
        return (
          <div className="hidden sm:table-cell">
            <Badge variant="outline" style={{
              borderColor: category.color ?? undefined,
              color: category.color ?? undefined,
            }}>
              {category.icon && <span className="mr-1">{category.icon}</span>}
              {category.name}
            </Badge>
          </div>
        );
      }
      return <div className="hidden sm:table-cell">N/A</div>;
    },
    enableSorting: true,
  },
  {
    accessorKey: "nextOccurrenceDate",
    header: ({ column }) => (
      <div className="hidden md:table-cell">
        <DataTableColumnHeader column={column} title="Prochaine" />
      </div>
    ),
    cell: ({ row }) => {
      const date = row.getValue("nextOccurrenceDate");
      return (
        <div className="hidden md:table-cell">
          {format(new Date(date as string | Date), "dd MMM yyyy", { locale: fr })}
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "endDate",
    header: ({ column }) => (
      <div className="hidden lg:table-cell">
        <DataTableColumnHeader column={column} title="Fin" />
      </div>
    ),
    cell: ({ row }) => {
      const date = row.getValue("endDate");
      if (!date) return <div className="hidden lg:table-cell">-</div>;
      return (
        <div className="hidden lg:table-cell">
          {format(new Date(date as string | Date), "dd MMM yyyy", { locale: fr })}
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "notes",
    header: ({ column }) => (
      <div className="hidden lg:table-cell">
        <DataTableColumnHeader column={column} title="Notes" />
      </div>
    ),
    cell: ({ row }) => {
      const notes = row.getValue("notes");
      return <div className="hidden lg:table-cell">{notes as string || "-"}</div>;
    },
    enableSorting: true,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <div className="hidden lg:table-cell">
        <DataTableColumnHeader column={column} title="Créé le" />
      </div>
    ),
    cell: ({ row }) => {
      const date = row.getValue("createdAt");
      return <div className="hidden lg:table-cell">{format(new Date(date as string | Date), "dd MMM yyyy", { locale: fr })}</div>;
    },
    enableSorting: true,
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <div className="hidden lg:table-cell">
        <DataTableColumnHeader column={column} title="Modifié le" />
      </div>
    ),
    cell: ({ row }) => {
      const date = row.getValue("updatedAt");
      if (!date) return <div className="hidden lg:table-cell">-</div>;
      return <div className="hidden lg:table-cell">{format(new Date(date as string | Date), "dd MMM yyyy", { locale: fr })}</div>;
    },
    enableSorting: true,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const recurringTransaction = row.original;
      return <RecurringTransactionRowActions recurring={recurringTransaction} />;
    },
    enableSorting: false,
    enableHiding: false,
  },
]; 