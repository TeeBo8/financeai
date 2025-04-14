"use client";

import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Trash2, Pencil, ArrowUpDown } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { toast } from "sonner";
import { TransactionForm } from "~/components/transactions/transaction-form";
import type { TransactionData } from "~/components/transactions/transaction-form";
import { useRouter } from "next/navigation";

// --- Types ---
// Type direct pour définir la structure d'une transaction
export type Transaction = {
  id: string;
  userId: string;
  amount: string;
  description: string;
  date: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date | null;
  categoryId: string | null;
  bankAccountId: string;
  category?: {
    id: string;
    name: string;
    icon?: string;
    color?: string;
  } | null;
  bankAccount: {
    name: string;
  };
};

// Interface pour les props du composant
interface TransactionsListProps {
  transactions: Transaction[];
  onEdit?: (transaction: Transaction) => void;
}

// Définir les colonnes triables
type SortableColumn = 'date' | 'description' | 'amount' | 'category.name' | 'bankAccount.name';
// Définir la direction du tri
type SortDirection = 'asc' | 'desc';

// Helper pour formater la monnaie
const formatCurrency = (amount: string | number | null | undefined): string => {
    if (amount === null || amount === undefined) return "N/A";
    
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
    
    if (isNaN(numericAmount)) {
        return "Invalide";
    }
    
    return new Intl.NumberFormat('fr-FR', { 
        style: 'currency', 
        currency: 'EUR' 
    }).format(numericAmount);
};

// Helper pour formater la date
const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) return "N/A";
    try {
        // Tenter de parser la date (peut être string ou Date)
        return format(new Date(date), 'PP', { locale: fr }); // 'PP' = format de date court localisé
    } catch {
        return "Date invalide";
    }
};

// Helper pour préparer les données de la transaction pour le formulaire
const prepareTransactionData = (transaction: {
  id: string;
  amount: string;
  description: string;
  date: string | Date;
  categoryId: string | null;
  bankAccountId: string;
}): TransactionData => ({
  id: transaction.id,
  amount: Number(transaction.amount),
  description: transaction.description,
  date: new Date(transaction.date),
  categoryId: transaction.categoryId,
  bankAccountId: transaction.bankAccountId,
});

export function TransactionsList({ transactions, onEdit }: TransactionsListProps) {
  const router = useRouter();
  const utils = api.useUtils();
  const [isError] = useState(false);
  
  const { isLoading: isLoadingCategories } = api.category.getAll.useQuery();

  // --- État pour le Tri ---
  const [sortColumn, setSortColumn] = useState<SortableColumn>('date'); // Tri par date par défaut
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc'); // Plus récent en premier

  // --- Logique de Filtrage ET Tri (avec useMemo) ---
  const filteredAndSortedTransactions = useMemo(() => {
    if (!transactions) return [];

    // Nous n'avons plus besoin de filtrer ici car les transactions sont déjà filtrées par la page
    // On conserve uniquement le tri
    const sorted = [...transactions];
    sorted.sort((a, b) => {
      let valA: string | number | Date;
      let valB: string | number | Date;

      // Préparer les valeurs pour la comparaison
      if (sortColumn === 'date') {
          valA = new Date(a.date);
          valB = new Date(b.date);
      } else if (sortColumn === 'amount') {
          // Assurer que c'est bien un nombre
          valA = typeof a.amount === 'string' ? parseFloat(a.amount) : Number(a.amount);
          valB = typeof b.amount === 'string' ? parseFloat(b.amount) : Number(b.amount);
      } else if (sortColumn === 'category.name') {
          // Accéder au nom de la catégorie
          valA = a.category?.name?.toLowerCase() ?? '';
          valB = b.category?.name?.toLowerCase() ?? '';
      } else if (sortColumn === 'bankAccount.name') {
          // Accéder au nom du compte bancaire
          valA = a.bankAccount?.name?.toLowerCase() ?? '';
          valB = b.bankAccount?.name?.toLowerCase() ?? '';
      } else { // description (string)
          // Comparaison insensible à la casse
          valA = a.description?.toLowerCase() ?? '';
          valB = b.description?.toLowerCase() ?? '';
      }

      // Comparaison
      let comparison = 0;
      if (valA < valB) {
          comparison = -1;
      } else if (valA > valB) {
          comparison = 1;
      }

      // Appliquer la direction du tri
      return sortDirection === 'desc' ? comparison * -1 : comparison;
    });

    return sorted;
  }, [transactions, sortColumn, sortDirection]);

  // Mutation pour la suppression de transaction
  const deleteTransactionMutation = api.transaction.delete.useMutation({
      onSuccess: async (_data) => {
          toast.success(`Transaction supprimée avec succès.`);
          
          // Invalider tous les caches qui dépendent des transactions
          await utils.transaction.getAll.invalidate();
          await utils.budget.getAll.invalidate();
          await utils.dashboard.getTotalBalance.invalidate();
          await utils.dashboard.getCurrentMonthSummary.invalidate();
          await utils.bankAccount.getAll.invalidate();
          await utils.report.invalidate();
          
          // Rafraîchir les server components
          router.refresh();
      },
      onError: (_error) => {
          toast.error(_error.message || "Impossible de supprimer la transaction.");
      },
  });

  // Fonction appelée lors de la confirmation
  const handleDeleteTransaction = (transactionId: string) => {
      if (!transactionId) {
        toast.error("Erreur: ID de transaction manquant pour la suppression");
        return;
      }
      
      // S'assurer que l'ID est une chaîne valide
      const idToDelete = String(transactionId).trim();
      
      deleteTransactionMutation.mutate({ id: idToDelete });
  };

  // --- Handler pour changer le tri ---
  const handleSort = (column: SortableColumn) => {
      // Si on clique sur la même colonne, on inverse la direction
      if (sortColumn === column) {
          setSortDirection(prevDirection => (prevDirection === 'asc' ? 'desc' : 'asc'));
      } else {
          // Si on clique sur une nouvelle colonne, on trie par défaut (asc pour texte/montant, desc pour date)
          setSortColumn(column);
          setSortDirection(column === 'date' ? 'desc' : 'asc');
      }
  };

  // Si les données sont en cours de chargement
  if (isLoadingCategories) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p className="text-muted-foreground">Chargement des données...</p>
      </div>
    );
  }

  // Si une erreur s'est produite
  if (isError || !transactions) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-destructive">
        <p>Impossible de charger vos transactions. Veuillez réessayer plus tard.</p>
      </div>
    );
  }

  // Si aucune transaction n'a été trouvée
  if (transactions.length === 0) {
    return (
      <div className="rounded-md bg-muted p-4">
        <p className="text-center text-muted-foreground">
          Vous n&apos;avez pas encore de transactions.
        </p>
      </div>
    );
  }

  // Rendu du tableau de transactions
  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer" 
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center">
                  Date
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                  {sortColumn === 'date' && (
                    <span className="ml-1 text-xs">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer" 
                onClick={() => handleSort('description')}
              >
                <div className="flex items-center">
                  Description
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                  {sortColumn === 'description' && (
                    <span className="ml-1 text-xs">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer text-right" 
                onClick={() => handleSort('amount')}
              >
                <div className="flex items-center justify-end">
                  Montant
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                  {sortColumn === 'amount' && (
                    <span className="ml-1 text-xs">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer" 
                onClick={() => handleSort('category.name')}
              >
                <div className="flex items-center">
                  Catégorie
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                  {sortColumn === 'category.name' && (
                    <span className="ml-1 text-xs">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer" 
                onClick={() => handleSort('bankAccount.name')}
              >
                <div className="flex items-center">
                  Compte
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                  {sortColumn === 'bankAccount.name' && (
                    <span className="ml-1 text-xs">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Aucune transaction trouvée.
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{formatDate(transaction.date)}</TableCell>
                  <TableCell className="font-medium">{transaction.description}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell>
                    {transaction.category ? (
                      <Badge
                        variant="outline"
                        style={{
                          borderColor: transaction.category.color ?? undefined,
                          color: transaction.category.color ?? undefined,
                        }}
                      >
                        {transaction.category.name}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Aucune</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {transaction.bankAccount ? (
                      <span className="text-sm">{transaction.bankAccount.name}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {onEdit ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(transaction)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    ) : (
                      <TransactionForm
                        transaction={prepareTransactionData(transaction)}
                        mode="edit"
                        onSuccess={() => {
                          // Pas besoin d'ajouter l'invalidation ici car elle est déjà dans le composant TransactionForm
                        }}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TransactionForm>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deleteTransactionMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action est irréversible et supprimera définitivement la transaction &quot;{transaction.description}&quot; du {formatDate(transaction.date)} ({formatCurrency(transaction.amount)}).
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteTransaction(transaction.id)}
                            disabled={deleteTransactionMutation.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {deleteTransactionMutation.isPending ? 'Suppression...' : 'Supprimer'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 