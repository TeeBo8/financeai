// src/components/budgets/budget-form.tsx
"use client";

import React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"
import { DatePicker } from "~/components/ui/date-picker"; // Assurez-vous que le chemin est correct
import { api } from "~/trpc/react";
import { toast } from "sonner"; // ou use-toast

// Réutiliser le type Budget défini dans BudgetList ou le redéfinir/importer
// Pour l'instant, on définit une interface locale pour les props
export interface BudgetFormData {
    id?: string; // ID est optionnel, présent seulement en mode édition
    name: string;
    amount: number;
    period: 'monthly' | 'weekly' | 'custom';
    startDate: Date;
    endDate: Date | null;
    categoryId: string | null;
    // On pourrait inclure d'autres champs si nécessaire (createdAt, updatedAt...)
    // mais le formulaire n'a besoin que de ceux modifiables.
}


// Schéma Zod pour la validation (identique au schéma de base + id optionnel)
// On peut utiliser le schéma de l'input de la mutation tRPC si on veut être 100% synchro
const budgetFormSchema = z.object({
    // PAS DE CHAMP 'id' ICI - il n'est pas modifié via le formulaire
    name: z.string().min(1, "Le nom est requis"),
    amount: z.coerce.number().positive("Le montant doit être positif"),
    period: z.enum(["monthly", "weekly", "custom"], { required_error: "La période est requise." }),
    startDate: z.date({ required_error: "La date de début est requise." }),
    endDate: z.date().nullable(),
    categoryId: z.string().nullable(),
}).refine(data => !data.endDate || !data.startDate || data.endDate >= data.startDate, {
    message: "La date de fin ne peut pas être avant la date de début.",
    path: ["endDate"], // Applique l'erreur au champ endDate
});


type BudgetFormValues = z.infer<typeof budgetFormSchema>;

// Type étendu pour inclure l'id uniquement pour les defaultValues
type BudgetFormValuesWithId = BudgetFormValues & { id?: string };

interface BudgetFormProps {
    initialData?: BudgetFormData | null; // Données pour pré-remplir (mode édition)
    onFormSubmit?: () => void;      // Callback pour fermer le Dialog/Modal
}

// Helper pour calculer la couleur de contraste
const getContrastYIQ = (hexColor: string): string => {
  if (!hexColor) return '#000000';
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#000000' : '#FFFFFF';
};

export function BudgetForm({ initialData = null, onFormSubmit }: BudgetFormProps) {
    const utils = api.useUtils();
    const isEditMode = !!initialData; // Détermine si on est en mode édition
    
    // Récupérer les catégories pour le Select
    const { data: categories, isLoading: _isLoadingCategories } = api.category.getAll.useQuery();

    // Créer les defaultValues avec l'id pour stocker l'id, même s'il n'est pas dans le schéma Zod
    const defaultValues: BudgetFormValuesWithId = {
        name: initialData?.name ?? "",
        amount: initialData?.amount ?? 0,
        period: initialData?.period ?? "monthly", // Valeur par défaut au lieu de undefined
        startDate: initialData?.startDate ? new Date(initialData.startDate) : new Date(),
        endDate: initialData?.endDate ? new Date(initialData.endDate) : null,
        categoryId: initialData?.categoryId ?? null,
    };
    
    // Stocker l'id séparément pour la mise à jour
    if (initialData?.id) {
        defaultValues.id = initialData.id;
    }

    const form = useForm<BudgetFormValues>({
        resolver: zodResolver(budgetFormSchema),
        // Utiliser les defaultValues si en mode édition
        defaultValues,
    });

    // Mutation pour la création
    const createBudget = api.budget.create.useMutation({
        onSuccess: () => {
            toast.success("Budget créé avec succès !");
            void utils.budget.getAll.invalidate();
            form.reset(); // Réinitialise le formulaire
            onFormSubmit?.(); // Ferme la dialogue
        },
        onError: (error) => {
            toast.error(`Erreur création: ${error.message}`);
        }
    });

    // Mutation pour la modification
    const updateBudget = api.budget.update.useMutation({
         onSuccess: (_data) => {
            toast.success(`Budget modifié avec succès !`);
            void utils.budget.getAll.invalidate();
            form.reset(); // Réinitialise aussi après modification
            onFormSubmit?.(); // Ferme la dialogue
        },
        onError: (error) => {
            toast.error(`Erreur modification: ${error.message}`);
        }
    });

    // Détermine quelle mutation utiliser et le statut de chargement/pending
    const mutation = isEditMode ? updateBudget : createBudget;
    const { isPending } = mutation; // Utilise isPending

    // Fonction de soumission
    function onSubmit(data: BudgetFormValues) {
        // Nettoyer les données en supprimant les espaces inutiles
        const cleanedData = {
            ...data,
            name: data.name.trim()
        };
        
        if (isEditMode && initialData?.id) {
            // Mode édition : appeler update avec l'ID et les données
            updateBudget.mutate({
                id: initialData.id, // Utilise l'ID stocké des initialData
                ...cleanedData // Passe les données nettoyées
            });
        } else {
            // Mode création : appeler create (sans ID)
            createBudget.mutate(cleanedData);
        }
    }

    return (
        <Form {...form}>
            {/* Utilise la mutation isPending pour le statut */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Champs du formulaire (Name, Amount, Period, StartDate, EndDate, Category) */}
                {/* Ils sont identiques pour create et edit */}

                 {/* Nom */}
                 <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nom du budget</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Épargne Vacances" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Montant */}
                 <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Montant Cible (€)</FormLabel>
                            <FormControl>
                                <Input type="number" step="0.01" placeholder="500" {...field} />
                            </FormControl>
                             <FormDescription>
                                Le montant total alloué pour ce budget pendant sa période.
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
                             <Select onValueChange={field.onChange} defaultValue={field.value || "monthly"}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choisir une période" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="monthly">Mensuel</SelectItem>
                                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                                    <SelectItem value="custom">Personnalisé</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                    />

                {/* Date Début */}
                 <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Date de début</FormLabel>
                            <DatePicker date={field.value} setDate={field.onChange} />
                            <FormMessage />
                        </FormItem>
                    )}
                />

                 {/* Date Fin (Conditionnelle pour 'custom' mais toujours affichée pour simplicité) */}
                <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Date de fin (Optionnel)</FormLabel>
                             <DatePicker date={field.value ?? undefined} setDate={field.onChange} />
                             <FormDescription>
                                Laisser vide si le budget est récurrent (mensuel/hebdo) ou personnalisé sans fin définie.
                             </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Catégorie */}
                <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Catégorie (optionnelle)</FormLabel>
                            <Select
                                onValueChange={(value) => {
                                    const newValue = value === "null" ? null : value;
                                    form.setValue("categoryId", newValue, {
                                        shouldValidate: true,
                                        shouldDirty: true
                                    });
                                }}
                                value={field.value ?? "null"}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner une catégorie" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="null">Aucune catégorie</SelectItem>
                                    {categories?.map((category) => (
                                        <SelectItem key={category.id} value={category.id}>
                                            <div className="flex items-center gap-2">
                                                {category.icon && (
                                                    <span 
                                                        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-xs"
                                                        style={{
                                                            backgroundColor: category.color ?? 'transparent',
                                                            color: category.color ? getContrastYIQ(category.color) : 'inherit',
                                                        }}
                                                    >
                                                        {category.icon}
                                                    </span>
                                                )}
                                                <span>{category.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                Associer ce budget à une catégorie pour suivre les dépenses par catégorie.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={isPending} className="w-full">
                    {isPending ? (isEditMode ? 'Modification...' : 'Ajout...') : (isEditMode ? 'Enregistrer les modifications' : 'Ajouter le budget')}
                </Button>
            </form>
        </Form>
    );
}