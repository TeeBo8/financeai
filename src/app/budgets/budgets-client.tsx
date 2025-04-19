"use client";

import { useState } from "react";
import { type AppRouter } from "~/server/api/root";
import { type inferRouterOutputs } from "@trpc/server";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { PlusCircle, FilterX, Loader2 } from "lucide-react";
import { Skeleton } from "~/components/ui/skeleton";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { toast } from "sonner";
import { columns } from "~/components/budgets/columns";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { DataTablePagination } from "~/components/ui/data-table-pagination";
import { DataTableViewOptions } from "~/components/ui/data-table-view-options";
import { BudgetDialog } from "~/components/budgets/budget-dialog";

// Type pour un budget avec ses dépenses
type BudgetWithSpending = inferRouterOutputs<AppRouter>["budget"]["getAll"][number];

// Structure pour les filtres
interface BudgetFilters {
  period?: string; // 'all', 'MONTHLY', 'YEARLY', 'CUSTOM'
  spentPercentage?: string; // 'all', 'under50', 'between50And75', 'between75And100', 'over100'
}

interface BudgetsClientProps {
  budgets: BudgetWithSpending[];
}

export default function BudgetsClient({ budgets: initialBudgets }: BudgetsClientProps) {
  const router = useRouter();
  const utils = api.useUtils();
  
  // État local pour le dialogue
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetWithSpending | null>(null);
  
  // État pour les filtres
  const [filters, setFilters] = useState<BudgetFilters>({
    period: 'all',
    spentPercentage: 'all',
  });

  // Requête tRPC pour les budgets, utilisant les filtres
  const { data: budgets, isLoading, isFetching, error } = api.budget.getAll.useQuery(undefined, {
    initialData: initialBudgets, // Utiliser les données initiales fournies par le serveur
  });

  // Fonction pour filtrer les budgets côté client
  const filteredBudgets = (budgets || []).filter(budget => {
    // Filtre par période (insensible à la casse)
    if (filters.period && filters.period !== 'all') {
      if (budget.period.toUpperCase() !== filters.period.toUpperCase()) {
        return false;
      }
    }
    
    // Filtre par pourcentage de dépenses
    if (filters.spentPercentage && filters.spentPercentage !== 'all') {
      // Assurez-vous que amount est un nombre
      const amount = typeof budget.amount === 'string' ? parseFloat(budget.amount) : budget.amount;
      const spentAmount = typeof budget.spentAmount === 'string' ? parseFloat(budget.spentAmount) : budget.spentAmount;
      
      if (amount === 0 && spentAmount > 0) return filters.spentPercentage === 'over100'; // Cas spécial: budget 0 dépensé
      if (amount === 0) return false; // Cas spécial: budget 0 non dépensé

      const spentPercentage = (spentAmount / amount) * 100;
      
      switch (filters.spentPercentage) {
        case 'under50':
          if (spentPercentage >= 50) return false;
          break;
        case 'between50And75':
          if (spentPercentage < 50 || spentPercentage >= 75) return false;
          break;
        case 'between75And100':
          if (spentPercentage < 75 || spentPercentage >= 100) return false;
          break;
        case 'over100':
          if (spentPercentage < 100) return false;
          break;
      }
    }
    
    return true;
  });

  // Gestionnaire de changement de filtre
  const handleFilterChange = <K extends keyof BudgetFilters>(
    key: K,
    value: BudgetFilters[K] | string // Accepte string pour les Selects
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "" ? undefined : value,
    }));
  };

  // Reset des filtres
  const resetFilters = () => {
    setFilters({
      period: 'all',
      spentPercentage: 'all',
    });
  };

  // Vérifie s'il y a des filtres actifs
  const hasActiveFilters = 
    (filters.period && filters.period !== 'all') || 
    (filters.spentPercentage && filters.spentPercentage !== 'all');

  // Fonction pour ouvrir le dialogue de création
  const handleNewBudget = () => {
    setEditingBudget(null);
    setIsDialogOpen(true);
  };

  // Fonction pour fermer le dialogue
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingBudget(null);
    
    // Invalider les requêtes pour rafraîchir les données
    void utils.budget.getAll.invalidate();
  };

  // Fonction pour ouvrir en mode édition
  const handleEditBudget = (budget: BudgetWithSpending) => {
    setEditingBudget(budget);
    setIsDialogOpen(true);
  };

  // Configuration de la table TanStack
  const table = useReactTable({
    data: filteredBudgets || [], // Assurer que data n'est jamais undefined
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
    // Passer handleEditBudget via la propriété meta pour les actions
    meta: {
      editBudget: handleEditBudget,
    },
  });

  // Affichage pendant le chargement initial (quand aucune donnée n'est disponible)
  if (isLoading && !budgets) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Liste de tous vos budgets</h3>
            <p className="text-sm text-muted-foreground">
              Suivez vos dépenses et respectez vos objectifs budgétaires.
            </p>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  // Gestion de l'erreur
  if (error) {
    return <div className="text-red-600">Erreur: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h3 className="text-lg font-medium">Liste de tous vos budgets</h3>
          <p className="text-sm text-muted-foreground">
            Suivez vos dépenses et respectez vos objectifs budgétaires.
          </p>
        </div>
        <Button onClick={handleNewBudget} className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          <span>Nouveau Budget</span>
        </Button>
      </div>

      {/* Zone des Filtres */}
      <div className="flex flex-col gap-4 rounded-md border p-4 sm:flex-row sm:items-end">
        {/* Période */}
        <div className="space-y-1 sm:w-60">
          <label className="text-sm font-medium">Période</label>
          <Select
            value={filters.period}
            onValueChange={(value) => handleFilterChange('period', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Toutes les périodes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les périodes</SelectItem>
              <SelectItem value="MONTHLY">Mensuel</SelectItem>
              <SelectItem value="YEARLY">Annuel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Utilisation du budget */}
        <div className="space-y-1 sm:w-60">
          <label className="text-sm font-medium">Utilisation</label>
          <Select
            value={filters.spentPercentage}
            onValueChange={(value) => handleFilterChange('spentPercentage', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Toutes les utilisations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les utilisations</SelectItem>
              <SelectItem value="under50">Moins de 50%</SelectItem>
              <SelectItem value="between50And75">Entre 50% et 75%</SelectItem>
              <SelectItem value="between75And100">Entre 75% et 100%</SelectItem>
              <SelectItem value="over100">Dépassé (plus de 100%)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bouton Reset Filtres */}
        <div className="flex justify-start">
          <Button
            variant="ghost"
            onClick={resetFilters}
            disabled={!hasActiveFilters || isFetching}
            className="h-10"
            aria-label="Réinitialiser les filtres"
          >
            <FilterX className="mr-2 h-4 w-4" /> Réinitialiser
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          {/* Placeholder pour d'éventuels autres contrôles de la table */}
        </div>
        <DataTableViewOptions table={table} />
      </div>

      {/* DataTable */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Aucun budget trouvé.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      <DataTablePagination table={table} />

      {/* Indicateur de chargement pendant le refetch */}
      {isFetching && !isLoading && (
        <div className="mt-4 flex items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Chargement des budgets...
        </div>
      )}

      {/* Rendu conditionnel du dialogue */}
      <BudgetDialog 
        isOpen={isDialogOpen} 
        onClose={handleCloseDialog} 
        isEditing={!!editingBudget} // Passe l'état d'édition
        budgetToEdit={editingBudget} // Passe le budget à éditer
      />
    </div>
  );
} 