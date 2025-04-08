import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const postRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  // Méthodes mock qui ne dépendent pas de la base de données
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async () => {
      // Cette méthode ne modifie plus réellement la base de données
      return { success: true };
    }),

  getLatest: protectedProcedure.query(async () => {
    // Retourner un objet mock au lieu de null pour éviter les erreurs
    return { id: "mock-id", name: "Example Post", createdById: "user-id", createdAt: new Date() };
  }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
