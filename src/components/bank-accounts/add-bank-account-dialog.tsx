"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  // DialogFooter, // Pas nécessaire ici, le formulaire a son bouton
} from "~/components/ui/dialog";
import { BankAccountForm } from "./bank-account-form"; // Importe notre formulaire
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '~/server/api/root';

type BankAccount = inferRouterOutputs<AppRouter>['bankAccount']['getAll'][number];

interface AddBankAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  accountToEdit?: BankAccount | null;
}

export default function AddBankAccountDialog({
  isOpen,
  onClose,
  accountToEdit,
}: AddBankAccountDialogProps) {

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
          <BankAccountForm
            accountToEdit={accountToEdit}
            onFormSubmit={onClose} // Passe la fonction onClose pour fermer le dialogue après succès
          />
        </div>
        {/*
        <DialogFooter>
           Pas besoin de footer si le bouton est dans le formulaire
        </DialogFooter>
        */}
      </DialogContent>
    </Dialog>
  );
} 