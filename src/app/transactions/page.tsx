"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { PlusCircle, FilterX, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { TransactionsDataTable } from "@/components/transactions/transactions-data-table";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import type { TransactionWithRelations } from "@/lib/types";
import { useTransactionDialogStore } from "@/stores/useTransactionDialogStore";
import { useSearchParams } from "next/navigation";

// Structure pour les filtres
interface TransactionFilters {
    dateFrom?: Date;
    dateTo?: Date;
    categoryId?: string; // 'all', 'none', ou ID de catégorie
    bankAccountId?: string; // 'all' ou ID de compte
}

export default function TransactionsPage() {
  // Utiliser searchParams pour lire les paramètres d'URL
  const searchParams = useSearchParams();
  
  // États pour le dialogue/édition
  const { openDialog } = useTransactionDialogStore();

  // Créer l'objet filterInput basé sur les paramètres d'URL
  const filterInput = React.useMemo(() => {
    const input: Record<string, any> = {};
    
    // Recherche textuelle
    const query = searchParams.get('q');
    if (query) {
      input.description = query; // Adapter au nom de champ attendu par l'API
    }
    
    // Dates
    const fromDate = searchParams.get('from');
    if (fromDate) {
      input.dateFrom = new Date(fromDate);
    }
    
    const toDate = searchParams.get('to');
    if (toDate) {
      input.dateTo = new Date(toDate);
    }
    
    // Type (revenus/dépenses)
    const type = searchParams.get('type');
    if (type === 'income') {
      input.type = 'income';
    } else if (type === 'expense') {
      input.type = 'expense';
    }
    
    // Compte bancaire
    const accountId = searchParams.get('accountId');
    if (accountId && accountId !== 'all') {
      input.bankAccountId = accountId;
    }
    
    // Catégorie
    const categoryId = searchParams.get('categoryId');
    if (categoryId) {
      if (categoryId === 'none') {
        input.categoryId = 'none';
      } else if (categoryId !== 'all') {
        input.categoryId = categoryId;
      }
    }
    
    return input;
  }, [searchParams]); // Recalculer quand les searchParams changent
  
  // Requête tRPC pour les transactions avec les filtres de l'URL
  const transactionsQuery = api.transaction.getAll.useQuery(filterInput, {
    // keepPreviousData peut être utile pour éviter les flashs pendant le chargement
    // keepPreviousData: true,
  });

  // Requête tRPC pour les catégories (pour les références)
  const categoriesQuery = api.category.getAll.useQuery();
  // Requête tRPC pour les comptes bancaires (pour les références)
  const bankAccountsQuery = api.bankAccount.getAll.useQuery();

  // Handlers pour ouvrir le dialogue
  const handleOpenAddDialog = () => {
    openDialog(undefined, { showAddAndNew: false });
  };

  // Calcul de l'état de chargement global
  const isLoading = transactionsQuery.isLoading ?? categoriesQuery.isLoading ?? bankAccountsQuery.isLoading;
  
  // Vérifier si des filtres sont actifs (pour l'UI)
  const hasActiveFilters = searchParams.toString() !== '';

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

      {/* Composant de Filtres */}
      <TransactionFilters />

      {/* Affichage de la DataTable */}
      {transactionsQuery.data?.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-md border text-muted-foreground">
          Aucune transaction ne correspond à ces critères.
        </div>
      ) : (
        <TransactionsDataTable 
          transactions={transactionsQuery.data as unknown as TransactionWithRelations[]} 
        />
      )}
      
       {/* Indicateur de chargement pendant le refetch */}
       {transactionsQuery.isFetching && !isLoading && (
            <div className="mt-4 flex items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Chargement des transactions...
            </div>
       )}
    </div>
  );
} 