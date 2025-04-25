import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import * as schema from "@/server/db/schema";
import { TRPCError } from "@trpc/server";
import { eq, and, desc } from "drizzle-orm";

// --- Schémas Zod d'Input ---

// Schéma pour la création
export const savingsGoalCreateInput = z.object({
  name: z.string().min(1, { message: "Le nom est requis." }).max(256),
  targetAmount: z.number().positive({ message: "Le montant cible doit être positif." }),
  targetDate: z.date().optional().nullable(), // Date optionnelle
  icon: z.string().max(50).optional().nullable(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, { message: "Format de couleur invalide (#RRGGBB)" }).optional().nullable(),
});

// Schéma pour la mise à jour (ID requis, reste optionnel)
export const savingsGoalUpdateInput = z.object({
  id: z.string().min(1),
  name: z.string().min(1, { message: "Le nom est requis." }).max(256).optional(),
  targetAmount: z.number().positive({ message: "Le montant cible doit être positif." }).optional(),
  targetDate: z.date().optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, { message: "Format de couleur invalide (#RRGGBB)" }).optional().nullable(),
  // On ne permet pas de modifier currentAmount directement via update, seulement via 'contribute'
});

// Schéma pour juste un ID (pour delete et getById si besoin)
export const savingsGoalIdInput = z.object({
  id: z.string().min(1),
});

// Schéma pour la contribution
export const savingsGoalContributeInput = z.object({
  id: z.string().min(1),
  contributionAmount: z.number().positive({ message: "La contribution doit être positive." }),
});

// --- Routeur tRPC ---

export const savingsGoalRouter = createTRPCRouter({
  create: protectedProcedure
    .input(savingsGoalCreateInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      try {
        const [newGoal] = await ctx.db
          .insert(schema.savingsGoals)
          .values({
            userId: userId,
            name: input.name,
            targetAmount: input.targetAmount.toString(), // Convertir decimal en string pour Drizzle/pg
            targetDate: input.targetDate,
            // currentAmount a une valeur par défaut dans la DB ('0.00')
            icon: input.icon,
            color: input.color,
            // createdAt et updatedAt sont gérés par la DB
          })
          .returning(); // Récupère l'enregistrement inséré

        if (!newGoal) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Échec de la création de l\'objectif d\'épargne.',
          });
        }

        // Retourne l'objectif créé (convertit les montants en nombre si nécessaire)
        return {
          ...newGoal,
          targetAmount: parseFloat(newGoal.targetAmount),
          currentAmount: parseFloat(newGoal.currentAmount),
        };

      } catch (error) {
        console.error("Error creating savings goal:", error);
        // Log l'erreur spécifique si possible
        if (error instanceof TRPCError) throw error; // Re-throw les erreurs TRPC connues
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Une erreur est survenue lors de la création de l\'objectif.',
        });
      }
    }),

  list: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;

      try {
        const goals = await ctx.db.query.savingsGoals.findMany({
          where: eq(schema.savingsGoals.userId, userId),
          orderBy: (goals, { desc }) => [desc(goals.createdAt)],
        });

        // Convertit les montants en nombres pour le frontend
        return goals.map(goal => ({
          ...goal,
          targetAmount: parseFloat(goal.targetAmount),
          currentAmount: parseFloat(goal.currentAmount),
        }));

      } catch (error) {
        console.error("Error fetching savings goals:", error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Impossible de récupérer les objectifs d\'épargne.',
        });
      }
    }),

  update: protectedProcedure
    .input(savingsGoalUpdateInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { id, ...dataToUpdate } = input;

      // Crée un objet de mise à jour avec les types corrects
      const updateData: Partial<typeof schema.savingsGoals.$inferInsert> = {};
      
      // Ajoute les champs non-undefined un par un
      if (dataToUpdate.name !== undefined) updateData.name = dataToUpdate.name;
      if (dataToUpdate.targetAmount !== undefined) updateData.targetAmount = dataToUpdate.targetAmount.toString();
      if (dataToUpdate.targetDate !== undefined) updateData.targetDate = dataToUpdate.targetDate;
      if (dataToUpdate.icon !== undefined) updateData.icon = dataToUpdate.icon;
      if (dataToUpdate.color !== undefined) updateData.color = dataToUpdate.color;

      try {
        const [updatedGoal] = await ctx.db
          .update(schema.savingsGoals)
          .set(updateData)
          .where(and(
            eq(schema.savingsGoals.id, id),
            eq(schema.savingsGoals.userId, userId)
          ))
          .returning();

        if (!updatedGoal) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Objectif d\'épargne non trouvé ou accès non autorisé.',
          });
        }

        return {
          ...updatedGoal,
          targetAmount: parseFloat(updatedGoal.targetAmount),
          currentAmount: parseFloat(updatedGoal.currentAmount),
        };

      } catch (error) {
        console.error("Error updating savings goal:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Une erreur est survenue lors de la mise à jour de l\'objectif.',
        });
      }
    }),

  delete: protectedProcedure
    .input(savingsGoalIdInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { id } = input;

      try {
        const [deletedGoal] = await ctx.db
          .delete(schema.savingsGoals)
          .where(and(
            eq(schema.savingsGoals.id, id),
            eq(schema.savingsGoals.userId, userId)
          ))
          .returning();

        if (!deletedGoal) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Objectif d\'épargne non trouvé ou accès non autorisé.',
          });
        }

        return {
          ...deletedGoal,
          targetAmount: parseFloat(deletedGoal.targetAmount),
          currentAmount: parseFloat(deletedGoal.currentAmount),
        };

      } catch (error) {
        console.error("Error deleting savings goal:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Une erreur est survenue lors de la suppression de l\'objectif.',
        });
      }
    }),

  contribute: protectedProcedure
    .input(savingsGoalContributeInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { id, contributionAmount } = input;

      try {
        const updatedGoal = await ctx.db.transaction(async (tx) => {
          const currentGoal = await tx.query.savingsGoals.findFirst({
            where: and(
              eq(schema.savingsGoals.id, id),
              eq(schema.savingsGoals.userId, userId)
            ),
          });

          if (!currentGoal) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Objectif d\'épargne non trouvé ou accès non autorisé.',
            });
          }

          const currentAmountNumber = parseFloat(currentGoal.currentAmount);
          const newCurrentAmount = currentAmountNumber + contributionAmount;

          const [result] = await tx
            .update(schema.savingsGoals)
            .set({
              currentAmount: newCurrentAmount.toString(),
            })
            .where(and(
              eq(schema.savingsGoals.id, id),
              eq(schema.savingsGoals.userId, userId)
            ))
            .returning();

          if (!result) {
            throw new TRPCError({ 
              code: 'INTERNAL_SERVER_ERROR', 
              message: 'Échec de la mise à jour de la contribution.' 
            });
          }
          return result;
        });

        return {
          ...updatedGoal,
          targetAmount: parseFloat(updatedGoal.targetAmount),
          currentAmount: parseFloat(updatedGoal.currentAmount),
        };

      } catch (error) {
        console.error("Error contributing to savings goal:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Une erreur est survenue lors de l\'ajout de la contribution.',
        });
      }
    }),
});

// Exporte le type du routeur
export type SavingsGoalRouter = typeof savingsGoalRouter; 