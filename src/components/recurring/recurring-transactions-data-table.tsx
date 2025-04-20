"use client";

import * as React from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { DataTablePagination } from "~/components/ui/data-table-pagination";
import { DataTableViewOptions } from "~/components/ui/data-table-view-options";
// Importer le type de données
import { type AppRouter } from '~/server/api/root';
import { type inferRouterOutputs } from '@trpc/server';
type RecurringTransactionWithRelations = inferRouterOutputs<AppRouter>['recurringTransaction']['getAll'][number];


interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

// Renommer le composant
export function RecurringTransactionsDataTable<TData extends RecurringTransactionWithRelations, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({});
  // État pour la visibilité des colonnes (utilisé par DataTableViewOptions)
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
      // Masquer la colonne 'endDate' par défaut par exemple ?
      "endDate": false,
  });
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  // Trier par prochaine occurrence par défaut ?
  const [sorting, setSorting] = React.useState<SortingState>([
      { id: 'nextOccurrenceDate', desc: false } // false = ascendant (plus proche en premier)
  ]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: false, // Pas besoin de sélectionner les lignes pour l'instant
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility, // Gérer les changements de visibilité
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(), // Activer le filtrage (on ajoutera les inputs plus tard si besoin)
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(), // Utile pour les filtres à facettes futurs
    getFacetedUniqueValues: getFacetedUniqueValues(), // Utile pour les filtres à facettes futurs
  });

  return (
    <div className="space-y-4">
       {/* Barre d'outils (on pourrait ajouter des filtres ici plus tard) */}
       <div className="flex items-center">
            {/* <Input placeholder="Filtrer par description..."
               value={(table.getColumn("description")?.getFilterValue() as string) ?? ""}
               onChange={(event) => table.getColumn("description")?.setFilterValue(event.target.value)}
               className="max-w-sm"
            /> */}
           <DataTableViewOptions table={table} />
       </div>
       {/* La table */}
       <div className="rounded-md border">
           <Table>
               <TableHeader>
                   {table.getHeaderGroups().map((headerGroup) => (
                       <TableRow key={headerGroup.id}>
                           {headerGroup.headers.map((header) => {
                               return (
                                   <TableHead key={header.id} colSpan={header.colSpan}>
                                       {header.isPlaceholder
                                           ? null
                                           : flexRender(
                                               header.column.columnDef.header,
                                               header.getContext()
                                           )}
                                   </TableHead>
                               );
                           })}
                       </TableRow>
                   ))}
               </TableHeader>
               <TableBody>
                   {table.getRowModel().rows?.length ? (
                       table.getRowModel().rows.map((row) => (
                           <TableRow
                               key={row.id}
                               data-state={row.getIsSelected() && "selected"}
                           >
                               {row.getVisibleCells().map((cell) => (
                                   <TableCell key={cell.id}>
                                       {flexRender(
                                           cell.column.columnDef.cell,
                                           cell.getContext()
                                       )}
                                   </TableCell>
                               ))}
                           </TableRow>
                       ))
                   ) : (
                       <TableRow>
                           <TableCell
                               colSpan={columns.length}
                               className="h-24 text-center"
                           >
                               Aucune transaction récurrente trouvée.
                           </TableCell>
                       </TableRow>
                   )}
               </TableBody>
           </Table>
       </div>
       {/* Pagination */}
       <DataTablePagination table={table} />
    </div>
  );
} 