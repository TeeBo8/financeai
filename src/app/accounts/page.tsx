"use server";

import { api } from "~/trpc/server";
import { AccountsPageClient } from "./accounts-page-client";

export default async function AccountsPage() {
  // Récupération des données côté serveur
  const accounts = await api.bankAccount.getAll();

  return (
    <div className="p-4 md:p-6">
      <AccountsPageClient accounts={accounts} />
    </div>
  );
} 