"use client";

import { DataTable } from "~/components/ui/data-table";
import { columns } from "./columns";
import type { TransactionWithRelations } from "~/lib/types";

interface TransactionsDataTableProps {
  transactions: TransactionWithRelations[];
}

export function TransactionsDataTable({ transactions }: TransactionsDataTableProps) {
  return (
    <DataTable
      columns={columns}
      data={transactions}
      initialSorting={[{ id: "date", desc: true }]} // Tri par défaut : date décroissante
      enablePagination={true}
      pageSize={10}
    />
  );
} 