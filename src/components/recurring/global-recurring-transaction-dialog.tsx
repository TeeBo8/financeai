"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "~/components/ui/dialog";
import { RecurringTransactionForm } from "./recurring-transaction-form";
import { useRecurringTransactionDialogStore } from "~/stores/useRecurringTransactionDialogStore";

export function GlobalRecurringTransactionDialog() {
  const { isOpen, isEditing, closeDialog } = useRecurringTransactionDialogStore();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
      {/* Augmenter la largeur potentiellement car le formulaire est plus grand */}
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier la Transaction Récurrente" : "Ajouter une Transaction Récurrente"}
          </DialogTitle>
          <DialogDescription>
             {isEditing
                ? "Modifiez les détails de cette transaction récurrente."
                : "Configurez une transaction qui se répétera automatiquement."
             }
          </DialogDescription>
        </DialogHeader>
        {/* Intégrer le formulaire */}
        {/* Le formulaire lira isEditing et dataToEdit directement depuis le store */}
        <RecurringTransactionForm />
      </DialogContent>
    </Dialog>
  );
} 