"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Loader2 } from "lucide-react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '~/server/api/root';

// Schema de validation Zod pour le formulaire
const formSchema = z.object({
  name: z.string().min(1, "Le nom est requis.").max(256, "Le nom est trop long."),
  // Ajoutez d'autres champs ici si nécessaire plus tard (ex: solde initial)
});

type BankAccountFormData = z.infer<typeof formSchema>;
type BankAccount = inferRouterOutputs<AppRouter>['bankAccount']['getAll'][number];

interface BankAccountFormProps {
  accountToEdit?: BankAccount | null; // Compte à modifier (optionnel)
  onFormSubmit: () => void; // Fonction à appeler après succès pour fermer le dialogue
}

export function BankAccountForm({ accountToEdit, onFormSubmit }: BankAccountFormProps) {
  const utils = api.useUtils();

  // Configuration react-hook-form
  const form = useForm<BankAccountFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: accountToEdit?.name ?? "",
      // autres valeurs par défaut
    },
  });

  // Reset le formulaire si on passe d'édition à ajout (ou inversement)
  useEffect(() => {
    if (accountToEdit) {
      form.reset({ name: accountToEdit.name });
    } else {
      form.reset({ name: "" });
    }
  }, [accountToEdit, form]);

  // Mutation tRPC pour la création
  const createMutation = api.bankAccount.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Compte "${data.name}" créé avec succès !`);
      void utils.bankAccount.getAll.invalidate(); // Invalide le cache pour rafraîchir la liste
      onFormSubmit(); // Appelle la fonction du parent (ferme le dialogue)
    },
    onError: (error) => {
      toast.error(`Erreur lors de la création : ${error.message}`);
    },
  });

  // Mutation tRPC pour la mise à jour
  const updateMutation = api.bankAccount.update.useMutation({
    onSuccess: (data) => {
      toast.success(`Compte "${data.name}" mis à jour avec succès !`);
      void utils.bankAccount.getAll.invalidate();
      onFormSubmit();
    },
    onError: (error) => {
      // Gère le cas spécifique où le compte n'est pas trouvé pendant l'update
      if (error.data?.code === 'NOT_FOUND') {
          toast.error('Erreur: Compte bancaire non trouvé.');
      } else if (error.data?.code === 'FORBIDDEN') {
          toast.error('Erreur: Vous n\'êtes pas autorisé à modifier ce compte.');
      } else {
          toast.error(`Erreur lors de la mise à jour : ${error.message}`);
      }
    },
  });

  // Fonction appelée lors de la soumission du formulaire valide
  function onSubmit(values: BankAccountFormData) {
    if (accountToEdit) {
      // Mode édition
      updateMutation.mutate({ id: accountToEdit.id, ...values });
    } else {
      // Mode création
      createMutation.mutate(values);
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du compte *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Compte Courant LCL, Livret A..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Ajoutez d'autres champs ici si nécessaire */}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {accountToEdit ? "Enregistrer les modifications" : "Ajouter le compte"}
        </Button>
      </form>
    </Form>
  );
} 