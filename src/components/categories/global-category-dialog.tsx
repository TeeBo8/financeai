"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CategoryForm } from "./category-form";
import { useCategoryDialogStore } from "@/stores/useCategoryDialogStore";

export function GlobalCategoryDialog() {
  // Récupérer l'état et les actions depuis le store Zustand
  const { isOpen, isEditing, closeDialog } = useCategoryDialogStore();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier la catégorie" : "Ajouter une catégorie"}
          </DialogTitle>
          <DialogDescription>
             {isEditing
                ? "Modifiez les informations de votre catégorie."
                : "Ajoutez une nouvelle catégorie pour classer vos transactions."
             }
          </DialogDescription>
        </DialogHeader>
        {/* Intégrer le formulaire */}
        <CategoryForm />
      </DialogContent>
    </Dialog>
  );
} 