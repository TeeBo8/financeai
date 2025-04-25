"use client";

import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import type { RecurringTransactionWithRelations } from "@/lib/types";

interface RecurringTransactionsDataTableProps {
  data: RecurringTransactionWithRelations[];
}

export function RecurringTransactionsDataTable({ data }: RecurringTransactionsDataTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      initialSorting={[{ id: "nextOccurrenceDate", desc: false }]}
      enablePagination={true}
      pageSize={10}
    />
  );
} 