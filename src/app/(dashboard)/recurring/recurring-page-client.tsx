"use client";

import { Button } from "~/components/ui/button";
import { Plus } from "lucide-react";
// Importer le store
import { useRecurringTransactionDialogStore } from "~/stores/useRecurringTransactionDialogStore";
// Importer le DataTable et les colonnes
import { columns } from "~/components/recurring/columns";
import { RecurringTransactionsDataTable } from "~/components/recurring/recurring-transactions-data-table";
// Importer le type de données
import { type AppRouter } from '~/server/api/root';
import { type inferRouterOutputs } from '@trpc/server';

type RecurringTransactionWithRelations = inferRouterOutputs<AppRouter>['recurringTransaction']['getAll'][number];

interface RecurringPageClientProps {
  recurringModels: RecurringTransactionWithRelations[];
}

export default function RecurringPageClient({ recurringModels }: RecurringPageClientProps) {
  const { openCreateDialog } = useRecurringTransactionDialogStore();

  const handleNewRecurring = () => {
    // Utiliser le store pour ouvrir le dialogue
    openCreateDialog();
  };

  return (
    <>
      {/* Barre d'outils */}
      <div className="mb-4 flex items-center justify-between">
        <Button onClick={handleNewRecurring} className="ml-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nouveau modèle
        </Button>
      </div>

      {/* Intégration du DataTable */}
      <RecurringTransactionsDataTable data={recurringModels} columns={columns} />
    </>
  );
} 