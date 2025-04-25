"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  // DialogFooter, // Pas nécessaire ici, le formulaire a son bouton
} from "@/components/ui/dialog";
import { AccountForm } from "./account-form"; // Importe notre formulaire
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from "@/server/api/root";

type AccountWithBalance = inferRouterOutputs<AppRouter>['bankAccount']['getAll'][number];

interface AddAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  accountToEdit?: AccountWithBalance | null;
}

export default function AddAccountDialog({
  isOpen,
  onClose,
  accountToEdit,
}: AddAccountDialogProps) {

  // Détermine le titre et la description en fonction du mode (ajout ou édition)
  const title = accountToEdit ? "Modifier le compte bancaire" : "Ajouter un nouveau compte bancaire";
  const description = accountToEdit
    ? "Modifiez les informations de votre compte ci-dessous."
    : "Entrez le nom de votre nouveau compte bancaire.";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <AccountForm
            accountToEdit={accountToEdit}
            onFormSubmit={onClose} // Passe la fonction onClose pour fermer le dialogue après succès
          />
        </div>
      </DialogContent>
    </Dialog>
  );
} 