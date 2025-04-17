"use client";

import React from "react";
import { MoreHorizontal } from "lucide-react"; 
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { useTransactionDialogStore } from "~/stores/useTransactionDialogStore";
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
import type { TransactionWithRelations } from "~/lib/types";
import type { TransactionData } from "~/components/transactions/transaction-form";

interface TransactionRowActionsProps {
  transaction: TransactionWithRelations;
}

export function TransactionRowActions({ transaction }: TransactionRowActionsProps) {
  const utils = api.useUtils();
  const router = useRouter();

  // --- Gestion du Dialogue de Modification (avec Zustand) ---
  const { openDialog: openEditDialog } = useTransactionDialogStore();

  // Prépare les données pour le formulaire d'édition
  const prepareTransactionData = (transaction: TransactionWithRelations): TransactionData => ({
    id: transaction.id,
    amount: typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : Number(transaction.amount),
    description: transaction.description,
    date: new Date(transaction.date),
    categoryId: transaction.categoryId,
    bankAccountId: transaction.bankAccountId,
  });

  const handleEdit = () => {
    // Ouvre le dialogue d'édition en passant la transaction initiale et en spécifiant showAddAndNew: false
    openEditDialog(prepareTransactionData(transaction), { showAddAndNew: false });
  };
  // --- Fin Gestion Dialogue Modification ---

  // --- Gestion de la Suppression ---
  const [showDeleteAlert, setShowDeleteAlert] = React.useState(false);

  const deleteMutation = api.transaction.delete.useMutation({
    onSuccess: async () => {
      toast.success("Transaction supprimée avec succès");
      
      // Invalider les caches qui dépendent des transactions
      await utils.transaction.getAll.invalidate();
      await utils.budget.getAll.invalidate();
      await utils.dashboard.getTotalBalance.invalidate();
      await utils.dashboard.getCurrentMonthSummary.invalidate();
      await utils.bankAccount.getAll.invalidate();
      await utils.report.invalidate();
      
      setShowDeleteAlert(false); // Ferme l'alerte
      
      // Rafraîchir les composants du serveur
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message || "Impossible de supprimer la transaction");
      setShowDeleteAlert(false);
    },
  });

  const handleDeleteConfirm = () => {
    deleteMutation.mutate({ id: transaction.id });
  };
  // --- Fin Gestion Suppression ---

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Ouvrir menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          {/* Option Modifier */}
          <DropdownMenuItem onClick={handleEdit}>Modifier</DropdownMenuItem>
          <DropdownMenuSeparator />
          {/* Option Supprimer (ouvre l'AlertDialog) */}
          <DropdownMenuItem
            className="text-destructive focus:text-destructive focus:bg-destructive/10"
            onSelect={(event) => {
              event.preventDefault(); // Empêche la fermeture auto du Dropdown
              setShowDeleteAlert(true); // Ouvre l'AlertDialog
            }}
          >
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialogue de Confirmation de Suppression */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible et supprimera définitivement la transaction &quot;{transaction.description}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 