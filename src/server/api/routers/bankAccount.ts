// src/server/api/routers/bankAccount.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { bankAccounts, transactions } from "@/server/db/schema";
import { and, eq, desc, sql, sum, getTableColumns } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// Regex simple pour valider un code couleur hexadécimal (# suivi de 3 ou 6 chiffres/lettres)
const hexColorRegex = /^#([0-9A-Fa-f]{3}){1,2}$/;

// Schéma de base pour la validation
const bankAccountInputSchema = z.object({
  name: z.string().min(1, { message: "Le nom du compte est requis." }).max(256, { message: "Le nom du compte est trop long (max 256 caractères)." }),
  // On pourrait ajouter ici: initialBalance, currency, type plus tard
  icon: z.string().optional().or(z.literal('')).transform(val => val === '' ? null : val), // Optionnel, transforme "" en null
  color: z.string()
         .regex(hexColorRegex, { message: "Format couleur invalide (ex: #FFF)." })
         .optional()
         .or(z.literal('')) // Permet chaîne vide
         .transform(val => val === '' ? null : val), // Transforme "" en null
});

export const bankAccountRouter = createTRPCRouter({
  // == CREATE ==
  create: protectedProcedure
    .input(bankAccountInputSchema)
    .mutation(async ({ ctx, input }) => {
      console.log("Creating bank account for user:", ctx.session.user.id, "with name:", input.name);
      try {
        const [newAccount] = await ctx.db
          .insert(bankAccounts)
          .values({
            userId: ctx.session.user.id,
            name: input.name,
            icon: input.icon,
            color: input.color,
            // updatedAt: new Date() // Drizzle gère ça avec $onUpdate
          })
          .returning(); // Retourne le compte créé

        if (!newAccount) {
            console.error("Failed to create bank account, insert operation returned undefined.");
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Impossible de créer le compte bancaire.' });
        }

        console.log("Bank account created successfully:", newAccount);
        return newAccount;

      } catch (error) {
        console.error("Error creating bank account:", error);
        // Log plus détaillé si nécessaire
        // if (error instanceof Error) { console.error(error.message); }
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erreur lors de la création du compte bancaire.' });
      }
    }),

  // == READ (Get All with Balance Calculation) ==
  getAll: protectedProcedure
    .query(async ({ ctx }) => {
      console.log("Fetching bank accounts with balance for user:", ctx.session.user.id);
      try {
        // Sélectionne toutes les colonnes de bankAccounts + la somme des transactions
        const accountsWithBalance = await db
          .select({
            // Récupère toutes les colonnes de la table bankAccounts
            ...getTableColumns(bankAccounts),
            // Calcule la somme des montants des transactions associées
            // Utilise coalesce pour retourner '0.00' si la somme est NULL (aucune transaction)
            // sum() renvoie une chaîne pour les types decimal/numeric
            balance: sql<string>`coalesce(${sum(transactions.amount)}, '0.00')`.as('balance'),
          })
          .from(bankAccounts)
          // Jointure GAUCHE pour inclure les comptes sans transactions
          .leftJoin(transactions, eq(bankAccounts.id, transactions.bankAccountId))
          // Filtre pour l'utilisateur connecté
          .where(eq(bankAccounts.userId, ctx.session.user.id))
          // Regroupe par ID de compte pour que SUM() fonctionne par compte
          .groupBy(bankAccounts.id) // PostgreSQL est assez intelligent pour permettre de grouper juste par PK
          // Trie par date de création du compte
          .orderBy(desc(bankAccounts.createdAt));

        console.log(`Found ${accountsWithBalance.length} bank accounts with calculated balance`);
        return accountsWithBalance; // Retourne les comptes avec la propriété 'balance' ajoutée

      } catch (error) {
          console.error("Error fetching bank accounts with balance:", error);
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erreur lors de la récupération des comptes bancaires et des soldes.' });
      }
    }),

  // == UPDATE ==
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1), // ID du compte à mettre à jour
        name: z.string().min(1, { message: "Le nom du compte est requis." }).max(256).optional(),
        icon: bankAccountInputSchema.shape.icon.optional(),
        color: bankAccountInputSchema.shape.color.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log("Updating bank account:", input.id, "for user:", ctx.session.user.id);
      
      try {
        // Vérifier d'abord si le compte existe et appartient à l'utilisateur
        const existingAccount = await ctx.db.query.bankAccounts.findFirst({
          where: and(
            eq(bankAccounts.id, input.id),
            eq(bankAccounts.userId, ctx.session.user.id)
          )
        });

        if (!existingAccount) {
          const accountExists = await ctx.db.query.bankAccounts.findFirst({ 
            where: eq(bankAccounts.id, input.id) 
          });
          if (accountExists) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Vous n\'êtes pas autorisé à modifier ce compte.' });
          } else {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Compte bancaire non trouvé.' });
          }
        }

        // Extraire l'id et filtrer les champs à mettre à jour
        const { id, ...updateData } = input;
        
        // Filtrer les clés undefined pour n'envoyer que ce qui change
        const filteredUpdateData = Object.fromEntries(
          Object.entries(updateData).filter(([, value]) => value !== undefined)
        );
        
        // Si rien à mettre à jour, retourner le compte existant
        if (Object.keys(filteredUpdateData).length === 0) {
          return existingAccount;
        }
        
        // Ajouter le timestamp de mise à jour
        const updatedData = {
          ...filteredUpdateData,
          updatedAt: new Date()
        };
        
        const [updatedAccount] = await ctx.db
          .update(bankAccounts)
          .set(updatedData)
          .where(eq(bankAccounts.id, id))
          .returning();

        if (!updatedAccount) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erreur lors de la mise à jour du compte.' });
        }

        console.log("Bank account updated successfully:", updatedAccount);
        return updatedAccount;

      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error updating bank account:", error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erreur lors de la mise à jour du compte bancaire.' });
      }
    }),

  // == DELETE ==
  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      console.log("Deleting bank account:", input.id, "for user:", ctx.session.user.id);

      try {
        // Vérifier d'abord si le compte existe et appartient à l'utilisateur
        const accountToDelete = await ctx.db.query.bankAccounts.findFirst({
          where: and(
            eq(bankAccounts.id, input.id),
            eq(bankAccounts.userId, ctx.session.user.id)
          )
        });

        if (!accountToDelete) {
          const accountExists = await ctx.db.query.bankAccounts.findFirst({ 
            where: eq(bankAccounts.id, input.id) 
          });
          if (accountExists) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Vous n\'êtes pas autorisé à supprimer ce compte.' });
          } else {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Compte bancaire non trouvé.' });
          }
        }

        const [deletedAccount] = await ctx.db
          .delete(bankAccounts)
          .where(eq(bankAccounts.id, input.id))
          .returning();

        if (!deletedAccount) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erreur lors de la suppression du compte.' });
        }

        console.log("Bank account deleted successfully:", deletedAccount);
        return deletedAccount;

      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error deleting bank account:", error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erreur lors de la suppression du compte bancaire.' });
      }
    }),
}); 