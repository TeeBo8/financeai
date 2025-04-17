"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { formatCurrency } from "~/lib/utils";
import { DataTableColumnHeader } from "~/components/ui/data-table-column-header";
import { AccountRowActions } from "./account-row-actions";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Utilise le type retourné par la procédure tRPC pour plus de sûreté
import { type AppRouter } from '~/server/api/root';
import { type inferRouterOutputs } from '@trpc/server';
type RouterOutput = inferRouterOutputs<AppRouter>;
type AccountWithBalance = RouterOutput['bankAccount']['getAll'][number];

export const columns: ColumnDef<AccountWithBalance>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nom" />
    ),
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "balance",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Solde" />
    ),
    cell: ({ row }) => {
      // Le solde vient sous forme de string depuis l'API
      const balance = parseFloat(row.getValue("balance"));
      return <div className={`text-right font-medium ${balance < 0 ? "text-destructive" : "text-green-600 dark:text-green-400"}`}>
        {formatCurrency(balance)}
      </div>;
    },
    sortingFn: "basic",
    sortDescFirst: true, // Tri décroissant par défaut pour voir les plus gros soldes en premier
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Créé le" />
    ),
    cell: ({ row }) => {
      // Type explicite et conversion sûre
      const value = row.getValue("createdAt");
      // Si c'est une date ISO, cela fonctionne directement
      return <div className="text-sm text-muted-foreground">
        {format(new Date(value as string), "dd MMM yyyy", { locale: fr })}
      </div>;
    },
    enableHiding: true,
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Mis à jour" />
    ),
    cell: ({ row }) => {
      // Type explicite et conversion sûre
      const value = row.getValue("updatedAt");
      // Vérifier si la valeur existe avant de formater
      return <div className="text-sm text-muted-foreground">
        {value ? format(new Date(value as string), "dd MMM yyyy", { locale: fr }) : "-"}
      </div>;
    },
    enableHiding: true,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const account = row.original;
      return <AccountRowActions account={account} />;
    },
    enableSorting: false,
    enableHiding: false,
  },
]; 