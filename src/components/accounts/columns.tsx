"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { formatCurrency } from "@/lib/utils";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { AccountRowActions } from "./account-row-actions";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Circle } from "lucide-react"; // Icône par défaut si aucune n'est fournie

// Utilise le type retourné par la procédure tRPC pour plus de sûreté
import { type AppRouter } from "@/server/api/root";
import { type inferRouterOutputs } from '@trpc/server';
type RouterOutput = inferRouterOutputs<AppRouter>;
type AccountWithBalance = RouterOutput['bankAccount']['getAll'][number];

export const columns: ColumnDef<AccountWithBalance>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nom" />
    ),
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      const icon = row.original.icon; // Accéder à l'icône depuis les données originales
      const color = row.original.color; // Accéder à la couleur depuis les données originales

      return (
        <div className="flex items-center space-x-2">
          {/* Afficher l'icône ou un cercle coloré par défaut */}
          <span
             className="flex h-5 w-5 items-center justify-center rounded-full text-xs shrink-0"
             // Appliquer la couleur de fond si elle existe, sinon une couleur par défaut
             style={{ backgroundColor: color ?? 'hsl(var(--muted))', color: color ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))' }}
             aria-hidden="true"
           >
             {icon ? (
                 // Si l'icône est un emoji ou un seul caractère
                 icon.length === 1 || /\p{Emoji}/u.test(icon) ? (
                      <span>{icon}</span>
                  ) : (
                      // Si c'est un nom d'icône (futur usage possible avec une lib d'icônes)
                      <Circle className="h-3 w-3" /> // Placeholder
                  )
             ) : (
                 // Icône par défaut si aucune n'est fournie
                 <Circle className="h-3 w-3" />
             )}
          </span>
          {/* Afficher le nom */}
          <span className="font-medium truncate">{name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "balance",
    header: ({ column }) => (
      <div className="text-right">
        <DataTableColumnHeader column={column} title="Solde" />
      </div>
    ),
    cell: ({ row }) => {
      // Gérer les deux cas : balance peut être string ou number selon l'API
      const balanceValue = row.getValue("balance");
      const balance = typeof balanceValue === 'string' 
        ? parseFloat(balanceValue) 
        : (balanceValue as number);
        
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
      return <div className="hidden lg:table-cell text-sm text-muted-foreground">
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
      return <div className="hidden lg:table-cell text-sm text-muted-foreground">
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