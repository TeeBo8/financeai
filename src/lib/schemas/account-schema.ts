import { z } from 'zod';

// Regex simple pour valider un code couleur hexadécimal (# suivi de 3 ou 6 chiffres/lettres)
const hexColorRegex = /^#([0-9A-Fa-f]{3}){1,2}$/;

// Schéma pour la validation du formulaire de compte (création/modification)
export const accountFormSchema = z.object({
  // L'ID n'est pas dans le formulaire, il sera géré via les props/état pour l'édition
  name: z.string().min(1, { message: "Le nom du compte est requis." }),
  // Le champ type a été retiré car il n'existe pas dans la base de données
  icon: z.string().optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
  color: z.string()
         .regex(hexColorRegex, { message: "Format couleur invalide (ex: #FFF)." })
         .optional()
         .or(z.literal(''))
         .transform(val => val === '' ? undefined : val),
});

// Type TypeScript dérivé du schéma Zod pour les valeurs du formulaire
export type AccountFormValues = z.infer<typeof accountFormSchema>; 