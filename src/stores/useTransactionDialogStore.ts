import { create } from "zustand";
import { type TransactionData } from "~/components/transactions/transaction-form";

interface TransactionDialogState {
  isOpen: boolean;
  mode: "create" | "edit";
  initialData?: TransactionData;
  openDialog: (data?: TransactionData) => void;
  closeDialog: () => void;
}

export const useTransactionDialogStore = create<TransactionDialogState>((set) => ({
  isOpen: false,
  mode: "create",
  initialData: undefined,
  openDialog: (data?: TransactionData) => set({ 
    isOpen: true, 
    initialData: data, 
    mode: data ? "edit" : "create" 
  }),
  closeDialog: () => set({ 
    isOpen: false, 
    initialData: undefined, 
    mode: "create" 
  }),
})); 