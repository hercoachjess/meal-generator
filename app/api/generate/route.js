import { NextResponse } from "next/server";

export async function POST(request) {
  const { calories, protein, ingredient, flavorProfile } = await request.json();

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: `You are a Culinary AI. Respond ONLY with valid JSON, no markdown, no extra text. Schema: {"name":"string","tagline":"string","calories":number,"protein":number,"carbs":number,"fat":number,"ingredients":[{"item":"string","amount":"string"}],"steps":["string"]}`,
      messages: [{ role: "user", content: `Create a recipe: Calories: ${calories}kcal, Protein: ${protein}g, Must include: ${ingredient}, Flavor: ${flavorProfile}. Return only JSON.` }],
    }),
  });

  const data = await response.json();
  const text = data.content?.map(i => i.text || "").join("") || "";
  const clean = text.replace(/```json|```/g, "").trim();
  const recipe = JSON.parse(clean);

  return NextResponse.json({ recipe });
}