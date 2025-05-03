"use client";

import { useState } from "react";
import { type AppRouter } from "@/server/api/root";
import { type inferRouterOutputs } from "@trpc/server";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BudgetDialog } from "@/components/budgets/budget-dialog";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { BudgetForm } from "@/components/budgets/budget-form";

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
  const _router = useRouter();
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

  // Fonction utilitaire pour formater les montants en euros
  const formatAmount = (amount: number | string | null | undefined) => {
    if (amount === null || amount === undefined) {
      return "N/A";
    }
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(numAmount);
  };

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
  const _resetFilters = () => {
    setFilters({
      period: 'all',
      spentPercentage: 'all',
    });
  };

  // Vérifie s'il y a des filtres actifs
  const _hasActiveFilters = 
    (filters.period && filters.period !== 'all') || 
    (filters.spentPercentage && filters.spentPercentage !== 'all');

  // Fonction pour ouvrir le dialogue de création
  const _handleNewBudget = () => {
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
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Rechercher un budget..."
            value={filters.period}
            onChange={(e) => handleFilterChange('period', e.target.value)}
            className="w-full sm:w-[250px]"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={filters.period} onValueChange={(value) => handleFilterChange('period', value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrer par période" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Période</SelectLabel>
                <SelectItem value="all">Toutes les périodes</SelectItem>
                <SelectItem value="MONTHLY">Mensuel</SelectItem>
                <SelectItem value="YEARLY">Annuel</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select value={filters.spentPercentage} onValueChange={(value) => handleFilterChange('spentPercentage', value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrer par dépenses" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Dépenses</SelectLabel>
                <SelectItem value="all">Toutes les dépenses</SelectItem>
                <SelectItem value="under50">Moins de 50%</SelectItem>
                <SelectItem value="between50And75">Entre 50% et 75%</SelectItem>
                <SelectItem value="between75And100">Entre 75% et 100%</SelectItem>
                <SelectItem value="over100">Dépassé (plus de 100%)</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Sheet>
            <SheetTrigger asChild>
              <Button>Nouveau Budget</Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-xl md:max-w-2xl lg:max-w-3xl">
              <SheetHeader>
                <SheetTitle>Créer un nouveau budget</SheetTitle>
                <SheetDescription>
                  Définissez un budget pour mieux gérer vos dépenses
                </SheetDescription>
              </SheetHeader>
              <BudgetForm initialData={null} onClose={() => {
                void utils.budget.getAll.invalidate();
              }} />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredBudgets.length > 0 ? (
          filteredBudgets.map((budget) => {
            const spentPercentage = (budget.spentAmount / budget.amount) * 100;
            const isOverBudget = spentPercentage > 100;

            return (
              <Card key={budget.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{budget.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {budget.period === "MONTHLY"
                          ? "Budget mensuel"
                          : "Budget annuel"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatAmount(budget.spentAmount)} /{" "}
                        {formatAmount(budget.amount)}
                      </p>
                      <p
                        className={`text-xs ${
                          isOverBudget ? "text-destructive" : "text-muted-foreground"
                        }`}
                      >
                        {isOverBudget
                          ? `Dépassement de ${formatAmount(
                              budget.spentAmount - budget.amount
                            )}`
                          : `Reste ${formatAmount(
                              budget.amount - budget.spentAmount
                            )}`}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <Progress
                    value={Math.min(spentPercentage, 100)}
                    className={`h-2 ${
                      isOverBudget ? "bg-destructive/20" : ""
                    }`}
                    indicatorClassName={isOverBudget ? "bg-destructive" : ""}
                  />
                  <p className="mt-1 text-xs text-right text-muted-foreground">
                    {spentPercentage.toFixed(0)}%
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => handleEditBudget(budget)}>
                    Voir les détails
                  </Button>
                </CardFooter>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full flex items-center justify-center rounded-lg border border-dashed p-8">
            <div className="flex flex-col items-center text-center">
              <h3 className="mt-4 text-lg font-semibold">
                Aucun budget trouvé
              </h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground">
                Essayez de modifier vos filtres ou créez un nouveau budget.
              </p>
              <Sheet>
                <SheetTrigger asChild>
                  <Button>Créer un budget</Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Créer un nouveau budget</SheetTitle>
                    <SheetDescription>
                      Définissez un budget pour mieux gérer vos dépenses
                    </SheetDescription>
                  </SheetHeader>
                  <BudgetForm initialData={null} onClose={() => {
                    void utils.budget.getAll.invalidate();
                  }} />
                </SheetContent>
              </Sheet>
            </div>
          </div>
        )}
      </div>

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
        budgetToEdit={editingBudget ? {
          id: editingBudget.id,
          name: editingBudget.name,
          amount: parseFloat(editingBudget.amount.toString()),
          period: editingBudget.period as "MONTHLY" | "YEARLY",
          budgetsToCategories: editingBudget.budgetsToCategories
        } : undefined} // Convertit le budget à éditer dans le bon format
      />
    </div>
  );
} 