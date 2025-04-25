"use client";

import { useTransactionDialogStore } from "@/stores/useTransactionDialogStore";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function GlobalTransactionDialog() {
  const { isOpen, closeDialog, mode, initialData, showAddAndNewButton } = useTransactionDialogStore();

  return (
    <Dialog open={isOpen} onOpenChange={closeDialog}>
      <DialogContent className="sm:max-w-lg">
        {/* On passe le mode et les données initiales au formulaire */}
        <TransactionForm
          key={initialData?.id ?? mode ?? "new"} // Important pour forcer un re-render, inclure le mode
          mode={mode}
          transaction={initialData}
          showAddAndNewButton={showAddAndNewButton}
        />
      </DialogContent>
    </Dialog>
  );
} 