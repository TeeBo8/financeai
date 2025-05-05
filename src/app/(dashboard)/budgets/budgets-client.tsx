"use client";

import React, { useState } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Plus, PlusCircle, Loader2 } from "lucide-react";
import { BudgetCard, type BudgetWithSpending } from "@/components/budgets/budget-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { BudgetForm } from "@/components/budgets/budget-form";

export function BudgetsClient() {
  const [isNewBudgetDialogOpen, setIsNewBudgetDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<BudgetWithSpending | null>(null);
  const [budgetToDelete, setBudgetToDelete] = useState<BudgetWithSpending | null>(null);

  const utils = api.useUtils();
  const { data: budgets, isLoading } = api.budget.getAll.useQuery();

  const deleteBudget = api.budget.delete.useMutation({
    onSuccess: (data) => {
      if (data) {
        toast.success(`Budget "${data.name}" supprimé avec succès`);
      } else {
        toast.success("Budget supprimé avec succès");
      }
      void utils.budget.getAll.invalidate();
      closeDialogs();
    },
    onError: (error) => {
      toast.error(`Erreur lors de la suppression : ${error.message}`);
      closeDialogs();
    },
  });

  const handleNewBudget = () => {
    setIsNewBudgetDialogOpen(true);
  };

  const handleEditBudget = (budget: BudgetWithSpending) => {
    setBudgetToEdit(budget);
    setIsEditDialogOpen(true);
  };

  const handleDeleteRequest = (budget: BudgetWithSpending) => {
    setBudgetToDelete(budget);
    setIsDeleteDialogOpen(true);
  };

  const closeDialogs = () => {
    setIsNewBudgetDialogOpen(false);
    setIsEditDialogOpen(false);
    setIsDeleteDialogOpen(false);
    setBudgetToEdit(null);
    setBudgetToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
          <p className="text-muted-foreground">
            Créez et gérez vos budgets pour mieux contrôler vos dépenses.
          </p>
        </div>
        <Button onClick={handleNewBudget}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau Budget
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* TODO: Ajouter des skeletons pour le chargement */}
          <div className="h-32 animate-pulse rounded-lg bg-muted" />
          <div className="h-32 animate-pulse rounded-lg bg-muted" />
          <div className="h-32 animate-pulse rounded-lg bg-muted" />
        </div>
      ) : budgets?.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground mb-4">
            Aucun budget trouvé. Commencez par créer votre premier budget.
          </p>
          <Button onClick={handleNewBudget}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Créer un budget
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {budgets?.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onEdit={handleEditBudget}
              onDeleteRequest={handleDeleteRequest}
            />
          ))}
        </div>
      )}

      {/* Dialogue Nouveau Budget */}
      <Dialog open={isNewBudgetDialogOpen} onOpenChange={setIsNewBudgetDialogOpen}>
        <DialogContent className="sm:max-w-xl md:max-w-2xl lg:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Créer un nouveau budget</DialogTitle>
            <DialogDescription>
              Ajoutez un nouveau budget pour suivre vos dépenses
            </DialogDescription>
          </DialogHeader>
          <BudgetForm onClose={closeDialogs} />
        </DialogContent>
      </Dialog>

      {/* Dialogue Modifier Budget */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-xl md:max-w-2xl lg:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Modifier le budget</DialogTitle>
            <DialogDescription>
              Modifiez les détails du budget existant
            </DialogDescription>
          </DialogHeader>
          <BudgetForm 
            initialData={budgetToEdit ? {
              id: budgetToEdit.id,
              name: budgetToEdit.name,
              amount: budgetToEdit.amount,
              period: budgetToEdit.period as "MONTHLY" | "YEARLY",
              categoryIds: budgetToEdit.categories.map(category => category.id)
            } : null}
            onClose={closeDialogs}
          />
        </DialogContent>
      </Dialog>

      {/* Dialogue Supprimer Budget */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment supprimer le budget &quot;{budgetToDelete?.name}&quot; ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDialogs} disabled={deleteBudget.isPending}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (budgetToDelete) {
                  deleteBudget.mutate({ id: budgetToDelete.id });
                }
              }}
              disabled={deleteBudget.isPending}
            >
              {deleteBudget.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                "Supprimer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 