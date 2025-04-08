"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Calendar } from "~/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

// Schéma de validation du formulaire
const formSchema = z.object({
  amount: z.coerce.number().refine(val => !isNaN(val), {
    message: "Le montant doit être un nombre valide"
  }),
  description: z.string().min(1, "La description est requise"),
  date: z.date({
    required_error: "Veuillez sélectionner une date",
  }),
  categoryId: z.string().optional(),
  bankAccountId: z.string().min(1, "Veuillez sélectionner un compte bancaire"),
});

// Type dérivé du schéma
type FormValues = z.infer<typeof formSchema>;

// Type pour une transaction existante
export type TransactionData = {
  id: string;
  amount: number;
  description: string;
  date: Date;
  categoryId: string | null;
  bankAccountId: string;
};

export function TransactionForm({ 
  children,
  onSuccess,
  transaction,
  mode = "create"
}: { 
  children: React.ReactNode;
  onSuccess?: () => void;
  transaction?: TransactionData;
  mode?: "create" | "edit";
}) {
  const [open, setOpen] = useState(false);
  const isEditMode = mode === "edit";

  // Ajouter un log pour vérifier les props reçues
  useEffect(() => {
    if (isEditMode) {
      console.log("TransactionForm initialisé en mode édition avec la transaction:", transaction);
    }
  }, [isEditMode, transaction]);

  // Récupérer les catégories pour le menu déroulant
  const { data: categories } = api.category.getAll.useQuery();
  
  // Récupérer les comptes bancaires
  const { data: bankAccounts, isLoading: isLoadingAccounts } = api.bankAccount.getAll.useQuery();

  // Obtenir le contexte tRPC pour pouvoir invalider les queries
  const utils = api.useUtils();

  // Initialiser le formulaire avec react-hook-form et zod
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      description: "",
      date: new Date(),
      categoryId: undefined,
      bankAccountId: "",
    },
  });

  // Remplir le formulaire avec les données de la transaction existante en mode édition
  useEffect(() => {
    if (isEditMode && transaction) {
      form.reset({
        amount: transaction.amount,
        description: transaction.description,
        date: new Date(transaction.date),
        categoryId: transaction.categoryId ?? undefined,
        bankAccountId: transaction.bankAccountId,
      });
    }
  }, [form, transaction, isEditMode]);

  // Mutation tRPC pour créer une transaction
  const createTransaction = api.transaction.create.useMutation({
    onSuccess: async () => {
      console.log("Action réussie, invalidation du cache...");
      
      // Notification de succès
      toast.success("Transaction créée avec succès !");
      
      // Invalider le cache pour la query transaction.getAll
      await utils.transaction.getAll.invalidate();
      
      // Invalider aussi le cache des budgets, car une nouvelle transaction peut affecter les montants dépensés
      await utils.budget.getAll.invalidate();
      
      // Fermer le dialog et réinitialiser le formulaire
      setOpen(false);
      form.reset();
      
      // Appeler le callback onSuccess si fourni
      if (onSuccess) {
        onSuccess();
      }
      console.log("Cache invalidé et formulaire fermé.");
    },
    onError: (error) => {
      console.error("Erreur lors de l'ajout de la transaction:", error);
      toast.error("Erreur lors de la création de la transaction.");
    },
  });

  // Mutation tRPC pour mettre à jour une transaction
  const updateTransaction = api.transaction.update.useMutation({
    onSuccess: async () => {
      console.log("Action réussie, invalidation du cache...");
      
      // Notification de succès
      toast.success("Transaction modifiée avec succès !");
      
      // Invalider le cache pour la query transaction.getAll
      await utils.transaction.getAll.invalidate();
      
      // Invalider aussi le cache des budgets
      await utils.budget.getAll.invalidate();
      
      // Fermer le dialog et réinitialiser le formulaire
      setOpen(false);
      form.reset();
      
      // Appeler le callback onSuccess si fourni
      if (onSuccess) {
        onSuccess();
      }
      console.log("Cache invalidé et formulaire fermé.");
    },
    onError: (error: unknown) => {
      console.error("Erreur lors de la modification de la transaction:", error);
      toast.error(`Erreur lors de la modification de la transaction: ${error instanceof Error ? error.message : String(error)}`);
    },
  });

  // Gérer la soumission du formulaire
  function onSubmit(values: FormValues) {
    console.log("Valeurs du formulaire avant ajustement:", values);

    // Traitement spécial pour categoryId
    // Si 'none' ou undefined/empty -> explicitement NULL
    // Sinon, utiliser la valeur (qui doit être un UUID valide)
    const categoryId = (!values.categoryId || values.categoryId === "none") 
      ? null 
      : values.categoryId;
    
    console.log("CategoryId après traitement:", categoryId);
    
    if (isEditMode && transaction) {
      // Vérification supplémentaire que l'ID existe
      if (!transaction.id) {
        console.error("ERREUR: ID de transaction manquant pour la mise à jour", transaction);
        toast.error("Erreur: ID de transaction manquant pour la mise à jour");
        return;
      }

      // Mode édition: mettre à jour une transaction existante
      console.log("Mode édition pour transaction ID:", transaction.id);
      console.log("Objet transaction complet:", transaction);
      
      // Créer l'objet avec l'ID en premier, plus explicitement
      const updateData = {
        id: transaction.id,
        description: values.description,
        amount: values.amount,
        date: values.date,
        categoryId: categoryId,
        bankAccountId: values.bankAccountId,
      };
      
      console.log("Données finales envoyées à updateTransaction.mutate:", updateData);
      updateTransaction.mutate(updateData);
    } else {
      // Mode création: ajouter une nouvelle transaction
      const createData = {
        description: values.description,
        amount: values.amount,
        date: values.date,
        categoryId: categoryId,
        bankAccountId: values.bankAccountId,
      };
      
      console.log("Données finales envoyées à createTransaction.mutate:", createData);
      createTransaction.mutate(createData);
    }
  }

  const isPending = createTransaction.isPending || updateTransaction.isPending;
  const dialogTitle = isEditMode ? "Modifier la transaction" : "Ajouter une transaction";
  const dialogDescription = isEditMode 
    ? "Modifiez les détails de cette transaction" 
    : "Saisissez les détails de votre nouvelle transaction";
  const submitButtonText = isEditMode
    ? (isPending ? "Modification en cours..." : "Modifier")
    : (isPending ? "Ajout en cours..." : "Ajouter");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            {/* Montant */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Montant</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0.00"
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) => {
                        // Convertir en nombre pour le formulaire
                        field.onChange(parseFloat(e.target.value) || 0);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Entrez un montant positif pour un revenu, négatif pour une dépense
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Compte Bancaire */}
            <FormField
              control={form.control}
              name="bankAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Compte Bancaire *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoadingAccounts || !bankAccounts || bankAccounts.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          isLoadingAccounts ? "Chargement..."
                          : (!bankAccounts || bankAccounts.length === 0) ? "Aucun compte disponible"
                          : "Sélectionner un compte..."
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {bankAccounts?.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!isLoadingAccounts && (!bankAccounts || bankAccounts.length === 0) && (
                    <p className="text-sm text-muted-foreground">
                      Veuillez d&apos;abord <Link href="/accounts" className="underline">ajouter un compte bancaire</Link>.
                    </p>
                  )}
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
                    <Input placeholder="Ex: Courses au supermarché" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className="w-full pl-3 text-left font-normal"
                        >
                          {field.value ? (
                            format(field.value, "dd MMMM yyyy", { locale: fr })
                          ) : (
                            <span>Choisir une date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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
                  <FormLabel>Catégorie</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? "none"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">-- Non catégorisé --</SelectItem>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center">
                            <span
                              className="mr-2 inline-block h-3 w-3 rounded-full"
                              style={{ backgroundColor: category.color ?? '#ccc' }}
                              aria-hidden="true"
                            />
                            {category.icon && <span className="mr-1">{category.icon}</span>}
                            <span>{category.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {submitButtonText}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 