import { z } from 'zod';

// Schéma pour la validation du formulaire de compte (création/modification)
export const accountFormSchema = z.object({
  // L'ID n'est pas dans le formulaire, il sera géré via les props/état pour l'édition
  name: z.string().min(1, { message: "Le nom du compte est requis." }),
  // Le champ type a été retiré car il n'existe pas dans la base de données
});

// Type TypeScript dérivé du schéma Zod pour les valeurs du formulaire
export type AccountFormValues = z.infer<typeof accountFormSchema>; 