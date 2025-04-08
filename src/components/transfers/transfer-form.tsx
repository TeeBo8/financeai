"use client";

import React from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { DatePicker } from "~/components/ui/date-picker"; 
import { Loader2 } from "lucide-react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '~/server/api/root';

type BankAccount = inferRouterOutputs<AppRouter>['bankAccount']['getAll'][number];

// Schéma Zod pour le formulaire de transfert
const formSchema = z.object({
  fromAccountId: z.string().min(1, "Compte source requis."),
  toAccountId: z.string().min(1, "Compte destination requis."),
  amount: z.coerce
    .number({ invalid_type_error: "Montant invalide." })
    .positive("Le montant doit être positif.")
    .finite("Montant trop grand."),
  date: z.date({ required_error: "Date requise." }),
  description: z.string().max(256, "Description trop longue.").optional(),
}).refine(data => data.fromAccountId !== data.toAccountId, {
    message: "Les comptes doivent être différents.",
    path: ["toAccountId"],
});

type TransferFormData = z.infer<typeof formSchema>;

interface TransferFormProps {
  accounts: BankAccount[];
  onFormSubmit: () => void;
}

export function TransferForm({ accounts, onFormSubmit }: TransferFormProps) {
  const utils = api.useUtils();

  const form = useForm<TransferFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fromAccountId: "",
      toAccountId: "",
      amount: 0,
      date: new Date(),
      description: "",
    },
  });

  const createTransferMutation = api.transaction.createTransfer.useMutation({
    onSuccess: (data) => {
      toast.success(`Transfert (ID: ${data.transferId}) créé avec succès !`);
      void utils.transaction.getAll.invalidate();
      void utils.bankAccount.getAll.invalidate();
      onFormSubmit();
      form.reset();
    },
    onError: (error) => {
      // Typage sécurisé pour l'accès aux propriétés
      const errorMessage = error.message || "Erreur inconnue";
      const errorCode = error.data?.code;
      
      if (errorCode === 'BAD_REQUEST') {
        toast.error(`Erreur de transfert : ${errorMessage}`);
      } else {
        toast.error(`Erreur lors du transfert : ${errorMessage}`);
      }
    },
  });

  function onSubmit(values: TransferFormData) {
    console.log("Submitting transfer:", values);
    createTransferMutation.mutate({
        ...values,
        amount: values.amount.toString(),
    });
  }

  const isSubmitting = createTransferMutation.isPending;
  const canTransfer = accounts.length >= 2;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {!canTransfer && (
            <p className="text-sm text-destructive text-center">
                Vous devez avoir au moins deux comptes bancaires pour effectuer un transfert.
            </p>
        )}

        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="fromAccountId"
            render={({ field }) => (
                <FormItem>
                <FormLabel>De *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={!canTransfer}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Compte source..." />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {accounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="toAccountId"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Vers *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={!canTransfer}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Compte destination..." />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {accounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Montant *</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="Ex: 150.00" 
                  {...field} 
                  onChange={event => {
                    const value = event.target.value;
                    field.onChange(value === '' ? undefined : parseFloat(value));
                  }}
                  value={field.value === 0 ? '0' : (field.value || '')}
                  disabled={!canTransfer}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date *</FormLabel>
              <DatePicker 
                date={field.value} 
                setDate={field.onChange}
                buttonProps={{ disabled: !canTransfer }}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optionnel)</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Virement épargne" {...field} disabled={!canTransfer}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting || !canTransfer} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Effectuer le transfert
        </Button>
      </form>
    </Form>
  );
}

// Fonction de formatage de devise
const formatCurrency = (amount: string | number | null | undefined): string => {
    if (amount === null || amount === undefined) return '';
    const numberAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numberAmount)) return '';
    return numberAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}; 