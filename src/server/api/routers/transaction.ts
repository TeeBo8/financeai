import { z } from "zod"; // Utile pour valider les entrées plus tard
import { eq, desc, and, gte, lte, sql, like, lt } from "drizzle-orm"; // Import des opérateurs Drizzle (equal, descending)
import { revalidatePath } from "next/cache"; // Import de revalidatePath pour invalider le cache

import {
  createTRPCRouter,
  protectedProcedure, // <-- Important : Procédure accessible uniquement aux utilisateurs connectés
  // publicProcedure, // On n'en a pas besoin ici pour l'instant
} from "@/server/api/trpc";

// Importez votre schéma et la connexion db
import { db } from "@/server/db";
import * as schema from "@/server/db/schema"; // Importe toutes les tables et relations
import { TRPCError } from "@trpc/server";
import { transactions, bankAccounts } from "@/server/db/schema"; // Import direct des tables nécessaires

// Schéma de validation pour la création d'une transaction
const createTransactionSchema = z.object({
  amount: z.number({ invalid_type_error: "Le montant doit être un nombre" }),
  description: z.string().min(1, { message: "La description est requise" }),
  date: z.date({ required_error: "La date est requise" }),
  categoryId: z.string().nullable(), // Accepte n'importe quelle chaîne ou null
  bankAccountId: z.string().min(1, "L'ID du compte bancaire est requis."),
});

// Schéma de base pour les transactions (utilisé pour create et update)
const transactionInputSchemaBase = z.object({
  description: z.string().min(1, "La description est requise"),
  amount: z.coerce.number(), // Accepte positif/négatif
  date: z.date(),
  categoryId: z.string().nullable(), // Accepte n'importe quelle chaîne ou null
  bankAccountId: z.string().min(1, "L'ID du compte bancaire est requis."),
});

export const transactionRouter = createTRPCRouter({
  /**
   * Procédure pour récupérer toutes les transactions de l'utilisateur connecté.
   * Elle est protégée, donc ctx.session.user est garanti d'exister.
   */
  getAll: protectedProcedure
    .input(z.object({
      dateFrom: z.date().optional(),
      dateTo: z.date().optional(),
      categoryId: z.string().optional(),
      bankAccountId: z.string().optional(),
      description: z.string().optional(),
      type: z.enum(['all', 'income', 'expense']).optional().default('all'),
    }).optional())
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      console.log(`Fetching transactions for user: ${userId}`, "with filters:", input);

      const whereClauses = [eq(schema.transactions.userId, userId)];
      
      if (input?.dateFrom) {
        whereClauses.push(gte(schema.transactions.date, input.dateFrom));
      }
      if (input?.dateTo) {
        const dateToPlusOneDay = new Date(input.dateTo);
        dateToPlusOneDay.setDate(dateToPlusOneDay.getDate() + 1);
        whereClauses.push(lte(schema.transactions.date, dateToPlusOneDay));
      }
      if (input?.categoryId) {
        if (input.categoryId === 'none') {
          whereClauses.push(sql`${schema.transactions.categoryId} IS NULL`);
        } else {
          whereClauses.push(eq(schema.transactions.categoryId, input.categoryId));
        }
      }
      if (input?.bankAccountId && input.bankAccountId !== 'all') {
        whereClauses.push(eq(schema.transactions.bankAccountId, input.bankAccountId));
      }
      
      if (input?.description && input.description.trim() !== '') {
        whereClauses.push(like(schema.transactions.description, `%${input.description}%`));
      }
      
      if (input?.type === 'income') {
        whereClauses.push(gte(schema.transactions.amount, '0'));
      } else if (input?.type === 'expense') {
        whereClauses.push(lt(schema.transactions.amount, '0'));
      }

      try {
        const userTransactions = await db.query.transactions.findMany({
          where: and(...whereClauses),
          orderBy: [desc(schema.transactions.date), desc(schema.transactions.createdAt)],
          with: {
            category: true,
            bankAccount: {
              columns: {
                name: true,
                icon: true,
                color: true,
              }
            }
          },
        });

        console.log(`Found ${userTransactions.length} transactions`);

        return userTransactions;
      } catch (error) {
        console.error("Error fetching transactions:", error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erreur lors de la récupération des transactions.' });
      }
    }),

  /**
   * Procédure pour créer une nouvelle transaction.
   * Protégée, nécessite un utilisateur connecté.
   * Valide les données d'entrée avec Zod.
   */
  create: protectedProcedure
    .input(createTransactionSchema)
    .mutation(async ({ ctx, input }) => {
      // Récupérer l'ID de l'utilisateur connecté
      const userId = ctx.session.user.id;
      
      console.log("Attempting to create transaction for user:", userId);
      console.log("Input data:", input);
      
      // Vérifier que le compte bancaire appartient à l'utilisateur
      const bankAccountExists = await db.query.bankAccounts.findFirst({
        where: and(
          eq(schema.bankAccounts.id, input.bankAccountId),
          eq(schema.bankAccounts.userId, userId)
        ),
        columns: { id: true } // On a juste besoin de savoir s'il existe
      });

      if (!bankAccountExists) {
        console.error("Bank account not found or not owned by user:", input.bankAccountId);
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Compte bancaire invalide ou non autorisé.' });
      }

      // Vérifier aussi la catégorie si fournie
      if (input.categoryId) {
        const categoryExists = await db.query.categories.findFirst({
          where: and(
            eq(schema.categories.id, input.categoryId),
            eq(schema.categories.userId, userId)
          ),
          columns: { id: true }
        });
        if (!categoryExists) {
          console.error("Category not found or not owned by user:", input.categoryId);
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Catégorie invalide ou non autorisée.' });
        }
      }
      
      try {
        // Insérer la nouvelle transaction dans la base de données
        const result = await db.insert(schema.transactions).values({
          amount: input.amount.toString(), // Convertir en string pour numeric dans la BDD
          description: input.description,
          date: input.date,
          userId: userId,
          categoryId: input.categoryId,
          bankAccountId: input.bankAccountId,
        }).returning();
        
        // Vérifier si nous avons bien reçu une transaction
        if (!result || result.length === 0) {
          throw new Error("Échec de la création de transaction");
        }
        
        // On a vérifié que result contient au moins un élément, donc result[0] existe
        const newTransaction = result[0]!;
        console.log("Transaction created successfully:", newTransaction);
        
        // ----- IMPORTANT : Invalidation du cache -----
        // Invalider le cache des routes affectées par cette mutation
        revalidatePath("/dashboard"); // Invalide le cache pour la page dashboard
        revalidatePath("/transactions"); // Invalide aussi la page des transactions
        revalidatePath("/accounts"); // Invalide la page des comptes (soldes)
        revalidatePath("/reports"); // Invalide la page des rapports
        
        // Si une catégorie est spécifiée, récupérer ses détails
        if (newTransaction.categoryId) {
          const category = await db.query.categories.findFirst({
            where: eq(schema.categories.id, newTransaction.categoryId)
          });
          
          if (category) {
            // Retourner la transaction avec sa catégorie
            return {
              ...newTransaction,
              category: category,
            };
          }
        }
        
        // Sinon, retourner juste la transaction
        return newTransaction;
      } catch (error) {
        console.error("Failed to create transaction:", error);
        // Relance l'erreur pour que tRPC la gère et informe le client
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erreur lors de la création de la transaction.' });
      }
    }),

  /**
   * Procédure pour supprimer une transaction par son ID.
   * Protégée, nécessite un utilisateur connecté.
   * Vérifie que l'utilisateur est propriétaire de la transaction.
   */
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1, "ID de transaction requis."),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const transactionIdToDelete = input.id;

      console.log(`User ${userId} attempting to delete transaction ${transactionIdToDelete}`);

      try {
        // Suppression avec vérification d'appartenance
        const deleteResult = await db
          .delete(schema.transactions)
          .where(
            and(
              eq(schema.transactions.id, transactionIdToDelete),
              eq(schema.transactions.userId, userId) // <-- Sécurité !
            )
          )
          .returning({ deletedId: schema.transactions.id });

        // Vérifier si la suppression a eu lieu
        if (deleteResult.length === 0) {
          console.warn(`Transaction ${transactionIdToDelete} not found for user ${userId} or permission denied.`);
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: "La transaction que vous essayez de supprimer n'a pas été trouvée ou ne vous appartient pas.",
          });
        }

        console.log(`Transaction ${deleteResult[0]?.deletedId} successfully deleted by user ${userId}.`);

        // Invalider le cache des routes affectées par cette mutation
        revalidatePath("/dashboard");
        revalidatePath("/transactions");
        revalidatePath("/accounts");
        revalidatePath("/reports");

        return { success: true, deletedId: deleteResult[0]?.deletedId };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error(`Failed to delete transaction ${transactionIdToDelete} for user ${userId}:`, error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Une erreur est survenue lors de la suppression de la transaction.',
          cause: error,
        });
      }
    }),

  /**
   * Procédure pour mettre à jour une transaction existante.
   * Protégée, nécessite un utilisateur connecté.
   * Valide les données d'entrée avec Zod et vérifie que l'utilisateur est propriétaire.
   */
  update: protectedProcedure
    .input(
      // Schéma de base rendu partiel + ID obligatoire
      transactionInputSchemaBase.partial().extend({
        id: z.string().min(1, "ID de transaction requis pour la mise à jour."),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { id: transactionId, ...updateData } = input; // Sépare l'ID

      console.log(`User ${userId} attempting to update transaction ${transactionId}`);
      console.log("Update data:", updateData);
      
      // 1. Trouver la transaction existante pour vérifier la propriété et obtenir l'ancien montant/catégorie
      const existingTransaction = await db.query.transactions.findFirst({
        where: and(eq(schema.transactions.id, transactionId), eq(schema.transactions.userId, userId))
      });

      if (!existingTransaction) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Transaction non trouvée ou non autorisée.' });
      }

      // 2. Vérifier le nouveau bankAccountId s'il est fourni
      if (updateData.bankAccountId && updateData.bankAccountId !== existingTransaction.bankAccountId) {
        const bankAccountExists = await db.query.bankAccounts.findFirst({
          where: and(
            eq(schema.bankAccounts.id, updateData.bankAccountId),
            eq(schema.bankAccounts.userId, userId)
          ),
          columns: { id: true }
        });
        if (!bankAccountExists) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Nouveau compte bancaire invalide ou non autorisé.' });
        }
      }

      // 3. Vérifier la nouvelle categoryId si fournie
      if (updateData.categoryId !== undefined && updateData.categoryId !== existingTransaction.categoryId) {
        if (updateData.categoryId !== null) { // Si ce n'est pas null, vérifier l'existence et la propriété
          const categoryExists = await db.query.categories.findFirst({
            where: and(
              eq(schema.categories.id, updateData.categoryId),
              eq(schema.categories.userId, userId)
            ),
            columns: { id: true }
          });
          if (!categoryExists) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'Nouvelle catégorie invalide ou non autorisée.' });
          }
        }
      }

      try {
        // Prépare l'objet `set` uniquement avec les champs fournis dans l'input
        const dataToSet: Partial<typeof schema.transactions.$inferInsert> = {};
        if (updateData.description !== undefined) dataToSet.description = updateData.description;
        if (updateData.amount !== undefined) dataToSet.amount = updateData.amount.toString();
        if (updateData.date !== undefined) dataToSet.date = updateData.date;
        if (updateData.categoryId !== undefined) dataToSet.categoryId = updateData.categoryId;
        if (updateData.bankAccountId !== undefined) dataToSet.bankAccountId = updateData.bankAccountId;
        // Mettre à jour 'updatedAt' manuellement
        dataToSet.updatedAt = new Date();

        // Mise à jour DB
        const updatedTransactions = await db
          .update(schema.transactions)
          .set(dataToSet)
          .where(
            and(
              eq(schema.transactions.id, transactionId),
              eq(schema.transactions.userId, userId) // <-- Sécurité !
            )
          )
          .returning(); // Retourne la transaction mise à jour

        // Vérifier si la mise à jour a eu lieu
        if (updatedTransactions.length === 0) {
          console.warn(`Transaction ${transactionId} not found for user ${userId} or permission denied for update.`);
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: "La transaction que vous essayez de modifier n'a pas été trouvée ou ne vous appartient pas.",
          });
        }

        const updatedTransaction = updatedTransactions[0];
        console.log(`Transaction ${updatedTransaction?.id} successfully updated by user ${userId}.`);

        // Invalider le cache des routes affectées par cette mutation
        revalidatePath("/dashboard");
        revalidatePath("/transactions");
        revalidatePath("/accounts");
        revalidatePath("/reports");

        // Si une catégorie est spécifiée dans la transaction mise à jour, la récupérer
        if (updatedTransaction?.categoryId) {
          const category = await db.query.categories.findFirst({
            where: eq(schema.categories.id, updatedTransaction.categoryId)
          });
          
          if (category) {
            // Retourner la transaction avec sa catégorie
            return {
              ...updatedTransaction,
              category: category,
            };
          }
        }
        
        // Sinon, retourner juste la transaction mise à jour
        return updatedTransaction;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error(`Failed to update transaction ${transactionId} for user ${userId}:`, error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Une erreur est survenue lors de la mise à jour de la transaction.',
          cause: error,
        });
      }
    }),

  // == CREATE TRANSFER ==
  createTransfer: protectedProcedure
    .input(
      z.object({
        fromAccountId: z.string().min(1, "Compte source requis."),
        toAccountId: z.string().min(1, "Compte destination requis."),
        amount: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
            message: "Le montant doit être un nombre positif.",
        }), // Montant positif du transfert
        date: z.date(),
        description: z.string().max(256).optional(), // Description optionnelle
      }).refine(data => data.fromAccountId !== data.toAccountId, { // Empêche transfert vers le même compte
          message: "Le compte source et le compte destination doivent être différents.",
          path: ["toAccountId"], // Erreur associée au champ 'toAccountId'
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { fromAccountId, toAccountId, amount, date } = input;
      const transferAmount = parseFloat(amount); // Convertit en nombre
      const description = input.description ?? `Transfert entre comptes`;

      // Génère un ID unique pour lier les deux transactions du transfert
      const transferId = `tf_${crypto.randomUUID()}`; // Utilise crypto.randomUUID() natif

      console.log(`Creating transfer for user: ${userId}, From: ${fromAccountId}, To: ${toAccountId}, Amount: ${transferAmount}, TransferID: ${transferId}`);

      // Utilisation d'une transaction de base de données pour assurer l'atomicité
      // Si l'une des insertions échoue, l'autre sera annulée (rollback)
      try {
        await db.transaction(async (tx) => {
          // 1. Vérifier que les deux comptes appartiennent à l'utilisateur
          const accounts = await tx.select({ id: bankAccounts.id })
            .from(bankAccounts)
            .where(and(
                eq(bankAccounts.userId, userId),
                // Vérifie que les deux ID existent et appartiennent à l'user
                sql`${bankAccounts.id} IN (${fromAccountId}, ${toAccountId})`
            ));

           if (accounts.length !== 2) {
               console.error("One or both accounts not found or not owned by user.", { fromAccountId, toAccountId, found: accounts });
               // Essayer de donner un message plus précis
               const fromExists = accounts.some(a => a.id === fromAccountId);
               const toExists = accounts.some(a => a.id === toAccountId);
               let message = "Compte(s) invalide(s) ou non autorisé(s).";
               if (!fromExists && !toExists) message = "Comptes source et destination invalides.";
               else if (!fromExists) message = "Compte source invalide.";
               else if (!toExists) message = "Compte destination invalide.";
               throw new TRPCError({ code: 'BAD_REQUEST', message });
           }

          // 2. Créer la transaction de sortie (montant négatif)
          const [outgoingTx] = await tx.insert(transactions).values({
              userId,
              bankAccountId: fromAccountId,
              amount: (-transferAmount).toFixed(2), // Montant négatif, formaté à 2 décimales
              date,
              description: `Sortie: ${description}`, // Ajoute un préfixe pour clarté
              transferId, // Lie les transactions
              categoryId: null, // Pas de catégorie pour les transferts internes
          }).returning({id: transactions.id});

           if (!outgoingTx) throw new Error("Failed to create outgoing transaction."); // Erreur interne à la transaction DB

          // 3. Créer la transaction d'entrée (montant positif)
          const [incomingTx] = await tx.insert(transactions).values({
            userId,
            bankAccountId: toAccountId,
            amount: transferAmount.toFixed(2), // Montant positif
            date,
            description: `Entrée: ${description}`, // Ajoute un préfixe
            transferId, // Même ID de transfert
            categoryId: null,
          }).returning({id: transactions.id});

          if (!incomingTx) throw new Error("Failed to create incoming transaction.");

          console.log(`Transfer successful: Outgoing Tx ID: ${outgoingTx.id}, Incoming Tx ID: ${incomingTx.id}`);
        }); // Fin de la transaction DB

        // Retourne un message de succès ou les ID créés
        return { success: true, transferId };

      } catch (error) {
          // Attrape les erreurs de la transaction DB ou les TRPCErrors lancées dedans
          if (error instanceof TRPCError) throw error;
          if (error instanceof Error) {
               console.error("Error during database transaction for transfer:", error.message);
                // Erreur plus générique pour le client
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erreur lors de la création du transfert.' });
          }
          console.error("Unknown error during transfer creation:", error);
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erreur inconnue lors de la création du transfert.' });
      }
    }),
}); 