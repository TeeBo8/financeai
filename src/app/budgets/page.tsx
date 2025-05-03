"use client";

import { Suspense } from "react";
import { api } from "@/trpc/react";
import BudgetsClient from "./budgets-client";

export default function BudgetsPage() {
  // Extraire les données du budget à l'aide de tRPC
  const { data: budgets = [] } = api.budget.getAll.useQuery();

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Budgets</h2>
          <p className="text-muted-foreground">
            Créez et gérez vos budgets pour mieux contrôler vos dépenses.
          </p>
        </div>
      </div>

      <Suspense fallback={<div>Chargement des budgets...</div>}>
        <BudgetsClient budgets={budgets} />
      </Suspense>
    </div>
  );
} 