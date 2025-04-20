import { postRouter } from "~/server/api/routers/post";
import { transactionRouter } from "~/server/api/routers/transaction";
import { categoryRouter } from "~/server/api/routers/category";
import { budgetRouter } from "~/server/api/routers/budget";
import { bankAccountRouter } from "~/server/api/routers/bankAccount";
import { accountRouter } from "~/server/api/routers/account";
import { reportRouter } from "~/server/api/routers/report";
import { dashboardRouter } from "~/server/api/routers/dashboard";
import { aiRouter } from "~/server/api/routers/ai";
import { recurringTransactionRouter } from "~/server/api/routers/recurringTransaction";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  transaction: transactionRouter,
  category: categoryRouter,
  budget: budgetRouter,
  bankAccount: bankAccountRouter,
  account: accountRouter,
  report: reportRouter,
  dashboard: dashboardRouter,
  ai: aiRouter,
  recurringTransaction: recurringTransactionRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
