// src/components/budgets/budget-form.tsx
"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
    name: z.string().min(1, "Le nom du budget est requis"),
    amount: z.number().min(0.01, "Le montant doit être positif"),
    period: z.enum(["MONTHLY", "YEARLY"]),
    categoryIds: z.array(z.string()).min(1, "Veuillez sélectionner au moins une catégorie"),
});

type FormValues = z.infer<typeof formSchema>;

export interface BudgetFormData extends FormValues {
    id?: string;
}

interface BudgetFormProps {
    initialData?: BudgetFormData | null;
    onClose: () => void;
}

export function BudgetForm({ initialData = null, onClose }: BudgetFormProps) {
    const utils = api.useUtils();
    const isEditMode = !!initialData?.id;

    // Chargement des catégories
    const { data: categories, isLoading: isLoadingCategories } = api.category.getAll.useQuery();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialData?.name ?? "",
            amount: initialData?.amount ?? 0,
            period: initialData?.period ?? "MONTHLY",
            categoryIds: initialData?.categoryIds ?? [],
        },
    });

    // Mutation pour créer un budget
    const createBudget = api.budget.create.useMutation({
        onSuccess: () => {
            toast.success("Budget créé avec succès !");
            void utils.budget.getAll.invalidate();
            onClose();
        },
        onError: (error) => {
            toast.error(`Erreur lors de la création : ${error.message}`);
        },
    });

    // Mutation pour mettre à jour un budget
    const updateBudget = api.budget.update.useMutation({
        onSuccess: () => {
            toast.success("Budget mis à jour avec succès !");
            void utils.budget.getAll.invalidate();
            onClose();
        },
        onError: (error) => {
            toast.error(`Erreur lors de la mise à jour : ${error.message}`);
        },
    });

    // État d'attente basé sur les deux mutations
    const isPending = createBudget.isPending || updateBudget.isPending;

    // Soumission du formulaire
    const onSubmit = (data: FormValues) => {
        if (isEditMode && initialData?.id) {
            updateBudget.mutate({
                id: initialData.id,
                ...data,
            });
        } else {
            createBudget.mutate(data);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                {/* Nom du budget */}
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nom du budget</FormLabel>
                            <FormControl>
                                <Input 
                                    {...field}
                                    placeholder="Ex: Courses mensuelles" 
                                    disabled={isPending} 
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Montant alloué */}
                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Montant alloué</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    type="number"
                                    placeholder="Ex: 150"
                                    step="0.01"
                                    min="0"
                                    disabled={isPending}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                            </FormControl>
                            <FormDescription>
                                Montant maximum que vous souhaitez dépenser
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Période */}
                <FormField
                    control={form.control}
                    name="period"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Période</FormLabel>
                            <FormControl>
                                <select 
                                    {...field}
                                    className="w-full p-2 border rounded"
                                    disabled={isPending}
                                >
                                    <option value="MONTHLY">Mensuel</option>
                                    <option value="YEARLY">Annuel</option>
                                </select>
                            </FormControl>
                            <FormDescription>
                                À quelle fréquence ce budget se renouvelle-t-il ?
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Catégories */}
                <FormField
                    control={form.control}
                    name="categoryIds"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Catégories</FormLabel>
                            {isLoadingCategories ? (
                                <div className="py-2 text-muted-foreground">Chargement...</div>
                            ) : !categories || categories.length === 0 ? (
                                <div className="py-2 text-muted-foreground">Aucune catégorie.</div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 rounded-md border p-4 max-h-60 overflow-y-auto">
                                    {categories.map((category) => (
                                        <FormItem
                                            key={category.id}
                                            className="flex flex-row items-start space-x-3 space-y-0"
                                        >
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value?.includes(category.id)}
                                                    onCheckedChange={(checked: boolean) => {
                                                        const currentValue = field.value ?? [];
                                                        if (checked) {
                                                            field.onChange([...currentValue, category.id]);
                                                        } else {
                                                            field.onChange(currentValue.filter((id) => id !== category.id));
                                                        }
                                                    }}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel className="font-normal cursor-pointer">
                                                    {category.icon && <span className="mr-2">{category.icon}</span>}
                                                    {category.name}
                                                </FormLabel>
                                            </div>
                                        </FormItem>
                                    ))}
                                </div>
                            )}
                            <FormDescription>
                                Sélectionnez les catégories de dépenses à suivre
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Boutons */}
                <div className="flex justify-end gap-2 pt-4">
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={onClose}
                        disabled={isPending}
                    >
                        Annuler
                    </Button>
                    <Button 
                        type="submit"
                        disabled={isPending}
                    >
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditMode ? "Mettre à jour" : "Créer le budget"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}