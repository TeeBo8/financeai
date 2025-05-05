"use client";

import { api } from "@/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecurringTransactionsDataTable } from "@/components/recurring/recurring-transactions-data-table";

export function SubscriptionsClient() {
  // Récupérer les transactions récurrentes marquées comme abonnements
  const { data: subscriptionRecurring = [] } = api.recurringTransaction.getAll.useQuery({
    isSubscription: true,
  });

  // Calculer les statistiques
  const totalSubscriptions = subscriptionRecurring.length;
  const totalMonthlyAmount = subscriptionRecurring.reduce((sum, t) => {
    if (t.frequency === "MONTHLY") return sum + Math.abs(Number(t.amount));
    if (t.frequency === "YEARLY") return sum + Math.abs(Number(t.amount)) / 12;
    return sum;
  }, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total des abonnements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubscriptions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Montant mensuel total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalMonthlyAmount.toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR",
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {subscriptionRecurring.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Aucun abonnement défini dans vos transactions récurrentes.
          </div>
        ) : (
          <RecurringTransactionsDataTable data={subscriptionRecurring} />
        )}
      </div>
    </div>
  );
} 