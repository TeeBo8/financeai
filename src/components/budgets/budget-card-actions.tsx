"use client";

import { useState } from "react";
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

// Type pour le budget
interface Budget {
  id: string;
  name: string;
  amount: number | string;
  period: string;
  spentAmount: number | string;
  [key: string]: string | number | undefined;
}

// Props pour le composant
interface BudgetCardActionsProps {
  budget: Budget;
  onEdit: (budget: Budget) => void;
}

export function BudgetCardActions({ budget, onEdit }: BudgetCardActionsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const utils = api.useUtils();

  // Mutation pour supprimer un budget
  const deleteBudget = api.budget.delete.useMutation({
    onSuccess: () => {
      toast.success("Budget supprimé avec succès");
      void utils.budget.getAll.invalidate();
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
      setIsDeleteDialogOpen(false);
    },
  });

  const handleDelete = () => {
    deleteBudget.mutate({ id: budget.id });
  };

  return (
    <div className="flex justify-end gap-2 mt-4">
      {/* Bouton Modifier */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onEdit(budget)}
        title="Modifier ce budget"
      >
        <Pencil className="h-4 w-4 mr-1" /> Modifier
      </Button>
      
      {/* Bouton Supprimer avec AlertDialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            title="Supprimer ce budget"
          >
            <Trash2 className="h-4 w-4 mr-1" /> Supprimer
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment supprimer le budget &quot;{budget.name}&quot; ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteBudget.isPending}
              className="bg-destructive text-destructive-foreground"
            >
              {deleteBudget.isPending ? "Suppression..." : "Confirmer la suppression"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 