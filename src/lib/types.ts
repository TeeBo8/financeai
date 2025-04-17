// Type pour les transactions avec leurs relations (catégorie, compte bancaire)
export type TransactionWithRelations = {
  id: string;
  userId: string;
  amount: string | number;
  description: string;
  date: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date | null;
  categoryId: string | null;
  bankAccountId: string;
  transferId?: string | null;
  category?: {
    id: string;
    name: string;
    icon?: string;
    color?: string;
  } | null;
  bankAccount: {
    id?: string;
    name: string;
  };
}; 