"use client";

import React from 'react';
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { useRecurringTransactionDialogStore } from "@/stores/useRecurringTransactionDialogStore";
import { Loader2, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ComboboxField } from "@/components/ui/combobox-rhf";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { recurringTransactionFormSchema, type RecurringTransactionFormValues } from "@/lib/validations/recurring-transaction";

export function RecurringTransactionForm() {
    const utils = api.useUtils();
    const { closeDialog } = useRecurringTransactionDialogStore();
    
    // --- Préparation Données (Comptes, Catégories) ---
    const { data: bankAccounts = [] } = api.bankAccount.getAll.useQuery();
    const { data: categories = [] } = api.category.getAll.useQuery();

    // --- Mutations ---
    const { mutate: createRecurringTransaction, isPending: isCreating } =
      api.recurringTransaction.create.useMutation({
        onSuccess: () => {
          utils.recurringTransaction.getAll.invalidate();
          toast.success("Transaction récurrente créée avec succès !");
          form.reset();
        },
        onError: (error) => {
          toast.error(
            error.data?.zodError?.fieldErrors.content?.[0] ??
              "Une erreur est survenue lors de la création de la transaction récurrente."
          );
        },
      });

    // --- Form ---
    const form = useForm<RecurringTransactionFormValues>({
        resolver: zodResolver(recurringTransactionFormSchema),
        defaultValues: {
            description: "",
            notes: "",
            amount: 0,
            type: "expense",
            frequency: "MONTHLY",
            interval: 1,
            startDate: new Date().toISOString().split("T")[0],
            endDate: "",
            bankAccountId: "",
            categoryId: null,
            isSubscription: false,
        },
    });

    // --- Soumission ---
    const onSubmit = (data: RecurringTransactionFormValues) => {
        if (!data.bankAccountId) {
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
            bankAccountId: data.bankAccountId,
            isSubscription: data.isSubscription,
        };
        
        createRecurringTransaction(apiData);
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
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Compte Bancaire - Remplacé par ComboboxField */}
                <FormField
                    control={form.control}
                    name="bankAccountId"
                    render={({ field: _field }) => (
                        <FormItem>
                            <FormLabel>Compte Bancaire</FormLabel>
                            <ComboboxField
                                control={form.control}
                                name="bankAccountId"
                                label=""
                                options={bankAccounts?.map(acc => ({
                                    value: acc.id,
                                    label: acc.name,
                                    icon: acc.icon,
                                    color: acc.color,
                                })) ?? []}
                                placeholder="Sélectionner un compte..."
                                searchPlaceholder="Rechercher un compte..."
                                emptyText="Aucun compte trouvé."
                            />
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Catégorie (Optionnelle) */}
                <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field: _field }) => (
                        <FormItem>
                            <FormLabel>Catégorie (Optionnelle)</FormLabel>
                            <Select
                                value={_field.value || "none"}
                                onValueChange={(value) => {
                                    const newValue = value === "none" ? null : value;
                                    _field.onChange(newValue);
                                }}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner une catégorie" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="none">-- Aucune --</SelectItem>
                                    {categories?.map((cat) => (
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

                {/* Abonnement */}
                <FormField
                    control={form.control}
                    name="isSubscription"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <FormLabel>Marquer comme Abonnement ?</FormLabel>
                                <FormDescription>
                                    Cochez si cette transaction représente un abonnement récurrent (ex: Netflix, Spotify...)
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={isCreating}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                {/* Boutons d'action */}
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={closeDialog} disabled={isCreating}>
                        Annuler
                    </Button>
                    <Button type="submit" disabled={isCreating}>
                        {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Créer la récurrence
                    </Button>
                </div>
            </form>
        </Form>
    );
} 