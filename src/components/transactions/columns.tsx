"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatCurrency } from "~/lib/utils";
import { Badge } from "~/components/ui/badge";
import { DataTableColumnHeader } from "~/components/ui/data-table-column-header";
import type { TransactionWithRelations } from "~/lib/types";
import { TransactionRowActions } from "./transaction-row-actions";

// Définition des colonnes pour la table des transactions
export const columns: ColumnDef<TransactionWithRelations>[] = [
  // --- Colonne Date ---
  {
    accessorKey: "date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
    cell: ({ row }) => {
      // Nous devons utiliser un casting type pour s'assurer que format accepte la valeur
      const date = row.getValue("date");
      // Formate la date de manière lisible
      return <span>{format(new Date(date as string | Date), "dd MMM yyyy", { locale: fr })}</span>;
    },
    // Optionnel: Active le tri mais désactive le filtrage par défaut pour cette colonne
    enableSorting: true,
    enableHiding: false, // On ne peut pas cacher la date
  },

  // --- Colonne Description ---
  {
    accessorKey: "description",
     header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
    cell: ({ row }) => <div className="font-medium">{row.getValue("description")}</div>,
    enableSorting: true,
  },

  // --- Colonne Montant ---
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Montant" />
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount")); // Convertit en nombre
      const formatted = formatCurrency(amount);
      // Applique une couleur différente pour dépenses/revenus
      const textColor = amount < 0 ? "text-destructive" : "text-green-600 dark:text-green-400";

      return <div className={`text-right font-medium ${textColor}`}>{formatted}</div>;
    },
    // Tri par montant numérique
    sortingFn: "alphanumeric", // Ou définir une fonction de tri custom si besoin
    enableSorting: true,
  },

  // --- Colonne Catégorie ---
   {
    // Accède à l'objet catégorie entier (suppose que ton type TransactionWithRelations l'inclut)
    accessorKey: "category",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Catégorie" />
    ),
    cell: ({ row }) => {
      const category = row.original.category; // Accède à l'objet via row.original
      if (!category) {
        return <span className="text-muted-foreground">Aucune</span>;
      }
      return (
         // Affiche un badge avec la couleur et l'icône/nom
        <Badge variant="outline" style={{
            // Applique la couleur de fond ou de bordure basée sur category.color
             borderColor: category.color ?? undefined,
             // backgroundColor: // ou background si tu préfères
             color: category.color ?? undefined, // Met aussi le texte en couleur
             }} className="hidden md:inline-flex">
           {category.icon && <span className="mr-1">{category.icon}</span>}
          {category.name}
        </Badge>
      );
    },
    // Permet le filtrage basé sur le nom de la catégorie
    filterFn: (row, id, value) => {
      const categoryName = row.original.category?.name;
      // Vérifie que 'value' est une string et 'categoryName' existe
      if (typeof value === 'string' && typeof categoryName === 'string') {
        // Compare en minuscules pour être insensible à la casse
        return categoryName.toLowerCase().includes(value.toLowerCase());
      }
      return false; // Ne correspond pas si les types sont mauvais
    },
    enableSorting: true, // On peut trier par nom de catégorie ?
    sortingFn: (rowA, rowB, _columnId) => { // Tri custom par nom
        const nameA = rowA.original.category?.name?.toLowerCase() ?? '';
        const nameB = rowB.original.category?.name?.toLowerCase() ?? '';
        return nameA.localeCompare(nameB);
    }
  },

   // --- Colonne Compte Bancaire ---
   {
     accessorKey: "bankAccount", // Accède à l'objet compte
     header: ({ column }) => (
       <DataTableColumnHeader column={column} title="Compte" />
     ),
     cell: ({ row }) => {
        const account = row.original.bankAccount;
        return <div className="hidden md:table-cell">{account?.name ?? "N/A"}</div>; // Affiche le nom du compte
     },
     filterFn: (row, id, value) => {
       const accountName = row.original.bankAccount?.name;
       if (typeof value === 'string' && typeof accountName === 'string') {
         return accountName.toLowerCase().includes(value.toLowerCase());
       }
       return false;
     },
     enableSorting: true,
     sortingFn: (rowA, rowB, _columnId) => { // Tri custom par nom
        const nameA = rowA.original.bankAccount?.name?.toLowerCase() ?? '';
        const nameB = rowB.original.bankAccount?.name?.toLowerCase() ?? '';
        return nameA.localeCompare(nameB);
    }
   },

  // --- Colonne Actions ---
  {
    id: "actions", // ID unique pour la colonne d'actions
    cell: ({ row }) => {
      const transaction = row.original; // Récupère la transaction entière
      // Passe la transaction au composant qui gérera les boutons Edit/Delete
      return <TransactionRowActions transaction={transaction} />;
    },
    // Désactive tri et masquage pour cette colonne
    enableSorting: false,
    enableHiding: false,
  },
]; 