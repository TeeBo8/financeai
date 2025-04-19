"use client";

import { useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "~/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { accountFormSchema, type AccountFormValues } from "~/lib/schemas/account-schema";
import { useAccountDialogStore, defaultAccountFormValues } from "~/stores/useAccountDialogStore";
import { Loader2 } from 'lucide-react'; // Pour l'indicateur de chargement

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
            ? { name: accountToEdit.name } // Pré-remplir avec les données existantes
            : defaultAccountFormValues, // Utiliser les valeurs vides pour la création
    });

    // Reset le formulaire si on passe d'édition à création ou si le compte à éditer change
    useEffect(() => {
        if (isEditing && accountToEdit) {
            form.reset({ name: accountToEdit.name });
        } else {
            form.reset(defaultAccountFormValues);
        }
    }, [isEditing, accountToEdit, form]);

    // --- Mutations ---
    const createAccount = api.account.create.useMutation({
        onSuccess: (newAccount) => {
            toast.success(`Compte "${newAccount.name}" créé avec succès !`);
            void utils.account.getAll.invalidate(); // Rafraîchir la liste
            void utils.dashboard.getTotalBalance.invalidate(); // Mettre à jour solde total
            form.reset(defaultAccountFormValues); // Reset pour une éventuelle nouvelle saisie
            closeDialog();
        },
        onError: (error) => {
            toast.error(`Erreur création : ${error.message}`);
        },
    });

    const updateAccount = api.account.update.useMutation({
        onSuccess: () => {
            toast.success("Compte mis à jour avec succès !");
            void utils.account.getAll.invalidate();
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
        console.log("Soumission formulaire compte:", data);
        if (isEditing && accountToEdit) {
            // N'envoyer que les données qui ont potentiellement changé + l'ID
            updateAccount.mutate({
                id: accountToEdit.id,
                name: data.name,
            });
        } else {
            createAccount.mutate(data);
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
                            <FormLabel>Nom du compte</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Compte Courant BNP" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Ajouter champ Type ici si besoin plus tard */}

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