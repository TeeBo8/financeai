"use client";

import { CategoriesDataTable } from "./categories-data-table";
import { AddCategoryDialog } from "./add-category-dialog";

// Type pour les catégories venant de l'API TRPC
import { type AppRouter } from '~/server/api/root';
import { type inferRouterOutputs } from '@trpc/server';
type RouterOutput = inferRouterOutputs<AppRouter>;
type Category = RouterOutput['category']['getAll'][number];

interface CategoriesPageClientProps {
  categories: Category[];
}

export function CategoriesPageClient({ categories }: CategoriesPageClientProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestion des Catégories</h1>
        <AddCategoryDialog />
      </div>

      <p className="text-muted-foreground mb-6">
        Créez et gérez vos catégories pour mieux organiser vos transactions et budgets.
      </p>

      <CategoriesDataTable categories={categories} />
    </div>
  );
} 