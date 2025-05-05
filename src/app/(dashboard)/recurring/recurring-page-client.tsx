"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
// Importer le store
import { useRecurringTransactionDialogStore } from "@/stores/useRecurringTransactionDialogStore";
// Importer le DataTable
import { RecurringTransactionsDataTable } from "@/components/recurring/recurring-transactions-data-table";
// Importer le type de données
import { type RecurringTransactionWithRelations } from "@/lib/types";

interface RecurringPageClientProps {
  recurringModels: RecurringTransactionWithRelations[];
}

export default function RecurringPageClient({ recurringModels }: RecurringPageClientProps) {
  const { openDialog } = useRecurringTransactionDialogStore();

  const handleNewRecurring = () => {
    // Utiliser le store pour ouvrir le dialogue
    openDialog();
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
      <RecurringTransactionsDataTable data={recurringModels} />
    </>
  );
} 