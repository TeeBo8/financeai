"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
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
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { formatCurrency } from "~/lib/utils";

// Récupérer le type avec balance si besoin (normalement pas nécessaire ici, l'ID suffit)
import { type AppRouter } from '~/server/api/root';
import { type inferRouterOutputs } from '@trpc/server';
type RouterOutput = inferRouterOutputs<AppRouter>;
type AccountWithBalance = RouterOutput['bankAccount']['getAll'][number];

interface AccountRowActionsProps {
  account: AccountWithBalance; // Utiliser le type avec balance si passé, sinon juste Account
}

export function AccountRowActions({ account }: AccountRowActionsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const utils = api.useUtils(); // Pour invalider les données après suppression

  const deleteAccount = api.bankAccount.delete.useMutation({
    onSuccess: () => {
      toast.success("Compte supprimé avec succès !");
      // Invalider les données pour rafraîchir la table et potentiellement le dashboard
      void utils.bankAccount.getAll.invalidate();
      void utils.dashboard.getTotalBalance.invalidate(); // Le solde total change
      // Pas besoin de router.refresh() si l'invalidation suffit à react-query pour mettre à jour
      setIsDeleteDialogOpen(false); // Fermer l'alerte de confirmation
    },
    onError: (error) => {
      toast.error(`Erreur lors de la suppression : ${error.message}`);
      setIsDeleteDialogOpen(false); // Fermer l'alerte même en cas d'erreur
    },
  });

  const handleDelete = () => {
    deleteAccount.mutate({ id: account.id });
  };

  const handleEdit = () => {
    // TODO: Implémenter l'ouverture du dialogue d'édition de compte
    console.log("Modifier le compte :", account.id);
    toast.info("Fonctionnalité 'Modifier' à implémenter.");
  };

  return (
    <>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le compte &quot;{account.name}&quot; sera supprimé définitivement.
              {account.balance !== "0.00" && (
                <span className="mt-2 block font-semibold text-destructive">
                  Attention : Ce compte a un solde de {formatCurrency(parseFloat(account.balance))}. La suppression entraînera la perte de ces données.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteAccount.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteAccount.isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Ouvrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Modifier
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-red-600 focus:text-red-700 focus:bg-red-50" // Style pour la suppression
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
} 