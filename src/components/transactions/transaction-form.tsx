"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
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
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { ComboboxField, type ComboboxOption } from "~/components/ui/combobox-rhf";

// Schéma de validation du formulaire
const formSchema = z.object({
  // Type de transaction: revenu ou dépense
  transactionType: z.enum(["income", "expense"], {
    required_error: "Veuillez sélectionner le type de transaction",
  }),
  // Le montant est toujours positif dans le formulaire
  amount: z.coerce.number({
    invalid_type_error: "Le montant doit être un nombre valide"
  }).positive("Le montant doit être positif"),
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

// Props pour le formulaire
interface TransactionFormProps {
  onSuccess?: () => void;
  transaction?: TransactionData;
  mode?: "create" | "edit";
  // children est optionnel maintenant
  children?: React.ReactNode;
  // Props pour le Dialog externe
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isDialogOpen?: boolean; // Indique si le parent Dialog est ouvert
}

export function TransactionForm({ 
  children,
  onSuccess,
  transaction,
  mode = "create",
  open,
  onOpenChange,
  isDialogOpen
}: TransactionFormProps) {
  const router = useRouter();
  // État interne pour le dialog - utilisé uniquement si open/onOpenChange ne sont pas fournis
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Déterminer quel état utiliser pour le dialog
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  // Utiliser l'opérateur de fusion nulle à la place de l'opérateur logique OR
  const setIsOpen = onOpenChange ?? setInternalOpen;

  // Crée une ref pour l'input sur lequel on veut mettre le focus
  const amountInputRef = useRef<HTMLInputElement>(null);
  
  // État pour savoir quel bouton a été cliqué
  const [submitAction, setSubmitAction] = useState<'save' | 'saveAndNew'>('save');

  // useEffect pour le focus initial
  useEffect(() => {
    // On utilise soit isDialogOpen passé en prop, soit isOpen local
    const dialogIsOpen = isDialogOpen ?? isOpen;
    
    if (dialogIsOpen) {
      // Petit délai pour laisser le temps au dialogue d'être rendu
      const timer = setTimeout(() => {
        amountInputRef.current?.focus({ preventScroll: true });
      }, 100);
      
      // Nettoie le timer si le composant est démonté
      return () => clearTimeout(timer);
    }
  }, [isDialogOpen, isOpen]);

  const isEditMode = mode === "edit";

  // Récupérer les catégories pour le menu déroulant
  const { data: categories } = api.category.getAll.useQuery();
  
  // Récupérer les comptes bancaires
  const { data: bankAccounts } = api.bankAccount.getAll.useQuery();

  // Obtenir le contexte tRPC pour pouvoir invalider les queries
  const utils = api.useUtils();

  // Déterminer le type de transaction initial basé sur le montant
  const getInitialTransactionType = (amount: number | undefined) => {
    if (amount === undefined) return "expense"; // Par défaut: dépense
    return amount >= 0 ? "income" : "expense";
  };

  // Obtenir le montant absolu pour l'affichage dans le formulaire
  const getInitialAmount = (amount: number | undefined) => {
    if (amount === undefined) return undefined;
    return Math.abs(amount);
  };

  // Initialiser le formulaire avec react-hook-form et zod
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      transactionType: isEditMode && transaction 
        ? getInitialTransactionType(transaction.amount) 
        : "expense",
      amount: isEditMode && transaction
        ? getInitialAmount(transaction.amount)
        : 0,
      description: transaction?.description ?? "",
      date: transaction?.date ? new Date(transaction.date) : new Date(),
      categoryId: transaction?.categoryId ?? undefined,
      bankAccountId: transaction?.bankAccountId ?? "",
    },
  });

  // Fonction de gestion du succès des mutations
  const handleMutationSuccess = async () => {
    // Notification de succès
    toast.success(isEditMode ? "Transaction modifiée avec succès !" : "Transaction ajoutée avec succès !");
    
    // Invalider les caches qui dépendent des transactions
    await utils.transaction.getAll.invalidate();
    await utils.budget.getAll.invalidate();
    await utils.dashboard.getTotalBalance.invalidate();
    await utils.dashboard.getCurrentMonthSummary.invalidate();
    await utils.bankAccount.getAll.invalidate();
    await utils.report.invalidate();
    
    // Rafraîchir les server components
    router.refresh();
    
    if (submitAction === 'saveAndNew' && !isEditMode) {
      // Pour "Ajouter et Nouveau" : d'abord réinitialiser complètement le formulaire
      form.reset();
      
      // Puis définir uniquement les valeurs que nous voulons conserver
      const currentType = form.getValues('transactionType');
      const currentDate = form.getValues('date');
      const currentBankAccount = form.getValues('bankAccountId');
      
      // Mettre à jour les champs que nous voulons conserver
      form.setValue('transactionType', currentType);
      form.setValue('date', currentDate);
      form.setValue('bankAccountId', currentBankAccount);
      
      // Remet le focus sur le montant après reset
      setTimeout(() => amountInputRef.current?.focus(), 50);
      // Ne pas fermer le dialogue
    } else {
      // Pour "Ajouter" ou "Modifier" : reset complet et fermeture
      form.reset();
      
      // Fermer le dialogue si contrôlé de l'extérieur
      if (isControlled) {
        setIsOpen(false);
      }
    }
    
    // Réinitialiser l'action par défaut pour la prochaine fois
    setSubmitAction('save');
    
    // Appeler le callback onSuccess si fourni
    if (onSuccess) {
      onSuccess();
    }
  };
  
  // Fonction de gestion des erreurs des mutations
  const handleMutationError = (_error: unknown) => {
    toast.error(`Erreur lors de la ${isEditMode ? 'modification' : 'création'} de la transaction: ${_error instanceof Error ? _error.message ?? String(_error) : String(_error)}`);
    // Réinitialiser l'action en cas d'erreur aussi
    setSubmitAction('save');
  };

  // Mutation tRPC pour créer une transaction
  const createTransaction = api.transaction.create.useMutation({
    onSuccess: handleMutationSuccess,
    onError: handleMutationError,
  });

  // Mutation tRPC pour mettre à jour une transaction
  const updateTransaction = api.transaction.update.useMutation({
    onSuccess: handleMutationSuccess,
    onError: handleMutationError,
  });

  // Gérer la soumission du formulaire
  function onSubmit(values: FormValues) {
    // Traitement spécial pour categoryId
    // Si &apos;none&apos; ou undefined/empty -> explicitement NULL
    // Sinon, utiliser la valeur (qui doit être un UUID valide)
    const categoryId = (!values.categoryId || values.categoryId === "none") 
      ? null 
      : values.categoryId;
    
    // Calculer le montant final avec le bon signe en fonction du type de transaction
    const finalAmount = values.transactionType === "expense" 
      ? -Math.abs(values.amount) 
      : Math.abs(values.amount);
    
    if (isEditMode && transaction) {
      // Vérification supplémentaire que l'ID existe
      if (!transaction.id) {
        toast.error("Erreur: ID de transaction manquant pour la mise à jour");
        return;
      }

      // Mode édition: mettre à jour une transaction existante
      const updateData = {
        id: transaction.id,
        description: values.description,
        amount: finalAmount,
        date: values.date,
        categoryId: categoryId,
        bankAccountId: values.bankAccountId,
      };
      
      updateTransaction.mutate(updateData);
    } else {
      // Mode création: ajouter une nouvelle transaction
      const createData = {
        description: values.description,
        amount: finalAmount,
        date: values.date,
        categoryId: categoryId,
        bankAccountId: values.bankAccountId,
      };
      
      createTransaction.mutate(createData);
    }
  }

  const isPending = createTransaction.isPending || updateTransaction.isPending;
  const dialogTitle = isEditMode ? "Modifier la transaction" : "Ajouter une transaction";
  const dialogDescription = isEditMode 
    ? "Modifiez les détails de cette transaction" 
    : "Saisissez les détails de votre nouvelle transaction";

  // Prépare les options pour les Combobox
  const accountOptions: ComboboxOption[] = bankAccounts?.map(acc => ({
    value: acc.id,
    label: acc.name,
  })) ?? [];

  const categoryOptions: ComboboxOption[] = (categories ?? []).map(category => ({
    value: category.id,
    label: category.name,
    icon: category.icon ? (
      <div className="flex items-center">
        <span
          className="mr-2 inline-block h-3 w-3 rounded-full"
          style={{ backgroundColor: category.color ?? "#ccc" }}
          aria-hidden="true"
        />
        <span>{category.icon}</span>
      </div>
    ) : undefined,
  }));

  // Le contenu du formulaire
  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        {/* Type de transaction (Revenu/Dépense) */}
        <FormField
          control={form.control}
          name="transactionType"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel>Type de transaction</FormLabel>
              <FormControl>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  value={field.value}
                  onValueChange={field.onChange}
                  className="grid grid-cols-2"
                >
                  <ToggleGroupItem value="income" aria-label="Revenu">
                    <ArrowUpCircle className="mr-2 h-4 w-4 text-green-500" />
                    Revenu
                  </ToggleGroupItem>
                  <ToggleGroupItem value="expense" aria-label="Dépense">
                    <ArrowDownCircle className="mr-2 h-4 w-4 text-red-500" />
                    Dépense
                  </ToggleGroupItem>
                </ToggleGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Montant (toujours positif) */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Montant</FormLabel>
              <FormControl>
                <Input
                  ref={amountInputRef}
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  value={field.value === 0 && !isEditMode ? '' : field.value}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val === '' ? 0 : parseFloat(val));
                  }}
                />
              </FormControl>
              <FormDescription>
                Entrez le montant (toujours positif). Utilisez les boutons ci-dessus pour indiquer s&apos;il s&apos;agit d&apos;un revenu ou d&apos;une dépense.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Compte Bancaire */}
        <ComboboxField
          control={form.control}
          name="bankAccountId"
          label="Compte Bancaire *"
          options={accountOptions}
          placeholder="Sélectionner un compte..."
          searchPlaceholder="Rechercher un compte..."
          emptyText="Aucun compte trouvé."
          description={!bankAccounts || (bankAccounts && bankAccounts.length === 0) ? 
            <span>Veuillez d&apos;abord <Link href="/accounts" className="underline">ajouter un compte bancaire</Link>.</span> : undefined}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ex: Courses au supermarché" 
                  value={field.value ?? ''} 
                  onChange={field.onChange}
                />
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
        <ComboboxField
          control={form.control}
          name="categoryId"
          label="Catégorie"
          options={categoryOptions}
          placeholder="Sélectionner une catégorie..."
          searchPlaceholder="Rechercher une catégorie..."
          emptyText="Aucune catégorie trouvée."
          allowNull={true}
          nullLabel="-- Non catégorisé --"
        />

        <DialogFooter className="flex gap-2">
          {/* Afficher "Ajouter et Nouveau" seulement en mode création */}
          {!isEditMode && (
            <Button
              type="submit"
              variant="secondary"
              disabled={isPending}
              onClick={() => setSubmitAction('saveAndNew')}
            >
              {createTransaction.isPending && submitAction === 'saveAndNew' ? "Ajout en cours..." : "Ajouter et Nouveau"}
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={isPending}
            onClick={() => setSubmitAction('save')}
          >
            {isPending && submitAction === 'save'
              ? (isEditMode ? "Modification en cours..." : "Ajout en cours...")
              : (isEditMode ? "Modifier" : "Ajouter")
            }
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );

  // Si children est fourni, on rend un Dialog avec children comme trigger
  // Sinon, on rend juste le contenu du formulaire (pour l'intégrer dans un Dialog externe)
  if (children) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
          {formContent}
        </DialogContent>
      </Dialog>
    );
  }

  // Si pas d'enfants, retourner uniquement le contenu (sans Dialog)
  return (
    <>
      <DialogHeader>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogDescription>
          {dialogDescription}
        </DialogDescription>
      </DialogHeader>
      {formContent}
    </>
  );
}
