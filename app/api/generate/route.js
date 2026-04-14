import { NextResponse } from "next/server";

export async function POST(request) {
  const { calories, protein, ingredient, flavorProfile, dietaryPrefs, allergens, avoidMeals, mealFilters } = await request.json();

  const restrictions = [];
  if (dietaryPrefs?.length) restrictions.push(`Dietary style: ${dietaryPrefs.join(", ")}`);
  if (allergens?.length) restrictions.push(`STRICTLY avoid these allergens in every ingredient: ${allergens.join(", ")}`);
  if (avoidMeals?.length) restrictions.push(`Do NOT suggest any of these meals (user has had them recently): ${avoidMeals.join(", ")}`);

  const filters = [];
  if (mealFilters?.mealType) filters.push(`This is a ${mealFilters.mealType} meal`);
  if (mealFilters?.prepTime) filters.push(`Prep + cook time must be ${mealFilters.prepTime}`);
  if (mealFilters?.temp === "Warm") filters.push("Must be a warm/hot dish — nothing cold or raw");
  if (mealFilters?.temp === "Cold") filters.push("Must be a cold or room-temperature dish — no cooking required");
  if (mealFilters?.style) filters.push(`The dish format should be: ${mealFilters.style}`);
  if (mealFilters?.portion === "Light") filters.push("Keep this light and easy to digest — smaller portion");
  if (mealFilters?.portion === "Hearty") filters.push("Make this filling and satisfying — a hearty full meal");

  const allNotes = [...restrictions, ...filters];
  const restrictionNote = allNotes.length ? ` IMPORTANT — ${allNotes.join(". ")}.` : "";

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
      system: `You are a culinary AI and nutritionist. Respond ONLY with valid JSON, no markdown, no extra text. IMPORTANT: All ingredient amounts MUST use metric measurements only — grams (g) for solids and millilitres (ml) for liquids. Never use cups, tablespoons, teaspoons, oz, lbs, or any non-metric units. Schema: {"name":"string","tagline":"string","calories":number,"protein":number,"carbs":number,"fat":number,"ingredients":[{"item":"string","amount":"string"}],"steps":["string"]}`,
      messages: [{
        role: "user",
        content: `Create a single-serving recipe using metric measurements only (grams and ml). Calories: ${calories}kcal, Protein: ${protein}g, Must include: ${ingredient}, Flavour: ${flavorProfile}.${restrictionNote} Return only valid JSON.`,
      }],
    }),
  });

  const data = await response.json();
  const text = data.content?.map(i => i.text || "").join("") || "";
  const clean = text.replace(/```json|```/g, "").trim();
  const recipe = JSON.parse(clean);

  return NextResponse.json({ recipe });
}
