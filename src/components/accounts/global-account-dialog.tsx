"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AccountForm } from "./account-form"; // Importer le formulaire
import { useAccountDialogStore } from "@/stores/useAccountDialogStore"; // Importer le store

export function GlobalAccountDialog() {
  // Récupérer l'état et les actions depuis le store Zustand
  const { isOpen, isEditing, closeDialog } = useAccountDialogStore();

  // Pas besoin de gérer les données ici, le formulaire le fait via le store

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier le compte" : "Ajouter un compte"}
          </DialogTitle>
          <DialogDescription>
             {isEditing
                ? "Modifiez le nom de votre compte bancaire."
                : "Ajoutez un nouveau compte pour suivre vos transactions."
             }
          </DialogDescription>
        </DialogHeader>
        {/* Intégrer le formulaire */}
        {/* Le formulaire lira isEditing et accountToEdit directement depuis le store */}
        <AccountForm />
      </DialogContent>
    </Dialog>
  );
} 