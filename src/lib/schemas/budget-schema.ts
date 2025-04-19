import { z } from 'zod';

// Version optimisée du schéma pour éviter les problèmes
export const budgetFormSchema = z.object({
  name: z.string().min(1, { message: "Le nom du budget est requis." }),

  amount: z.coerce
    .number()
    .min(0, { message: "Le montant doit être positif ou nul." })
    .default(0)
    .transform(val => (isNaN(val) ? 0 : val)), // Toujours retourner un nombre valide

  period: z.enum(['MONTHLY', 'YEARLY'], {
    errorMap: () => ({ message: "Période invalide. Choisissez 'Mensuel' ou 'Annuel'." })
  }).default("MONTHLY"),

  // Accepte un tableau vide (bugdet sans catégorie)
  categoryIds: z.array(z.string())
    .default([])
    .transform(cats => cats.filter(Boolean)) // Filtrer les valeurs vides
});

// Type TypeScript dérivé du schéma Zod pour les valeurs du formulaire
export type BudgetFormValues = z.infer<typeof budgetFormSchema>; 