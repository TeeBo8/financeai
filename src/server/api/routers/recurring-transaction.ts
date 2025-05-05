import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { recurringTransactions } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";

export const recurringTransactionRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(
      z.object({
        isSubscription: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const results = await ctx.db.query.recurringTransactions.findMany({
        where: and(
          eq(recurringTransactions.userId, ctx.session?.user.id ?? ""),
          input.isSubscription !== undefined
            ? eq(recurringTransactions.isSubscription, input.isSubscription)
            : undefined
        ),
        with: {
          bankAccount: true,
          category: true,
        },
        orderBy: (recurringTransactions, { desc }) => [
          desc(recurringTransactions.nextOccurrenceDate),
        ],
      });
      return results;
    }),
}); 