// src/components/budgets/budget-form.tsx
"use client";

import React, { useState } from 'react';
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { Check } from "lucide-react";

export interface BudgetFormData {
    id?: string;
    name: string;
    amount: number;
    period: "MONTHLY" | "YEARLY";
    categoryIds: string[];
}

interface BudgetFormProps {
    initialData?: BudgetFormData | null;
    onClose: () => void;
}

export function BudgetForm({ initialData = null, onClose }: BudgetFormProps) {
    const utils = api.useUtils();
    const isEditMode = !!initialData?.id;

    // État simple sans react-hook-form
    const [name, setName] = useState(initialData?.name || '');
    const [amount, setAmount] = useState(initialData?.amount || 0);
    const [period, setPeriod] = useState(initialData?.period || 'MONTHLY');
    const [selectedCategories, setSelectedCategories] = useState<string[]>(initialData?.categoryIds || []);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Chargement des catégories
    const { data: categories, isLoading: isLoadingCategories } = api.category.getAll.useQuery();

    // Toggle pour ajouter/retirer une catégorie
    const toggleCategory = (categoryId: string) => {
        setSelectedCategories(prev => 
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    // Mutation pour créer un budget
    const createBudget = api.budget.create.useMutation({
        onSuccess: () => {
            toast.success("Budget créé avec succès !");
            void utils.budget.getAll.invalidate();
            onClose();
        },
        onError: (error) => {
            toast.error(`Erreur lors de la création : ${error.message}`);
            setIsSubmitting(false);
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
            setIsSubmitting(false);
        },
    });

    // Soumission du formulaire
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name) {
            toast.error("Le nom du budget est requis");
            return;
        }
        
        if (amount <= 0) {
            toast.error("Le montant doit être positif");
            return;
        }

        setIsSubmitting(true);

        const formData = {
            name,
            amount,
            period,
            categoryIds: selectedCategories
        };

        if (isEditMode && initialData?.id) {
            updateBudget.mutate({
                id: initialData.id,
                ...formData,
            });
        } else {
            createBudget.mutate(formData);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
            {/* Nom du budget */}
            <div className="space-y-2">
                <Label htmlFor="name">Nom du budget</Label>
                <Input 
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Courses mensuelles" 
                    disabled={isSubmitting} 
                />
            </div>

            {/* Montant alloué */}
            <div className="space-y-2">
                <Label htmlFor="amount">Montant alloué</Label>
                <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    placeholder="Ex: 150"
                    step="0.01"
                    min="0"
                    disabled={isSubmitting}
                />
                <p className="text-sm text-muted-foreground">
                    Montant maximum que vous souhaitez dépenser
                </p>
            </div>

            {/* Période */}
            <div className="space-y-2">
                <Label htmlFor="period">Période</Label>
                <select 
                    id="period"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as "MONTHLY" | "YEARLY")}
                    className="w-full p-2 border rounded"
                    disabled={isSubmitting}
                >
                    <option value="MONTHLY">Mensuel</option>
                    <option value="YEARLY">Annuel</option>
                </select>
                <p className="text-sm text-muted-foreground">
                    À quelle fréquence ce budget se renouvelle-t-il ?
                </p>
            </div>

            {/* Catégories */}
            <div className="space-y-2">
                <Label>Catégories</Label>
                <div className="border rounded-md p-3">
                    {isLoadingCategories ? (
                        <div className="py-2 text-muted-foreground">Chargement...</div>
                    ) : !categories || categories.length === 0 ? (
                        <div className="py-2 text-muted-foreground">Aucune catégorie.</div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {categories.map(category => (
                                <div 
                                    key={category.id}
                                    className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                                        selectedCategories.includes(category.id) 
                                            ? 'bg-primary/10 border border-primary/30' 
                                            : 'hover:bg-muted'
                                    } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={() => !isSubmitting && toggleCategory(category.id)}
                                >
                                    <div className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                                        selectedCategories.includes(category.id)
                                            ? 'bg-primary border-primary text-primary-foreground'
                                            : 'border-primary'
                                    } ${isSubmitting ? 'opacity-50' : ''}`}>
                                        {selectedCategories.includes(category.id) && (
                                            <Check className="h-3 w-3" />
                                        )}
                                    </div>
                                    <span className={`${isSubmitting ? 'opacity-50' : ''}`}>{category.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <p className="text-sm text-muted-foreground">
                    Sélectionnez les catégories de dépenses à suivre
                </p>
            </div>

            {/* Boutons */}
            <div className="flex justify-end gap-2 pt-4">
                <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onClose}
                    disabled={isSubmitting}
                >
                    Annuler
                </Button>
                <Button 
                    type="submit"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Traitement en cours..." : isEditMode ? "Mettre à jour" : "Créer le budget"}
                </Button>
            </div>
        </form>
    );
}