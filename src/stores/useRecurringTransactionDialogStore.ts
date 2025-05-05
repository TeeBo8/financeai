import { create } from 'zustand';

// Valeurs par défaut pour une nouvelle transaction récurrente
export const defaultRecurringTransactionFormValues = {
  description: '',
  notes: '',
  amount: 0,
  isExpense: true,
  frequency: 'MONTHLY' as const,
  interval: 1,
  startDate: new Date().toISOString().split('T')[0],
  endDate: null,
  bankAccountId: '',
  categoryId: null,
  isSubscription: false,
};

type RecurringTransactionDialogStore = {
  isOpen: boolean;
  isEditing: boolean;
  openDialog: () => void;
  closeDialog: () => void;
  setEditing: (isEditing: boolean) => void;
};

export const useRecurringTransactionDialogStore = create<RecurringTransactionDialogStore>((set) => ({
  isOpen: false,
  isEditing: false,
  openDialog: () => set({ isOpen: true }),
  closeDialog: () => set({ isOpen: false, isEditing: false }),
  setEditing: (isEditing) => set({ isEditing }),
})); 