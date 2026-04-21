import OpenAI from "openai";

const globalForOpenAI = globalThis as unknown as {
  openai: OpenAI | undefined;
};

export const openai =
  globalForOpenAI.openai ??
  new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

if (process.env.NODE_ENV !== "production") globalForOpenAI.openai = openai;

export async function decomposeGoal(
  goalTitle: string,
  goalDescription: string,
  deadline: string | null
) {
  const prompt = `
Tu es un coach expert en productivité et gestion d'objectifs.
Un utilisateur veut atteindre cet objectif :

Titre: ${goalTitle}
Description: ${goalDescription || "Aucune description"}
Date limite: ${deadline || "Pas de date limite définie"}

Décompose cet objectif en sous-objectifs clairs et crée des tâches journalières concrètes pour chaque sous-objectif.

Réponds UNIQUEMENT en JSON valide avec cette structure exacte :
{
  "subGoals": [
    {
      "title": "Titre du sous-objectif",
      "description": "Description courte",
      "order": 1,
      "tasks": [
        {
          "title": "Tâche journalière concrète",
          "description": "Détail de la tâche",
          "dayOffset": 0
        }
      ]
    }
  ]
}

Règles :
- Maximum 4 sous-objectifs
- Maximum 3 tâches par sous-objectif
- Les tâches doivent être concrètes et réalisables en 30-60 minutes
- dayOffset = nombre de jours à partir d'aujourd'hui pour planifier la tâche
- Réponds UNIQUEMENT avec le JSON, aucun texte avant ou après
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error("Réponse OpenAI vide");

  return JSON.parse(content);
}

export async function generateCongratulations(
  taskTitle: string,
  goalTitle: string
) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: `Génère un court message de félicitations (1-2 phrases, ton encourageant et chaleureux) 
pour quelqu'un qui vient de terminer cette tâche : "${taskTitle}" 
dans le cadre de son objectif : "${goalTitle}".
Réponds uniquement avec le message, sans guillemets.`,
      },
    ],
    temperature: 0.9,
    max_tokens: 100,
  });

  return response.choices[0].message.content || "Excellent travail ! Continue comme ça !";
}