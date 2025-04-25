"use client";

import React, { useEffect } from 'react';
import { Search, X, CalendarIcon } from 'lucide-react';
import { api } from "@/trpc/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { DateRange } from "react-day-picker";

export function TransactionFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  // États pour les filtres
  const [query, setQuery] = React.useState('');
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();
  const [type, setType] = React.useState<string>('all');
  const [accountId, setAccountId] = React.useState<string>('all');
  const [categoryId, setCategoryId] = React.useState<string>('all');

  // Charger les comptes et catégories via tRPC
  const accountsQuery = api.bankAccount.getAll.useQuery();
  const categoriesQuery = api.category.getAll.useQuery();

  // Lire les paramètres d'URL au chargement initial
  useEffect(() => {
    // Lecture des paramètres de recherche
    const urlQuery = searchParams.get('q') || '';
    const urlType = searchParams.get('type') || 'all';
    const urlAccountId = searchParams.get('accountId') || 'all';
    const urlCategoryId = searchParams.get('categoryId') || 'all';
    
    // Pour les dates, il faut les convertir en objets Date
    const urlFromDate = searchParams.get('from');
    const urlToDate = searchParams.get('to');
    
    // Initialiser les états avec les valeurs de l'URL
    setQuery(urlQuery);
    setType(urlType);
    setAccountId(urlAccountId);
    setCategoryId(urlCategoryId);
    
    // Créer un objet DateRange seulement si au moins une des dates existe
    if (urlFromDate || urlToDate) {
      const fromDate = urlFromDate ? new Date(urlFromDate) : undefined;
      const toDate = urlToDate ? new Date(urlToDate) : undefined;
      
      setDateRange({ 
        from: fromDate, 
        to: toDate 
      });
    }
  }, [searchParams]); // Ajout de searchParams comme dépendance

  // Fonction pour mettre à jour l'URL avec les paramètres actuels
  const updateUrlParams = (overrides?: {
    query?: string;
    dateRange?: DateRange | undefined;
    type?: string;
    accountId?: string;
    categoryId?: string;
  }) => {
    // Créer une nouvelle instance de URLSearchParams
    const params = new URLSearchParams(searchParams.toString());
    
    // Utiliser les valeurs d'override ou les valeurs d'état actuelles
    const currentQuery = overrides?.query !== undefined ? overrides.query : query;
    const currentDateRange = overrides?.dateRange !== undefined ? overrides.dateRange : dateRange;
    const currentType = overrides?.type !== undefined ? overrides.type : type;
    const currentAccountId = overrides?.accountId !== undefined ? overrides.accountId : accountId;
    const currentCategoryId = overrides?.categoryId !== undefined ? overrides.categoryId : categoryId;
    
    // Mise à jour du paramètre de recherche
    if (currentQuery && currentQuery.trim() !== '') {
      params.set('q', currentQuery);
    } else {
      params.delete('q');
    }
    
    // Mise à jour des dates
    if (currentDateRange?.from) {
      const fromDate = format(currentDateRange.from, 'yyyy-MM-dd');
      params.set('from', fromDate);
    } else {
      params.delete('from');
    }
    
    if (currentDateRange?.to) {
      const toDate = format(currentDateRange.to, 'yyyy-MM-dd');
      params.set('to', toDate);
    } else {
      params.delete('to');
    }
    
    // Mise à jour du type
    if (currentType && currentType !== 'all') {
      params.set('type', currentType);
    } else {
      params.delete('type');
    }
    
    // Mise à jour du compte
    if (currentAccountId && currentAccountId !== 'all') {
      params.set('accountId', currentAccountId);
    } else {
      params.delete('accountId');
    }
    
    // Mise à jour de la catégorie
    if (currentCategoryId && currentCategoryId !== 'all') {
      params.set('categoryId', currentCategoryId);
    } else {
      params.delete('categoryId');
    }
    
    // Mettre à jour l'URL sans rechargement
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Gestionnaire pour la modification de la recherche
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    // Attendre un instant avant de mettre à jour l'URL pour éviter trop de mises à jour
    setTimeout(() => updateUrlParams({ query: newValue }), 300);
  };

  // Gestionnaire pour la modification des dates
  const handleDateRangeChange = (newRange: DateRange | undefined) => {
    setDateRange(newRange);
    // Mettre à jour l'URL immédiatement
    setTimeout(() => {
      updateUrlParams({ dateRange: newRange });
    }, 100);
  };

  // Gestionnaire pour la modification du type
  const handleTypeChange = (newType: string) => {
    setType(newType);
    updateUrlParams({ type: newType });
  };

  // Gestionnaire pour la modification du compte
  const handleAccountChange = (newAccountId: string) => {
    setAccountId(newAccountId);
    updateUrlParams({ accountId: newAccountId });
  };

  // Gestionnaire pour la modification de la catégorie
  const handleCategoryChange = (newCategoryId: string) => {
    setCategoryId(newCategoryId);
    updateUrlParams({ categoryId: newCategoryId });
  };

  // Gestionnaire pour la réinitialisation des filtres
  const handleReset = () => {
    setQuery('');
    setDateRange(undefined);
    setType('all');
    setAccountId('all');
    setCategoryId('all');
    
    // Réinitialiser l'URL
    router.replace(pathname, { scroll: false });
  };

  // Gestionnaire pour effacer la sélection de date
  const handleClearDateRange = () => {
    setDateRange(undefined);
    setTimeout(() => updateUrlParams({ dateRange: undefined }), 100);
  };

  return (
    <Card className="mb-4">
      <CardContent className="pt-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Recherche Texte */}
          <div className="relative w-full sm:w-auto sm:flex-grow-0 sm:min-w-[250px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par description..."
              value={query}
              onChange={handleQueryChange}
              className="h-9 pl-8"
            />
          </div>

          {/* Plage de Dates personnalisée avec contrôle direct */}
          <div className="grid gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "h-9 w-[230px] justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                        {format(dateRange.to, "dd/MM/yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy")
                    )
                  ) : (
                    <span>Choisir une plage</span>
                  )}
                  {dateRange && (
                    <Button
                      variant="ghost"
                      className="ml-auto h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearDateRange();
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={handleDateRangeChange}
                  numberOfMonths={2}
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Compte */}
          <Select 
            value={accountId} 
            onValueChange={handleAccountChange}
          >
            <SelectTrigger className="h-9 w-full sm:w-auto sm:min-w-[150px]">
              <SelectValue placeholder="Compte" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les comptes</SelectItem>
              {accountsQuery.data?.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  <div className="flex items-center">
                    {account.icon && <span className="mr-1">{account.icon}</span>}
                    <span
                      className={cn("mr-2 inline-block h-3 w-3 rounded-full", 
                        !account.color && "bg-gray-300")}
                      style={{ backgroundColor: account.color || undefined }}
                      aria-hidden="true"
                    />
                    {account.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Catégorie */}
          <Select 
            value={categoryId} 
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger className="h-9 w-full sm:w-auto sm:min-w-[150px]">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              <SelectItem value="none">-- Aucune --</SelectItem>
              {categoriesQuery.data?.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center">
                    <span
                      className={cn("mr-2 inline-block h-3 w-3 rounded-full", 
                        !category.color && "bg-gray-300")}
                      style={{ backgroundColor: category.color || undefined }}
                      aria-hidden="true"
                    />
                    {category.icon && <span className="mr-1">{category.icon}</span>}
                    {category.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Type */}
          <Select 
            value={type} 
            onValueChange={handleTypeChange}
          >
            <SelectTrigger className="h-9 w-full sm:w-auto sm:min-w-[130px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="income">Revenus</SelectItem>
              <SelectItem value="expense">Dépenses</SelectItem>
            </SelectContent>
          </Select>

          {/* Bouton Réinitialiser */}
          <Button variant="ghost" onClick={handleReset} className="h-9 px-2 ml-auto lg:px-3">
            Réinitialiser
            <X className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 