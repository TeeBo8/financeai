import { z } from "zod";

export const recurringTransactionFormSchema = z.object({
  description: z.string().min(1, "La description est requise"),
  notes: z.string(),
  amount: z.number().min(0.01, "Le montant doit être positif"),
  type: z.enum(["income", "expense"]),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]),
  interval: z.number().min(1, "L'intervalle doit être au moins 1"),
  startDate: z.string().min(1, "La date de début est requise"),
  endDate: z.string(),
  bankAccountId: z.string().min(1, "Le compte bancaire est requis"),
  categoryId: z.string().nullable(),
  isSubscription: z.boolean(),
}).strict();

export type RecurringTransactionFormValues = z.infer<typeof recurringTransactionFormSchema>; 