"use client";

import { useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { categoryFormSchema, type CategoryFormValues } from "@/lib/schemas/category-schema";
import { useCategoryDialogStore, defaultCategoryFormValues } from "@/stores/useCategoryDialogStore";
import { Loader2 } from 'lucide-react';

interface CategoryFormProps {
  // Pas de props nécessaires, on utilise le store
  initialData?: {
    id: string;
    name: string;
    icon?: string | null;
    color?: string | null;
  };
  onFormSubmit?: () => void;
}

export function CategoryForm({}: CategoryFormProps) {
    const utils = api.useUtils();
    const { closeDialog, isEditing, categoryToEdit } = useCategoryDialogStore();

    const form = useForm<CategoryFormValues>({
        resolver: zodResolver(categoryFormSchema),
        // Pré-remplir si en mode édition, sinon utiliser les valeurs par défaut
        defaultValues: isEditing && categoryToEdit
            ? { 
                name: categoryToEdit.name,
                icon: categoryToEdit.icon ?? "",
                color: categoryToEdit.color ?? "",
              }
            : defaultCategoryFormValues,
    });

    // Reset le formulaire si on passe d'édition à création ou si la catégorie à éditer change
    useEffect(() => {
        if (isEditing && categoryToEdit) {
            form.reset({
                name: categoryToEdit.name,
                icon: categoryToEdit.icon ?? "",
                color: categoryToEdit.color ?? "",
            });
        } else {
            form.reset(defaultCategoryFormValues);
        }
    }, [isEditing, categoryToEdit, form]);

    // --- Mutations ---
    const { mutate: createCategory, isPending: isCreating } = api.category.create.useMutation({
        onSuccess: () => {
            toast.success("Catégorie créée avec succès");
            void utils.category.getAll.invalidate();
            closeDialog();
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const { mutate: updateCategory, isPending: isUpdating } = api.category.update.useMutation({
        onSuccess: () => {
            toast.success("Catégorie mise à jour avec succès");
            void utils.category.getAll.invalidate();
            closeDialog();
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    function onSubmit(data: CategoryFormValues) {
        if (isEditing && categoryToEdit) {
            updateCategory({
                id: categoryToEdit.id,
                ...data,
            });
        } else {
            createCategory(data);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Champ Nom */}
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nom de la catégorie</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Alimentation" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Champ Icône */}
                <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Icône (optionnel)</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: 🍎 ou nom d'icône" {...field} value={field.value ?? ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Champ Couleur */}
                <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Couleur (optionnel)</FormLabel>
                            <FormControl>
                                <Input
                                    type="color"
                                    {...field}
                                    value={field.value ?? '#CCCCCC'}
                                    className="p-0 h-10 w-14 cursor-pointer border-none"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Boutons d'action */}
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={closeDialog} disabled={isCreating || isUpdating}>
                        Annuler
                    </Button>
                    <Button type="submit" disabled={isCreating || isUpdating}>
                        {isCreating || isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditing ? "Mettre à jour" : "Créer la catégorie"}
                    </Button>
                </div>
            </form>
        </Form>
    );
} 