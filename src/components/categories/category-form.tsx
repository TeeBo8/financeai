"use client";

import React, { useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { api } from "~/trpc/react";
import { toast } from "sonner";

// Schéma Zod correspondant au backend (MAJ)
const categoryFormSchema = z.object({
    name: z.string().min(1, "Le nom est requis").max(50, "Nom trop long"),
    icon: z.string().max(50).optional().nullable(),
    color: z.string()
             .regex(/^#[0-9A-Fa-f]{6}$/, { message: "Format #RRGGBB requis" })
             .optional()
             .nullable(),
}).refine(data => !(data.color === '' && data.color !== null), {
    message: "Format #RRGGBB requis ou laisser vide",
    path: ["color"],
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

// Type pour les données initiales (mode édition)
interface CategoryFormData {
     id?: string;
     name: string;
     icon?: string | null;
     color?: string | null;
}

interface CategoryFormProps {
    initialData?: CategoryFormData | null;
    onFormSubmit?: () => void;
}

export function CategoryForm({ initialData = null, onFormSubmit }: CategoryFormProps) {
    const utils = api.useUtils();
    const isEditMode = !!initialData;

    const form = useForm<CategoryFormValues>({
        resolver: zodResolver(categoryFormSchema),
        defaultValues: {
            name: initialData?.name ?? "",
            icon: initialData?.icon ?? null,
            color: initialData?.color ?? null,
        },
    });

     // MAJ avec useEffect si initialData change PENDANT que le form est ouvert (sécurité)
     useEffect(() => {
        if (initialData) {
            form.reset({
                name: initialData.name ?? "",
                icon: initialData.icon ?? null,
                color: initialData.color ?? null,
            });
        } else {
             form.reset({
                name: "",
                icon: null,
                color: null,
            });
        }
    }, [initialData, form]);

     const createCategory = api.category.create.useMutation({
        onSuccess: () => {
            toast.success("Catégorie créée !");
            void utils.category.getAll.invalidate();
             // Invalider aussi les selects dans les autres formulaires ?
             void utils.transaction.getAll.invalidate(); // Pour que le nom s'affiche si utilisé
             void utils.budget.getAll.invalidate();      // Pour que le nom s'affiche si utilisé
            onFormSubmit?.();
            form.reset({ name: "", icon: null, color: null }); // Reset complet
        },
        onError: (error) => {
             toast.error(`Erreur: ${error.message}`);
        }
     });

     const updateCategory = api.category.update.useMutation({
         onSuccess: (data) => {
             toast.success(`Catégorie "${data?.name ?? 'inconnue'}" modifiée !`);
             void utils.category.getAll.invalidate();
             void utils.transaction.getAll.invalidate();
             void utils.budget.getAll.invalidate();
             onFormSubmit?.();
             // Pas de reset ici, on garde le formulaire édité fermé
         },
         onError: (error) => {
             toast.error(`Erreur: ${error.message}`);
         }
     });

     const mutation = isEditMode ? updateCategory : createCategory;
     const { isPending } = mutation;

    function onSubmit(data: CategoryFormValues) {
         console.log("Submitting category form:", data);
         // Assurer que les chaines vides deviennent null avant envoi si nullable
         const submitData = {
             ...data,
             icon: data.icon === "" ? null : data.icon,
             color: data.color === "" ? null : data.color,
         };
         console.log("Data prepared for mutation:", submitData);

        if (isEditMode && initialData?.id) {
            updateCategory.mutate({ id: initialData.id, ...submitData });
        } else {
            createCategory.mutate(submitData);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nom de la catégorie</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Transport" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Icône (Optionnel)</FormLabel>
                            <FormControl>
                                <Input 
                                    placeholder="Ex: 🚗 ou &apos;Car&apos;" 
                                    {...field} 
                                    value={field.value ?? ''}
                                />
                            </FormControl>
                            <FormDescription>
                                Saisissez un emoji ou un nom d&apos;icône (ex: d&apos;une librairie).
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Couleur (Optionnel)</FormLabel>
                            <div className="flex items-center space-x-2">
                                <FormControl>
                                    <Input 
                                        type="color" 
                                        className="h-10 w-14 p-1"
                                        {...field}
                                        value={field.value ?? '#000000'}
                                        onChange={(e) => field.onChange(e.target.value)}
                                    />
                                </FormControl>
                                <Input 
                                    placeholder="#FF5733"
                                    className="flex-1 font-mono"
                                    {...field}
                                    value={field.value ?? ''}
                                    onChange={(e) => {
                                        let value = e.target.value.trim();
                                        // Ajouter '#' automatiquement si absent et valide
                                        if (value.length === 6 && /^[0-9A-Fa-f]{6}$/.test(value)) {
                                            value = '#' + value;
                                        }
                                        field.onChange(value);
                                    }}
                                />
                                {field.value && (
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => field.onChange(null)}
                                    >
                                        Effacer
                                    </Button>
                                )}
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={isPending} className="w-full">
                    {isPending ? 'Enregistrement...' : (isEditMode ? 'Modifier' : 'Créer')}
                </Button>
            </form>
        </Form>
    );
} 