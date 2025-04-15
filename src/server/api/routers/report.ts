// src/server/api/routers/report.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { transactions, categories } from "~/server/db/schema";
import { and, eq, gte, lte, sql, desc, lt, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { fr } from 'date-fns/locale';

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

            // Zod validera que result correspond bien à expensesByCategoryOutputSchema
            return result;

      } catch (error) {
          console.error("Error fetching expenses by category report:", error);
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erreur lors de la génération du rapport.' });
      }
    }),

  // --- NOUVELLE PROCÉDURE : Résumé Mensuel Revenus/Dépenses ---
  getMonthlySummaries: protectedProcedure
    .input(
      z.object({
        // Optionnel: Permettre de spécifier une période
        // Pour l'instant, on prend l'année civile en cours par défaut
        // startDate: z.date().optional(),
        // endDate: z.date().optional(),
        // Ou nombre de mois à regarder en arrière
        monthsToGoBack: z.number().int().min(1).max(24).default(12),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const now = new Date();
      // Définit la période: les 'monthsToGoBack' derniers mois complets + mois en cours
      const endDate = endOfMonth(now);
      const startDate = startOfMonth(subMonths(now, input.monthsToGoBack - 1));

      try {
        // Requête pour obtenir les revenus et dépenses agrégés par mois
        const monthlyData = await db
          .select({
            // Format 'YYYY-MM' pour grouper
            month: sql<string>`TO_CHAR(${transactions.date}, 'YYYY-MM')`,
            // Utilise ABS pour les dépenses pour les rendre positives
            expenses: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.amount} < 0 THEN ABS(${transactions.amount}) ELSE 0 END), 0)`,
            income: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.amount} > 0 THEN ${transactions.amount} ELSE 0 END), 0)`,
          })
          .from(transactions)
          .where(
            and(
              eq(transactions.userId, userId),
              gte(transactions.date, startDate),
              lte(transactions.date, endDate)
            )
          )
          .groupBy(sql`TO_CHAR(${transactions.date}, 'YYYY-MM')`)
          // Trier par mois pour le graphique
          .orderBy(asc(sql`TO_CHAR(${transactions.date}, 'YYYY-MM')`));

        // Formater les données pour le graphique
        const formattedData = monthlyData.map(row => {
          // Convertit 'YYYY-MM' en objet Date pour formater le label
          const year = parseInt(row.month.substring(0, 4), 10);
          const monthIndex = parseInt(row.month.substring(5, 7), 10) - 1; // Mois est 0-indexé
          const dateOfMonth = new Date(year, monthIndex);

          return {
            // Label lisible (ex: "Avr 2025")
            name: format(dateOfMonth, "MMM yyyy", { locale: fr }),
            Revenus: Number(row.income), // Convertir en nombre
            Dépenses: Number(row.expenses) // Convertir en nombre
          };
        });

        // Optionnel: Remplir les mois manquants (si un mois n'a aucune transaction)
        // const allMonths = eachMonthOfInterval({ start: startDate, end: endDate });
        // const filledData = allMonths.map(monthDate => {
        //   const monthName = format(monthDate, "MMM yyyy", { locale: fr });
        //   const existingData = formattedData.find(d => d.name === monthName);
        //   return existingData ?? { name: monthName, Revenus: 0, Dépenses: 0 };
        // });
        // return filledData; // Retourner les données remplies

        return formattedData; // Retourner les données brutes (mois avec transactions uniquement)

      } catch (error) {
        console.error("Error fetching monthly summaries:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des résumés mensuels.",
        });
      }
    }),

}); // Fin reportRouter 