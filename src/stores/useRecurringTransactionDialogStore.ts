import { create } from 'zustand';
// Importe le type retourné par l'API pour l'édition
import { type AppRouter } from "@/server/api/root";
import { type inferRouterOutputs } from '@trpc/server';

type RecurringTransactionWithRelations = inferRouterOutputs<AppRouter>['recurringTransaction']['getAll'][number];

// Type pour l'état du store
type RecurringTransactionDialogState = {
  isOpen: boolean;
  isEditing: boolean;
  dataToEdit: RecurringTransactionWithRelations | null;
  openCreateDialog: () => void;
  openEditDialog: (recurring: RecurringTransactionWithRelations) => void;
  closeDialog: () => void;
};

// Valeurs par défaut pour une nouvelle transaction récurrente
// Important pour le reset du formulaire. Adapter si besoin.
export const defaultRecurringTransactionFormValues = {
  description: '',
  notes: '',
  amount: 0,
  isExpense: true,
  frequency: 'MONTHLY' as const, // Valeur par défaut
  interval: 1,
  // Mettre la date de début à aujourd'hui par défaut ? Format YYYY-MM-DD pour l'input type="date"
  startDate: new Date().toISOString().split('T')[0],
  endDate: null, // Pas de date de fin par défaut
  bankAccountId: '', // Sera rempli par un select/combobox
  categoryId: null, // Optionnel
};

// Création du store Zustand
export const useRecurringTransactionDialogStore = create<RecurringTransactionDialogState>((set) => ({
  isOpen: false,
  isEditing: false,
  dataToEdit: null,
  openCreateDialog: () => {
    set({
      isOpen: true,
      isEditing: false,
      dataToEdit: null,
    });
  },
  openEditDialog: (recurring: RecurringTransactionWithRelations) => {
    set({
      isOpen: true,
      isEditing: true,
      dataToEdit: recurring,
    });
  },
  closeDialog: () => {
    set({
      isOpen: false,
      isEditing: false,
      dataToEdit: null,
    });
  },
})); 