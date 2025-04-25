"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { TransferForm } from "./transfer-form"; // Importe le formulaire
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from "@/server/api/root";

type BankAccount = inferRouterOutputs<AppRouter>['bankAccount']['getAll'][number];

interface TransferFundsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: BankAccount[]; // Reçoit la liste des comptes
}

export default function TransferFundsDialog({
  isOpen,
  onClose,
  accounts,
}: TransferFundsDialogProps) {

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md"> {/* Un peu plus large */}
        <DialogHeader>
          <DialogTitle>Effectuer un Transfert</DialogTitle>
          <DialogDescription>
            Transférez des fonds entre vos comptes bancaires.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <TransferForm
            accounts={accounts} // Passe les comptes au formulaire
            onFormSubmit={onClose} // Ferme le dialogue après succès
          />
        </div>
      </DialogContent>
    </Dialog>
  );
} 