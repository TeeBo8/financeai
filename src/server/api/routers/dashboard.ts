import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { transactions } from "~/server/db/schema";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

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
}); 