"use client"

import { type Table, type Column } from "@tanstack/react-table"
import { Settings2 } from "lucide-react"

import { Button } from "~/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"

// Interface pour définir les props attendues par le composant
interface DataTableViewOptionsProps<TData> {
  table: Table<TData> // Reçoit l'instance de la table TanStack
}

// Le composant fonctionnel générique
export function DataTableViewOptions<TData>({
  table,
}: DataTableViewOptionsProps<TData>) {
  // Fonction helper pour obtenir un nom lisible pour l'en-tête de colonne
  const getHeaderName = (column: Column<TData, unknown>): string => {
    // Si le header est défini comme une simple chaîne, on la retourne
    if (typeof column.columnDef.header === 'string') {
      return column.columnDef.header;
    }
    // Sinon, on retourne l'ID de la colonne comme fallback sûr
    return column.id;
  }

  return (
    <DropdownMenu>
      {/* Le bouton qui ouvre le menu */}
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto hidden h-8 lg:flex" // Caché sur mobile, flex sur grand écran
        >
          <Settings2 className="mr-2 h-4 w-4" />
          Affichage
        </Button>
      </DropdownMenuTrigger>

      {/* Le contenu du menu déroulant */}
      <DropdownMenuContent align="end" className="w-[150px]">
        <DropdownMenuLabel>Colonnes visibles</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* On boucle sur toutes les colonnes de la table */}
        {table
          .getAllColumns()
          // On filtre pour ne garder que celles qui peuvent être cachées
          // et qui ont une fonction d'accès aux données (pas les colonnes d'action pures)
          .filter(
            (column) =>
              typeof column.accessorFn !== "undefined" && column.getCanHide()
          )
          // Pour chaque colonne filtrée, on crée une case à cocher
          .map((column) => {
            const headerName = getHeaderName(column);
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={column.getIsVisible()} // Case cochée si la colonne est visible
                // Au changement d'état, on bascule la visibilité de la colonne
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {/* Affiche le nom de la colonne */}
                {headerName}
              </DropdownMenuCheckboxItem>
            )
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 