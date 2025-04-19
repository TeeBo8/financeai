// src/lib/schemas/category-schema.ts
import { z } from 'zod';

// Regex simple pour valider un code couleur hexadécimal (# suivi de 3 ou 6 chiffres/lettres)
// Rendue optionnelle car le champ color est optionnel
const hexColorRegex = /^#([0-9A-Fa-f]{3}){1,2}$/;

export const categoryFormSchema = z.object({
  name: z.string().min(1, { message: "Le nom de la catégorie est requis." }),
  // Icone: Simple string, peut être un emoji. Optionnel.
  icon: z.string().optional(),
  // Couleur: Doit être un code hex valide si fourni, sinon optionnel
  color: z.string()
           .regex(hexColorRegex, { message: "Format de couleur invalide (ex: #FFF ou #A033FF)." })
           .optional()
           .or(z.literal('')), // Permet aussi chaîne vide
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>; 