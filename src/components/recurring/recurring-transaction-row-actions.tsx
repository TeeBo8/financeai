"use client";

import { useState } from "react";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { api } from "@/trpc/react";
import { toast } from "sonner";

// Importer le type
import { type AppRouter } from "@/server/api/root";
import { type inferRouterOutputs } from '@trpc/server';
type RecurringTransactionWithRelations = inferRouterOutputs<AppRouter>['recurringTransaction']['getAll'][number];

interface RecurringTransactionRowActionsProps {
  recurring: RecurringTransactionWithRelations;
}

export function RecurringTransactionRowActions({ recurring }: RecurringTransactionRowActionsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const utils = api.useUtils();

  const deleteRecurring = api.recurringTransaction.delete.useMutation({
    onSuccess: () => {
      toast.success("Transaction récurrente supprimée.");
      void utils.recurringTransaction.getAll.invalidate();
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Erreur suppression : ${error.message}`);
      setIsDeleteDialogOpen(false);
    },
  });

  const handleDelete = () => {
    deleteRecurring.mutate({ id: recurring.id });
  };

  return (
    <>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le modèle de transaction récurrente &quot;{recurring.description}&quot; sera supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteRecurring.isPending}>
              {deleteRecurring.isPending ? "Suppression..." : "Supprimer"}
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
          <DropdownMenuItem
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-red-600 focus:text-red-700 focus:bg-red-50"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
} 