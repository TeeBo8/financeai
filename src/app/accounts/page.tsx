"use client";

import React from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { PlusCircle, ArrowRightLeft } from "lucide-react";
import BankAccountList from "~/components/bank-accounts/bank-account-list";
// Importer le dialogue
import AddBankAccountDialog from "~/components/bank-accounts/add-bank-account-dialog";
// Importer le dialogue de transfert
import TransferFundsDialog from "~/components/transfers/transfer-funds-dialog";
// Typage pour accountToEdit
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '~/server/api/root';
import { Skeleton } from "~/components/ui/skeleton";

type BankAccount = inferRouterOutputs<AppRouter>['bankAccount']['getAll'][number];

export default function BankAccountsPage() {
  // Hook tRPC pour récupérer tous les comptes bancaires
  const { data: accounts, isLoading, error, refetch } = api.bankAccount.getAll.useQuery();

  // État pour gérer l'ouverture du dialogue d'ajout/modification
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingAccount, setEditingAccount] = React.useState<BankAccount | null>(null);
  // État pour gérer l'ouverture du dialogue de transfert
  const [isTransferFormOpen, setIsTransferFormOpen] = React.useState(false);

  const handleOpenAddDialog = () => {
    setEditingAccount(null); // Assure qu'on est en mode création
    setIsFormOpen(true);
  };

  // Fonctions pour ouvrir en mode édition et fermer le dialogue (seront passées au composant Liste)
  const handleOpenEditDialog = (account: BankAccount) => {
    setEditingAccount(account); // Met le compte à éditer
    setIsFormOpen(true); // Ouvre le dialogue
    console.log("Should open edit dialog for:", account);
  };

  const handleCloseDialog = () => {
    setIsFormOpen(false);
    // Optionnel: léger délai avant de reset pour éviter un flash si l'anim de fermeture est visible
    // setTimeout(() => setEditingAccount(null), 150);
    setEditingAccount(null); // Nettoyer l'état après fermeture
  };

  // Handlers pour le dialogue de transfert
  const handleOpenTransferDialog = () => {
    setIsTransferFormOpen(true);
  };

  const handleCloseTransferDialog = () => {
    setIsTransferFormOpen(false);
  };

  // Gestion de l'affichage pendant le chargement
  if (isLoading) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Comptes Bancaires</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="rounded-md border">
          {/* Skeleton pour le header de la table */}
          <div className="grid grid-cols-[40%_25%_20%_15%] h-12 items-center border-b px-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-1/2 justify-self-end" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-1/2 justify-self-end" />
          </div>
          {/* Skeleton pour quelques lignes de la table */}
          {Array.from({ length: 3 }).map((_, i) => (
             <div key={i} className="grid grid-cols-[40%_25%_20%_15%] h-14 items-center border-b px-4 last:border-b-0">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-5 w-1/3 justify-self-end" />
                <Skeleton className="h-5 w-1/2" />
                <div className="flex justify-self-end space-x-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
          ))}
        </div>
      </div>
    );
  }

  // Gestion de l'erreur
  if (error) {
    return (
      <div className="p-4 text-red-600 md:p-6">
        Erreur lors du chargement des comptes : {error.message}
        <Button onClick={() => void refetch()} className="ml-4">Réessayer</Button>
      </div>
    );
  }

  // Affichage principal une fois les données chargées
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <h1 className="text-2xl font-semibold">Comptes Bancaires</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleOpenTransferDialog}>
            <ArrowRightLeft className="mr-2 h-4 w-4" /> Effectuer un Transfert
          </Button>
          <Button onClick={handleOpenAddDialog}>
            <PlusCircle className="mr-2 h-4 w-4" /> Ajouter un compte
          </Button>
        </div>
        {/* Intégrer le composant AddBankAccountDialog ici */}
        <AddBankAccountDialog
          isOpen={isFormOpen}
          onClose={handleCloseDialog}
          accountToEdit={editingAccount}
        />
        {/* Dialogue de transfert */}
        <TransferFundsDialog
          isOpen={isTransferFormOpen}
          onClose={handleCloseTransferDialog}
          accounts={accounts ?? []}
        />
      </div>

      {accounts && accounts.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground">
            Cliquez sur un compte pour voir les options.
            <span className="block text-xs text-destructive"> (Note: La suppression d&apos;un compte supprime aussi toutes ses transactions associées.)</span>
          </p>
          <BankAccountList accounts={accounts} onEdit={handleOpenEditDialog} />
        </>
      ) : (
        <div className="mt-6 flex flex-col items-center justify-center rounded-md border border-dashed p-10 text-center">
          <p className="text-muted-foreground">Vous n&apos;avez pas encore ajouté de compte bancaire.</p>
          <Button onClick={handleOpenAddDialog} className="mt-4">
            <PlusCircle className="mr-2 h-4 w-4" /> Ajouter votre premier compte
          </Button>
        </div>
      )}
    </div>
  );
} 