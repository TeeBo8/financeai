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
import { useCategoryDialogStore } from "~/stores/useCategoryDialogStore";

// Type pour les catégories venant de l'API TRPC
import { type AppRouter } from '~/server/api/root';
import { type inferRouterOutputs } from '@trpc/server';
type RouterOutput = inferRouterOutputs<AppRouter>;
type Category = RouterOutput['category']['getAll'][number];

interface CategoryRowActionsProps {
  category: Category;
}

export function CategoryRowActions({ category }: CategoryRowActionsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { openEditDialog } = useCategoryDialogStore();

  const utils = api.useUtils(); // Pour invalider les données après suppression

  const deleteCategory = api.category.delete.useMutation({
    onSuccess: () => {
      toast.success("Catégorie supprimée avec succès !");
      // Invalider les données pour rafraîchir les listes
      void utils.category.getAll.invalidate();
      // Potentiellement les transactions et budgets qui utilisent cette catégorie
      void utils.transaction.getAll.invalidate();
      void utils.budget.getAll.invalidate();
      setIsDeleteDialogOpen(false); // Fermer l'alerte de confirmation
    },
    onError: (error) => {
      toast.error(`Erreur lors de la suppression : ${error.message}`);
      setIsDeleteDialogOpen(false); // Fermer l'alerte même en cas d'erreur
    },
  });

  const handleDelete = () => {
    deleteCategory.mutate({ id: category.id });
  };

  const handleEdit = () => {
    openEditDialog(category);
  };

  return (
    <>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La catégorie &quot;{category.name}&quot; sera supprimée définitivement.
              <span className="mt-2 block font-semibold">
                Note : Si des transactions utilisent cette catégorie, l&apos;opération sera bloquée.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteCategory.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCategory.isPending ? "Suppression..." : "Supprimer"}
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