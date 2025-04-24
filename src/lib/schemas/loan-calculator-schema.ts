import { z } from "zod";

export const loanCalculatorSchema = z.object({
  amount: z.string().min(1, "Le montant est requis")
    .pipe(z.coerce.number({ invalid_type_error: "Montant invalide" }))
    .pipe(z.number().positive({ message: "Le montant doit être positif" }))
    .transform(val => val.toString()),

  rate: z.string().min(1, "Le taux est requis")
    .pipe(z.coerce.number({ invalid_type_error: "Taux invalide" }))
    .pipe(z.number().positive({ message: "Le taux doit être positif" }))
    .transform(val => val.toString()),

  duration: z.string().min(1, "La durée est requise")
    .pipe(z.coerce.number({ invalid_type_error: "Durée invalide" }))
    .pipe(z.number().int({ message: "La durée doit être en années entières" }).positive({ message: "La durée doit être positive" }))
    .transform(val => val.toString()),
});

export type LoanCalculatorSchemaType = z.infer<typeof loanCalculatorSchema>; 