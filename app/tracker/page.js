"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

const MEAL_SLOTS = ["Breakfast", "Lunch", "Dinner"];
const MACRO_CONFIG = [
  { key: "calories", label: "Calories", unit: "kcal", color: "#1e2d4a" },
  { key: "protein",  label: "Protein",  unit: "g",    color: "#C9A84C" },
  { key: "carbs",    label: "Carbs",    unit: "g",    color: "#5a9fd4" },
  { key: "fat",      label: "Fat",      unit: "g",    color: "#7a9e7e" },
];

function Nav({ user, onSignOut }) {
  return (
    <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 48px", borderBottom: "1px solid #e8e4dc", background: "#fff", position: "sticky", top: 0, zIndex: 50 }}>
      <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap" rel="stylesheet" />
      <Link href="/" style={{ fontSize: 20, color: "#1e2d4a", lineHeight: 1, textDecoration: "none" }}>
        <span style={{ fontStyle: "italic", fontWeight: 300 }}>her</span>
        <span style={{ fontWeight: 800 }}>coach.</span>
        <span style={{ color: "#C9A84C", fontFamily: "'Great Vibes', cursive", fontWeight: 400, fontSize: 16, marginLeft: 1, verticalAlign: "middle" }}>Jess</span>
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/generator" style={{ fontSize: 12, color: "#555", fontFamily: "sans-serif", textDecoration: "none" }}>← Generator</Link>
        <Link href="/progress" style={{ fontSize: 12, color: "#555", fontFamily: "sans-serif", textDecoration: "none" }}>Progress Log</Link>
        {user && <button onClick={onSignOut} style={{ padding: "8px 16px", background: "transparent", color: "#1e2d4a", border: "1px solid #e8e4dc", borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase", fontFamily: "sans-serif" }}>Sign Out</button>}
      </div>
    </nav>
  );
}

function MacroBar({ label, eaten, target, unit, color }) {
  const pct = target > 0 ? Math.min(Math.round((eaten / target) * 100), 100) : 0;
  const over = target > 0 && eaten > target;
  const done = !over && pct >= 100;
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "sans-serif" }}>{label}</span>
        <span style={{ fontSize: 13, fontFamily: "sans-serif" }}>
          <span style={{ fontWeight: 700, color: over ? "#c0392b" : color }}>{eaten}</span>
          <span style={{ color: "#aaa" }}> / {target} {unit}</span>
          {done && <span style={{ marginLeft: 6, color: "#2d7a4f", fontSize: 12 }}>✓</span>}
          {over && <span style={{ marginLeft: 6, color: "#c0392b", fontSize: 11 }}>over</span>}
        </span>
      </div>
      <div style={{ height: 8, background: "#f0ece4", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: over ? "#c0392b" : color, borderRadius: 10, transition: "width 0.4s ease" }} />
      </div>
      <div style={{ textAlign: "right", fontSize: 10, color: "#bbb", fontFamily: "sans-serif", marginTop: 3 }}>{pct}%</div>
    </div>
  );
}

export default function TrackerPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [targets, setTargets] = useState({ calories: 1800, protein: 120, carbs: 210, fat: 52 });
  const [dateOffset, setDateOffset] = useState(0); // 0 = today, -1 = yesterday
  const [plannerMeals, setPlannerMeals] = useState([]);
  const [extras, setExtras] = useState([]);
  const [extraForm, setExtraForm] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "" });
  const [loading, setLoading] = useState(true);

  const dateObj = new Date();
  dateObj.setDate(dateObj.getDate() + dateOffset);
  const dateStr = dateObj.toISOString().slice(0, 10);
  const dateLabel = dateObj.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      setUser(user);
      const { data } = await supabase.from("profiles").select("calories,protein,carbs,fat").eq("user_id", user.id).single();
      if (data?.calories) setTargets({ calories: data.calories, protein: data.protein, carbs: data.carbs, fat: data.fat });
      setLoading(false);
    });
  }, [router]);

  useEffect(() => {
    // Load planned meals for this date
    try {
      const planner = JSON.parse(localStorage.getItem("weeklyPlanner") || "{}").slots || {};
      const meals = MEAL_SLOTS.map(slot => {
        const data = planner[`${dateStr}_${slot}`];
        return data ? { slot, recipe: data.recipe } : null;
      }).filter(Boolean);
      setPlannerMeals(meals);
    } catch { setPlannerMeals([]); }

    // Load extra items for this date
    try {
      const stored = JSON.parse(localStorage.getItem(`extraLog_${dateStr}`) || "[]");
      setExtras(stored);
    } catch { setExtras([]); }
  }, [dateStr]);

  function saveExtras(next) {
    setExtras(next);
    localStorage.setItem(`extraLog_${dateStr}`, JSON.stringify(next));
  }

  function addExtra() {
    if (!extraForm.name) return;
    const item = {
      id: Date.now(),
      name: extraForm.name,
      calories: parseInt(extraForm.calories) || 0,
      protein: parseInt(extraForm.protein) || 0,
      carbs: parseInt(extraForm.carbs) || 0,
      fat: parseInt(extraForm.fat) || 0,
    };
    saveExtras([...extras, item]);
    setExtraForm({ name: "", calories: "", protein: "", carbs: "", fat: "" });
  }

  function removeExtra(id) { saveExtras(extras.filter(e => e.id !== id)); }

  // Totals
  const plannerTotals = plannerMeals.reduce((acc, m) => ({
    calories: acc.calories + (m.recipe.calories || 0),
    protein: acc.protein + (m.recipe.protein || 0),
    carbs: acc.carbs + (m.recipe.carbs || 0),
    fat: acc.fat + (m.recipe.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const extrasTotals = extras.reduce((acc, e) => ({
    calories: acc.calories + e.calories,
    protein: acc.protein + e.protein,
    carbs: acc.carbs + e.carbs,
    fat: acc.fat + e.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const eaten = {
    calories: plannerTotals.calories + extrasTotals.calories,
    protein: plannerTotals.protein + extrasTotals.protein,
    carbs: plannerTotals.carbs + extrasTotals.carbs,
    fat: plannerTotals.fat + extrasTotals.fat,
  };

  const inputStyle = { background: "#fff", border: "1px solid #e8e4dc", borderRadius: 4, padding: "10px 12px", fontSize: 13, fontFamily: "sans-serif", outline: "none", color: "#1a1a1a", boxSizing: "border-box" };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#fafaf8" }}>
      <div style={{ textAlign: "center", padding: 80, color: "#C9A84C", fontFamily: "sans-serif" }}>Loading...</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#fafaf8", fontFamily: "Georgia, serif" }}>
      <style>{`* { box-sizing: border-box; } @media(max-width:600px){ nav { padding: 16px 20px !important; } .track-grid { grid-template-columns: 1fr 1fr !important; } }`}</style>
      <Nav user={user} onSignOut={async () => { const s = createClient(); await s.auth.signOut(); router.push("/login"); }} />

      {/* Header */}
      <div style={{ textAlign: "center", padding: "40px 24px 0" }}>
        <div style={{ fontSize: 11, color: "#C9A84C", letterSpacing: 4, textTransform: "uppercase", marginBottom: 10, fontFamily: "sans-serif", fontWeight: 700 }}>Daily</div>
        <h1 style={{ fontSize: "clamp(24px,4vw,38px)", fontWeight: 400, color: "#1a1a1a", margin: "0 0 20px" }}>
          Macro <span style={{ color: "#C9A84C", fontStyle: "italic" }}>Tracker</span>
        </h1>
        {/* Date nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 8 }}>
          <button onClick={() => setDateOffset(d => d - 1)} style={{ background: "#fff", border: "1px solid #e8e4dc", color: "#1e2d4a", borderRadius: 4, width: 34, height: 34, cursor: "pointer", fontSize: 16, fontWeight: 700 }}>‹</button>
          <span style={{ fontSize: 14, color: "#555", fontFamily: "sans-serif", minWidth: 240, textAlign: "center" }}>
            {dateOffset === 0 ? "Today · " : dateOffset === -1 ? "Yesterday · " : ""}{dateLabel}
          </span>
          <button onClick={() => setDateOffset(d => Math.min(d + 1, 0))} disabled={dateOffset === 0} style={{ background: "#fff", border: "1px solid #e8e4dc", color: dateOffset === 0 ? "#ccc" : "#1e2d4a", borderRadius: 4, width: 34, height: 34, cursor: dateOffset === 0 ? "default" : "pointer", fontSize: 16, fontWeight: 700 }}>›</button>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "28px 24px 80px" }}>

        {/* Progress bars */}
        <div style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 8, padding: "28px 28px 20px", boxShadow: "0 4px 24px rgba(0,0,0,0.05)", marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "#C9A84C", letterSpacing: 3, textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 700, marginBottom: 22 }}>Today&apos;s Progress</div>
          {MACRO_CONFIG.map(({ key, label, unit, color }) => (
            <MacroBar key={key} label={label} eaten={eaten[key]} target={targets[key]} unit={unit} color={color} />
          ))}
          {/* Summary row */}
          <div className="track-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 20, paddingTop: 20, borderTop: "1px solid #f0ece4" }}>
            {MACRO_CONFIG.map(({ key, label, color }) => (
              <div key={key} style={{ textAlign: "center", background: "#fafaf8", borderRadius: 6, padding: "10px 6px", border: "1px solid #e8e4dc" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color, fontFamily: "Georgia, serif" }}>{targets[key] - eaten[key] > 0 ? targets[key] - eaten[key] : 0}</div>
                <div style={{ fontSize: 9, color: "#aaa", textTransform: "uppercase", letterSpacing: 1, fontFamily: "sans-serif", marginTop: 3 }}>
                  {targets[key] - eaten[key] > 0 ? `${label} left` : `${label} ✓`}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Planned meals */}
        <div style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 8, padding: "24px", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "#C9A84C", letterSpacing: 3, textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 700 }}>From Your Planner</div>
            <Link href="/generator" style={{ fontSize: 11, color: "#aaa", fontFamily: "sans-serif", textDecoration: "none" }}>Edit plan →</Link>
          </div>
          {MEAL_SLOTS.map(slot => {
            const meal = plannerMeals.find(m => m.slot === slot);
            return (
              <div key={slot} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #f0ece4" }}>
                <div style={{ width: 72, fontSize: 10, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: 1, fontFamily: "sans-serif", flexShrink: 0 }}>{slot}</div>
                {meal ? (
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1e2d4a", fontFamily: "sans-serif" }}>{meal.recipe.name}</div>
                    <div style={{ fontSize: 11, color: "#aaa", fontFamily: "sans-serif", marginTop: 2, display: "flex", gap: 10 }}>
                      <span style={{ color: "#1e2d4a", fontWeight: 700 }}>{meal.recipe.calories} cal</span>
                      <span>{meal.recipe.protein}g P</span>
                      <span>{meal.recipe.carbs}g C</span>
                      <span>{meal.recipe.fat}g F</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ flex: 1, fontSize: 13, color: "#ccc", fontFamily: "sans-serif", fontStyle: "italic" }}>Not planned yet</div>
                )}
              </div>
            );
          })}
          {plannerMeals.length === 0 && (
            <div style={{ textAlign: "center", padding: "16px 0 0", fontSize: 13, color: "#bbb", fontFamily: "sans-serif" }}>
              No meals planned for this day yet. <Link href="/generator" style={{ color: "#1e2d4a" }}>Go to generator →</Link>
            </div>
          )}
        </div>

        {/* Extra items */}
        <div style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 8, padding: "24px", marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "#C9A84C", letterSpacing: 3, textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 700, marginBottom: 16 }}>+ Log Extra Items</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 55px 55px 55px auto", gap: 8, marginBottom: 12, alignItems: "end" }}>
            <div>
              <div style={{ fontSize: 10, color: "#aaa", fontFamily: "sans-serif", marginBottom: 4 }}>ITEM</div>
              <input value={extraForm.name} onChange={e => setExtraForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Protein shake" style={{ ...inputStyle, width: "100%" }} onKeyDown={e => e.key === "Enter" && addExtra()} />
            </div>
            {["calories","protein","carbs","fat"].map(k => (
              <div key={k}>
                <div style={{ fontSize: 10, color: "#aaa", fontFamily: "sans-serif", marginBottom: 4, textTransform: "uppercase" }}>{k === "calories" ? "Cal" : k.charAt(0).toUpperCase()}</div>
                <input type="number" min="0" value={extraForm[k]} onChange={e => setExtraForm(f => ({ ...f, [k]: e.target.value }))} placeholder="0" style={{ ...inputStyle, width: "100%", textAlign: "center" }} />
              </div>
            ))}
            <div>
              <div style={{ fontSize: 10, color: "transparent", fontFamily: "sans-serif", marginBottom: 4 }}>–</div>
              <button onClick={addExtra} style={{ padding: "10px 14px", background: "#1e2d4a", color: "#fff", border: "none", borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "sans-serif", whiteSpace: "nowrap" }}>Add</button>
            </div>
          </div>

          {extras.length > 0 && (
            <div style={{ borderTop: "1px solid #f0ece4", paddingTop: 12 }}>
              {extras.map(e => (
                <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f8f6f2" }}>
                  <div style={{ flex: 1, fontSize: 13, color: "#1e2d4a", fontFamily: "sans-serif", fontWeight: 600 }}>{e.name}</div>
                  <div style={{ fontSize: 11, color: "#aaa", fontFamily: "sans-serif", display: "flex", gap: 8 }}>
                    <span style={{ color: "#1e2d4a", fontWeight: 700 }}>{e.calories} cal</span>
                    <span>{e.protein}g P</span>
                    <span>{e.carbs}g C</span>
                    <span>{e.fat}g F</span>
                  </div>
                  <button onClick={() => removeExtra(e.id)} style={{ background: "none", border: "none", color: "#ccc", fontSize: 16, cursor: "pointer", padding: 0 }}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals card */}
        {(plannerMeals.length > 0 || extras.length > 0) && (
          <div style={{ background: "#1e2d4a", border: "none", borderRadius: 8, padding: "20px 24px" }}>
            <div style={{ fontSize: 11, color: "rgba(201,168,76,0.8)", letterSpacing: 3, textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 700, marginBottom: 16 }}>Total Logged Today</div>
            <div className="track-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
              {MACRO_CONFIG.map(({ key, label, color }) => (
                <div key={key} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", fontFamily: "Georgia, serif" }}>{eaten[key]}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "sans-serif", marginTop: 3 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

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
