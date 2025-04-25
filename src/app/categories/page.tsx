import { CategoriesPageClient } from "@/components/categories/categories-page-client";
import { api } from "@/trpc/server";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  // Récupération des catégories depuis l'API tRPC côté serveur
  const categories = await api.category.getAll();

  return (
    <div className="container mx-auto py-10">
      <CategoriesPageClient categories={categories} />
    </div>
  );
} 