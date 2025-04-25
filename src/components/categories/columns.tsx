"use client";

import React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { CategoryRowActions } from "./category-row-actions";

// Type pour les catégories venant de l'API TRPC
import { type AppRouter } from "@/server/api/root";
import { type inferRouterOutputs } from '@trpc/server';
type RouterOutput = inferRouterOutputs<AppRouter>;
type Category = RouterOutput['category']['getAll'][number];

export const columns: ColumnDef<Category>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nom" />
    ),
    cell: ({ row }) => {
      const color = row.original.color;
      const icon = row.original.icon;
      return (
        <div className="flex items-center space-x-2">
          {color && (
            <span
              className="inline-block h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: color }}
              aria-hidden="true"
            />
          )}
          {icon && <span className="text-xs mr-1 shrink-0">{icon}</span>}
          <span className="font-medium truncate">{row.getValue("name")}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "color",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Couleur" />
    ),
    cell: ({ row }) => {
      const colorValue = row.getValue("color");
      
      // Préparer un style sûr
      const style = colorValue ? { backgroundColor: colorValue as string } : {};
      
      return colorValue ? (
        <div className="flex justify-center">
          <span
            className="inline-block h-2 w-8 rounded"
            style={style}
            aria-label="Couleur"
          />
        </div>
      ) : "—";
    },
    enableSorting: false,
    enableHiding: true,
  },
  {
    accessorKey: "icon",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Icône" />
    ),
    cell: ({ row }) => {
      const iconValue = row.getValue("icon");
      
      // Désactiver l'erreur ESLint pour cette conversion spécifique
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      const displayContent = iconValue ? String(iconValue) : "—";
      
      return (
        <div className="text-center text-lg">
          {displayContent}
        </div>
      );
    },
    enableSorting: false,
    enableHiding: true,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const category = row.original;
      return <CategoryRowActions category={category} />;
    },
    enableSorting: false,
    enableHiding: false,
  },
]; 