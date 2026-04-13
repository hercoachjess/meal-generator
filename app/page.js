"use client";
import { useState, useEffect } from "react";

const FLAVOR_PROFILES = ["Mediterranean", "Spicy", "Comfort Food", "Asian", "High Protein", "Vegetarian"];

const SAMPLE_DB = [
  { id: 1, name: "Lemon Herb Chicken Bowl", calories: 548, protein: 41, carbs: 38, fat: 14, flavor: "Mediterranean", steps: ["Grill 200g chicken breast seasoned with lemon and herbs for 6 mins each side.", "Cook 80g quinoa in vegetable stock for 12 minutes.", "Slice cucumber, halve cherry tomatoes, crumble 30g feta.", "Assemble bowl, drizzle with olive oil and lemon juice."], ingredients: [{ item: "Chicken breast", amount: "200g" }, { item: "Quinoa", amount: "80g" }, { item: "Cucumber", amount: "50g" }, { item: "Feta cheese", amount: "30g" }, { item: "Olive oil", amount: "1 tbsp" }] },
  { id: 2, name: "Spicy Beef & Rice Power Bowl", calories: 562, protein: 43, carbs: 42, fat: 15, flavor: "Spicy", steps: ["Brown 180g lean beef mince with garlic and chilli flakes.", "Cook 90g brown rice according to packet instructions.", "Drain and rinse 80g black beans, warm in pan.", "Assemble bowl with salsa and fresh coriander on top."], ingredients: [{ item: "Lean beef mince", amount: "180g" }, { item: "Brown rice", amount: "90g" }, { item: "Black beans", amount: "80g" }, { item: "Salsa", amount: "2 tbsp" }] },
  { id: 3, name: "Turkey Meatball Pasta", calories: 530, protein: 39, carbs: 55, fat: 12, flavor: "Comfort Food", steps: ["Mix 200g turkey mince with garlic, form into 8 meatballs.", "Fry meatballs in olive oil for 10 mins until golden.", "Cook 90g whole wheat pasta, warm 150ml marinara sauce.", "Combine everything and top with 20g grated parmesan."], ingredients: [{ item: "Turkey mince", amount: "200g" }, { item: "Whole wheat pasta", amount: "90g" }, { item: "Marinara sauce", amount: "150ml" }, { item: "Parmesan", amount: "20g" }] },
];

function matchesMacros(meal, targets) {
  const tol = 0.10;
  const within = (v, t) => Math.abs(v - t) / t <= tol;
  return within(meal.calories, targets.calories) && within(meal.protein, targets.protein);
}

async function callClaudeAPI(calories, protein, ingredient, flavorProfile) {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ calories, protein, ingredient, flavorProfile }),
  });
  const data = await response.json();
  return data.recipe;
}

async function fetchGoogleImage(recipeName, flavor) {
  try {
    const query = `${recipeName} ${flavor} meal`;
    const response = await fetch(`/api/image?query=${encodeURIComponent(query)}`);
    const data = await response.json();
    return data.imageUrl || getFallbackImage(flavor);
  } catch {
    return getFallbackImage(flavor);
  }
}

function getFallbackImage(flavor) {
  const seeds = { Mediterranean: 292, Spicy: 431, "Comfort Food": 167, Asian: 312, "High Protein": 488, Vegetarian: 145 };
  const seed = seeds[flavor] || 200;
  return `https://picsum.photos/seed/${seed}/800/500`;
}

function MacroRing({ label, value, unit, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ width: 68, height: 68, borderRadius: "50%", border: `3px solid ${color}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: `${color}18`, margin: "0 auto 6px", boxShadow: `0 0 14px ${color}40` }}>
        <span style={{ fontSize: 17, fontWeight: 800, color, fontFamily: "Georgia, serif" }}>{value}</span>
      </div>
      <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 10, color: "#555" }}>{unit}</div>
    </div>
  );
}

function RecipeCard({ recipe, flavor, imageUrl, isFavourite, onToggleFavourite }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ background: "linear-gradient(160deg,#1a1a2e,#16213e)", borderRadius: 20, overflow: "hidden", border: "1px solid #2a2a4a", boxShadow: "0 20px 60px rgba(0,0,0,0.5)", marginBottom: 24 }}>
      <div style={{ position: "relative", height: 220, overflow: "hidden" }}>
        <img src={imageUrl} alt={recipe.name} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.7)" }} onError={e => { e.target.src = getFallbackImage(flavor); }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,#1a1a2e,transparent 60%)" }} />
        <button
          onClick={() => onToggleFavourite(recipe, imageUrl)}
          style={{ position: "absolute", top: 12, right: 14, background: "rgba(0,0,0,0.45)", border: "none", borderRadius: "50%", width: 40, height: 40, cursor: "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)", transition: "transform 0.15s" }}
          aria-label={isFavourite ? "Remove from favourites" : "Save to favourites"}
        >
          {isFavourite ? "❤️" : "🤍"}
        </button>
        <div style={{ position: "absolute", bottom: 14, left: 18, right: 60 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: "Georgia, serif", lineHeight: 1.2 }}>{recipe.name}</div>
          {recipe.tagline && <div style={{ fontSize: 13, color: "#aaa", marginTop: 4 }}>{recipe.tagline}</div>}
        </div>
      </div>
      <div style={{ padding: "18px 18px 0", display: "flex", justifyContent: "space-around" }}>
        <MacroRing label="Calories" value={recipe.calories} unit="kcal" color="#ff6b6b" />
        <MacroRing label="Protein" value={recipe.protein} unit="g" color="#4ecdc4" />
        <MacroRing label="Carbs" value={recipe.carbs} unit="g" color="#ffe66d" />
        <MacroRing label="Fat" value={recipe.fat} unit="g" color="#a8e6cf" />
      </div>
      <button onClick={() => setExpanded(!expanded)} style={{ width: "100%", background: "none", border: "none", color: "#4ecdc4", fontSize: 13, padding: "14px", cursor: "pointer", fontWeight: 600 }}>
        {expanded ? "▲ Hide Recipe" : "▼ Show Full Recipe"}
      </button>
      {expanded && (
        <div style={{ padding: "0 18px 18px" }}>
          {recipe.ingredients && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#4ecdc4", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Ingredients</div>
              {Array.isArray(recipe.ingredients)
                ? recipe.ingredients.map((ing, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #2a2a4a", fontSize: 14, color: "#ddd" }}>
                    <span>{ing.item}</span><span style={{ color: "#888" }}>{ing.amount}</span>
                  </div>
                ))
                : <div style={{ color: "#ddd", fontSize: 14 }}>{recipe.ingredients}</div>
              }
            </div>
          )}
          {recipe.steps && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#ff6b6b", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Instructions</div>
              {recipe.steps.map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <div style={{ minWidth: 26, height: 26, borderRadius: "50%", background: "#ff6b6b22", border: "1px solid #ff6b6b55", color: "#ff6b6b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{i + 1}</div>
                  <div style={{ fontSize: 14, color: "#ccc", lineHeight: 1.6, paddingTop: 3 }}>{step}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FavouritesSection({ favourites, onRemove }) {
  const [open, setOpen] = useState(false);
  if (favourites.length === 0) return null;
  return (
    <div style={{ maxWidth: 460, margin: "32px auto 0", padding: "0 16px" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: 16, padding: "14px 20px", color: "#ff6b6b", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        <span>❤️ Saved Favourites ({favourites.length})</span>
        <span style={{ fontSize: 12 }}>{open ? "▲ Hide" : "▼ Show"}</span>
      </button>
      {open && (
        <div style={{ marginTop: 16 }}>
          {favourites.map((fav, i) => (
            <RecipeCard
              key={fav.savedAt}
              recipe={fav.recipe}
              flavor={fav.flavor}
              imageUrl={fav.imageUrl}
              isFavourite={true}
              onToggleFavourite={() => onRemove(fav.savedAt)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [calories, setCalories] = useState(550);
  const [protein, setProtein] = useState(40);
  const [ingredient, setIngredient] = useState("");
  const [flavor, setFlavor] = useState("Mediterranean");
  const [loading, setLoading] = useState(false);
  const [path, setPath] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [imageUrls, setImageUrls] = useState({});
  const [error, setError] = useState(null);
  const [favourites, setFavourites] = useState([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("mealFavourites") || "[]");
      setFavourites(saved);
    } catch {
      // ignore parse errors
    }
  }, []);

  function toggleFavourite(recipe, imageUrl) {
    setFavourites(prev => {
      const exists = prev.find(f => f.recipe.name === recipe.name);
      const next = exists
        ? prev.filter(f => f.recipe.name !== recipe.name)
        : [...prev, { recipe, flavor, imageUrl, savedAt: Date.now() }];
      localStorage.setItem("mealFavourites", JSON.stringify(next));
      return next;
    });
  }

  function removeFavourite(savedAt) {
    setFavourites(prev => {
      const next = prev.filter(f => f.savedAt !== savedAt);
      localStorage.setItem("mealFavourites", JSON.stringify(next));
      return next;
    });
  }

  function isFavourite(recipe) {
    return favourites.some(f => f.recipe.name === recipe.name);
  }

  async function handleGenerate(surpriseMe = false) {
    setError(null);
    setLoading(true);
    setRecipes([]);
    setPath(null);
    setImageUrls({});
    try {
      if (!surpriseMe) {
        const matches = SAMPLE_DB.filter(m => matchesMacros(m, { calories, protein }));
        if (matches.length > 0) {
          setPath("DATABASE");
          setRecipes(matches);
          matches.forEach(async (r, i) => {
            const url = await fetchGoogleImage(r.name, r.flavor);
            setImageUrls(prev => ({ ...prev, [i]: url }));
          });
          setLoading(false);
          return;
        }
      }
      setPath("AI");
      const recipe = await callClaudeAPI(calories, protein, ingredient || "chicken", flavor);
      setRecipes([recipe]);
      const url = await fetchGoogleImage(recipe.name, flavor);
      setImageUrls({ 0: url });
    } catch (e) {
      setError("Something went wrong. Please try again.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at top left,#0f0c29,#302b63,#24243e)", padding: "0 0 60px" }}>
      <div style={{ textAlign: "center", padding: "50px 20px 30px" }}>
        <div style={{ fontSize: 12, color: "#4ecdc4", letterSpacing: 3, textTransform: "uppercase", fontWeight: 600, marginBottom: 10 }}>AI-Powered</div>
        <h1 style={{ fontSize: "clamp(28px,5vw,50px)", fontFamily: "Georgia, serif", color: "#fff", margin: 0, lineHeight: 1.1 }}>
          Macro Meal<br /><span style={{ color: "#4ecdc4" }}>Generator</span>
        </h1>
        <p style={{ color: "#888", marginTop: 12, fontSize: 14, maxWidth: 380, margin: "12px auto 0" }}>
          Enter your targets. Get a perfectly matched meal — from your library or invented just for you.
        </p>
      </div>
      <div style={{ maxWidth: 460, margin: "0 auto", padding: "0 16px" }}>
        <div style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", borderRadius: 24, padding: 26, border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 30px 80px rgba(0,0,0,0.4)" }}>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#ccc", marginBottom: 7 }}>
              🔥 Calories: <span style={{ color: "#ff6b6b", fontWeight: 700 }}>{calories} kcal</span>
            </label>
            <input type="range" min={300} max={900} value={calories} onChange={e => setCalories(+e.target.value)} style={{ width: "100%", accentColor: "#ff6b6b" }} />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#ccc", marginBottom: 7 }}>
              💪 Protein: <span style={{ color: "#4ecdc4", fontWeight: 700 }}>{protein}g</span>
            </label>
            <input type="range" min={10} max={80} value={protein} onChange={e => setProtein(+e.target.value)} style={{ width: "100%", accentColor: "#4ecdc4" }} />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#ccc", marginBottom: 7 }}>🥩 Key Ingredient</label>
            <input type="text" placeholder="e.g. salmon, tofu, chicken..." value={ingredient} onChange={e => setIngredient(e.target.value)} style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: "11px 14px", color: "#fff", fontSize: 14, boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: 22 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#ccc", marginBottom: 7 }}>🌶️ Flavor Profile</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {FLAVOR_PROFILES.map(f => (
                <button key={f} onClick={() => setFlavor(f)} style={{ padding: "7px 13px", borderRadius: 20, fontSize: 12, cursor: "pointer", fontWeight: 600, background: flavor === f ? "#4ecdc4" : "rgba(255,255,255,0.07)", color: flavor === f ? "#000" : "#aaa", border: flavor === f ? "1px solid #4ecdc4" : "1px solid rgba(255,255,255,0.1)" }}>{f}</button>
              ))}
            </div>
          </div>
          <button onClick={() => handleGenerate(false)} disabled={loading} style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", background: loading ? "#333" : "linear-gradient(135deg,#4ecdc4,#2bb5ad)", color: loading ? "#666" : "#000", fontSize: 15, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", marginBottom: 10, boxShadow: loading ? "none" : "0 8px 30px rgba(78,205,196,0.4)" }}>
            {loading ? "✨ Generating..." : "🔍 Find My Meal"}
          </button>
          <button onClick={() => handleGenerate(true)} disabled={loading} style={{ width: "100%", padding: "13px", borderRadius: 14, background: "transparent", border: "1px solid rgba(255,107,107,0.4)", color: "#ff6b6b", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
            🎲 Surprise Me — AI Generate
          </button>
        </div>
        {path && !loading && (
          <div style={{ textAlign: "center", margin: "18px 0 8px" }}>
            <span style={{ background: path === "DATABASE" ? "#00d4aa22" : "#ff6b6b22", border: `1px solid ${path === "DATABASE" ? "#00d4aa" : "#ff6b6b"}`, color: path === "DATABASE" ? "#00d4aa" : "#ff6b6b", padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
              {path === "DATABASE" ? "📚 Matched from your meal library" : "✨ AI-invented just for you"}
            </span>
          </div>
        )}
        {loading && <div style={{ textAlign: "center", padding: 28, color: "#4ecdc4", fontSize: 14 }}>✨ Crafting your perfect meal...</div>}
        {error && <div style={{ background: "#ff6b6b22", border: "1px solid #ff6b6b44", borderRadius: 12, padding: 14, marginTop: 14, color: "#ff6b6b", fontSize: 13 }}>⚠️ {error}</div>}
        <div style={{ marginTop: 18 }}>
          {recipes.map((recipe, i) => (
            <RecipeCard
              key={i}
              recipe={recipe}
              flavor={flavor}
              imageUrl={imageUrls[i] || getFallbackImage(flavor)}
              isFavourite={isFavourite(recipe)}
              onToggleFavourite={toggleFavourite}
            />
          ))}
        </div>
        {path === "DATABASE" && recipes.length > 0 && (
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <button onClick={() => handleGenerate(true)} style={{ background: "none", border: "1px solid #4ecdc444", borderRadius: 12, color: "#4ecdc4", padding: "11px 22px", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
              Not what you wanted? ✨ Let AI invent something new
            </button>
          </div>
        )}
      </div>
      <FavouritesSection favourites={favourites} onRemove={removeFavourite} />
    </div>
  );
}
