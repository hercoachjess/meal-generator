"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

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

function MacroBar({ label, value, unit, color }) {
  return (
    <div style={{ textAlign: "center", flex: 1 }}>
      <div style={{ fontSize: 20, fontWeight: 700, color, fontFamily: "Georgia, serif", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: 1, marginTop: 4, fontFamily: "sans-serif" }}>{label}</div>
      <div style={{ fontSize: 10, color: "#ccc", fontFamily: "sans-serif" }}>{unit}</div>
    </div>
  );
}

function RecipeCard({ recipe, flavor, imageUrl, isFavourite, onToggleFavourite }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden", border: "1px solid #e8e4dc", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", marginBottom: 20 }}>
      {/* Image */}
      <div style={{ position: "relative", height: 200, overflow: "hidden" }}>
        <img src={imageUrl} alt={recipe.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.src = getFallbackImage(flavor); }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)" }} />
        <button
          onClick={() => onToggleFavourite(recipe, imageUrl)}
          style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,255,255,0.9)", border: "none", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
          aria-label={isFavourite ? "Remove from favourites" : "Save to favourites"}
        >
          {isFavourite ? "❤️" : "🤍"}
        </button>
        <div style={{ position: "absolute", bottom: 14, left: 16, right: 52 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", fontFamily: "Georgia, serif", lineHeight: 1.2 }}>{recipe.name}</div>
          {recipe.tagline && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 4, fontFamily: "sans-serif" }}>{recipe.tagline}</div>}
        </div>
      </div>

      {/* Macros */}
      <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-around", borderBottom: "1px solid #f0ece4", background: "#fafaf8" }}>
        <MacroBar label="Calories" value={recipe.calories} unit="kcal" color="#1e2d4a" />
        <MacroBar label="Protein" value={`${recipe.protein}g`} unit="protein" color="#C9A84C" />
        <MacroBar label="Carbs" value={`${recipe.carbs}g`} unit="carbs" color="#1e2d4a" />
        <MacroBar label="Fat" value={`${recipe.fat}g`} unit="fat" color="#C9A84C" />
      </div>

      {/* Expand toggle */}
      <button onClick={() => setExpanded(!expanded)} style={{ width: "100%", background: "none", border: "none", color: "#1e2d4a", fontSize: 12, padding: "13px 20px", cursor: "pointer", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", fontFamily: "sans-serif", textAlign: "center" }}>
        {expanded ? "▲ Hide Recipe" : "▼ Show Full Recipe"}
      </button>

      {expanded && (
        <div style={{ padding: "0 20px 20px", borderTop: "1px solid #f0ece4" }}>
          {recipe.ingredients && (
            <div style={{ marginBottom: 16, marginTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#C9A84C", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "sans-serif" }}>Ingredients</div>
              {Array.isArray(recipe.ingredients)
                ? recipe.ingredients.map((ing, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f0ece4", fontSize: 14, color: "#444", fontFamily: "sans-serif" }}>
                    <span>{ing.item}</span><span style={{ color: "#aaa" }}>{ing.amount}</span>
                  </div>
                ))
                : <div style={{ color: "#555", fontSize: 14, fontFamily: "sans-serif" }}>{recipe.ingredients}</div>
              }
            </div>
          )}
          {recipe.steps && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#1e2d4a", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "sans-serif" }}>Instructions</div>
              {recipe.steps.map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                  <div style={{ minWidth: 24, height: 24, borderRadius: "50%", background: "#1e2d4a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, fontFamily: "sans-serif", flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ fontSize: 14, color: "#555", lineHeight: 1.7, paddingTop: 2, fontFamily: "sans-serif" }}>{step}</div>
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
    <div style={{ maxWidth: 560, margin: "32px auto 0", padding: "0 20px" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: "100%", background: "#fff", border: "1px solid #e8e4dc", borderRadius: 8, padding: "14px 20px", color: "#1e2d4a", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "sans-serif", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
      >
        <span>❤️ Saved Favourites ({favourites.length})</span>
        <span style={{ fontSize: 11, color: "#aaa" }}>{open ? "▲ Hide" : "▼ Show"}</span>
      </button>
      {open && (
        <div style={{ marginTop: 16 }}>
          {favourites.map((fav) => (
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

function Nav({ user, onSignOut }) {
  return (
    <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 48px", borderBottom: "1px solid #e8e4dc", background: "#fff", position: "sticky", top: 0, zIndex: 50 }}>
      <Link href="/" style={{ fontSize: 20, color: "#1e2d4a", lineHeight: 1, textDecoration: "none" }}>
        <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap" rel="stylesheet" />
        <span style={{ fontStyle: "italic", fontWeight: 300 }}>her</span>
        <span style={{ fontWeight: 800 }}>coach.</span>
        <span style={{ color: "#C9A84C", fontFamily: "'Great Vibes', cursive", fontWeight: 400, fontSize: 16, marginLeft: 1, verticalAlign: "middle" }}>Jess</span>
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/planner" style={{ fontSize: 12, color: "#555", fontFamily: "sans-serif", textDecoration: "none", letterSpacing: 0.5 }}>Weekly Planner</Link>
        <Link href="/profile" style={{ fontSize: 12, color: "#555", fontFamily: "sans-serif", textDecoration: "none", letterSpacing: 0.5 }}>My Profile</Link>
        {user && (
          <>
            <span style={{ fontSize: 12, color: "#bbb", fontFamily: "sans-serif" }}>{user.email}</span>
            <button onClick={onSignOut} style={{ padding: "8px 16px", background: "transparent", color: "#1e2d4a", border: "1px solid #e8e4dc", borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase", fontFamily: "sans-serif" }}>
              Sign Out
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default function GeneratorPage() {
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
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("mealFavourites") || "[]");
      setFavourites(saved);
    } catch { /* ignore */ }
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user);
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("calories, protein, carbs, fat, name")
          .eq("user_id", user.id)
          .single();
        if (profile?.calories) {
          setCalories(profile.calories);
          setProtein(profile.protein);
        }
      }
    });
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

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
    <div style={{ minHeight: "100vh", background: "#fafaf8", fontFamily: "Georgia, serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        .gen-input {
          width: 100%; background: #fff; border: 1px solid #e8e4dc; border-radius: 4px;
          padding: 12px 14px; color: #1a1a1a; font-size: 14px; font-family: sans-serif;
          outline: none; transition: border-color 0.2s;
        }
        .gen-input:focus { border-color: #1e2d4a; }
        .gen-input::placeholder { color: #ccc; }
        .flavor-pill {
          padding: 7px 14px; border-radius: 20px; font-size: 12px; cursor: pointer;
          font-weight: 600; border: 1px solid #e8e4dc; background: #fff; color: #888;
          font-family: sans-serif; transition: all 0.15s;
        }
        .flavor-pill.active { background: #1e2d4a; color: #fff; border-color: #1e2d4a; }
        .btn-generate {
          width: 100%; padding: 15px; border: none; border-radius: 4px;
          background: #1e2d4a; color: #fff; font-size: 13px; font-weight: 700;
          letter-spacing: 2px; text-transform: uppercase; font-family: sans-serif;
          cursor: pointer; transition: opacity 0.2s; margin-bottom: 10px;
        }
        .btn-generate:disabled { opacity: 0.45; cursor: not-allowed; }
        .btn-surprise {
          width: 100%; padding: 13px; border-radius: 4px; background: transparent;
          border: 1px solid #C9A84C; color: #C9A84C; font-size: 13px; font-weight: 700;
          letter-spacing: 1.5px; text-transform: uppercase; font-family: sans-serif; cursor: pointer;
          transition: all 0.2s;
        }
        .btn-surprise:disabled { opacity: 0.45; cursor: not-allowed; }
        input[type="range"] { accent-color: #1e2d4a; }
        @media (max-width: 768px) {
          .gen-nav { padding: 16px 20px !important; }
          .gen-nav-links { display: none; }
          .gen-body { padding: 32px 16px !important; }
        }
      `}</style>

      <Nav user={user} onSignOut={handleSignOut} />

      <div className="gen-body" style={{ maxWidth: 560, margin: "0 auto", padding: "48px 20px 80px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 11, color: "#C9A84C", letterSpacing: 4, textTransform: "uppercase", marginBottom: 12, fontFamily: "sans-serif", fontWeight: 700 }}>AI-Powered</div>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 400, color: "#1a1a1a", margin: 0, lineHeight: 1.15 }}>
            Macro Meal <span style={{ color: "#C9A84C", fontStyle: "italic" }}>Generator</span>
          </h1>
          <p style={{ color: "#999", marginTop: 12, fontSize: 14, maxWidth: 400, margin: "12px auto 0", lineHeight: 1.8, fontFamily: "sans-serif", fontWeight: 300 }}>
            Enter your targets. Get a perfectly matched meal — from your library or invented just for you.
          </p>
        </div>

        {/* Form card */}
        <div style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 8, padding: "36px 32px", boxShadow: "0 4px 24px rgba(0,0,0,0.05)", marginBottom: 24 }}>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 8, letterSpacing: 1, textTransform: "uppercase", fontFamily: "sans-serif" }}>
              Calories — <span style={{ color: "#1e2d4a" }}>{calories} kcal</span>
            </label>
            <input type="range" min={300} max={900} value={calories} onChange={e => setCalories(+e.target.value)} style={{ width: "100%" }} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 8, letterSpacing: 1, textTransform: "uppercase", fontFamily: "sans-serif" }}>
              Protein — <span style={{ color: "#C9A84C" }}>{protein}g</span>
            </label>
            <input type="range" min={10} max={80} value={protein} onChange={e => setProtein(+e.target.value)} style={{ width: "100%", accentColor: "#C9A84C" }} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 8, letterSpacing: 1, textTransform: "uppercase", fontFamily: "sans-serif" }}>Key Ingredient</label>
            <input type="text" placeholder="e.g. salmon, tofu, chicken..." value={ingredient} onChange={e => setIngredient(e.target.value)} className="gen-input" />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 10, letterSpacing: 1, textTransform: "uppercase", fontFamily: "sans-serif" }}>Flavour Profile</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {FLAVOR_PROFILES.map(f => (
                <button key={f} onClick={() => setFlavor(f)} className={`flavor-pill${flavor === f ? " active" : ""}`}>{f}</button>
              ))}
            </div>
          </div>

          <button onClick={() => handleGenerate(false)} disabled={loading} className="btn-generate">
            {loading ? "Finding your meal..." : "Find My Meal"}
          </button>
          <button onClick={() => handleGenerate(true)} disabled={loading} className="btn-surprise">
            ✦ Surprise Me — AI Generate
          </button>
        </div>

        {/* Status badge */}
        {path && !loading && (
          <div style={{ textAlign: "center", margin: "0 0 20px" }}>
            <span style={{ display: "inline-block", background: path === "DATABASE" ? "rgba(201,168,76,0.1)" : "rgba(30,45,74,0.08)", border: `1px solid ${path === "DATABASE" ? "rgba(201,168,76,0.4)" : "rgba(30,45,74,0.25)"}`, color: path === "DATABASE" ? "#9a7a28" : "#1e2d4a", padding: "5px 16px", borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, fontFamily: "sans-serif" }}>
              {path === "DATABASE" ? "Matched from your meal library" : "✦ AI-invented just for you"}
            </span>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: 32, color: "#C9A84C", fontSize: 14, fontFamily: "sans-serif" }}>
            ✦ Crafting your perfect meal...
          </div>
        )}

        {error && (
          <div style={{ background: "rgba(220,53,53,0.06)", border: "1px solid rgba(220,53,53,0.2)", borderRadius: 4, padding: 14, marginBottom: 16, color: "#c0392b", fontSize: 13, fontFamily: "sans-serif" }}>
            ⚠ {error}
          </div>
        )}

        {/* Recipe results */}
        <div>
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
            <button onClick={() => handleGenerate(true)} style={{ background: "none", border: "1px solid #e8e4dc", borderRadius: 4, color: "#1e2d4a", padding: "11px 24px", fontSize: 12, cursor: "pointer", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", fontFamily: "sans-serif" }}>
              Not what you wanted? Let AI invent something new
            </button>
          </div>
        )}

        {/* Favourites */}
        <FavouritesSection favourites={favourites} onRemove={removeFavourite} />
      </div>

      {/* Footer */}
      <footer style={{ background: "#fff", borderTop: "1px solid #e8e4dc", padding: "28px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <Link href="/" style={{ fontSize: 18, color: "#1e2d4a", lineHeight: 1, textDecoration: "none" }}>
          <span style={{ fontStyle: "italic", fontWeight: 300 }}>her</span>
          <span style={{ fontWeight: 800 }}>coach.</span>
          <span style={{ color: "#C9A84C", fontFamily: "'Great Vibes', cursive", fontWeight: 400, fontSize: 16, marginLeft: 1, verticalAlign: "middle" }}>Jess</span>
        </Link>
        <div style={{ fontSize: 12, color: "#bbb", fontFamily: "sans-serif" }}>© 2026 HerCoachJess. All rights reserved.</div>
      </footer>
    </div>
  );
}
