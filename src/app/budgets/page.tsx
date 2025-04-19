import { Suspense } from "react";
import { api } from "~/trpc/server";
import { Button } from "~/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BudgetsPage() {
  const budgets = await api.budget.getAll();

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Budgets</h1>
          <p className="text-sm text-muted-foreground">
            Suivez vos dépenses et respectez vos objectifs budgétaires.
          </p>
        </div>
        <Link href="/budgets/new">
          <Button className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            <span>Nouveau Budget</span>
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {budgets.length === 0 ? (
          <div className="col-span-full p-8 text-center border rounded-lg">
            <h3 className="font-medium">Aucun budget trouvé</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Créez votre premier budget pour commencer à suivre vos dépenses.
            </p>
          </div>
        ) : (
          budgets.map((budget: any) => (
            <div key={budget.id} className="p-4 border rounded-lg">
              <h3 className="font-bold">{budget.name}</h3>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Montant:</p>
                  <p className="font-medium">{budget.amount} €</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Période:</p>
                  <p className="font-medium">{budget.period === "MONTHLY" ? "Mensuel" : "Annuel"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Dépensé:</p>
                  <p className="font-medium">{budget.spentAmount} €</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Restant:</p>
                  <p className="font-medium">{budget.remainingAmount} €</p>
                </div>
              </div>
              {budget.categoryDisplay && (
                <div className="mt-2">
                  <p className="text-muted-foreground text-sm">Catégories:</p>
                  <p className="text-sm">{budget.categoryDisplay}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
} 