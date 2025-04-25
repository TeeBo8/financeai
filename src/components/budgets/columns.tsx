"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { api } from "@/trpc/react";
import { toast } from "sonner";

// Type simplifié pour le budget
interface BudgetType {
  id: string;
  name: string;
  amount: number;
  period: string;
  spentAmount: number;
  remainingAmount: number;
  budgetsToCategories: {
    category: {
      id: string;
      name: string;
    }
  }[];
}

// Fonction utilitaire pour formater les montants en euros
const formatAmount = (amount: number | string | null | undefined) => {
  if (amount === null || amount === undefined) {
    return "N/A";
  }
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(numAmount);
};

// Définition des colonnes pour le tableau des budgets
export const columns: ColumnDef<any>[] = [
  {
    accessorKey: "name",
    header: "Nom",
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "categories",
    header: "Catégories",
    cell: ({ row }) => {
      const budget = row.original;
      const categories = budget.budgetsToCategories?.map((btc: any) => btc.category) || [];
      
      if (categories.length === 0) {
        return <span className="text-muted-foreground">Aucune</span>;
      }
      
      return (
        <div className="flex flex-wrap gap-1">
          {categories.slice(0, 2).map((category: any) => (
            <Badge key={category.id} variant="outline">
              {category.name}
            </Badge>
          ))}
          {categories.length > 2 && (
            <Badge variant="outline">+{categories.length - 2}</Badge>
          )}
        </div>
      );
    }
  },
  {
    accessorKey: "amount",
    header: "Montant",
    cell: ({ row }) => formatAmount(row.getValue("amount")),
  },
  {
    accessorKey: "spentAmount",
    header: "Dépensé",
    cell: ({ row }) => formatAmount(row.original.spentAmount),
  },
  {
    accessorKey: "progress",
    header: "Progression",
    cell: ({ row }) => {
      const budget = row.original;
      const amount = typeof budget.amount === "string" ? parseFloat(budget.amount) : budget.amount;
      const spentAmount = typeof budget.spentAmount === "string" ? parseFloat(budget.spentAmount) : budget.spentAmount;
      
      if (!amount) return <div>N/A</div>;
      
      const percentage = Math.min(Math.round((spentAmount / amount) * 100), 100);
      
      return (
        <div className="w-full space-y-1">
          <Progress value={percentage} className="h-2" />
          <div className="flex justify-between text-xs">
            <span>{percentage}%</span>
            <span>{formatAmount(budget.remainingAmount)}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "period",
    header: "Période",
    cell: ({ row }) => {
      const period = row.getValue("period") as string;
      return (
        <Badge variant="outline">
          {period === "MONTHLY" ? "Mensuel" : 
           period === "YEARLY" ? "Annuel" : 
           period}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const budget = row.original;
      const utils = api.useUtils();
      
      // Récupérer la fonction d'édition à partir de meta
      const meta = table.options.meta as { editBudget?: (budget: any) => void };
      const handleEdit = meta?.editBudget;

      // Mutation pour supprimer un budget
      const deleteBudget = api.budget.delete.useMutation({
        onSuccess: () => {
          toast.success("Budget supprimé avec succès");
          void utils.budget.getAll.invalidate();
        },
        onError: (error) => {
          toast.error(`Erreur: ${error.message}`);
        },
      });

      return (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit?.(budget)}
            title="Modifier ce budget"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" title="Supprimer ce budget">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir supprimer le budget &quot;{budget.name}&quot; ?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => deleteBudget.mutate({ id: budget.id })}
                  className="bg-destructive text-destructive-foreground"
                >
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      );
    },
  },
]; 