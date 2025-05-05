import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { budgets, budgetsToCategories, transactions } from "@/server/db/schema";
import { eq, and, sql, gte, lte, inArray, sum } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { revalidatePath } from "next/cache";
import { startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'; // Pour les périodes

// Type pour le retour de la requête getAll
type BudgetWithSpending = {
  id: string;
  name: string;
  userId: string;
  amount: number;
  period: string;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date | null;
  spentAmount: number;
  remainingAmount: number;
  categoryDisplay: string;
  categories: Array<{
    id: string;
    name: string;
  }>;
};

// Helper pour obtenir les dates de début/fin de la période courante
function getCurrentPeriod(period: string): { startDate: Date, endDate: Date } {
    const now = new Date();
    switch (period.toUpperCase()) {
        case 'MONTHLY':
            return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
        case 'YEARLY':
            return { startDate: startOfYear(now), endDate: endOfYear(now) };
        // TODO: Gérer 'CUSTOM' si implémenté
        default: // Par défaut, mensuel
            return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
    }
}

export const budgetRouter = createTRPCRouter({
  getAll: protectedProcedure
    .query(async ({ ctx }): Promise<BudgetWithSpending[]> => {
      console.log(`[BudgetGetAll LOG] Entering procedure for user: ${ctx.session.user.id}`);

      const budgets = await ctx.db.query.budgets.findMany({
        where: (budget, { eq }) => eq(budget.userId, ctx.session.user.id),
        with: {
          budgetsToCategories: {
            with: {
              category: true
            }
          }
        }
      });

      console.log(`[BudgetGetAll LOG] Raw DB result count: ${budgets?.length ?? 'undefined/null'}`);

      // Retourner un tableau vide si aucun budget n'est trouvé
      if (!budgets || budgets.length === 0) {
        console.log(`[BudgetGetAll LOG] No budgets found for user: ${ctx.session.user.id}`);
        return [];
      }

      // 2. Pour chaque budget, calculer le montant dépensé dans la période courante
      const budgetsWithSpending = await Promise.all(budgets.map(async (budget) => {
          const categoryIds = budget.budgetsToCategories.map(c => c.category.id);
          
          // Préparer un tableau des noms de catégories pour l'affichage
          const categoryNames = budget.budgetsToCategories.map(c => c.category.name);
          const categoryDisplay = categoryNames.join(", ");
          
          let spentAmount = 0;

          // Si le budget n'est lié à aucune catégorie, les dépenses sont 0
          if (categoryIds.length > 0) {
              const { startDate, endDate } = getCurrentPeriod(budget.period);

              // 3. Sommer les dépenses (montants négatifs) dans les catégories liées pour la période
              const result = await ctx.db
                  .select({
                      totalSpent: sum(sql<number>`abs(${transactions.amount})`).mapWith(Number)
                  })
                  .from(transactions)
                  .where(and(
                      eq(transactions.userId, ctx.session.user.id),
                      inArray(transactions.categoryId, categoryIds),
                      gte(transactions.date, startDate),
                      lte(transactions.date, endDate),
                      sql`${transactions.amount} < 0`
                  ))
                  .execute();

              spentAmount = result[0]?.totalSpent ?? 0;
          }

          // Drizzle retourne les décimaux comme string, on les convertit
          const budgetAmount = parseFloat(budget.amount as string);

          // Créer un nouvel objet sans faire référence à la structure d'origine
          return {
              id: budget.id,
              name: budget.name,
              userId: budget.userId,
              amount: budgetAmount,
              period: budget.period,
              startDate: budget.startDate,
              endDate: budget.endDate,
              createdAt: budget.createdAt,
              updatedAt: budget.updatedAt,
              // Données calculées
              spentAmount: spentAmount,
              remainingAmount: budgetAmount - spentAmount,
              categoryDisplay: categoryDisplay,
              // Inclure les relations pour l'affichage si nécessaire
              categories: budget.budgetsToCategories.map(c => c.category)
          };
      }));

      console.log(`[BudgetGetAll LOG] Returning ${budgetsWithSpending.length} processed budgets for user: ${ctx.session.user.id}`);
      return budgetsWithSpending;
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1, "Le nom est requis"),
      amount: z.coerce.number().positive("Le montant doit être positif"),
      period: z.enum(["MONTHLY", "YEARLY"]),
      categoryIds: z.array(z.string()).default([]),
      isSubscription: z.boolean().optional().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Version plus simple et robuste
        const { name, amount, period, categoryIds } = input;
        
        // S'assurer que categoryIds est un tableau
        const cleanedCategoryIds = Array.isArray(categoryIds) ? categoryIds.filter(Boolean) : [];
        
        // 1. Créer le budget
        const [newBudget] = await ctx.db
          .insert(budgets)
          .values({
            name,
            amount: amount.toString(),
            period,
            userId: ctx.session.user.id,
            startDate: new Date(),
            endDate: null,
          })
          .returning();

        if (!newBudget) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Échec de la création du budget"
          });
        }

        // 2. Créer les associations avec les catégories seulement si des catégories existent
        if (cleanedCategoryIds.length > 0) {
          try {
            await ctx.db
              .insert(budgetsToCategories)
              .values(
                cleanedCategoryIds.map(categoryId => ({
                  budgetId: newBudget.id,
                  categoryId
                }))
              );
          } catch (_error) {
            // Continuer même si l'association échoue
          }
        }

        // 3. Revalider les chemins pour la mise à jour de l'interface
        revalidatePath("/budgets");
        revalidatePath("/dashboard");

        return newBudget;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR", 
          message: error instanceof Error ? error.message : "Erreur inconnue lors de la création du budget"
        });
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 1. Vérifier si le budget appartient à l'utilisateur
       const budget = await ctx.db.query.budgets.findFirst({
        where: (b, { eq, and }) => and(
            eq(b.id, input.id),
            eq(b.userId, ctx.session.user.id)
        ),
        columns: { id: true } // Juste besoin de l'ID pour confirmer l'existence et la propriété
      });

       if (!budget) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Budget non trouvé." });
      }

      // 2. Supprimer les liens dans la table de jointure (important!)
      await ctx.db.delete(budgetsToCategories)
        .where(eq(budgetsToCategories.budgetId, input.id));

      // 3. Supprimer le budget lui-même
      const deletedBudget = await ctx.db
        .delete(budgets)
        .where(eq(budgets.id, input.id))
        .returning();

      if (deletedBudget.length === 0) {
         throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Échec de la suppression du budget." });
       }

      // 4. Invalider les caches
      revalidatePath("/budgets");
      revalidatePath("/dashboard"); // Potentiellement affecté si le dashboard affiche des infos de budget

      return deletedBudget[0];
    }),
    
  // --- Nouvelle Procédure : Update ---
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1, "Le nom est requis").optional(),
      amount: z.coerce.number().positive("Le montant doit être positif").optional(),
      period: z.enum(["MONTHLY", "YEARLY", "CUSTOM"]).optional(),
      categoryIds: z.array(z.string()).min(1, "Sélectionnez au moins une catégorie").optional(),
      isSubscription: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, name, amount, period, categoryIds } = input;

      // 1. Vérifier si le budget appartient à l'utilisateur
      const budget = await ctx.db.query.budgets.findFirst({
        where: and(
          eq(budgets.id, id),
          eq(budgets.userId, ctx.session.user.id)
        ),
        columns: { id: true }
      });

      if (!budget) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Budget non trouvé"
        });
      }

      // 2. Mettre à jour le budget
      const updateData: Partial<typeof budgets.$inferInsert> = {};
      if (name) updateData.name = name;
      if (amount) updateData.amount = amount.toString();
      if (period) updateData.period = period;

      const [updatedBudget] = await ctx.db
        .update(budgets)
        .set(updateData)
        .where(eq(budgets.id, id))
        .returning();

      // 3. Mettre à jour les relations avec les catégories si nécessaire
      if (categoryIds && categoryIds.length > 0) {
        // 3.1 Supprimer les anciennes relations
        await ctx.db
          .delete(budgetsToCategories)
          .where(eq(budgetsToCategories.budgetId, id));

        // 3.2 Créer les nouvelles relations
        const budgetCategoryLinks = categoryIds.map(categoryId => ({
          budgetId: id,
          categoryId
        }));

        await ctx.db
          .insert(budgetsToCategories)
          .values(budgetCategoryLinks);
      }

      // 4. Retourner le budget mis à jour
      return updatedBudget;
    }),
  // --- Fin de la Procédure : Update ---

  // We might need delete/update later
}); 