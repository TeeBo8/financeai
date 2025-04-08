// src/server/api/routers/report.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { transactions, categories } from "~/server/db/schema";
import { and, eq, gte, lte, sql, desc, lt } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { startOfMonth, endOfMonth } from 'date-fns'; // Pour les dates par défaut

// Schéma de sortie pour notre rapport
const expensesByCategoryOutputSchema = z.array(z.object({
  categoryId: z.string(),
  categoryName: z.string(),
  categoryColor: z.string(),
  totalExpenses: z.number(), // On va retourner un nombre ici
}));

export const reportRouter = createTRPCRouter({

  getExpensesByCategory: protectedProcedure
    .input(z.object({
        // Permet de spécifier une plage, sinon utilise le mois courant
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
    }).optional()) // Input optionnel pour utiliser les valeurs par défaut
    .output(expensesByCategoryOutputSchema) // Valide la sortie
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Détermine la plage de dates : mois courant par défaut
      const now = new Date();
      const startDate = input?.dateFrom ?? startOfMonth(now);
      // Pour endOfMonth, on prend la fin de journée pour inclure toutes les transactions du dernier jour
      const endDate = input?.dateTo ?? endOfMonth(now);
      // Assure qu'on prend bien jusqu'à la fin de la journée
      endDate.setHours(23, 59, 59, 999);


      console.log(`Fetching expenses by category for user ${userId} from ${startDate.toISOString()} to ${endDate.toISOString()}`);

      try {
          // Requête Drizzle pour agréger les dépenses par catégorie
          const result = await db
              .select({
                  categoryId: categories.id,
                  categoryName: categories.name,
                  categoryColor: categories.color,
                  // Calcule la somme des montants ABSOLUS des dépenses et la convertit en nombre
                  totalExpenses: sql<number>`coalesce(sum(abs(${transactions.amount})), 0)`.mapWith(Number).as('total_expenses')
              })
              .from(transactions)
              // Jointure INTERNE pour ne prendre que les transactions qui ONT une catégorie
              .innerJoin(categories, eq(transactions.categoryId, categories.id))
              .where(and(
                  eq(transactions.userId, userId), // Filtre par utilisateur
                  gte(transactions.date, startDate), // Filtre date début
                  lte(transactions.date, endDate), // Filtre date fin
                  lt(transactions.amount, '0.00'), // Filtre SEULEMENT les dépenses (montant négatif)
                  // isNotNull(transactions.categoryId) // Redondant avec INNER JOIN
              ))
              // Groupe par les colonnes de catégorie pour que SUM s'applique par catégorie
              .groupBy(categories.id, categories.name, categories.color)
              // Trie par les dépenses les plus élevées en premier
              .orderBy(desc(sql`sum(abs(${transactions.amount}))`));

            console.log(`Found ${result.length} categories with expenses.`);
            // Zod validera que result correspond bien à expensesByCategoryOutputSchema
            return result;

      } catch (error) {
          console.error("Error fetching expenses by category report:", error);
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erreur lors de la génération du rapport.' });
      }
    }),

}); // Fin reportRouter 