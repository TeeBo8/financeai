"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale"; // Import French locale for date formatting
import { api } from "~/trpc/react"; // Import tRPC hook
import { toast } from "sonner"; // For notifications
import type { inferRouterOutputs } from '@trpc/server'; // Helper for types
import type { AppRouter } from '~/server/api/root'; // Your main AppRouter type
import { cn } from "~/lib/utils"; // Import cn

// Infer the type of a single bank account from the router output
type BankAccount = inferRouterOutputs<AppRouter>['bankAccount']['getAll'][number];

interface BankAccountListProps {
  accounts: BankAccount[];
  onEdit: (account: BankAccount) => void; // Function to trigger edit mode in parent
}

// Helper pour formater la devise (tu peux le mettre dans un fichier utils si utilisé ailleurs)
const formatCurrency = (amount: string | number | null | undefined): string => {
    if (amount === null || amount === undefined) return '';
    // La balance arrive en string depuis notre requête SQL
    const numberAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numberAmount)) return ''; // Gère le cas où la chaîne n'est pas un nombre valide
    return numberAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
};

export default function BankAccountList({ accounts, onEdit }: BankAccountListProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [accountIdToDelete, setAccountIdToDelete] = useState<string | null>(null);

  const utils = api.useUtils(); // Get tRPC utils for cache invalidation

  // tRPC mutation hook for deleting an account
  const deleteMutation = api.bankAccount.delete.useMutation({
    onSuccess: (data) => {
      toast.success(`Compte bancaire "${getAccountNameById(data.id)}" supprimé avec succès.`);
      // Invalidate the cache for bankAccount.getAll to refetch the list
      void utils.bankAccount.getAll.invalidate();
      setIsDeleteDialogOpen(false); // Close the dialog
      setAccountIdToDelete(null); // Reset the ID
    },
    onError: (error) => {
      toast.error(`Erreur lors de la suppression : ${error.message}`);
      setIsDeleteDialogOpen(false); // Close the dialog anyway
      setAccountIdToDelete(null); // Reset the ID
    },
  });

  // Helper to get account name for toast message (since mutation only returns ID)
  const getAccountNameById = (id: string | null): string => {
      if (!id) return "";
      const account = accounts.find(acc => acc.id === id);
      return account ? account.name : `ID ${id}`;
  }

  const handleDeleteClick = (accountId: string) => {
    setAccountIdToDelete(accountId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (accountIdToDelete) {
      deleteMutation.mutate({ id: accountIdToDelete });
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Nom du Compte</TableHead>
              <TableHead className="w-[25%] text-right">Solde Actuel</TableHead>
              <TableHead className="w-[20%]">Date de Création</TableHead>
              <TableHead className="w-[15%] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell className="font-medium">{account.name}</TableCell>
                <TableCell className={cn(
                    "text-right font-medium",
                    parseFloat(account.balance) < 0 ? "text-red-600" : "text-green-600" // Couleur selon positif/négatif
                 )}>
                   {formatCurrency(account.balance)}
                </TableCell>
                <TableCell>
                  {format(new Date(account.createdAt), "dd MMM yyyy", { locale: fr })} {/* Format plus court */}
                </TableCell>
                <TableCell className="text-right">
                  <TooltipProvider delayDuration={100}>
                    <div className="flex items-center justify-end space-x-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => onEdit(account)}
                            aria-label="Modifier le compte"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Modifier</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteClick(account.id)}
                            disabled={deleteMutation.isPending && accountIdToDelete === account.id}
                            aria-label="Supprimer le compte"
                          >
                            {deleteMutation.isPending && accountIdToDelete === account.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Supprimer</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            ))}
            
            {accounts.length === 0 && (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        Aucun compte bancaire trouvé.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Alert Dialog for Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer ce compte ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La suppression du compte bancaire entraînera
              également la suppression de **toutes les transactions** associées à ce compte.
              <br />
              Compte : <strong>{getAccountNameById(accountIdToDelete)}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAccountIdToDelete(null)}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Supprimer Définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 