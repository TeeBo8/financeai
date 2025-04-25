import { create } from 'zustand';
// Importe le type Account retourné par l'API pour l'édition
import { type AppRouter } from '@/server/api/root';
import { type inferRouterOutputs } from '@trpc/server';

// Les deux types possibles de compte avec balance
type AccountGetAllResult = inferRouterOutputs<AppRouter>['account']['getAll'][number];
type BankAccountGetAllResult = inferRouterOutputs<AppRouter>['bankAccount']['getAll'][number];

// Type unifié avec les propriétés essentielles pour l'édition
export type AccountWithBalance = {
  id: string;
  name: string;
  balance: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date | null;
  icon: string | null;
  color: string | null;
};

// Type pour l'état du store
type AccountDialogState = {
  isOpen: boolean;
  isEditing: boolean;
  accountToEdit: AccountWithBalance | null; // Stocke le compte complet pour l'édition
  openCreateDialog: () => void;
  openEditDialog: (account: AccountWithBalance | BankAccountGetAllResult) => void;
  closeDialog: () => void;
};

// Valeurs par défaut pour un nouveau compte (sera utilisé pour le reset du form)
export const defaultAccountFormValues = {
    name: "",
    // type: undefined, // Pas de champ type pour l'instant
    icon: "",
    color: "#000000",
};

// Création du store Zustand
export const useAccountDialogStore = create<AccountDialogState>((set) => ({
  isOpen: false,
  isEditing: false,
  accountToEdit: null,
  openCreateDialog: () => {
    console.log("Store: openCreateDialog called");
    set({
      isOpen: true,
      isEditing: false,
      accountToEdit: null,
    });
  },
  openEditDialog: (account) => {
    console.log("Store: openEditDialog called with account:", account.id);
    // Normaliser le compte pour avoir une structure cohérente
    const normalizedAccount: AccountWithBalance = {
      id: account.id,
      name: account.name,
      balance: typeof account.balance === 'string' ? parseFloat(account.balance) : account.balance,
      userId: account.userId,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
      icon: account.icon,
      color: account.color,
    };
    
    set({
      isOpen: true,
      isEditing: true,
      accountToEdit: normalizedAccount, // Stocke l'objet compte normalisé
    });
  },
  closeDialog: () => {
    console.log("Store: closeDialog called");
    set({
      isOpen: false,
      isEditing: false,
      accountToEdit: null, // Nettoyer le compte à éditer lors de la fermeture
    });
  },
})); 