import { Suspense } from "react";
import { SubscriptionsClient } from "./subscriptions-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SubscriptionsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Mes Abonnements</h1>
        <p className="text-muted-foreground">
          Gérez vos abonnements et services récurrents ici.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    <Skeleton className="h-4 w-[100px]" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    <Skeleton className="h-8 w-[100px]" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        }
      >
        <SubscriptionsClient />
      </Suspense>
    </div>
  );
} 