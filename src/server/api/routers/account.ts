import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { bankAccounts, transactions } from "~/server/db/schema";
import { eq, sql, and, getTableColumns } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { revalidatePath } from "next/cache";

// Schéma de base pour la validation (sera aussi utilisé côté client)
export const accountInputSchema = z.object({
  name: z.string().min(1, "Le nom du compte est requis."),
  // Nous retirons le champ 'type' car il n'existe pas dans la table bankAccounts
  icon: z.string().optional(),
  color: z.string().optional(),
});

export const accountRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
      const userAccounts = await ctx.db
          .select({
              ...getTableColumns(bankAccounts),
              balance: sql<number>`coalesce(sum(${transactions.amount}), 0)::real`.mapWith(Number),
          })
          .from(bankAccounts)
          .leftJoin(transactions, eq(bankAccounts.id, transactions.bankAccountId))
          .where(eq(bankAccounts.userId, ctx.session.user.id))
          .groupBy(bankAccounts.id)
          .orderBy(bankAccounts.name);

      return userAccounts.map(acc => ({
          ...acc,
          // Assurer que balance est bien un nombre
          balance: typeof acc.balance === 'string' ? parseFloat(acc.balance) : acc.balance
      }));
  }),

  // --- MUTATION CREATE ---
  create: protectedProcedure
    .input(accountInputSchema) // Utilise le schéma de validation
    .mutation(async ({ ctx, input }) => {
      const [newAccount] = await ctx.db
        .insert(bankAccounts)
        .values({
          name: input.name,
          userId: ctx.session.user.id,
          icon: input.icon,
          color: input.color,
          // Le solde initial est implicitement 0, géré par les transactions
        })
        .returning(); // Retourne le compte créé

      if (!newAccount) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la création du compte."
        });
      }

      // Invalidation des caches
      revalidatePath("/accounts");
      revalidatePath("/dashboard"); // Le solde total peut changer (même si 0 au début)

      return newAccount;
    }),

  // --- MUTATION UPDATE ---
  update: protectedProcedure
    .input(
      // Pour l'update, on ajoute l'ID et on rend les autres champs optionnels
      accountInputSchema.extend({
        id: z.string().min(1, "ID de compte requis."), // Accepte n'importe quel format d'ID non vide
        name: accountInputSchema.shape.name.optional(), // Optional pour update
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // Vérifier si le compte appartient à l'utilisateur avant de mettre à jour
      const account = await ctx.db.query.bankAccounts.findFirst({
          where: and(eq(bankAccounts.id, id), eq(bankAccounts.userId, ctx.session.user.id)),
          columns: { id: true },
      });

      if (!account) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Compte non trouvé ou non autorisé." });
      }

      // Si aucune donnée à mettre à jour n'est fournie (ne devrait pas arriver avec le formulaire)
      if (Object.keys(updateData).length === 0) {
          return await ctx.db.query.bankAccounts.findFirst({ where: eq(bankAccounts.id, id) }); // Retourne le compte existant
      }

      const [updatedAccount] = await ctx.db
        .update(bankAccounts)
        .set({
            ...updateData,
            updatedAt: new Date(), // Mettre à jour la date de modification
        })
        .where(eq(bankAccounts.id, id))
        .returning();

      if (!updatedAccount) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la mise à jour du compte."
        });
      }

      // Invalidation des caches
      revalidatePath("/accounts");
      revalidatePath("/dashboard"); // Le nom pourrait changer dans certains affichages ?

      return updatedAccount;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1, "ID de compte requis.") }))
    .mutation(async ({ ctx, input }) => {
      // ... (code existant pour delete) ...
    }),
}); 