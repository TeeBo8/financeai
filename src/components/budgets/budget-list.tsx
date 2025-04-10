"use client";

import React, { useState, useMemo } from 'react';
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { api } from "~/trpc/react";

// On va sûrement réutiliser la Table shadcn/ui
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
// Peut-être une ProgressBar pour le suivi ? Installons-la !
import { Progress } from "~/components/ui/progress";
import { Button } from "~/components/ui/button";
import { Trash2, Pencil, ArrowUpDown } from "lucide-react";
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
} from "~/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "~/components/ui/dialog";
import { toast } from "sonner";
import { BudgetForm } from "./budget-form";
import type { BudgetFormData } from "./budget-form"; // Importer le type BudgetFormData

// Formatage monétaire (on pourrait le mettre dans utils.ts)
const formatAmount = (amount: number | string | null | undefined) => {
    if (amount === null || amount === undefined) {
        return "N/A";
    }
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    // Utiliser Intl.NumberFormat pour un meilleur formatage localisé
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(numAmount);
};

// Helper function to format period
const formatPeriod = (period: string, startDate?: Date | null, endDate?: Date | null): string => {
    switch(period) {
        case 'monthly': return 'Mensuel';
        case 'weekly': return 'Hebdomadaire';
        case 'custom':
            const start = startDate ? format(new Date(startDate), 'P', { locale: fr }) : 'N/A';
            const end = endDate ? format(new Date(endDate), 'P', { locale: fr }) : '∞'; // Infinity symbol for ongoing
            return `Personnalisé (${start} - ${end})`;
        default: return 'N/A';
    }
}

// Type pour les budgets tels que retournés par l'API
interface ApiBudget {
  id: string;
  userId: string;
  categoryId: string | null;
  name: string;
  amount: string; // Stocké comme string dans la DB
  period: 'monthly' | 'weekly' | 'custom';
  startDate: Date;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date | null;
  category?: {
    id: string;
    name: string;
    icon?: string;
    color?: string;
  } | null;
  spentAmount: number;
  categoryName?: string;
}

// Définir les colonnes triables pour les budgets
type SortableBudgetColumn = 'name' | 'categoryName' | 'amount' | 'spentAmount';
type SortDirection = 'asc' | 'desc';

export function BudgetList() {
  // Utiliser le hook tRPC pour récupérer les budgets
  const utils = api.useUtils();
  const { data: budgets, isLoading, error, refetch: _refetch } = api.budget.getAll.useQuery();
  const isError = !!error;

  // États pour la boîte de dialogue de modification
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<BudgetFormData | null>(null); // Utiliser BudgetFormData comme type

  // --- État pour le Tri ---
  const [sortColumn, setSortColumn] = useState<SortableBudgetColumn>('name'); // Tri par nom par défaut
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Hook de mutation pour la suppression
  const deleteBudgetMutation = api.budget.delete.useMutation({
    onSuccess: (data) => {
      toast.success(`Budget supprimé avec succès (ID: ${data.deletedId}).`);
      // Invalider le cache pour rafraîchir la liste
      void utils.budget.getAll.invalidate();
    },
    onError: (error) => {
      // Extraction sécurisée du message d'erreur
      const errorMessage = typeof error.message === 'string' 
        ? error.message 
        : "Impossible de supprimer le budget.";
      toast.error(errorMessage);
    },
  });

  // Fonction appelée lors de la confirmation de suppression
  const handleDeleteBudget = (budgetId: string) => {
    deleteBudgetMutation.mutate({ id: budgetId });
  };

  // Fonction pour ouvrir la dialogue de modification
  const handleOpenEditDialog = (budget: ApiBudget) => {
    // Convertir les données au format attendu par BudgetFormData
    const budgetDataForForm: BudgetFormData = {
      id: budget.id,
      name: budget.name,
      // Assurer que 'amount' est un nombre
      amount: typeof budget.amount === "string" ? parseFloat(budget.amount) : Number(budget.amount),
      period: budget.period,
      // Assurer que les dates sont des objets Date
      startDate: budget.startDate ? new Date(budget.startDate) : new Date(),
      endDate: budget.endDate ? new Date(budget.endDate) : null,
      categoryId: budget.categoryId ?? null, // Assurer null si undefined
    };

    // Vérifier si la conversion de amount a échoué
    if (isNaN(budgetDataForForm.amount)) {
      toast.error("Erreur lors de la préparation de la modification du budget (montant invalide).");
      return; // Empêche d'ouvrir le formulaire avec des données invalides
    }

    setBudgetToEdit(budgetDataForForm);
    setIsEditDialogOpen(true); // Ouvre la dialogue
  };

  // Fonction pour fermer la dialogue (appelée par le formulaire après succès)
  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setBudgetToEdit(null); // Réinitialise le budget en cours d'édition
  };

  // --- Logique de Tri (avec useMemo) ---
  const sortedBudgets = useMemo(() => {
    if (!budgets) return [];
    // Type assertion avec unknown intermédiaire pour éviter les erreurs
    const sorted = [...budgets] as unknown as ApiBudget[];

    sorted.sort((a, b) => {
      let valA: string | number | null | undefined;
      let valB: string | number | null | undefined;

      switch (sortColumn) {
        case 'name':
          valA = a.name ? a.name.toLowerCase() : '';
          valB = b.name ? b.name.toLowerCase() : '';
          break;
        case 'categoryName':
          // Gérer "Toutes les catégories" ou null/undefined
          valA = a.category?.name ? a.category.name.toLowerCase() : 'zzzz'; // Mettre les null/undefined à la fin
          valB = b.category?.name ? b.category.name.toLowerCase() : 'zzzz';
          break;
        case 'amount':
          valA = typeof a.amount === "string" ? parseFloat(a.amount) : Number(a.amount);
          valB = typeof b.amount === "string" ? parseFloat(b.amount) : Number(b.amount);
          break;
        case 'spentAmount':
          // Utiliser ?? 0 pour les cas où spentAmount serait undefined
          valA = Number(a.spentAmount ?? 0);
          valB = Number(b.spentAmount ?? 0);
          break;
        default:
          return 0; // Ne devrait pas arriver
      }

      // Comparaison (gestion des null/undefined pour string)
      let comparison = 0;
      if (valA === null || valA === undefined) comparison = -1; // nulls first? adjust if needed
      else if (valB === null || valB === undefined) comparison = 1;
      else if (valA < valB) comparison = -1;
      else if (valA > valB) comparison = 1;

      return sortDirection === 'desc' ? comparison * -1 : comparison;
    });
    return sorted;
  }, [budgets, sortColumn, sortDirection]);

  // --- Handler pour changer le tri ---
  const handleSort = (column: SortableBudgetColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      // Défaut : asc pour nom/cat, desc pour montants
      setSortDirection((column === 'amount' || column === 'spentAmount') ? 'desc' : 'asc');
    }
  };

  // Gestion erreur/chargement
  if (isLoading) {
    return <div className="text-center text-muted-foreground p-4">Chargement des budgets...</div>;
  }
  if (isError) {
    return <div className="rounded-md bg-destructive/10 p-4 text-destructive">Erreur de chargement des budgets.</div>;
  }
  if (!budgets || budgets.length === 0) {
    return (
      <div className="rounded-md border p-4 text-center text-muted-foreground">
        Vous n&apos;avez pas encore défini de budget.
      </div>
    );
  }

  // Rendu du tableau des budgets
  return (
    <>
      {/* Dialog pour la modification - placé en dehors du map pour n'en avoir qu'un seul */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        {/* Le trigger est géré manuellement par le bouton Edit dans le map */}
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifier le Budget</DialogTitle>
            <DialogDescription>
              Modifiez les détails de votre budget ici. Cliquez sur enregistrer lorsque vous avez terminé.
            </DialogDescription>
          </DialogHeader>
          {/* Rend le formulaire, en passant le budget à éditer et la fonction de fermeture */}
          {budgetToEdit && (
            <BudgetForm
              initialData={budgetToEdit}
              onFormSubmit={handleCloseEditDialog} // Passe la fonction pour fermer
            />
          )}
          {/* Pas besoin de DialogFooter ici si le formulaire a son propre bouton */}
        </DialogContent>
      </Dialog>

      <div className="rounded-md border mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <div className="flex items-center">
                  Nom
                  <Button variant="ghost" size="sm" onClick={() => handleSort('name')} className="ml-1 p-0 h-6">
                    <ArrowUpDown className={`h-4 w-4 ${sortColumn === 'name' ? 'opacity-100' : 'opacity-40'}`} />
                  </Button>
                </div>
              </TableHead><TableHead>
                <div className="flex items-center">
                  Catégorie
                  <Button variant="ghost" size="sm" onClick={() => handleSort('categoryName')} className="ml-1 p-0 h-6">
                    <ArrowUpDown className={`h-4 w-4 ${sortColumn === 'categoryName' ? 'opacity-100' : 'opacity-40'}`} />
                  </Button>
                </div>
              </TableHead><TableHead>Période</TableHead><TableHead className="text-right">
                <div className="flex items-center justify-end">
                  Montant Budget
                  <Button variant="ghost" size="sm" onClick={() => handleSort('amount')} className="ml-1 p-0 h-6">
                    <ArrowUpDown className={`h-4 w-4 ${sortColumn === 'amount' ? 'opacity-100' : 'opacity-40'}`} />
                  </Button>
                </div>
              </TableHead><TableHead className="text-right">
                <div className="flex items-center justify-end">
                  Dépensé
                  <Button variant="ghost" size="sm" onClick={() => handleSort('spentAmount')} className="ml-1 p-0 h-6">
                    <ArrowUpDown className={`h-4 w-4 ${sortColumn === 'spentAmount' ? 'opacity-100' : 'opacity-40'}`} />
                  </Button>
                </div>
              </TableHead><TableHead>Progression</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedBudgets.map(budget => (<TableRow key={budget.id}>
              <TableCell className="font-medium">{budget.name}</TableCell>
              <TableCell>
                {budget.category ? (
                  <div className="flex items-center gap-2">
                    {budget.category.icon && (
                      <span style={{ color: budget.category.color ?? undefined }}>
                        {budget.category.icon}
                      </span>
                    )}
                    <span>{budget.category.name}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Toutes</span>
                )}
              </TableCell>
              <TableCell>
                {formatPeriod(budget.period, budget.startDate, budget.endDate)}
                <span className="block text-xs text-muted-foreground">
                  {format(new Date(budget.startDate), "dd MMM yyyy", {locale: fr})}
                  {budget.endDate && ` - ${format(new Date(budget.endDate), "dd MMM yyyy", {locale: fr})}`}
                </span>
              </TableCell>
              <TableCell className="text-right">{formatAmount(budget.amount)}</TableCell>
              <TableCell className="text-right">{formatAmount(budget.spentAmount ?? 0)}</TableCell>
              <TableCell>
                {(() => {
                  const spent = budget.spentAmount ?? 0;
                  const total = typeof budget.amount === "string" ? parseFloat(budget.amount) : budget.amount;
                  
                  let progressValue = 0;
                  if (total > 0) {
                    progressValue = Math.max(0, Math.min(100, (spent / total) * 100));
                  } else if (spent > 0) {
                    progressValue = 100;
                  }

                  const progressColorClass = progressValue > 90 
                    ? '[&>*]:bg-red-500' 
                    : progressValue > 70 
                      ? '[&>*]:bg-yellow-500' 
                      : '[&>*]:bg-primary';

                  return (
                    <div className="flex items-center space-x-2">
                      <Progress 
                        value={progressValue} 
                        className={`w-[80%] ${progressColorClass}`}
                      />
                      <span className="text-xs text-muted-foreground">{`${Math.round(progressValue)}%`}</span>
                    </div>
                  );
                })()}
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEditDialog(budget as unknown as ApiBudget)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deleteBudgetMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est irréversible et supprimera définitivement le budget &quot;{budget.name}&quot;.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteBudget(budget.id)}
                        disabled={deleteBudgetMutation.isPending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleteBudgetMutation.isPending ? 'Suppression...' : 'Supprimer'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>))}
          </TableBody>
        </Table>
      </div>
    </>
  );
} 