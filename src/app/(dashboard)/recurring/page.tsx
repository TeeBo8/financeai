import { api } from "@/trpc/server";
import RecurringPageClient from "./recurring-page-client";
// Importer un Skeleton pour le DataTable (à créer si besoin)
// import { DataTableSkeleton } from "@/components/ui/data-table-skeleton";

export const metadata = {
  title: "Transactions Récurrentes - FinanceAI",
  description: "Gérez vos revenus et dépenses récurrents.",
};

// PAS de "use client" ici

export default async function RecurringTransactionsPage() {
  // Fetch initial des modèles récurrents
  const recurringModels = await api.recurringTransaction.getAll({});

  return (
    <section className="container grid items-center gap-6 pb-8 pt-6 md:py-8">
      <div className="flex max-w-[980px] flex-col gap-2">
        <h1 className="text-2xl font-bold leading-tight tracking-tighter md:text-3xl">
          Transactions Récurrentes
        </h1>
        <p className="text-muted-foreground">
          Gérez vos modèles de transactions récurrentes ici.
        </p>
      </div>
      
      <div className="mt-6"> {/* Ajouter un peu d'espace */}
        {/* Utiliser Suspense pour un meilleur UX pendant le chargement client */}
        {/* <Suspense fallback={<DataTableSkeleton columnCount={6} />}> */}
          <RecurringPageClient recurringModels={recurringModels} />
        {/* </Suspense> */}
      </div>
      
      {/* Le dialogue global sera rendu via ClientLayout */}
    </section>
  );
} 