import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
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
});


export const recurringTransactionRouter = createTRPCRouter({
  // --- GET ALL ---
  getAll: protectedProcedure.query(async ({ ctx }): Promise<RecurringTransactionWithRelations[]> => {
    const results = await ctx.db.query.recurringTransactions.findMany({
      where: eq(recurringTransactions.userId, ctx.session.user.id),
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

  // --- UPDATE ---
  update: protectedProcedure
    .input(
      recurringTransactionInputSchema.extend({
        id: z.string().min(1), // ID requis pour l'update
         // Rendre tous les autres champs optionnels
        description: recurringTransactionInputSchema.shape.description.optional(),
        notes: recurringTransactionInputSchema.shape.notes.optional(),
        amount: recurringTransactionInputSchema.shape.amount.optional(),
        frequency: recurringTransactionInputSchema.shape.frequency.optional(),
        interval: recurringTransactionInputSchema.shape.interval.optional(),
        startDate: recurringTransactionInputSchema.shape.startDate.optional(),
        endDate: recurringTransactionInputSchema.shape.endDate.optional(), // Déjà nullable, rendre optional
        bankAccountId: recurringTransactionInputSchema.shape.bankAccountId.optional(),
        categoryId: recurringTransactionInputSchema.shape.categoryId.optional(), // Déjà nullable, rendre optional
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, startDate, frequency, interval, ...updateData } = input;
      const userId = ctx.session.user.id;

      // 1. Vérifier si l'enregistrement appartient à l'utilisateur
      const existingItem = await ctx.db.query.recurringTransactions.findFirst({
        where: and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, userId)),
      });
      if (!existingItem) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Transaction récurrente non trouvée." });
      }

      // 2. Préparer les données à mettre à jour
      const { amount, ...otherUpdateData } = updateData;
      const finalUpdateData: Partial<typeof recurringTransactions.$inferInsert> = {
          ...otherUpdateData,
          updatedAt: new Date(),
          // Convertir amount si présent, s'assurer qu'il est toujours un string
          ...(amount !== undefined && { amount: amount.toString() }),
          // Convertir dates si présentes (Zod les a déjà transformées en Date)
          ...(startDate && { startDate }),
          ...(updateData.endDate !== undefined && { endDate: updateData.endDate }),
      };

      // 3. Recalculer nextOccurrenceDate SEULEMENT si la date de début, la fréquence ou l'intervalle changent
      const needsNextDateRecalc = startDate || frequency || interval;
      if (needsNextDateRecalc) {
          finalUpdateData.nextOccurrenceDate = calculateNextOccurrence(
              startDate || existingItem.startDate, // Utiliser la nouvelle date si fournie, sinon l'ancienne
              frequency || existingItem.frequency,
              interval || existingItem.interval
          );
      }

       // 4. Vérifier endDate vs startDate
      const finalStartDate = startDate || existingItem.startDate;
      const finalEndDate = updateData.endDate === null ? null : (updateData.endDate || existingItem.endDate);
      if (finalEndDate && finalEndDate < finalStartDate) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "La date de fin doit être après la date de début." });
      }

      // Filtrer les clés undefined avant l'update
       const filteredUpdateData = Object.fromEntries(
          Object.entries(finalUpdateData).filter(([, value]) => value !== undefined)
      );


      // 5. Exécuter l'update
      if (Object.keys(filteredUpdateData).length > 0) {
          const [updatedItem] = await ctx.db
            .update(recurringTransactions)
            .set(filteredUpdateData)
            .where(eq(recurringTransactions.id, id))
            .returning();

           if (!updatedItem) {
              throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erreur mise à jour transaction récurrente." });
           }
           revalidatePath("/recurring");
           return updatedItem;

      } else {
          // Rien à mettre à jour (à part potentiellement nextOccurrenceDate si recalculé sans autres modifs)
          // Il faudrait gérer ce cas séparément si nécessaire, ou juste retourner l'existant.
          return existingItem;
      }

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