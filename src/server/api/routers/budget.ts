import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { budgets, transactions } from "~/server/db/schema";
import { and, eq, sql, desc, lt } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// Import date-fns functions
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isValid, // To check date validity
  endOfDay // Ajout de endOfDay pour inclure la fin de journée
} from 'date-fns';

// Schema de base pour la création/modification (sans l'ID pour la création)
const budgetInputSchemaBase = z.object({
  name: z.string().min(1, "Le nom est requis"),
  amount: z.coerce.number().positive("Le montant doit être positif"),
  period: z.enum(["monthly", "weekly", "custom"]),
  startDate: z.date(),
  endDate: z.date().nullable(),
  // Accepte null en entrée du formulaire pour "Aucune catégorie"
  // Mais sera converti en chaîne vide ('') en DB car le schéma DB définit .notNull()
  categoryId: z.string().nullable(),
});

export const budgetRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const now = new Date(); // Get the current date/time

    // 1. Fetch all budgets for the user, including category details
    const userBudgets = await ctx.db.query.budgets.findMany({
      where: eq(budgets.userId, userId),
      with: {
        category: true, // Include linked category data
      },
      orderBy: [desc(budgets.createdAt)], // Optional: order them
    });

    if (userBudgets.length === 0) {
      return []; // Return empty array if no budgets
    }

    // 2. Determine the overall date range to fetch relevant transactions
    //    This avoids fetching *all* transactions if possible.
    //    We need to calculate the *potential* start and end dates for *all* budgets first.
    let overallMinDate: Date | null = null;
    let overallMaxDate: Date | null = null;

    userBudgets.forEach(budget => {
        // Ensure budget dates are valid Date objects
        const budgetStartDate = budget.startDate ? new Date(budget.startDate) : null;
        const budgetEndDate = budget.endDate ? new Date(budget.endDate) : null;

        if (!budgetStartDate || !isValid(budgetStartDate)) return; // Skip if start date is invalid

        let periodStartDate: Date | null = null;
        let periodEndDate: Date | null = null;

        switch (budget.period) {
            case 'monthly':
                periodStartDate = startOfMonth(now);
                periodEndDate = endOfMonth(now);
                break;
            case 'weekly':
                // Ensure startOfWeek uses the locale you prefer (e.g., { weekStartsOn: 1 } for Monday)
                // Default is usually Sunday (0)
                periodStartDate = startOfWeek(now, { weekStartsOn: 1 }); // Week starts on Monday
                periodEndDate = endOfWeek(now, { weekStartsOn: 1 });
                break;
            case 'custom':
                periodStartDate = budgetStartDate;
                // If custom end date is null, it means ongoing up to now for calculation purposes
                periodEndDate = budgetEndDate && isValid(budgetEndDate) ? budgetEndDate : now;
                break;
            default:
                 // Should not happen based on schema enum, but good practice
                 return;
        }

        // The effective period for *this* budget is the intersection of its defined dates
        // and the calculated period (monthly/weekly/custom range up to now).
        // Choose the later date as the start
        const effectiveStartDate = periodStartDate && budgetStartDate ? 
            (periodStartDate > budgetStartDate ? periodStartDate : budgetStartDate) : 
            (budgetStartDate || periodStartDate);
            
        // If budget has no end date (null), use the period's end date.
        // If budget has an end date, use the minimum of budget end date and period end date.
        // Choose the earlier date as the end
        const effectiveEndDate = periodEndDate && budgetEndDate && isValid(budgetEndDate) ? 
            (periodEndDate < budgetEndDate ? periodEndDate : budgetEndDate) : 
            (periodEndDate || now);

        // --- AJOUT : S'assurer que la date de fin inclut toute la journée ---
        let finalEffectiveEndDate = effectiveEndDate; 
        if (finalEffectiveEndDate && isValid(finalEffectiveEndDate)) {
            finalEffectiveEndDate = endOfDay(finalEffectiveEndDate); // Met l'heure à 23:59:59.999
        }
        // --------------------------------------------------------------------

        // Update overall min/max dates needed for transaction query
        if (effectiveStartDate && finalEffectiveEndDate && effectiveStartDate <= finalEffectiveEndDate) { // Only consider valid intervals
            if (!overallMinDate || effectiveStartDate < overallMinDate) {
                overallMinDate = effectiveStartDate;
            }
            if (!overallMaxDate || finalEffectiveEndDate > overallMaxDate) {
                overallMaxDate = finalEffectiveEndDate;
            }
        }
    });

    // 3. Fetch relevant transactions within the overall date range
    let relevantTransactions: typeof transactions.$inferSelect[] = [];
    if (overallMinDate && overallMaxDate && overallMinDate <= overallMaxDate) {
      // Ensure we're working with Date objects
      const minDate = new Date(overallMinDate);
      const maxDate = new Date(overallMaxDate);
      
      // Format dates as YYYY-MM-DD strings for database query
      const minDateStr = minDate.toISOString().split('T')[0];
      // Utiliser le jour complet pour la date max en ajoutant T23:59:59.999Z à la chaîne de date
      const maxDateIso = maxDate.toISOString();
      const maxDateStr = maxDateIso.split('T')[0];
      
      relevantTransactions = await ctx.db.query.transactions.findMany({
        where: and(
          eq(transactions.userId, userId),
          // Cast date strings to the proper format for comparison
          sql`${transactions.date}::date >= ${minDateStr}::date`,
          sql`${transactions.date}::date <= ${maxDateStr}::date`,
          lt(transactions.amount, "0") // Only fetch negative amounts (expenses) - as string since it's stored as string in DB
        ),
        // No need to order here, we'll filter in memory
      });
    }

    // 4. Calculate spent amount for each budget
    const budgetsWithSpentAmount = userBudgets.map(budget => {
      // Recalculate the effective dates for *this specific* budget again
      const budgetStartDate = budget.startDate ? new Date(budget.startDate) : null;
      const budgetEndDate = budget.endDate ? new Date(budget.endDate) : null;

      if (!budgetStartDate || !isValid(budgetStartDate)) {
           return { ...budget, spentAmount: 0, categoryName: budget.category?.name ?? null }; // Return with 0 spent if invalid start date
      }

      let periodStartDate: Date | null = null;
      let periodEndDate: Date | null = null;

      switch (budget.period) {
        case 'monthly':
          periodStartDate = startOfMonth(now);
          periodEndDate = endOfMonth(now);
          break;
        case 'weekly':
          periodStartDate = startOfWeek(now, { weekStartsOn: 1 });
          periodEndDate = endOfWeek(now, { weekStartsOn: 1 });
          break;
        case 'custom':
          periodStartDate = budgetStartDate;
          periodEndDate = budgetEndDate && isValid(budgetEndDate) ? budgetEndDate : now;
          break;
        default:
          return { ...budget, spentAmount: 0, categoryName: budget.category?.name ?? null }; // Should not happen
      }

      // Choose the later date as the start
      const effectiveStartDate = periodStartDate && budgetStartDate ? 
          (periodStartDate > budgetStartDate ? periodStartDate : budgetStartDate) : 
          (budgetStartDate || periodStartDate);
          
      // Choose the earlier date as the end
      const effectiveEndDate = periodEndDate && budgetEndDate && isValid(budgetEndDate) ? 
          (periodEndDate < budgetEndDate ? periodEndDate : budgetEndDate) : 
          (periodEndDate || now);

      // --- AJOUT : S'assurer que la date de fin inclut toute la journée ---
      let finalEffectiveEndDate = effectiveEndDate; 
      if (finalEffectiveEndDate && isValid(finalEffectiveEndDate)) {
          finalEffectiveEndDate = endOfDay(finalEffectiveEndDate); // Met l'heure à 23:59:59.999
      }
      // --------------------------------------------------------------------

      let spentAmount = 0;

      // Filter the fetched transactions for this budget
      if (effectiveStartDate && finalEffectiveEndDate && effectiveStartDate <= finalEffectiveEndDate) { // Check interval validity
        const transactionsForBudget = relevantTransactions.filter(tx => {
            const txDate = new Date(tx.date); // Ensure tx.date is a Date object
            if (!isValid(txDate)) return false; // Skip invalid transaction dates

            // Check if transaction date is within the budget's effective interval
            // Utilise finalEffectiveEndDate ici pour inclure toute la journée
            const isDateInRange = txDate >= effectiveStartDate && txDate <= finalEffectiveEndDate;
            if (!isDateInRange) return false;

            // Check category match
            // If budget categoryId is null, it applies to all categories
            // Otherwise, transaction categoryId must match budget categoryId
            const isCategoryMatch = budget.categoryId === null || tx.categoryId === budget.categoryId;

            return isCategoryMatch; // No need to check amount < 0 again, already filtered in query
        });

        // Sum the absolute values of the amounts
        spentAmount = transactionsForBudget.reduce((sum, tx) => {
            // Ensure amount is treated as a number and take absolute value
            const amountValue = Number(tx.amount);
            return sum + Math.abs(amountValue);
        }, 0);
      }

      // Return the budget object augmented with spentAmount and categoryName
      return {
        ...budget,
        spentAmount: spentAmount,
        // Add categoryName for convenience in the frontend
        categoryName: budget.category?.name ?? null,
      };
    });

    return budgetsWithSpentAmount;

  }),

  create: protectedProcedure
    .input(budgetInputSchemaBase)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      if (input.endDate && input.startDate > input.endDate) {
           throw new TRPCError({
               code: 'BAD_REQUEST',
               message: 'La date de début ne peut pas être après la date de fin.',
           });
      }

      try {
        // Préparer les données qui correspondent exactement aux noms de propriétés 
        // du schéma Drizzle pour 'budgets'
        const budgetData: typeof budgets.$inferInsert = {
          userId,
          name: input.name,
          amount: input.amount.toString(),
          period: input.period,
          startDate: input.startDate,
          endDate: input.endDate ?? new Date(),
          // Dans le schéma DB, categoryId est .notNull(), on ne peut pas stocker null
          // On utilise une chaîne vide comme valeur par défaut si null
          categoryId: input.categoryId ?? '',
        };

        const [newBudget] = await ctx.db
          .insert(budgets)
          .values(budgetData)
          .returning();

        return newBudget;

      } catch (error) {
        // Consider more specific error handling if needed
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la création du budget.',
          cause: error,
        });
      }
    }),

  // Procédure pour supprimer un budget
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1, "ID de budget invalide."),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const budgetIdToDelete = input.id;

      try {
        // On utilise Drizzle pour supprimer
        // La clause 'where' est cruciale pour la sécurité :
        // - On cible le bon budget par son ID (eq(budgets.id, budgetIdToDelete))
        // - ET on s'assure qu'il appartient bien à l'utilisateur connecté (eq(budgets.userId, userId))
        const deleteResult = await ctx.db
          .delete(budgets)
          .where(
            and(
              eq(budgets.id, budgetIdToDelete),
              eq(budgets.userId, userId) // <-- Vérification de propriété !
            )
          )
          .returning({ deletedId: budgets.id }); // Retourne l'ID si la suppression a réussi

        // Vérifier si une ligne a été effectivement supprimée
        // Si deleteResult est vide, c'est que le budget n'existait pas OU n'appartenait pas à l'utilisateur
        if (deleteResult.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND', // Ou 'FORBIDDEN', au choix
            message: "Le budget que vous essayez de supprimer n'a pas été trouvé ou ne vous appartient pas.",
          });
        }

        return { success: true, deletedId: deleteResult[0]?.deletedId };

      } catch (error) {
        // Si l'erreur est déjà une TRPCError (comme celle du NOT_FOUND), on la relance telle quelle
        if (error instanceof TRPCError) {
            throw error;
        }
        // Sinon, c'est probablement une erreur de base de données ou autre
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Une erreur est survenue lors de la suppression du budget.',
          cause: error, // On peut inclure l'erreur originale pour le débogage serveur
        });
      }
    }),
    
  // --- Nouvelle Procédure : Update ---
  update: protectedProcedure
    .input(
      // On prend le schéma de base et on le rend partiel (tous les champs optionnels)
      // Puis on le fusionne (.extend) avec un objet contenant l'ID obligatoire
      budgetInputSchemaBase.partial().extend({
        id: z.string().min(1, "ID de budget requis pour la mise à jour."),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { id: budgetId, ...updateData } = input; // Sépare l'ID du reste des données

      // Validation logique spécifique à l'update si nécessaire (ex: cohérence des dates)
      // Simple check si les deux sont dans l'input:
      if (updateData.startDate && updateData.endDate && updateData.startDate > updateData.endDate) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'La date de début ne peut pas être après la date de fin.',
        });
      }

      try {
        // Préparation des données à mettre à jour
        const setData: Record<string, unknown> = { 
          ...updateData,
          updatedAt: new Date() 
        };
        
        // Si amount est défini, le convertir en string
        if (updateData.amount !== undefined) {
          setData.amount = updateData.amount.toString();
        }
        
        // Mise à jour dans la DB
        const updatedBudgets = await ctx.db
          .update(budgets)
          .set(setData as Partial<typeof budgets.$inferInsert>) // Type plus spécifique pour éviter 'any'
          .where(
            and(
              eq(budgets.id, budgetId),
              eq(budgets.userId, userId) // <-- Vérification de propriété !
            )
          )
          .returning(); // Retourne l'objet budget complet mis à jour

        // Vérifier si une ligne a été effectivement mise à jour
        if (updatedBudgets.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: "Le budget que vous essayez de modifier n'a pas été trouvé ou ne vous appartient pas.",
          });
        }

        const updatedBudget = updatedBudgets[0];
        return updatedBudget; // Retourne le budget mis à jour

      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Une erreur est survenue lors de la modification du budget.',
          cause: error,
        });
      }
    }),
  // --- Fin de la Procédure : Update ---

  // We might need delete/update later
}); 