"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "~/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { recurringTransactionFormSchema } from "~/lib/schemas/recurring-transaction-schema";
import { useRecurringTransactionDialogStore, defaultRecurringTransactionFormValues } from "~/stores/useRecurringTransactionDialogStore";
import { Loader2, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { z } from "zod";

// Helper pour formater les dates pour les inputs type="date"
const formatDateForInput = (date: Date | string | null | undefined): string => {
    if (!date) return "";
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return ""; // Vérifier si la date est valide
        // Utiliser toISOString et slice pour obtenir YYYY-MM-DD en UTC
        return d.toISOString().slice(0, 10);
    } catch (e) {
        return "";
    }
};

// Type simple pour les données du formulaire
type FormValues = {
  description: string;
  notes: string;
  amount: number;
  type: 'income' | 'expense';
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval: number;
  startDate: string;
  endDate: string;
  accountId: string;
  categoryId: string | null;
};

export function RecurringTransactionForm() {
    const utils = api.useUtils();
    const { closeDialog, isEditing, dataToEdit } = useRecurringTransactionDialogStore();
    
    // États locaux pour suivre les sélections
    const [selectedAccountId, setSelectedAccountId] = useState<string>("");
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [transactionType, setTransactionType] = useState<'income' | 'expense'>('income');

    // --- Préparation Données (Comptes, Catégories) ---
    const { data: accounts = [], isLoading: isLoadingAccounts } = api.account.getAll.useQuery();
    const { data: categories = [], isLoading: isLoadingCategories } = api.category.getAll.useQuery();

    // --- Initialisation Formulaire ---
    const form = useForm<FormValues>({
        // Ne pas utiliser de resolver pour l'instant pour éviter les problèmes de validation
        // resolver: zodResolver(recurringTransactionFormSchema),
        defaultValues: {
            ...defaultRecurringTransactionFormValues,
            type: 'income',
            categoryId: null,
            endDate: ""
        },
    });

    // --- Pré-remplissage pour l'édition ---
    useEffect(() => {
        if (isEditing && dataToEdit) {
            try {
                // Déterminer le type (revenu/dépense) d'après le signe du montant
                const amount = parseFloat(dataToEdit.amount);
                const isExpense = amount < 0;
                const absAmount = Math.abs(amount);
                
                // Mettre à jour les états locaux
                setTransactionType(isExpense ? 'expense' : 'income');
                
                // ID du compte
                if (dataToEdit.bankAccountId) {
                    setSelectedAccountId(dataToEdit.bankAccountId);
                }
                
                // ID de catégorie 
                setSelectedCategoryId(dataToEdit.categoryId);
                
                // Reset du formulaire avec les données
                form.reset({
                    description: dataToEdit.description,
                    notes: dataToEdit.notes ?? "",
                    // Montant toujours positif dans le formulaire
                    amount: absAmount,
                    type: isExpense ? 'expense' : 'income',
                    frequency: dataToEdit.frequency as any,
                    interval: dataToEdit.interval,
                    // Dates au format YYYY-MM-DD pour input type="date"
                    startDate: formatDateForInput(dataToEdit.startDate),
                    endDate: formatDateForInput(dataToEdit.endDate),
                    accountId: dataToEdit.bankAccountId || "",
                    categoryId: dataToEdit.categoryId || null,
                });
            } catch (e) {
                console.error("Error preparing form data:", e);
                toast.error("Erreur lors du chargement des données");
            }
        } else {
            // Reset pour la création
            setTransactionType('income');
            setSelectedAccountId("");
            setSelectedCategoryId(null);
            form.reset({
                ...defaultRecurringTransactionFormValues,
                type: 'income',
                categoryId: null,
                endDate: ""
            });
        }
    }, [isEditing, dataToEdit, form]);

    // --- Mutations ---
    const createRecurring = api.recurringTransaction.create.useMutation({
        onSuccess: (newItem) => {
            toast.success(`Transaction récurrente "${newItem.description}" créée !`);
            void utils.recurringTransaction.getAll.invalidate();
            closeDialog();
        },
        onError: (error) => toast.error(`Erreur création: ${error.message}`),
    });

    const updateRecurring = api.recurringTransaction.update.useMutation({
        onSuccess: (updatedItem) => {
            toast.success(`Transaction récurrente "${updatedItem.description}" mise à jour !`);
            void utils.recurringTransaction.getAll.invalidate();
            closeDialog();
        },
        onError: (error) => toast.error(`Erreur MàJ: ${error.message}`),
    });

    const mutation = isEditing ? updateRecurring : createRecurring;
    const { isPending } = mutation;

    // --- Soumission ---
    const onSubmit = (data: FormValues) => {
        if (!data.accountId) {
            toast.error("Veuillez sélectionner un compte bancaire");
            return;
        }

        // Calculer le montant final avec le signe approprié
        const finalAmount = data.type === 'expense' ? -Math.abs(data.amount) : Math.abs(data.amount);
        
        // Préparer les données pour l'API
        const apiData = {
            description: data.description,
            notes: data.notes,
            amount: finalAmount,
            frequency: data.frequency,
            interval: data.interval,
            startDate: data.startDate,
            endDate: data.endDate || null,
            categoryId: data.categoryId,
            bankAccountId: data.accountId,
        };
        
        if (isEditing && dataToEdit) {
            updateRecurring.mutate({
                id: dataToEdit.id,
                ...apiData
            });
        } else {
            createRecurring.mutate(apiData);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6 max-h-[70vh] overflow-y-auto p-1 pr-3">
                {/* Toggle Revenu/Dépense */}
                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem className="space-y-1">
                            <FormLabel>Type (pour le signe du montant)</FormLabel>
                            <FormControl>
                                <ToggleGroup
                                    type="single"
                                    variant="outline"
                                    value={field.value}
                                    onValueChange={(value) => {
                                        if (value) {
                                            field.onChange(value);
                                            setTransactionType(value as 'income' | 'expense');
                                        }
                                    }}
                                    className="grid grid-cols-2"
                                >
                                    <ToggleGroupItem value="income" aria-label="Revenu">
                                        <ArrowUpCircle className="mr-2 h-4 w-4 text-green-500" />Revenu
                                    </ToggleGroupItem>
                                    <ToggleGroupItem value="expense" aria-label="Dépense">
                                        <ArrowDownCircle className="mr-2 h-4 w-4 text-red-500" />Dépense
                                    </ToggleGroupItem>
                                </ToggleGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Description */}
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Salaire, Loyer, Netflix..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Montant (toujours positif dans le form) */}
                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Montant</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    placeholder="100"
                                    step="0.01"
                                    min="0"
                                    value={field.value === 0 ? "0" : field.value ? field.value.toString() : ""}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        const parsed = parseFloat(value);
                                        field.onChange(isNaN(parsed) ? 0 : parsed);
                                    }}
                                />
                            </FormControl>
                            <FormDescription>Montant de chaque occurrence.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Compte Bancaire */}
                <FormField
                    control={form.control}
                    name="accountId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Compte Bancaire</FormLabel>
                            <Select
                                value={field.value}
                                onValueChange={(value) => {
                                    field.onChange(value);
                                    setSelectedAccountId(value);
                                }}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner un compte" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {isLoadingAccounts ? (
                                        <SelectItem value="loading" disabled>Chargement...</SelectItem>
                                    ) : accounts?.length ? (
                                        accounts.map((account) => (
                                            <SelectItem key={account.id} value={account.id}>
                                                {account.name}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <SelectItem value="empty" disabled>Aucun compte disponible</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Catégorie (Optionnelle) */}
                <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Catégorie (Optionnelle)</FormLabel>
                            <Select
                                value={field.value || "none"}
                                onValueChange={(value) => {
                                    const newValue = value === "none" ? null : value;
                                    field.onChange(newValue);
                                    setSelectedCategoryId(newValue);
                                }}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner une catégorie" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="none">-- Aucune --</SelectItem>
                                    {isLoadingCategories ? (
                                        <SelectItem value="loading" disabled>Chargement...</SelectItem>
                                    ) : categories?.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* --- Champs Récurrence --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Fréquence */}
                    <FormField
                        control={form.control}
                        name="frequency"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Fréquence</FormLabel>
                                <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="DAILY">Quotidien</SelectItem>
                                        <SelectItem value="WEEKLY">Hebdomadaire</SelectItem>
                                        <SelectItem value="MONTHLY">Mensuel</SelectItem>
                                        <SelectItem value="YEARLY">Annuel</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Intervalle */}
                    <FormField
                        control={form.control}
                        name="interval"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Intervalle</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={field.value || "1"}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            const parsed = parseInt(value, 10);
                                            field.onChange(isNaN(parsed) ? 1 : parsed);
                                        }}
                                    />
                                </FormControl>
                                <FormDescription>Ex: 1 = chaque mois, 2 = tous les 2 mois</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Date de Début */}
                    <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Date de Début</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Date de Fin (Optionnelle) */}
                    <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Date de Fin (Optionnelle)</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Notes */}
                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Notes (Optionnel)</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Ajouter une note..."
                                    {...field}
                                    value={field.value ?? ''}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Boutons d'action */}
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={closeDialog} disabled={isPending}>
                        Annuler
                    </Button>
                    <Button type="submit" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditing ? "Mettre à jour" : "Créer la récurrence"}
                    </Button>
                </div>
            </form>
        </Form>
    );
} 