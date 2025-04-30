import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { z } from "zod";
import { auth } from "@/server/auth";

// Schéma de validation des données d'entrée
const analyzeReportsSchema = z.object({
  totalIncome: z.number(),
  totalExpenses: z.number(),
  netFlow: z.number(),
  topExpenseCategories: z.array(
    z.object({
      name: z.string(),
      amount: z.number(),
    })
  ).optional(),
  startDate: z.string(),
  endDate: z.string(),
});

export async function POST(request: Request) {
  try {
    // Vérification de l'authentification
    const session = await auth();
    if (!session) {
      return new Response("Non autorisé", { status: 401 });
    }

    // Validation des données d'entrée
    const body = await request.json();
    const validationResult = analyzeReportsSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: "Données invalides", details: validationResult.error }),
        { status: 400 }
      );
    }

    const { totalIncome, totalExpenses, netFlow, topExpenseCategories, startDate, endDate } = validationResult.data;

    // Configuration du client Groq
    const groq = createOpenAI({
      baseURL: "https://api.groq.com/openai/v1",
      apiKey: process.env.GROQ_API_KEY || "",
    });

    const model = groq("llama3-8b-8192");

    // Construction du prompt
    const prompt = `Tu es un assistant financier expert qui aide les utilisateurs à comprendre leur situation financière.
    
Voici les données financières pour la période du ${startDate} au ${endDate} :

- Revenus totaux : ${totalIncome.toFixed(2)}€
- Dépenses totales : ${totalExpenses.toFixed(2)}€
- Flux net : ${netFlow.toFixed(2)}€
${topExpenseCategories ? `
Catégories de dépenses principales :
${topExpenseCategories.map(cat => `- ${cat.name} : ${cat.amount.toFixed(2)}€`).join('\n')}
` : ''}

Génère un résumé concis (2-3 phrases) en français qui :
1. Décrit la situation financière globale
2. Met en évidence les points clés (flux net, tendances)
3. Donne un avis objectif et encourageant
4. Utilise un ton professionnel mais accessible

Format de réponse : Texte simple, sans formatage.`;

    // Appel à l'IA
    const { text: summary } = await generateText({
      model,
      prompt,
    });

    // Retour de la réponse
    return Response.json({ summary });

  } catch (error) {
    console.error("Erreur lors de l'analyse des rapports:", error);
    return new Response(
      JSON.stringify({ error: "Erreur lors de l'analyse des rapports" }),
      { status: 500 }
    );
  }
} 