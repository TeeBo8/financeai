"use client";

import React, { useState, useMemo } from 'react';
import { api } from "@/trpc/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
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
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CategoryForm } from './category-form';

// Type pour une catégorie (simple définition explicite)
type Category = {
  id: string;
  name: string;
  createdAt?: Date;
  updatedAt?: Date | null;
  color?: string;
  icon?: string | null;
  userId?: string;
};

// Colonnes triables
type SortableCategoryColumn = 'name';
type SortDirection = 'asc' | 'desc';

// --- Helper function pour le contraste ---
const getContrastColor = (hexColor: string): string => {
  if (!hexColor) return '#000000'; // Default to black if no color
  // Enlever le '#'
  const hex = hexColor.replace('#', '');
  // Convertir RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  // Calcul simple de luminance (formule YIQ)
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  // Retourner blanc ou noir selon la luminance
  return (yiq >= 128) ? '#000000' : '#FFFFFF';
};

export function CategoryList() {
  const utils = api.useUtils();
  const { data: categories, isLoading, isError, error } = api.category.getAll.useQuery();

  // State pour la dialogue de modification
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  
  // --- État pour le Tri ---
  const [sortColumn, setSortColumn] = useState<SortableCategoryColumn>('name'); // Tri par nom par défaut
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Mutation pour la suppression
  const deleteCategoryMutation = api.category.delete.useMutation({
    onSuccess: () => {
      toast.success("Catégorie supprimée !");
      void utils.category.getAll.invalidate();
      // Invalider les autres caches où le nom/id de la catégorie est utilisé
      void utils.transaction.getAll.invalidate();
      void utils.budget.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  // Handler pour ouvrir la dialogue de modif
  const handleOpenEditDialog = (category: Category) => {
    setCategoryToEdit(category);
    setIsEditOpen(true);
  };

  // Handler pour fermer la dialogue de modif (passé au form)
  const handleCloseEditDialog = () => {
    setIsEditOpen(false);
    setCategoryToEdit(null);
  };

  // Handler pour la suppression
  const handleDeleteCategory = (categoryId: string) => {
    deleteCategoryMutation.mutate({ id: categoryId });
  };
  
  // --- Logique de Tri ---
  const sortedCategories = useMemo(() => {
    if (!categories) return [];
    const sorted = [...categories];

    sorted.sort((a, b) => {
      // Pour l'instant, on ne trie que par nom
      const valA = a.name?.toLowerCase() ?? '';
      const valB = b.name?.toLowerCase() ?? '';

      let comparison = 0;
      if (valA < valB) comparison = -1;
      else if (valA > valB) comparison = 1;

      return sortDirection === 'desc' ? comparison * -1 : comparison;
    });
    return sorted;
  }, [categories, sortDirection]); // sortColumn supprimé car il est inutile pour l'instant

  // --- Handler pour changer le tri ---
  const handleSort = (column: SortableCategoryColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc'); // Toujours asc par défaut pour le nom
    }
  };

  if (isLoading) {
    return <div>Chargement des catégories...</div>;
  }

  if (isError) {
    return <div className="text-red-500">Erreur lors du chargement: {error?.message}</div>;
  }

  if (!categories || categories.length === 0) {
    return <p className="text-muted-foreground">Aucune catégorie trouvée. Commencez par en créer une !</p>;
  }

  return (
    <> {/* Utiliser un Fragment pour encapsuler Dialog et Table */}
      {/* Dialogue pour la Modification */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifier la Catégorie</DialogTitle>
            <DialogDescription>
              Modifiez le nom de la catégorie.
            </DialogDescription>
          </DialogHeader>
          {/* Le formulaire en mode édition */}
          {categoryToEdit && (
            <CategoryForm
              initialData={categoryToEdit}
              onFormSubmit={handleCloseEditDialog}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Tableau des Catégories */}
      <div className="rounded-md border mt-6"> {/* Ajout mt-6 */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('name')} className="px-2 py-1">
                  Nom {sortColumn === 'name' && <ArrowUpDown className="ml-2 h-4 w-4 inline"/>}
                </Button>
              </TableHead>
              <TableHead className="w-[50px] text-center">Icône</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCategories.map(category => (<TableRow key={category.id}>
              <TableCell className="font-medium">{category.name}</TableCell>
              <TableCell className="text-center">
                {category.icon && (
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-base"
                    style={{
                      backgroundColor: category.color ?? 'transparent',
                      color: category.color ? getContrastColor(category.color) : 'inherit',
                    }}
                  >
                    {category.icon}
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEditDialog(category)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deleteCategoryMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        La suppression de la catégorie &quot;{category.name}&quot; mettra les transactions et budgets associés en &quot;Non catégorisé&quot;. Cette action est irréversible.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteCategory(category.id)}
                        disabled={deleteCategoryMutation.isPending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleteCategoryMutation.isPending ? 'Suppression...' : 'Supprimer'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>))}
          </TableBody>
        </Table>
      </div>
    </>
  );
} 