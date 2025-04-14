import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { transactions } from "~/server/db/schema";
import { and, eq, gte, lte, sql, lt, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  subDays,
  startOfDay,
  endOfDay,
  formatISO,
  eachDayOfInterval,
  format,
} from "date-fns";
import { fr } from "date-fns/locale";

export const dashboardRouter = createTRPCRouter({
  // 1. Obtenir le solde total
  getTotalBalance: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    try {
      // Calculer le solde total à partir des transactions
      const result = await db
        .select({
          total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
        })
        .from(transactions)
        .where(eq(transactions.userId, userId));

      // Convertir le résultat en nombre
      return Number(result[0]?.total ?? 0);
    } catch (error) {
      console.error("Error fetching total balance:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erreur lors de la récupération du solde total.",
      });
    }
  }),

  // 2. Obtenir les dépenses et revenus du mois en cours
  getCurrentMonthSummary: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    
    // Dates du mois précédent pour les comparaisons
    const prevMonthStart = startOfMonth(subMonths(now, 1));
    const prevMonthEnd = endOfMonth(subMonths(now, 1));

    try {
      // Calcul pour le mois en cours
      const currentMonthResult = await db
        .select({
          expenses: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.amount} < 0 THEN ABS(${transactions.amount}) ELSE 0 END), 0)`,
          income: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.amount} > 0 THEN ${transactions.amount} ELSE 0 END), 0)`,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId),
            gte(transactions.date, currentMonthStart),
            lte(transactions.date, currentMonthEnd)
          )
        );

      // Calcul pour le mois précédent (pour comparaison)
      const prevMonthResult = await db
        .select({
          expenses: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.amount} < 0 THEN ABS(${transactions.amount}) ELSE 0 END), 0)`,
          income: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.amount} > 0 THEN ${transactions.amount} ELSE 0 END), 0)`,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId),
            gte(transactions.date, prevMonthStart),
            lte(transactions.date, prevMonthEnd)
          )
        );

      // Convertir les résultats en nombres
      const currentExpenses = Number(currentMonthResult[0]?.expenses ?? 0);
      const currentIncome = Number(currentMonthResult[0]?.income ?? 0);
      const prevExpenses = Number(prevMonthResult[0]?.expenses ?? 0);
      const prevIncome = Number(prevMonthResult[0]?.income ?? 0);

      // Calcul des pourcentages de variation
      const calculatePercentChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / Math.abs(previous)) * 100;
      };

      const expensesChange = calculatePercentChange(currentExpenses, prevExpenses);
      const incomeChange = calculatePercentChange(currentIncome, prevIncome);
      const savingsChange = calculatePercentChange(
        currentIncome - currentExpenses,
        prevIncome - prevExpenses
      );

      return {
        expenses: currentExpenses,
        income: currentIncome,
        savings: currentIncome - currentExpenses,
        expensesChange,
        incomeChange,
        savingsChange,
      };
    } catch (error) {
      console.error("Error fetching current month summary:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erreur lors de la récupération du résumé mensuel.",
      });
    }
  }),

  // 3. Obtenir l'historique récent du solde
  getRecentBalanceTrend: protectedProcedure
    .input(
      z.object({
        // Permet de choisir le nombre de jours (7 par défaut)
        numberOfDays: z.number().int().min(2).max(90).default(7),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { numberOfDays } = input;
      const now = new Date();
      // Ajustement: Prendre la fin de la journée d'hier pour que le graphique s'arrête à la dernière journée complète
      const endDate = endOfDay(subDays(now, 1));
      const startDate = startOfDay(subDays(endDate, numberOfDays - 1));

      try {
        // Étape 1: Calculer le solde initial (total avant le début de notre période)
        const initialBalanceResult = await db
          .select({
            total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
          })
          .from(transactions)
          .where(
            and(
              eq(transactions.userId, userId),
              lt(transactions.date, startDate) // Transactions avant startDate
            )
          );
        let runningBalance = Number(initialBalanceResult[0]?.total ?? 0);

        // Étape 2: Obtenir les changements nets journaliers PENDANT la période
        // Utilise date_trunc spécifique à PostgreSQL pour grouper par jour
        const dailyChangesResult = await db
          .select({
            // Important: Assurer que le format de date est 'YYYY-MM-DD'
            day: sql<string>`DATE_TRUNC('day', ${transactions.date})::date::text`,
            change: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
          })
          .from(transactions)
          .where(
            and(
              eq(transactions.userId, userId),
              gte(transactions.date, startDate),
              lte(transactions.date, endDate) // Jusqu'à la fin de la période
            )
          )
          .groupBy(sql`DATE_TRUNC('day', ${transactions.date})::date`)
          .orderBy(asc(sql`DATE_TRUNC('day', ${transactions.date})::date`));

        // Créer une Map pour un accès facile : {'YYYY-MM-DD': changement}
        const dailyChangesMap = new Map<string, number>();
        dailyChangesResult.forEach((row) => {
          if (row.day) {
            dailyChangesMap.set(row.day, Number(row.change));
          }
        });

        // Étape 3: Construire les données du graphique jour par jour
        const intervalDays = eachDayOfInterval({ start: startDate, end: endDate });
        const trendData = intervalDays.map((day) => {
          const dayStr = formatISO(day, { representation: "date" }); // 'YYYY-MM-DD'
          const changeForDay = dailyChangesMap.get(dayStr) ?? 0;
          runningBalance += changeForDay; // Met à jour le solde courant
          return {
            // Format pour le label du graphique (ex: '14/04')
            name: format(day, "dd/MM", { locale: fr }),
            // Date complète peut être utile pour des tooltips ou filtres futurs
            date: dayStr,
            Solde: runningBalance, // La clé doit correspondre au dataKey dans le graphique
          };
        });
        
        return trendData;
      } catch (error) {
        console.error("Error fetching recent balance trend:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération de l'historique du solde.",
        });
      }
    }),
}); 