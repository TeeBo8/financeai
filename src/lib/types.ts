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

// Type pour les transactions récurrentes avec leurs relations
export type RecurringTransactionWithRelations = {
  id: string;
  userId: string;
  description: string;
  notes: string | null;
  amount: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval: number;
  startDate: Date;
  endDate: Date | null;
  nextOccurrenceDate: Date;
  bankAccountId: string;
  categoryId: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  bankAccount: {
    name: string;
  };
  category: {
    name: string;
    icon: string | null;
    color: string | null;
  } | null;
}; 