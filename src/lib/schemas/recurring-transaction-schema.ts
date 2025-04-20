import { z } from 'zod';

// Fonction helper pour valider que la date de fin est après la date de début
const validateEndDateAfterStartDate = (data: { 
  startDate: Date; 
  endDate?: Date | null; 
  [key: string]: unknown; 
}) => {
    if (!data.endDate) {
        return true; // Pas de date de fin, c'est valide
    }

    // Comparer uniquement si endDate est une date valide
    if (data.endDate instanceof Date && !isNaN(data.endDate.getTime())) {
         // Mettre les heures à zéro pour comparer uniquement les jours
         const startDateCopy = new Date(data.startDate);
         const endDateCopy = new Date(data.endDate);
         
         startDateCopy.setHours(0, 0, 0, 0);
         endDateCopy.setHours(0, 0, 0, 0);
         return endDateCopy >= startDateCopy;
    }
    return true; // Si endDate n'est pas une date valide, on laisse passer (une autre règle échouera peut-être)
};

// Schema principal
export const recurringTransactionFormSchema = z.object({
  description: z.string().min(1, { message: "La description est requise." }),
  notes: z.string().optional(), // Notes optionnelles

  // Montant: Peut être positif ou négatif
  amount: z.coerce // Utiliser coerce pour convertir l'input string en number
    .number({ invalid_type_error: "Veuillez entrer un montant valide." }),
    // Pas de .positive() ici, on accepte les dépenses

  // Récurrence
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'], {
    required_error: "La fréquence est requise.",
  }),
  interval: z.coerce // Coerce pour convertir en nombre
    .number({ invalid_type_error: "L'intervalle doit être un nombre."})
    .int({ message: "L'intervalle doit être un nombre entier." })
    .positive({ message: "L'intervalle doit être d'au moins 1."})
    .min(1, { message: "L'intervalle doit être d'au moins 1."})
    .default(1), // Default à 1 si non fourni (normalement le formulaire le fera)

  // Dates : Accepter string (YYYY-MM-DD) de l'input type="date"
  startDate: z.string({ required_error: "La date de début est requise." })
              .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Format de date invalide (AAAA-MM-JJ)." })
              .transform((dateStr) => new Date(dateStr + 'T00:00:00Z')), // Convertir en Date UTC à minuit

  // endDate est optionnel, mais si fourni, doit être une date valide
  endDate: z.string()
             .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Format de date invalide (AAAA-MM-JJ)." })
             .transform((dateStr) => new Date(dateStr + 'T00:00:00Z'))
             .nullable() // Peut être null
             .optional(), // Peut ne pas être fourni

  // Relations
  accountId: z.string({ required_error: "Le compte bancaire est requis." })
               .uuid({ message: "ID de compte invalide." }),
  // categoryId est optionnel, mais si fourni, doit être un UUID valide ou null
  categoryId: z.string()
                .uuid({ message: "ID de catégorie invalide." })
                .nullable() // Permet null explicitement
                .optional() // Peut ne pas être fourni
                .or(z.literal('')) // Permet chaîne vide du formulaire
                .transform(val => val === '' ? null : val), // Transforme chaîne vide en null

})
// Validation au niveau de l'objet pour comparer les dates
.refine(validateEndDateAfterStartDate, {
    message: "La date de fin ne peut pas être antérieure à la date de début.",
    path: ['endDate'], // Appliquer l'erreur au champ endDate
});

// Type TypeScript dérivé
export type RecurringTransactionFormValues = z.infer<typeof recurringTransactionFormSchema>; 