"use client";

import { useTransactionDialogStore } from "~/stores/useTransactionDialogStore";
import { TransactionForm } from "~/components/transactions/transaction-form";
import { Dialog, DialogContent } from "~/components/ui/dialog";

export function GlobalTransactionDialog() {
  const { isOpen, closeDialog, mode, initialData } = useTransactionDialogStore();

  // Cette fonction sera appelée quand le formulaire est soumis avec succès
  const handleSuccess = async () => {
    // Fermer le dialogue
    closeDialog();
    
    // Toast de succès est déjà géré dans le formulaire
    
    // Invalidations et refresh sont gérés dans le formulaire
  };

  return (
    <Dialog open={isOpen} onOpenChange={closeDialog}>
      <DialogContent className="sm:max-w-[425px]">
        {/* On passe le mode et les données initiales au formulaire */}
        <TransactionForm
          key={initialData?.id ?? "new"} // Important pour forcer un re-render
          mode={mode}
          transaction={initialData}
          onSuccess={handleSuccess}
          // Les props open et onOpenChange ne sont pas nécessaires ici
          // car le Dialog parent les gère déjà
        />
      </DialogContent>
    </Dialog>
  );
} 