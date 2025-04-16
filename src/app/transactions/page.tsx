"use client";

import React, { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { PlusCircle, FilterX, Loader2 } from "lucide-react";
import { Skeleton } from "~/components/ui/skeleton";
import { TransactionForm } from "~/components/transactions/transaction-form";
import { DatePicker } from "~/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { toast } from "sonner";
import { TransactionsList, type Transaction } from "~/components/transactions/transactions-list";
import type { TransactionData } from "~/components/transactions/transaction-form";
import { Dialog, DialogContent } from "~/components/ui/dialog";

// Structure pour les filtres
interface TransactionFilters {
    dateFrom?: Date;
    dateTo?: Date;
    categoryId?: string; // 'all', 'none', ou ID de catégorie
    bankAccountId?: string; // 'all' ou ID de compte
}

export default function TransactionsPage() {
  // États pour le dialogue/édition
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Helper pour préparer les données de la transaction pour le formulaire
  const prepareTransactionData = (transaction: Transaction): TransactionData => ({
    id: transaction.id,
    amount: Number(transaction.amount),
    description: transaction.description,
    date: new Date(transaction.date),
    categoryId: transaction.categoryId,
    bankAccountId: transaction.bankAccountId,
  });

  // État pour les filtres
  const [filters, setFilters] = useState<TransactionFilters>({
      categoryId: 'all', // Valeur initiale pour afficher 'Toutes les catégories'
      bankAccountId: 'all' // Valeur initiale pour afficher 'Tous les comptes'
  });

  // Requête tRPC pour les transactions, passe les filtres
  const transactionsQuery = api.transaction.getAll.useQuery({
        ...filters,
        categoryId: filters.categoryId === 'all' ? undefined : filters.categoryId, // Garde 'none' si sélectionné
        bankAccountId: filters.bankAccountId === 'all' ? undefined : filters.bankAccountId, // Envoie undefined si 'all'
  }, {
      // Optionnel: garder les données précédentes pendant le chargement pour éviter les flashs
      // keepPreviousData: true,
  });

  // Requête tRPC pour les catégories (pour le filtre)
  const categoriesQuery = api.category.getAll.useQuery();
  // Requête tRPC pour les comptes bancaires (pour le filtre)
  const bankAccountsQuery = api.bankAccount.getAll.useQuery();

  // Gestionnaire de changement de filtre
  const handleFilterChange = <K extends keyof TransactionFilters>(
    key: K,
    value: TransactionFilters[K] | string // Accepte string pour les Selects
  ) => {
    setFilters((prev) => ({
      ...prev,
      // Si la valeur est vide ou 'all', on met undefined pour potentiellement l'ignorer ou gérer le cas 'all'/'none' spécifiquement
      [key]: value === "" ? undefined : value,
    }));
     // transactionsQuery.refetch(); // useQuery refetch automatiquement si l'input change
  };

   // Reset des filtres
   const resetFilters = () => {
       setFilters({
           dateFrom: undefined,
           dateTo: undefined,
           categoryId: 'all',
           bankAccountId: 'all',
       });
   };

  // Handlers pour ouvrir le dialogue
  const handleOpenAddDialog = () => {
    setEditingTransaction(null);
    setIsFormOpen(true);
  };
  const handleOpenEditDialog = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsFormOpen(true);
  };

  // Calcul de l'état de chargement global
  const isLoading = transactionsQuery.isLoading ?? categoriesQuery.isLoading ?? bankAccountsQuery.isLoading;
  const hasActiveFilters = filters.dateFrom ?? filters.dateTo ?? (filters.categoryId && filters.categoryId !== 'all') ?? (filters.bankAccountId && filters.bankAccountId !== 'all');

  // Affichage pendant le chargement (ajuste si nécessaire)
  if (isLoading && !transactionsQuery.data) { // Affiche skeleton seulement au premier chargement
    return (
      <div className="space-y-4 p-4 md:p-6">
        <h1 className="text-2xl font-semibold">Transactions</h1>
        {/* Skeletons pour les filtres */}
        <div className="grid grid-cols-1 gap-4 rounded-md border p-4 md:grid-cols-4">
           <Skeleton className="h-10 w-full" />
           <Skeleton className="h-10 w-full" />
           <Skeleton className="h-10 w-full" />
           <Skeleton className="h-10 w-full" />
        </div>
         {/* Skeleton pour la table */}
        <Skeleton className="h-60 w-full rounded-md border" />
      </div>
    );
  }

  // Gestion de l'erreur
  if (transactionsQuery.error) {
    return <div className="p-4 text-red-600 md:p-6">Erreur: {transactionsQuery.error.message}</div>;
  }
  // Erreurs potentielles sur les autres requêtes (catégories, comptes)
  if (categoriesQuery.error) {
    // Affiche un message mais continue si possible
    console.error("Erreur chargement catégories:", categoriesQuery.error.message);
    toast.error("Erreur lors du chargement des catégories pour le filtre.");
  }
  if (bankAccountsQuery.error) {
    console.error("Erreur chargement comptes:", bankAccountsQuery.error.message);
    toast.error("Erreur lors du chargement des comptes pour le filtre.");
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-semibold">Transactions</h1>
          <p className="text-muted-foreground">Gérez et analysez vos transactions</p>
        </div>
        <Button onClick={handleOpenAddDialog}>
          <PlusCircle className="mr-2 h-4 w-4" /> Ajouter
        </Button>
      </div>

      {/* Zone des Filtres */}
      <div className="grid grid-cols-1 gap-x-4 gap-y-2 rounded-md border p-4 md:grid-cols-4 lg:grid-cols-5">
         {/* Date Début */}
        <div className="space-y-1">
            <label className="text-sm font-medium">Date de début</label>
            <DatePicker date={filters.dateFrom} setDate={(d) => handleFilterChange('dateFrom', d)} />
        </div>
         {/* Date Fin */}
        <div className="space-y-1">
             <label className="text-sm font-medium">Date de fin</label>
             <DatePicker date={filters.dateTo} setDate={(d) => handleFilterChange('dateTo', d)} />
         </div>
        {/* Catégorie */}
        <div className="space-y-1">
           <label className="text-sm font-medium">Catégorie</label>
            <Select
                value={filters.categoryId}
                onValueChange={(value) => handleFilterChange('categoryId', value)}
                disabled={categoriesQuery.isLoading || !categoriesQuery.data}
            >
                <SelectTrigger>
                    <SelectValue placeholder="Chargement..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    <SelectItem value="none">-- Aucune --</SelectItem>
                    {categoriesQuery.data?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center">
                                <span
                                    className="mr-2 inline-block h-3 w-3 rounded-full"
                                    style={{ backgroundColor: cat.color ?? '#ccc' }} // Fallback gris
                                    aria-hidden="true"
                                />
                                {cat.icon && <span className="mr-1">{cat.icon}</span>}
                                <span>{cat.name}</span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        {/* Compte Bancaire */}
        <div className="space-y-1">
           <label className="text-sm font-medium">Compte Bancaire</label>
            <Select
                value={filters.bankAccountId}
                onValueChange={(value) => handleFilterChange('bankAccountId', value)}
                disabled={bankAccountsQuery.isLoading || !bankAccountsQuery.data}
            >
                <SelectTrigger>
                    <SelectValue placeholder="Chargement..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Tous les comptes</SelectItem>
                    {bankAccountsQuery.data?.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
         {/* Bouton Reset Filtres */}
        <div className="flex items-end justify-center md:justify-start lg:justify-center">
            <Button
                variant="ghost"
                onClick={resetFilters}
                disabled={!hasActiveFilters || transactionsQuery.isFetching} // Désactivé si aucun filtre ou si chargement
                className="w-full md:w-auto"
                aria-label="Réinitialiser les filtres"
            >
                <FilterX className="mr-2 h-4 w-4" /> Réinitialiser
            </Button>
        </div>
      </div>

      {/* Affichage de la liste */}
      <div className="rounded-md border">
        {transactionsQuery.data?.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            Aucune transaction ne correspond à ces critères.
          </div>
        ) : (
          <TransactionsList 
            transactions={transactionsQuery.data ?? []}
            onEdit={handleOpenEditDialog}
          />
        )}
      </div>
      
       {/* Indicateur de chargement pendant le refetch */}
       {transactionsQuery.isFetching && !isLoading && (
            <div className="mt-4 flex items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Chargement des transactions...
            </div>
       )}

      {/* Dialog pour AJOUTER ou MODIFIER la transaction */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <TransactionForm
            key={editingTransaction ? editingTransaction.id : 'create'}
            transaction={editingTransaction ? prepareTransactionData(editingTransaction) : undefined}
            mode={editingTransaction ? "edit" : "create"}
            onSuccess={() => {
              setIsFormOpen(false);
              setEditingTransaction(null);
            }}
            isDialogOpen={isFormOpen}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
} 