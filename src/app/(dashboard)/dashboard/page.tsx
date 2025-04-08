import type { Metadata } from "next";
import { auth } from "~/server/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Tableau de bord - FinanceAI",
  description: "Gérez vos finances personnelles avec FinanceAI",
};

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session) {
    redirect("/");
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Tableau de bord</h1>
      <p className="text-muted-foreground">
        Bienvenue sur votre tableau de bord FinanceAI
      </p>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6 pb-2">
            <h3 className="text-sm font-medium">Solde total</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">3,240.50 €</div>
            <p className="text-xs text-muted-foreground">+20.1% par rapport au mois dernier</p>
          </div>
        </div>
        
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6 pb-2">
            <h3 className="text-sm font-medium">Dépenses du mois</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">1,345.20 €</div>
            <p className="text-xs text-muted-foreground">-5.3% par rapport au mois dernier</p>
          </div>
        </div>
        
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6 pb-2">
            <h3 className="text-sm font-medium">Revenus du mois</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">4,550.00 €</div>
            <p className="text-xs text-muted-foreground">+2.5% par rapport au mois dernier</p>
          </div>
        </div>
        
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6 pb-2">
            <h3 className="text-sm font-medium">Économies</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">10,540.80 €</div>
            <p className="text-xs text-muted-foreground">+8.1% par rapport au mois dernier</p>
          </div>
        </div>
      </div>
    </div>
  );
} 