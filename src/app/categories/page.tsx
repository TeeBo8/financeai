import { CategoryList } from "~/components/categories/category-list";
import { AddCategoryDialog } from "~/components/categories/add-category-dialog";

export default function CategoriesPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestion des Catégories</h1>
        <AddCategoryDialog />
      </div>

      <p className="text-muted-foreground mb-6">
        Créez et gérez vos catégories pour mieux organiser vos transactions et budgets.
      </p>

      <CategoryList />

    </div>
  );
} 