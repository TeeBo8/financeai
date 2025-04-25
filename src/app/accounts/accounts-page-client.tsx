"use client";

import { Button } from "@/components/ui/button";
import { PlusCircle, ArrowRightLeft } from "lucide-react";
import { useState } from "react";
import { AccountsDataTable } from "@/components/accounts/accounts-data-table";
import TransferFundsDialog from "@/components/transfers/transfer-funds-dialog";
import { useAccountDialogStore } from "@/stores/useAccountDialogStore";

// Utilise le type retourné par la procédure tRPC
import { type AppRouter } from "@/server/api/root";
import { type inferRouterOutputs } from '@trpc/server';
type RouterOutput = inferRouterOutputs<AppRouter>;
type AccountWithBalance = RouterOutput['bankAccount']['getAll'][number];

interface AccountsPageClientProps {
  accounts: AccountWithBalance[];
}

export function AccountsPageClient({ accounts }: AccountsPageClientProps) {
  // État pour gérer le dialogue de transfert
  const [isTransferFormOpen, setIsTransferFormOpen] = useState(false);
  
  // Utiliser le store pour gérer l'état du dialogue de compte
  const { openCreateDialog } = useAccountDialogStore();

  const handleOpenTransferDialog = () => {
    setIsTransferFormOpen(true);
  };

  const handleCloseTransferDialog = () => {
    setIsTransferFormOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <h1 className="text-2xl font-semibold">Comptes Bancaires</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleOpenTransferDialog}>
            <ArrowRightLeft className="mr-2 h-4 w-4" /> Effectuer un Transfert
          </Button>
          <Button onClick={openCreateDialog}>
            <PlusCircle className="mr-2 h-4 w-4" /> Ajouter un compte
          </Button>
        </div>
        
        {/* Intégration du dialogue de transfert */}
        <TransferFundsDialog
          isOpen={isTransferFormOpen}
          onClose={handleCloseTransferDialog}
          accounts={accounts}
        />
      </div>

      {accounts.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground">
            Utilisez le tableau ci-dessous pour gérer vos comptes bancaires.
            <span className="block text-xs text-destructive">(Note: La suppression d&apos;un compte n&apos;est possible que s&apos;il n&apos;a aucune transaction associée.)</span>
          </p>
          <AccountsDataTable accounts={accounts} />
        </>
      ) : (
        <div className="mt-6 flex flex-col items-center justify-center rounded-md border border-dashed p-10 text-center">
          <p className="text-muted-foreground">Vous n&apos;avez pas encore ajouté de compte bancaire.</p>
          <Button onClick={openCreateDialog} className="mt-4">
            <PlusCircle className="mr-2 h-4 w-4" /> Ajouter votre premier compte
          </Button>
        </div>
      )}
    </div>
  );
} 