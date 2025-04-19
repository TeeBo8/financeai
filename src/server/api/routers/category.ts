import { z } from "zod";
import { eq, and, desc, ne } from "drizzle-orm";

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

import { db } from "~/server/db";
import * as schema from "~/server/db/schema";
import { TRPCError } from "@trpc/server";
import { revalidatePath } from "next/cache";

// Schéma pour la création/modification d'une catégorie
const categoryInputSchemaBase = z.object({
    name: z.string().min(1, "Le nom de la catégorie est requis").max(50, "Le nom ne peut pas dépasser 50 caractères"),
    icon: z.string().max(50, "L'icône est trop longue").optional().nullable().or(z.literal('')).transform(val => val === '' ? null : val),
    color: z.string()
           .regex(/^#[0-9A-Fa-f]{6}$/, "Format couleur invalide (ex: #FF5733)")
           .optional()
           .nullable()
           .or(z.literal(''))
           .transform(val => val === '' ? null : val),
});

export const categoryRouter = createTRPCRouter({
  /**
   * Procédure pour récupérer toutes les catégories créées par l'utilisateur connecté.
   * Protégée, ctx.session.user est garanti d'exister.
   */
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    console.log(`Fetching categories for user: ${userId}`);

    const userCategories = await db.query.categories.findMany({
      where: eq(schema.categories.userId, userId),
      orderBy: [desc(schema.categories.name)],
    });

    console.log(`Found ${userCategories.length} categories`);

    return userCategories;
  }),

  // --- Nouvelle Procédure : Create ---
  create: protectedProcedure
    .input(categoryInputSchemaBase)
    .mutation(async ({ ctx, input }) => {
        const userId = ctx.session.user.id;
        console.log(`User ${userId} attempting to create category`);
        console.log("Input data:", input);

        // Optionnel : Vérifier si une catégorie avec le même nom existe déjà pour cet utilisateur
        const existingCategory = await db.query.categories.findFirst({
            where: and(
                eq(schema.categories.userId, userId),
                eq(schema.categories.name, input.name)
            ),
        });

        if (existingCategory) {
            throw new TRPCError({
                code: 'CONFLICT', // Code 409
                message: `Une catégorie nommée "${input.name}" existe déjà.`,
            });
        }

        try {
            const newCategory = await db
                .insert(schema.categories)
                .values({
                    userId,
                    name: input.name,
                    icon: input.icon ?? undefined,
                    color: input.color ?? undefined,
                })
                .returning();

            console.log("Category created successfully:", newCategory[0]);
            revalidatePath("/categories");
            revalidatePath("/transactions");
            
            return newCategory[0];

        } catch (error) {
            console.error("Error creating category:", error);
            // Gérer les erreurs potentielles de DB
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erreur lors de la création de la catégorie.', cause: error });
        }
    }),

  // --- Nouvelle Procédure : Update ---
  update: protectedProcedure
    .input(
        categoryInputSchemaBase.partial().extend({
            id: z.string().min(1, "ID de catégorie requis."),
        })
    )
    .mutation(async ({ ctx, input }) => {
        const userId = ctx.session.user.id;
        const { id: categoryId, ...updateData } = input;

        console.log(`User ${userId} attempting to update category ${categoryId}`);
        console.log("Update data:", updateData);

        // Si le nom est modifié, vérifier qu'il n'entre pas en conflit avec une autre catégorie existante
        if (updateData.name) {
            const existingCategory = await db.query.categories.findFirst({
                where: and(
                    eq(schema.categories.userId, userId),
                    eq(schema.categories.name, updateData.name),
                    // Exclure la catégorie actuelle de la vérification
                    ne(schema.categories.id, categoryId)
                ),
            });
            if (existingCategory) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: `Une autre catégorie nommée "${updateData.name}" existe déjà.`,
                });
            }
        }

        try {
            const updatedCategories = await db
                .update(schema.categories)
                .set({
                    ...{
                        name: updateData.name,
                        icon: updateData.icon ?? undefined,
                        color: updateData.color ?? undefined,
                    },
                    updatedAt: new Date(),
                })
                .where(
                    and(
                        eq(schema.categories.id, categoryId),
                        eq(schema.categories.userId, userId) // Sécurité
                    )
                )
                .returning();

            if (updatedCategories.length === 0) {
                console.warn(`Category ${categoryId} not found for user ${userId} or permission denied for update.`);
                throw new TRPCError({ code: 'NOT_FOUND', message: "Catégorie non trouvée ou non modifiable." });
            }

            const updatedCategory = updatedCategories[0];
            console.log(`Category ${updatedCategory?.id} successfully updated by user ${userId}.`);
            
            revalidatePath("/categories");
            revalidatePath("/transactions");
            
            return updatedCategory;

        } catch (error) {
            if (error instanceof TRPCError) throw error;
            console.error(`Failed to update category ${categoryId}:`, error);
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erreur lors de la modification de la catégorie.', cause: error });
        }
    }),

  // --- Nouvelle Procédure : Delete ---
  delete: protectedProcedure
    .input(
        z.object({ id: z.string().min(1, "ID de catégorie invalide.") })
    )
    .mutation(async ({ ctx, input }) => {
        const userId = ctx.session.user.id;
        const categoryIdToDelete = input.id;

        console.log(`User ${userId} attempting to delete category ${categoryIdToDelete}`);

        try {
            const deleteResult = await db
                .delete(schema.categories)
                .where(
                    and(
                        eq(schema.categories.id, categoryIdToDelete),
                        eq(schema.categories.userId, userId) // Sécurité
                    )
                )
                .returning({ deletedId: schema.categories.id });

            if (deleteResult.length === 0) {
                console.warn(`Category ${categoryIdToDelete} not found for user ${userId} or permission denied.`);
                throw new TRPCError({ code: 'NOT_FOUND', message: "Catégorie non trouvée ou non supprimable."});
            }

            console.log(`Category ${deleteResult[0]?.deletedId} successfully deleted by user ${userId}.`);
            
            revalidatePath("/categories");
            revalidatePath("/transactions");
            revalidatePath("/reports");
            
            return { success: true, deletedId: deleteResult[0]?.deletedId };

        } catch (error) {
            if (error instanceof TRPCError) throw error;
            console.error(`Failed to delete category ${categoryIdToDelete}:`, error);
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erreur lors de la suppression de la catégorie.', cause: error });
        }
    }),
}); 