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
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { accountFormSchema, type AccountFormValues } from "@/lib/schemas/account-schema";
import { useAccountDialogStore, defaultAccountFormValues } from "@/stores/useAccountDialogStore";
import { Loader2 } from 'lucide-react'; // Pour l'indicateur de chargement
import { z } from "zod";
import { type RouterOutputs } from "@/trpc/shared";

// Pas besoin de props complexes ici, on lira depuis le store
interface AccountFormProps {
  // On pourrait ajouter une prop onSuccess si on veut une action spécifique
  // après succès, mais la fermeture est déjà gérée par la mutation/store.
  accountToEdit?: any;
  onFormSubmit?: () => void;
}

export function AccountForm({}: AccountFormProps) {
    const utils = api.useUtils();
    const { closeDialog, isEditing, accountToEdit } = useAccountDialogStore();

    const form = useForm<AccountFormValues>({
        resolver: zodResolver(accountFormSchema),
        // Pré-remplir si en mode édition, sinon utiliser les valeurs par défaut
        defaultValues: isEditing && accountToEdit
            ? { 
                name: accountToEdit.name,
                icon: accountToEdit.icon ?? "", // Utiliser "" si null pour l'input
                color: accountToEdit.color ?? "#000000", // Défaut noir si null
              } 
            : defaultAccountFormValues, // Valeurs par défaut incluent maintenant icon et color
    });

    // Reset le formulaire si on passe d'édition à création ou si le compte à éditer change
    useEffect(() => {
        if (isEditing && accountToEdit) {
            form.reset({
                name: accountToEdit.name,
                icon: accountToEdit.icon ?? "",
                color: accountToEdit.color ?? "#000000", // Assurer une valeur par défaut valide pour l'input color
            });
        } else {
            form.reset(defaultAccountFormValues);
        }
    }, [isEditing, accountToEdit, form]);

    // --- Mutations ---
    const createAccount = api.bankAccount.create.useMutation({
        onSuccess: (newAccount) => {
            toast.success(`Compte "${newAccount.name}" créé avec succès !`);
            void utils.bankAccount.getAll.invalidate(); // Rafraîchir la liste
            void utils.dashboard.getTotalBalance.invalidate(); // Mettre à jour solde total
            form.reset(defaultAccountFormValues); // Reset pour une éventuelle nouvelle saisie
            closeDialog();
        },
        onError: (error) => {
            toast.error(`Erreur création : ${error.message}`);
        },
    });

    const updateAccount = api.bankAccount.update.useMutation({
        onSuccess: () => {
            toast.success("Compte mis à jour avec succès !");
            void utils.bankAccount.getAll.invalidate();
            // Pas besoin d'invalider getTotalBalance si seul le nom change
            closeDialog();
        },
        onError: (error) => {
            toast.error(`Erreur mise à jour : ${error.message}`);
        },
    });

    const mutation = isEditing ? updateAccount : createAccount;
    const { isPending } = mutation;

    // Fonction de soumission
    function onSubmit(data: AccountFormValues) {
        // Traitement des données pour l'API
        const submitData = {
            ...data,
            // S'assurer que les valeurs vides sont bien gérées
            icon: data.icon || undefined,
            color: data.color === "#000000" ? undefined : data.color
        };
        
        if (isEditing && accountToEdit) {
            updateAccount.mutate({
                id: accountToEdit.id,
                ...submitData,
            });
        } else {
            createAccount.mutate(submitData);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Champ Nom */}
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nom du compte</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Compte Courant BNP" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* --- AJOUT Champs Icône et Couleur --- */}
                <div className="grid grid-cols-[auto_1fr] items-center gap-4">
                    {/* Champ Icône */}
                    <FormField 
                        control={form.control} 
                        name="icon" 
                        render={({ field }) => (
                            <FormItem className="col-span-2">
                                <FormLabel>Icône (Optionnel)</FormLabel>
                                <FormControl>
                                    <Input placeholder="Copier un emoji (ex: 💰) ou nom icône" {...field} value={field.value ?? ''} />
                                </FormControl>
                                <FormDescription>Utilisé pour l&apos;affichage.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )} 
                    />

                    {/* Champ Couleur */}
                    <FormLabel htmlFor="account-color" className="self-center">Couleur (Optionnel)</FormLabel>
                    <FormField 
                        control={form.control} 
                        name="color" 
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Input
                                        id="account-color"
                                        type="color"
                                        {...field}
                                        value={field.value ?? "#000000"} // Assurer une valeur valide
                                        className="h-10 w-16 p-1" // Style pour le sélecteur de couleur
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} 
                    />
                </div>
                {/* --- FIN AJOUT --- */}

                {/* Boutons d'action */}
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={closeDialog} disabled={isPending}>
                        Annuler
                    </Button>
                    <Button type="submit" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditing ? "Mettre à jour" : "Créer le compte"}
                    </Button>
                </div>
            </form>
        </Form>
    );
} 