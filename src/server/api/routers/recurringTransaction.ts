import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { recurringTransactions } from "@/server/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { revalidatePath } from "next/cache";
import { add, parseISO } from 'date-fns'; // Pour calculer les dates
import { type RecurringTransactionWithRelations } from "@/lib/types";

// Helper pour calculer la prochaine date d'occurrence
function calculateNextOccurrence(startDate: Date, frequency: string, interval: number): Date {
    let nextDate = new Date(startDate); // Copie pour ne pas muter l'original
    // Normaliser l'heure à minuit pour éviter les problèmes de fuseau horaire/heure d'été
    nextDate.setHours(0, 0, 0, 0);

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Avancer la date jusqu'à ce qu'elle soit dans le futur (ou aujourd'hui)
    while (nextDate <= now) {
        switch (frequency.toUpperCase()) {
            case 'DAILY':
                nextDate = add(nextDate, { days: interval });
                break;
            case 'WEEKLY':
                nextDate = add(nextDate, { weeks: interval });
                break;
            case 'MONTHLY':
                nextDate = add(nextDate, { months: interval });
                break;
            case 'YEARLY':
                nextDate = add(nextDate, { years: interval });
                break;
            default:
                throw new Error(`Invalid frequency: ${frequency}`); // Gérer cas inconnu
        }
    }
    return nextDate;
}

// Schéma de base pour la création/modification (sans ID, userId, nextOccurrenceDate)
export const recurringTransactionInputSchema = z.object({
  description: z.string().min(1, "Description requise."),
  notes: z.string().nullish(), // Utiliser nullish pour optionnel + null
  amount: z.coerce.number({ invalid_type_error: "Montant invalide." }), // Pas forcément positif
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  interval: z.coerce.number().int().positive().min(1).default(1),
  // Utiliser z.string() pour accepter la date du formulaire (souvent string)
  // puis transformer en Date. Ajouter une validation de format si nécessaire.
  startDate: z.string().transform((dateStr) => parseISO(dateStr)), // parseISO gère YYYY-MM-DD
  endDate: z.string().transform((dateStr) => parseISO(dateStr)).nullable(), // Date de fin optionnelle
  bankAccountId: z.string().min(1, "Compte invalide."),
  // categoryId peut être null
  categoryId: z.string().nullable(),
  isSubscription: z.boolean().optional().default(false),
});


export const recurringTransactionRouter = createTRPCRouter({
  // --- GET ALL ---
  getAll: protectedProcedure
    .input(
      z.object({
        isSubscription: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }): Promise<RecurringTransactionWithRelations[]> => {
      const results = await ctx.db.query.recurringTransactions.findMany({
        where: (rt, { eq, and }) => and(
          eq(rt.userId, ctx.session.user.id),
          input.isSubscription !== undefined ? eq(rt.isSubscription, input.isSubscription) : undefined
        ),
        orderBy: [desc(recurringTransactions.nextOccurrenceDate)],
        with: {
            bankAccount: { columns: { name: true } },
            category: { columns: { name: true, color: true, icon: true } },
        }
      });

      // Convertir la fréquence en type correct
      return results.map(result => ({
        ...result,
        frequency: result.frequency as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
      }));
    }),

  // --- CREATE ---
  create: protectedProcedure
    .input(recurringTransactionInputSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Calculer la première nextOccurrenceDate
      const nextOccurrenceDate = calculateNextOccurrence(
          input.startDate, // Déjà convertie en Date par Zod
          input.frequency,
          input.interval
      );

      // Vérifier que endDate est après startDate si elle existe
      if (input.endDate && input.endDate < input.startDate) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "La date de fin doit être après la date de début." });
      }

      const [newItem] = await ctx.db
        .insert(recurringTransactions)
        .values({
          ...input,
          userId,
          amount: input.amount.toString(), // Convertir pour la DB si decimal
          nextOccurrenceDate,
          // Convertir les dates en objets Date si le schéma Drizzle les attend ainsi
          // startDate: input.startDate, // Zod l'a déjà fait
          // endDate: input.endDate, // Zod l'a déjà fait
        })
        .returning();

      if (!newItem) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erreur création transaction récurrente." });
      }
      revalidatePath("/recurring");
      return newItem;
    }),

  // --- DELETE ---
  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
       const userId = ctx.session.user.id;
       // Vérifier propriété avant suppression
       const item = await ctx.db.query.recurringTransactions.findFirst({
           where: and(eq(recurringTransactions.id, input.id), eq(recurringTransactions.userId, userId)),
           columns: { id: true }
       });
       if (!item) {
           throw new TRPCError({ code: "NOT_FOUND", message: "Transaction récurrente non trouvée." });
       }

       const [deletedItem] = await ctx.db
         .delete(recurringTransactions)
         .where(eq(recurringTransactions.id, input.id))
         .returning();

       if (!deletedItem) {
           throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erreur suppression transaction récurrente." });
       }
       revalidatePath("/recurring");
       return deletedItem;
    }),
}); 