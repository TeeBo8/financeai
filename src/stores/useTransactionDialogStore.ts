import { create } from "zustand";
import { type TransactionData } from "@/components/transactions/transaction-form";

interface TransactionDialogState {
  isOpen: boolean;
  mode: "create" | "edit";
  initialData?: TransactionData;
  showAddAndNewButton: boolean;
  openDialog: (data?: TransactionData, options?: { showAddAndNew?: boolean }) => void;
  closeDialog: () => void;
}

export const useTransactionDialogStore = create<TransactionDialogState>((set) => ({
  isOpen: false,
  mode: "create",
  initialData: undefined,
  showAddAndNewButton: false,
  openDialog: (data?: TransactionData, options?: { showAddAndNew?: boolean }) => set({ 
    isOpen: true, 
    initialData: data, 
    mode: data ? "edit" : "create",
    showAddAndNewButton: options?.showAddAndNew ?? false,
  }),
  closeDialog: () => set({ 
    isOpen: false, 
    initialData: undefined, 
    mode: "create",
    showAddAndNewButton: false,
  }),
})); 