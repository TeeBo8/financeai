"use client";

import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";

// Utilise le type retourné par la procédure tRPC
import { type AppRouter } from "@/server/api/root";
import { type inferRouterOutputs } from '@trpc/server';
type RouterOutput = inferRouterOutputs<AppRouter>;
type AccountWithBalance = RouterOutput['bankAccount']['getAll'][number];

interface AccountsDataTableProps {
  accounts: AccountWithBalance[];
}

export function AccountsDataTable({ accounts }: AccountsDataTableProps) {
  return (
    <DataTable
      columns={columns}
      data={accounts}
      initialSorting={[{ id: "balance", desc: true }]} // Tri par défaut : solde décroissant
      enablePagination={true}
      pageSize={10}
    />
  );
} 