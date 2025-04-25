import { create } from 'zustand';
import { type AppRouter } from '@/server/api/root';
import { type inferRouterOutputs } from '@trpc/server';

// Type pour une catégorie retournée par l'API
type CategoryGetAllResult = inferRouterOutputs<AppRouter>['category']['getAll'][number];

// Type unifié avec les propriétés essentielles pour l'édition
export type CategoryWithDetails = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date | null;
};

// Type pour l'état du store
type CategoryDialogState = {
  isOpen: boolean;
  isEditing: boolean;
  categoryToEdit: CategoryWithDetails | null;
  openCreateDialog: () => void;
  openEditDialog: (category: CategoryWithDetails | CategoryGetAllResult) => void;
  closeDialog: () => void;
};

// Valeurs par défaut pour une nouvelle catégorie
export const defaultCategoryFormValues = {
  name: "",
  icon: "",
  color: "",
};

// Création du store Zustand
export const useCategoryDialogStore = create<CategoryDialogState>((set) => ({
  isOpen: false,
  isEditing: false,
  categoryToEdit: null,
  openCreateDialog: () => {
    console.log("Store: openCreateDialog called");
    set({
      isOpen: true,
      isEditing: false,
      categoryToEdit: null,
    });
  },
  openEditDialog: (category) => {
    console.log("Store: openEditDialog called with category:", category.id);
    // Normaliser la catégorie pour avoir une structure cohérente
    const normalizedCategory: CategoryWithDetails = {
      id: category.id,
      name: category.name,
      icon: category.icon,
      color: category.color,
      userId: category.userId,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
    
    set({
      isOpen: true,
      isEditing: true,
      categoryToEdit: normalizedCategory,
    });
  },
  closeDialog: () => {
    console.log("Store: closeDialog called");
    set({
      isOpen: false,
      isEditing: false,
      categoryToEdit: null,
    });
  },
})); 