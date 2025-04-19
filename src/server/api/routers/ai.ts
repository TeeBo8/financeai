import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { categories } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { generateObject } from "ai";
import { env } from "~/env"; // Import env to access the API key safely
import Groq from "groq-sdk";

// Initialise le client Groq avec la clé API depuis les variables d'environnement
const groqClient = new Groq({
  apiKey: env.GROQ_API_KEY,
});

export const aiRouter = createTRPCRouter({
  suggestCategory: protectedProcedure
    .input(z.object({
      description: z.string().min(3, "La description est trop courte."),
    }))
    .output(z.object({ // On définit un output structuré
        categoryId: z.string().nullable(), // Accepter n'importe quel format d'ID de catégorie
        categoryName: z.string().nullable(), // Nom de la catégorie suggérée ou null
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const transactionDescription = input.description;

      // 1. Récupérer les catégories de l'utilisateur
      const userCategories = await ctx.db.select({
          id: categories.id,
          name: categories.name
        })
        .from(categories)
        .where(eq(categories.userId, userId))
        .orderBy(categories.name);

      if (userCategories.length === 0) {
        // Aucune catégorie, on ne peut rien suggérer
        console.log("SuggestCategory: No categories found for user", userId);
        return { categoryId: null, categoryName: null };
      }

      const categoryList = userCategories.map(c => c.name); // Juste les noms pour le prompt

      try {
        console.log(`SuggestCategory (Groq): Calling AI for description "${transactionDescription}" with categories:`, categoryList);

        // Appeler directement l'API Groq
        const prompt = `Analyse la description de transaction suivante: "${transactionDescription}". 
Quelle est la catégorie la plus pertinente parmi cette liste de catégories définies par l'utilisateur : ${categoryList.join(', ')} ? 
Réponds SEULEMENT avec le nom exact de la catégorie trouvée dans la liste, ou avec "null" si aucune catégorie de la liste ne semble correspondre.`;

        const response = await groqClient.chat.completions.create({
          messages: [
            {
              role: "system",
              content: "Tu es un assistant qui aide à catégoriser les transactions financières. Réponds UNIQUEMENT par le nom exact d'une catégorie de la liste donnée, ou 'null' si aucune ne correspond bien."
            },
            { role: "user", content: prompt }
          ],
          model: "llama3-8b-8192",
          temperature: 0.3,
        });

        // Extraire la réponse
        const suggestedCategoryName = response.choices[0]?.message?.content?.trim() || "null";
        console.log("SuggestCategory (Groq): AI response:", suggestedCategoryName);

        // 3. Trouver l'ID correspondant au nom suggéré
        if (suggestedCategoryName && suggestedCategoryName !== "null") {
          const matchedCategory = userCategories.find(c => c.name === suggestedCategoryName);
          if (matchedCategory) {
            console.log("SuggestCategory (Groq): Match found:", matchedCategory);
            return { categoryId: matchedCategory.id, categoryName: matchedCategory.name };
          } else {
            console.log("SuggestCategory (Groq): AI suggested a category not in the user's list:", suggestedCategoryName);
            return { categoryId: null, categoryName: null }; // L'IA a halluciné une catégorie
          }
        } else {
          console.log("SuggestCategory (Groq): AI suggested null.");
          return { categoryId: null, categoryName: null }; // L'IA n'a pas trouvé de correspondance
        }

      } catch (error) {
        console.error("Error calling Groq:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la suggestion de catégorie via Groq.",
          cause: error,
        });
      }
    }),
}); 