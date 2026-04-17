"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

const FLAVOR_PROFILES = ["Mediterranean", "Spicy", "Comfort Food", "Asian", "High Protein", "Vegetarian"];
const MEAL_SLOTS = ["Breakfast", "Lunch", "Dinner"];
const SHOP_COLOR = "#2d7a4f"; // green accent for shopping list

const SAMPLE_DB = [
  { id: 1, name: "Lemon Herb Chicken Bowl", calories: 548, protein: 41, carbs: 38, fat: 14, flavor: "Mediterranean", steps: ["Grill 200g chicken breast seasoned with lemon and herbs for 6 mins each side.", "Cook 80g quinoa in vegetable stock for 12 minutes.", "Slice cucumber, halve cherry tomatoes, crumble 30g feta.", "Assemble bowl, drizzle with olive oil and lemon juice."], ingredients: [{ item: "Chicken breast", amount: "200g" }, { item: "Quinoa", amount: "80g" }, { item: "Cucumber", amount: "50g" }, { item: "Feta cheese", amount: "30g" }, { item: "Olive oil", amount: "1 tbsp" }] },
  { id: 2, name: "Spicy Beef & Rice Power Bowl", calories: 562, protein: 43, carbs: 42, fat: 15, flavor: "Spicy", steps: ["Brown 180g lean beef mince with garlic and chilli flakes.", "Cook 90g brown rice according to packet instructions.", "Drain and rinse 80g black beans, warm in pan.", "Assemble bowl with salsa and fresh coriander on top."], ingredients: [{ item: "Lean beef mince", amount: "180g" }, { item: "Brown rice", amount: "90g" }, { item: "Black beans", amount: "80g" }, { item: "Salsa", amount: "2 tbsp" }] },
  { id: 3, name: "Turkey Meatball Pasta", calories: 530, protein: 39, carbs: 55, fat: 12, flavor: "Comfort Food", steps: ["Mix 200g turkey mince with garlic, form into 8 meatballs.", "Fry meatballs in olive oil for 10 mins until golden.", "Cook 90g whole wheat pasta, warm 150ml marinara sauce.", "Combine everything and top with 20g grated parmesan."], ingredients: [{ item: "Turkey mince", amount: "200g" }, { item: "Whole wheat pasta", amount: "90g" }, { item: "Marinara sauce", amount: "150ml" }, { item: "Parmesan", amount: "20g" }] },
];

function matchesMacros(meal, targets) {
  const tol = 0.15;
  const within = (v, t) => Math.abs(v - t) / t <= tol;
  return within(meal.calories, targets.calories) && within(meal.protein, targets.protein);
}

async function callClaudeAPI(calories, protein, ingredient, flavorProfile, options = {}) {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ calories, protein, ingredient, flavorProfile, ...options }),
  });
  const data = await response.json();
  return data.recipe;
}

// ── Repeat meal protection ───────────────────────────────────────────────────
function trackRecentMeal(name) {
  try {
    const recent = JSON.parse(localStorage.getItem("recentMeals") || "[]");
    const updated = [name, ...recent.filter(n => n !== name)].slice(0, 14);
    localStorage.setItem("recentMeals", JSON.stringify(updated));
  } catch { /* ignore */ }
}
function getAvoidList() {
  try { return JSON.parse(localStorage.getItem("recentMeals") || "[]").slice(0, 6); }
  catch { return []; }
}

// ── Streak calculator ────────────────────────────────────────────────────────
function calcStreak() {
  try {
    const slots = JSON.parse(localStorage.getItem("weeklyPlanner") || "{}").slots || {};
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 60; i++) {
      const dateStr = d.toISOString().slice(0, 10);
      const has = ["Breakfast", "Lunch", "Dinner"].some(m => slots[`${dateStr}_${m}`]);
      if (!has) break;
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  } catch { return 0; }
}

// ── Achievements ─────────────────────────────────────────────────────────────
const ACHIEVEMENTS = [
  { id: "first_meal",      icon: "🍽️", title: "First Recipe",        desc: "Generated your very first meal" },
  { id: "first_fav",       icon: "❤️",  title: "Hearted",             desc: "Saved your first favourite meal" },
  { id: "five_favs",       icon: "💝",  title: "Meal Collector",      desc: "Saved 5 favourite meals" },
  { id: "ten_favs",        icon: "🌟",  title: "Meal Enthusiast",     desc: "Saved 10 favourite meals" },
  { id: "full_day",        icon: "✅",  title: "Day Sorted",          desc: "Planned all 3 meals in one day" },
  { id: "macros_set",      icon: "📊",  title: "Macro Maven",         desc: "Set up your personalised targets" },
  { id: "streak_3",        icon: "🔥",  title: "On Fire",             desc: "3 day planning streak" },
  { id: "streak_7",        icon: "💪",  title: "Week Warrior",        desc: "7 day planning streak" },
  { id: "streak_14",       icon: "⭐",  title: "Consistency Queen",   desc: "14 day planning streak" },
  { id: "streak_30",       icon: "👑",  title: "Habit Formed",        desc: "30 day streak — incredible!" },
  { id: "preferences_set", icon: "🎯",  title: "Personalised",        desc: "Set your dietary preferences" },
  { id: "progress_start",  icon: "📈",  title: "Progress Tracker",    desc: "Started your progress log" },
];

const GOAL_TIPS = {
  lose: [
    "Protein keeps you full and fuelled — hit that target.",
    "Every healthy meal is a step closer to your goal.",
    "Consistency over perfection, always.",
    "Small daily changes create big long-term results.",
    "You don't have to be perfect, just consistent.",
  ],
  build: [
    "Muscle is built in the kitchen as much as the gym.",
    "Fuel your gains — protein is your best friend today.",
    "Eat to perform, perform to build.",
    "Recovery starts with what you eat. Make it count.",
    "Progressive nutrition builds progressive results.",
  ],
  maintain: [
    "Balance is your superpower. You've found the sweet spot.",
    "Consistency is the key to lasting results.",
    "You're building a lifestyle, not following a diet.",
    "Steady wins the race. You're doing brilliantly.",
    "Maintenance is an achievement — don't underestimate it.",
  ],
  default: [
    "Fuel your body, achieve your goals.",
    "Every great journey starts with a single meal.",
    "Consistency is the key to transformation.",
    "Small steps, taken every day, lead somewhere incredible.",
  ],
};

function checkAchievements(profile, streak, todaySlots) {
  try {
    const favs = JSON.parse(localStorage.getItem("mealFavourites") || "[]");
    const recents = JSON.parse(localStorage.getItem("recentMeals") || "[]");
    const today = new Date().toISOString().slice(0, 10);
    return {
      first_meal:      recents.length >= 1,
      first_fav:       favs.length >= 1,
      five_favs:       favs.length >= 5,
      ten_favs:        favs.length >= 10,
      full_day:        ["Breakfast","Lunch","Dinner"].every(m => todaySlots?.[`${today}_${m}`]),
      macros_set:      !!(profile?.calories),
      preferences_set: !!(profile?.dietary_pref),
      streak_3:        streak >= 3,
      streak_7:        streak >= 7,
      streak_14:       streak >= 14,
      streak_30:       streak >= 30,
      progress_start:  false, // checked separately via Supabase
    };
  } catch { return {}; }
}

// ── Circular Macro Ring ───────────────────────────────────────────────────────
function MacroRing({ label, value, target, color }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const pct = target > 0 ? Math.min(value / target, 1) : 0;
  const over = target > 0 && value > target;
  return (
    <div style={{ textAlign: "center" }}>
      <svg width="68" height="68" viewBox="0 0 68 68" style={{ display: "block", margin: "0 auto" }}>
        <circle cx="34" cy="34" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
        <circle cx="34" cy="34" r={r} fill="none"
          stroke={over ? "#ef4444" : color}
          strokeWidth="5"
          strokeDasharray={`${circ * pct} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 34 34)"
          style={{ transition: "stroke-dasharray 0.7s ease" }}
        />
        <text x="34" y="38" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff" fontFamily="Georgia, serif">{value}</text>
      </svg>
      <div style={{ fontSize: 9, color, textTransform: "uppercase", letterSpacing: 1.5, marginTop: 3, fontFamily: "sans-serif", fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", fontFamily: "sans-serif", marginTop: 1 }}>/ {target}</div>
    </div>
  );
}

// ── Dashboard Panel ───────────────────────────────────────────────────────────
function DashboardPanel({ profile, todayEaten, streak, unlockedIds, plannerSlots, favouriteCount }) {
  const h = new Date().getHours();
  const firstName = profile?.name ? profile.name.split(" ")[0] : null;
  const greeting = (h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening") + (firstName ? `, ${firstName}` : "");
  const timeIcon = h < 12 ? "☀️" : h < 17 ? "🌤️" : "🌙";

  const tips = GOAL_TIPS[profile?.goal] || GOAL_TIPS.default;
  const tip = tips[new Date().getDate() % tips.length];

  const today = new Date().toISOString().slice(0, 10);
  const mealsToday = ["Breakfast","Lunch","Dinner"].filter(m => plannerSlots[`${today}_${m}`]).length;
  const targets = { calories: profile?.calories || 0, protein: profile?.protein || 0, carbs: profile?.carbs || 0, fat: profile?.fat || 0 };
  const hasTargets = targets.calories > 0;

  return (
    <div style={{ background: "linear-gradient(135deg, #1a2840 0%, #243558 60%, #1e3050 100%)", borderBottom: "3px solid rgba(201,168,76,0.25)" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 28, flexWrap: "wrap" }}>

          {/* Left: greeting + quote */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 28, height: 2, background: "#C9A84C", borderRadius: 2 }} />
              <span style={{ fontSize: 9, color: "#C9A84C", letterSpacing: 4, textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 700 }}>Dashboard</span>
            </div>
            <h2 style={{ fontSize: "clamp(18px,3vw,26px)", fontWeight: 400, color: "#fff", margin: "0 0 5px", fontFamily: "Georgia, serif", lineHeight: 1.2 }}>
              {greeting} {timeIcon}
            </h2>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "sans-serif", marginBottom: 18, letterSpacing: 0.3 }}>
              {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </div>
            {tip && (
              <div style={{ borderLeft: "2px solid rgba(201,168,76,0.6)", paddingLeft: 12 }}>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", fontFamily: "Georgia, serif", fontStyle: "italic", lineHeight: 1.65 }}>
                  &ldquo;{tip}&rdquo;
                </div>
              </div>
            )}
          </div>

          {/* Right: macro rings */}
          {hasTargets && (
            <div style={{ display: "flex", gap: 18, flexShrink: 0 }}>
              <MacroRing label="Cal"     value={todayEaten.calories} target={targets.calories} color="rgba(255,255,255,0.9)" />
              <MacroRing label="Protein" value={todayEaten.protein}  target={targets.protein}  color="#C9A84C" />
              <MacroRing label="Carbs"   value={todayEaten.carbs}    target={targets.carbs}    color="#7ab8e8" />
              <MacroRing label="Fat"     value={todayEaten.fat}      target={targets.fat}      color="#8ec99a" />
            </div>
          )}
          {!hasTargets && (
            <Link href="/profile" style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 8, padding: "14px 18px", textDecoration: "none", flexShrink: 0 }}>
              <span style={{ fontSize: 20 }}>📊</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#C9A84C", fontFamily: "sans-serif" }}>Set Up Your Macros</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "sans-serif", marginTop: 2 }}>Get personalised targets →</div>
              </div>
            </Link>
          )}
        </div>

        {/* Stat pills */}
        <div style={{ display: "flex", gap: 8, marginTop: 24, flexWrap: "wrap" }}>
          {streak >= 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 20, padding: "5px 12px" }}>
              <span style={{ fontSize: 12 }}>🔥</span>
              <span style={{ fontSize: 11, color: "#C9A84C", fontFamily: "sans-serif", fontWeight: 700 }}>{streak} day streak</span>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "5px 12px" }}>
            <span style={{ fontSize: 11 }}>🍽️</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", fontFamily: "sans-serif" }}>{mealsToday}/3 meals today</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "5px 12px" }}>
            <span style={{ fontSize: 11 }}>❤️</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", fontFamily: "sans-serif" }}>{favouriteCount} saved</span>
          </div>
          {unlockedIds.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "5px 12px" }}>
              <span style={{ fontSize: 11 }}>🏆</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", fontFamily: "sans-serif" }}>{unlockedIds.length} achievement{unlockedIds.length !== 1 ? "s" : ""}</span>
            </div>
          )}
          {hasTargets && todayEaten.calories > 0 && (
            <Link href="/tracker" style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "5px 12px", textDecoration: "none" }}>
              <span style={{ fontSize: 11 }}>📊</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", fontFamily: "sans-serif" }}>{Math.round((todayEaten.calories / targets.calories) * 100)}% calories tracked</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Achievement Toast ─────────────────────────────────────────────────────────
function AchievementToast({ achievement, onDismiss }) {
  if (!achievement) return null;
  return (
    <div style={{
      position: "fixed", bottom: 28, right: 28, zIndex: 300,
      background: "#1e2d4a", border: "1px solid rgba(201,168,76,0.6)",
      borderRadius: 10, padding: "18px 22px", maxWidth: 300,
      boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
      animation: "toastIn 0.35s cubic-bezier(0.34,1.56,0.64,1)",
      cursor: "pointer",
    }} onClick={onDismiss}>
      <style>{`@keyframes toastIn { from { opacity:0; transform: translateY(24px) scale(0.95); } to { opacity:1; transform: translateY(0) scale(1); } }`}</style>
      <div style={{ fontSize: 9, color: "#C9A84C", letterSpacing: 3, textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 700, marginBottom: 8 }}>🏆 Achievement Unlocked</div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ fontSize: 28, lineHeight: 1 }}>{achievement.icon}</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "Georgia, serif", marginBottom: 2 }}>{achievement.title}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", fontFamily: "sans-serif", lineHeight: 1.5 }}>{achievement.desc}</div>
        </div>
      </div>
    </div>
  );
}

// ── Ingredient amount scaling ────────────────────────────────────────────────
function scaleAmount(amount, factor) {
  if (factor === 1) return amount;
  const match = String(amount).match(/^(\d+\.?\d*)\s*(.*)/);
  if (!match) return amount;
  const num = parseFloat(match[1]) * factor;
  const unit = match[2];
  const rounded = Number.isInteger(num) ? num : parseFloat(num.toFixed(1));
  return `${rounded}${unit ? " " + unit : ""}`;
}

async function fetchGoogleImage(recipeName, flavor) {
  try {
    const response = await fetch(`/api/image?query=${encodeURIComponent(recipeName + " " + flavor + " meal")}`);
    const data = await response.json();
    return data.imageUrl || getFallbackImage(flavor);
  } catch { return getFallbackImage(flavor); }
}

function getFallbackImage(flavor) {
  const seeds = { Mediterranean: 292, Spicy: 431, "Comfort Food": 167, Asian: 312, "High Protein": 488, Vegetarian: 145 };
  return `https://picsum.photos/seed/${seeds[flavor] || 200}/800/500`;
}

// ── Shopping List ────────────────────────────────────────────────────────────
function collectIngredients(mealsObj) {
  // mealsObj: { Breakfast: recipe|null, Lunch: recipe|null, Dinner: recipe|null }
  const items = [];
  Object.entries(mealsObj).forEach(([slot, recipe]) => {
    if (!recipe) return;
    const ings = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
    ings.forEach(ing => {
      items.push({ item: ing.item, amount: ing.amount, meal: slot });
    });
  });
  return items;
}

function downloadShoppingPDF(items, title) {
  import("jspdf").then(({ jsPDF }) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const navy = [30, 45, 74];
    const gold = [201, 168, 76];
    const green = [45, 122, 79];

    // Header band
    doc.setFillColor(...navy);
    doc.rect(0, 0, 210, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "italic");
    doc.text("her", 14, 17);
    doc.setFont("helvetica", "bold");
    doc.text("coach.", 26, 17);
    doc.setTextColor(...gold);
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text("Jess", 58, 17);
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(9);
    doc.text("Shopping List", 150, 17);

    // Title
    doc.setTextColor(...navy);
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.text(title, 14, 42);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text(new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }), 14, 50);

    // Group by meal
    const byMeal = {};
    items.forEach(i => { if (!byMeal[i.meal]) byMeal[i.meal] = []; byMeal[i.meal].push(i); });

    let y = 60;
    Object.entries(byMeal).forEach(([meal, ings]) => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFillColor(...green);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.roundedRect(14, y, 30, 7, 2, 2, "F");
      doc.text(meal.toUpperCase(), 16, y + 5);
      y += 12;

      ings.forEach(({ item, amount }) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setDrawColor(...green);
        doc.setLineWidth(0.3);
        doc.roundedRect(14, y - 4, 5, 5, 1, 1, "S");
        doc.setTextColor(50, 50, 50);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(item, 22, y);
        doc.setTextColor(130, 130, 130);
        doc.text(amount, 150, y);
        y += 8;
      });
      y += 4;
    });

    doc.setTextColor(...gold);
    doc.setFontSize(8);
    doc.text("Generated by hercoach.Jess — AI-Powered Nutrition", 14, 285);

    doc.save(`shopping-list-${new Date().toISOString().slice(0, 10)}.pdf`);
  });
}

function ShoppingListAccordion({ mealsObj, label }) {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState({});
  const items = collectIngredients(mealsObj);
  if (!items.length) return null;

  function toggle(key) { setChecked(prev => ({ ...prev, [key]: !prev[key] })); }

  const byMeal = {};
  items.forEach((it, idx) => {
    if (!byMeal[it.meal]) byMeal[it.meal] = [];
    byMeal[it.meal].push({ ...it, idx });
  });

  return (
    <div style={{ marginTop: 16, border: `1px solid rgba(45,122,79,0.3)`, borderRadius: 8, overflow: "hidden", background: "#fff" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: "100%", background: open ? "rgba(45,122,79,0.06)" : "#fff", border: "none", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: SHOP_COLOR, fontFamily: "sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
          🛒 Shopping List — {items.length} item{items.length !== 1 ? "s" : ""}
        </span>
        <span style={{ fontSize: 11, color: SHOP_COLOR, fontFamily: "sans-serif", opacity: 0.7 }}>{open ? "▲ Collapse" : "▼ Expand"}</span>
      </button>

      {open && (
        <div style={{ padding: "0 20px 20px", borderTop: `1px solid rgba(45,122,79,0.15)` }}>
          {Object.entries(byMeal).map(([meal, ings]) => (
            <div key={meal} style={{ marginTop: 16 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: SHOP_COLOR, textTransform: "uppercase", letterSpacing: 2, fontFamily: "sans-serif", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ display: "inline-block", background: SHOP_COLOR, color: "#fff", borderRadius: 10, padding: "2px 8px" }}>{meal}</span>
              </div>
              {ings.map(({ item, amount, idx }) => (
                <div
                  key={idx}
                  onClick={() => toggle(idx)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 4px", borderBottom: "1px solid rgba(45,122,79,0.08)", cursor: "pointer" }}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: 3, border: `2px solid ${checked[idx] ? SHOP_COLOR : "#ccc"}`,
                    background: checked[idx] ? SHOP_COLOR : "transparent", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    {checked[idx] && <span style={{ color: "#fff", fontSize: 10, lineHeight: 1 }}>✓</span>}
                  </div>
                  <span style={{ flex: 1, fontSize: 13, color: checked[idx] ? "#bbb" : "#444", fontFamily: "sans-serif", textDecoration: checked[idx] ? "line-through" : "none" }}>{item}</span>
                  <span style={{ fontSize: 12, color: checked[idx] ? "#ccc" : SHOP_COLOR, fontFamily: "sans-serif", fontWeight: 600 }}>{amount}</span>
                </div>
              ))}
            </div>
          ))}

          <button
            onClick={() => downloadShoppingPDF(items, label)}
            style={{ marginTop: 18, width: "100%", padding: "11px", border: `1px solid ${SHOP_COLOR}`, borderRadius: 4, background: SHOP_COLOR, color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "sans-serif", cursor: "pointer" }}
          >
            ↓ Download Shopping List PDF
          </button>
        </div>
      )}
    </div>
  );
}

// ── Macros Reference Panel ──────────────────────────────────────────────────
function MacrosPanel({ profile }) {
  if (!profile?.calories) {
    return (
      <div style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 8, padding: "24px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "#C9A84C", letterSpacing: 3, textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 700, marginBottom: 10 }}>Your Macros</div>
        <p style={{ fontSize: 13, color: "#aaa", fontFamily: "sans-serif", lineHeight: 1.7, marginBottom: 16 }}>Set up your macro targets to get personalised meal matching.</p>
        <Link href="/profile" style={{ display: "inline-block", padding: "10px 20px", background: "#1e2d4a", color: "#fff", borderRadius: 4, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "sans-serif", textDecoration: "none" }}>
          Set Up Macros
        </Link>
      </div>
    );
  }
  return (
    <div style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 8, padding: "24px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ fontSize: 11, color: "#C9A84C", letterSpacing: 3, textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 700 }}>Daily Targets</div>
        <Link href="/profile" style={{ fontSize: 11, color: "#aaa", fontFamily: "sans-serif", textDecoration: "none" }}>Edit →</Link>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { label: "Calories", value: profile.calories },
          { label: "Protein", value: `${profile.protein}g` },
          { label: "Carbs", value: `${profile.carbs}g` },
          { label: "Fat", value: `${profile.fat}g` },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: "#fafaf8", border: "1px solid #e8e4dc", borderRadius: 6, padding: "12px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1e2d4a", fontFamily: "Georgia, serif" }}>{value}</div>
            <div style={{ fontSize: 9, color: "#C9A84C", textTransform: "uppercase", letterSpacing: 1.5, marginTop: 4, fontFamily: "sans-serif", fontWeight: 700 }}>{label}</div>
          </div>
        ))}
      </div>
      {profile.goal && (
        <div style={{ marginTop: 14, padding: "8px 12px", background: "rgba(201,168,76,0.07)", borderRadius: 4, fontSize: 12, color: "#9a7a28", fontFamily: "sans-serif", textAlign: "center" }}>
          Goal: {profile.goal === "lose" ? "Lose Weight" : profile.goal === "build" ? "Build Muscle" : "Maintain Weight"}
        </div>
      )}
    </div>
  );
}

// ── Recipe Card ─────────────────────────────────────────────────────────────
function RecipeCard({ recipe, flavor, imageUrl, isFavourite, onToggleFavourite, compact = false }) {
  const [expanded, setExpanded] = useState(false);
  const [servings, setServings] = useState(1);
  return (
    <div className="recipe-card-hover" style={{ background: "#fff", borderRadius: 8, overflow: "hidden", border: "1px solid #e8e4dc", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", marginBottom: 20 }}>
      <div style={{ position: "relative", height: compact ? 150 : 200, overflow: "hidden" }}>
        <img src={imageUrl} alt={recipe.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.src = getFallbackImage(flavor); }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,0.55),transparent 60%)" }} />
        {onToggleFavourite && (
          <button onClick={() => onToggleFavourite(recipe, imageUrl)} style={{ position: "absolute", top: 10, right: 10, background: "rgba(255,255,255,0.9)", border: "none", borderRadius: "50%", width: 34, height: 34, cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
            {isFavourite ? "❤️" : "🤍"}
          </button>
        )}
        <div style={{ position: "absolute", bottom: 12, left: 14, right: 50 }}>
          <div style={{ fontSize: compact ? 15 : 18, fontWeight: 700, color: "#fff", fontFamily: "Georgia, serif", lineHeight: 1.2 }}>{recipe.name}</div>
        </div>
      </div>
      <div style={{ padding: "14px 16px", display: "flex", justifyContent: "space-around", borderBottom: "1px solid #f0ece4", background: "#fafaf8" }}>
        {[["Calories", recipe.calories], ["Protein", `${recipe.protein}g`], ["Carbs", `${recipe.carbs}g`], ["Fat", `${recipe.fat}g`]].map(([l, v]) => (
          <div key={l} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1e2d4a", fontFamily: "Georgia, serif" }}>{v}</div>
            <div style={{ fontSize: 9, color: "#C9A84C", textTransform: "uppercase", letterSpacing: 1, marginTop: 3, fontFamily: "sans-serif", fontWeight: 700 }}>{l}</div>
          </div>
        ))}
      </div>
      <button onClick={() => setExpanded(!expanded)} style={{ width: "100%", background: "none", border: "none", color: "#1e2d4a", fontSize: 11, padding: "12px 16px", cursor: "pointer", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", fontFamily: "sans-serif" }}>
        {expanded ? "▲ Hide Recipe" : "▼ Show Full Recipe"}
      </button>
      {expanded && (
        <div style={{ padding: "0 18px 18px", borderTop: "1px solid #f0ece4" }}>
          {recipe.ingredients && (
            <div style={{ marginTop: 14, marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#C9A84C", textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "sans-serif" }}>Ingredients</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 10, color: "#aaa", fontFamily: "sans-serif" }}>Serves</span>
                  {[1, 2, 4].map(s => (
                    <button key={s} onClick={() => setServings(s)} style={{ width: 26, height: 26, borderRadius: "50%", border: `1px solid ${servings === s ? "#1e2d4a" : "#e8e4dc"}`, background: servings === s ? "#1e2d4a" : "#fff", color: servings === s ? "#fff" : "#888", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "sans-serif" }}>{s}</button>
                  ))}
                </div>
              </div>
              {Array.isArray(recipe.ingredients) ? recipe.ingredients.map((ing, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f0ece4", fontSize: 13, color: "#444", fontFamily: "sans-serif" }}>
                  <span>{ing.item}</span>
                  <span style={{ color: servings > 1 ? "#C9A84C" : "#aaa", fontWeight: servings > 1 ? 700 : 400 }}>{scaleAmount(ing.amount, servings)}</span>
                </div>
              )) : <div style={{ color: "#555", fontSize: 13, fontFamily: "sans-serif" }}>{recipe.ingredients}</div>}
              {servings > 1 && <div style={{ marginTop: 8, fontSize: 11, color: "#C9A84C", fontFamily: "sans-serif" }}>Amounts scaled for {servings} servings</div>}
            </div>
          )}
          {recipe.steps && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#1e2d4a", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "sans-serif" }}>Instructions</div>
              {recipe.steps.map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <div style={{ minWidth: 22, height: 22, borderRadius: "50%", background: "#1e2d4a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, fontFamily: "sans-serif", flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ fontSize: 13, color: "#555", lineHeight: 1.7, paddingTop: 1, fontFamily: "sans-serif" }}>{step}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const MEAL_FILTER_GROUPS = [
  {
    key: "mealType",
    label: "Meal Type",
    options: ["Breakfast", "Brunch", "Lunch", "Dinner", "Snack", "Post-Workout", "Pre-Workout"],
  },
  {
    key: "prepTime",
    label: "Prep Time",
    options: ["Under 10 mins", "Under 20 mins", "Under 30 mins", "Meal Prep Friendly"],
  },
  {
    key: "temp",
    label: "Temperature",
    options: ["Warm", "Cold"],
  },
  {
    key: "style",
    label: "Meal Style",
    options: ["Bowl", "Wrap / Sandwich", "Salad", "Soup / Stew", "Stir-fry", "Baked / Roasted", "Eggs", "Smoothie"],
  },
  {
    key: "portion",
    label: "Portion Size",
    options: ["Light", "Standard", "Hearty"],
  },
];

// ── Tab: Generate Meal ───────────────────────────────────────────────────────
function GenerateTab({ profile, favourites, setFavourites, genOptions }) {
  const [calories, setCalories] = useState(profile?.calories || 550);
  const [protein, setProtein] = useState(profile?.protein || 40);
  const [ingredient, setIngredient] = useState("");
  const [flavor, setFlavor] = useState("Mediterranean");
  const [mealFilters, setMealFilters] = useState({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [path, setPath] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [imageUrls, setImageUrls] = useState({});
  const [error, setError] = useState(null);

  function toggleFilter(key, value) {
    setMealFilters(prev => ({ ...prev, [key]: prev[key] === value ? undefined : value }));
  }
  const activeFilterCount = Object.values(mealFilters).filter(Boolean).length;

  useEffect(() => {
    if (profile?.calories) { setCalories(profile.calories); setProtein(profile.protein); }
  }, [profile]);

  function isFavourite(recipe) { return favourites.some(f => f.recipe.name === recipe.name); }
  function toggleFavourite(recipe, imageUrl) {
    setFavourites(prev => {
      const exists = prev.find(f => f.recipe.name === recipe.name);
      const next = exists ? prev.filter(f => f.recipe.name !== recipe.name) : [...prev, { recipe, flavor, imageUrl, savedAt: Date.now() }];
      localStorage.setItem("mealFavourites", JSON.stringify(next));
      return next;
    });
  }

  async function handleGenerate(surpriseMe = false) {
    setError(null); setLoading(true); setRecipes([]); setPath(null); setImageUrls({});
    try {
      if (!surpriseMe) {
        const matches = SAMPLE_DB.filter(m => matchesMacros(m, { calories, protein }));
        if (matches.length > 0) {
          setPath("DATABASE"); setRecipes(matches);
          matches.forEach(async (r, i) => { const url = await fetchGoogleImage(r.name, r.flavor); setImageUrls(prev => ({ ...prev, [i]: url })); });
          setLoading(false); return;
        }
      }
      setPath("AI");
      const recipe = await callClaudeAPI(calories, protein, ingredient || "chicken", flavor, {
        dietaryPrefs: genOptions?.dietaryPrefs,
        allergens: genOptions?.allergens,
        avoidMeals: getAvoidList(),
        mealFilters,
      });
      trackRecentMeal(recipe.name);
      setRecipes([recipe]);
      setImageUrls({ 0: await fetchGoogleImage(recipe.name, flavor) });
    } catch { setError("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  }

  return (
    <div>
      <div style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 8, padding: "32px 28px", boxShadow: "0 4px 24px rgba(0,0,0,0.05)", marginBottom: 20 }}>
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 7, letterSpacing: 1, textTransform: "uppercase", fontFamily: "sans-serif" }}>Calories — <span style={{ color: "#1e2d4a" }}>{calories} kcal</span></label>
          <input type="range" min={300} max={900} value={calories} onChange={e => setCalories(+e.target.value)} style={{ width: "100%", accentColor: "#1e2d4a" }} />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 7, letterSpacing: 1, textTransform: "uppercase", fontFamily: "sans-serif" }}>Protein — <span style={{ color: "#C9A84C" }}>{protein}g</span></label>
          <input type="range" min={10} max={80} value={protein} onChange={e => setProtein(+e.target.value)} style={{ width: "100%", accentColor: "#C9A84C" }} />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 7, letterSpacing: 1, textTransform: "uppercase", fontFamily: "sans-serif" }}>Key Ingredient</label>
          <input type="text" placeholder="e.g. salmon, tofu, chicken..." value={ingredient} onChange={e => setIngredient(e.target.value)} style={{ width: "100%", background: "#fff", border: "1px solid #e8e4dc", borderRadius: 4, padding: "11px 14px", color: "#1a1a1a", fontSize: 14, fontFamily: "sans-serif", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 8, letterSpacing: 1, textTransform: "uppercase", fontFamily: "sans-serif" }}>Flavour Profile</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {FLAVOR_PROFILES.map(f => (
              <button key={f} onClick={() => setFlavor(f)} style={{ padding: "7px 14px", borderRadius: 20, fontSize: 11, cursor: "pointer", fontWeight: 600, background: flavor === f ? "#1e2d4a" : "#fff", color: flavor === f ? "#fff" : "#888", border: `1px solid ${flavor === f ? "#1e2d4a" : "#e8e4dc"}`, fontFamily: "sans-serif" }}>{f}</button>
            ))}
          </div>
        </div>
        {/* Meal filters accordion */}
        <div style={{ marginBottom: 24, border: "1px solid #e8e4dc", borderRadius: 6, overflow: "hidden" }}>
          <button
            onClick={() => setFiltersOpen(o => !o)}
            style={{ width: "100%", background: filtersOpen ? "#fafaf8" : "#fff", border: "none", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: "#888", letterSpacing: 1, textTransform: "uppercase", fontFamily: "sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
              More Options
              {activeFilterCount > 0 && (
                <span style={{ background: "#1e2d4a", color: "#fff", borderRadius: 10, fontSize: 10, padding: "1px 7px", fontWeight: 700 }}>{activeFilterCount} active</span>
              )}
            </span>
            <span style={{ fontSize: 11, color: "#aaa", fontFamily: "sans-serif" }}>{filtersOpen ? "▲" : "▼"}</span>
          </button>
          {filtersOpen && (
            <div style={{ padding: "16px 16px 20px", borderTop: "1px solid #f0ece4" }}>
              {MEAL_FILTER_GROUPS.map(group => (
                <div key={group.key} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#C9A84C", letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "sans-serif", marginBottom: 8 }}>{group.label}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {group.options.map(opt => {
                      const active = mealFilters[group.key] === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => toggleFilter(group.key, opt)}
                          style={{ padding: "6px 12px", borderRadius: 20, fontSize: 11, cursor: "pointer", fontWeight: 600, fontFamily: "sans-serif", border: `1px solid ${active ? "#1e2d4a" : "#e8e4dc"}`, background: active ? "#1e2d4a" : "#fff", color: active ? "#fff" : "#888", transition: "all 0.15s" }}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {activeFilterCount > 0 && (
                <button onClick={() => setMealFilters({})} style={{ marginTop: 4, background: "none", border: "none", fontSize: 11, color: "#aaa", cursor: "pointer", fontFamily: "sans-serif", textDecoration: "underline", padding: 0 }}>
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

        <button onClick={() => handleGenerate(false)} disabled={loading} style={{ width: "100%", padding: "14px", border: "none", borderRadius: 4, background: loading ? "#ccc" : "#1e2d4a", color: "#fff", fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", fontFamily: "sans-serif", cursor: loading ? "not-allowed" : "pointer", marginBottom: 10 }}>
          {loading ? "Finding your meal..." : "Find My Meal"}
        </button>
        <button onClick={() => handleGenerate(true)} disabled={loading} style={{ width: "100%", padding: "12px", borderRadius: 4, background: "transparent", border: "1px solid #C9A84C", color: loading ? "#ccc" : "#C9A84C", fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "sans-serif", cursor: loading ? "not-allowed" : "pointer" }}>
          ✦ Surprise Me — AI Generate
        </button>
      </div>
      {path && !loading && (
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <span style={{ display: "inline-block", background: path === "DATABASE" ? "rgba(201,168,76,0.1)" : "rgba(30,45,74,0.08)", border: `1px solid ${path === "DATABASE" ? "rgba(201,168,76,0.4)" : "rgba(30,45,74,0.25)"}`, color: path === "DATABASE" ? "#9a7a28" : "#1e2d4a", padding: "5px 14px", borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, fontFamily: "sans-serif" }}>
            {path === "DATABASE" ? "Matched from your meal library" : "✦ AI-invented just for you"}
          </span>
        </div>
      )}
      {loading && <div style={{ textAlign: "center", padding: 28, color: "#C9A84C", fontSize: 14, fontFamily: "sans-serif" }}>✦ Crafting your perfect meal...</div>}
      {error && <div style={{ background: "rgba(220,53,53,0.06)", border: "1px solid rgba(220,53,53,0.2)", borderRadius: 4, padding: 12, marginBottom: 14, color: "#c0392b", fontSize: 13, fontFamily: "sans-serif" }}>⚠ {error}</div>}
      {recipes.map((recipe, i) => (
        <RecipeCard key={i} recipe={recipe} flavor={flavor} imageUrl={imageUrls[i] || getFallbackImage(flavor)} isFavourite={isFavourite(recipe)} onToggleFavourite={toggleFavourite} />
      ))}
      {path === "DATABASE" && recipes.length > 0 && (
        <div style={{ textAlign: "center", marginTop: 4 }}>
          <button onClick={() => handleGenerate(true)} style={{ background: "none", border: "1px solid #e8e4dc", borderRadius: 4, color: "#1e2d4a", padding: "10px 20px", fontSize: 11, cursor: "pointer", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", fontFamily: "sans-serif" }}>
            Not what you wanted? Let AI invent something new
          </button>
        </div>
      )}
    </div>
  );
}

// ── Day Plan helpers ──────────────────────────────────────────────────────────
const EXTRA_MEAL_PRESETS = ["Morning Snack", "Afternoon Snack", "Pre-Workout", "Post-Workout", "Evening Snack", "Supper"];

function defaultIngredientForMeal(name) {
  const map = {
    "Breakfast": "oats or eggs",
    "Lunch": "chicken or tuna",
    "Dinner": "salmon or beef",
    "Morning Snack": "Greek yogurt or fruit",
    "Afternoon Snack": "nuts or rice cakes",
    "Pre-Workout": "banana or oats",
    "Post-Workout": "chicken or protein powder",
    "Evening Snack": "cottage cheese or dark chocolate",
    "Supper": "turkey or lentils",
  };
  return map[name] || "chicken or vegetables";
}

function autoBalanceMeals(meals) {
  const equal = Math.floor(100 / meals.length);
  const rem = 100 - equal * meals.length;
  return meals.map((m, i) => ({ ...m, pct: equal + (i === 0 ? rem : 0) }));
}

// ── Tab: Day Plan ────────────────────────────────────────────────────────────
function DayPlanTab({ profile, favourites, setFavourites, genOptions }) {
  const [meals, setMeals] = useState([
    { id: 1, name: "Breakfast", pct: 25 },
    { id: 2, name: "Lunch",     pct: 35 },
    { id: 3, name: "Dinner",    pct: 40 },
  ]);
  const [dayCalories, setDayCalories] = useState(profile?.calories || 1800);
  const [dayProtein,  setDayProtein]  = useState(profile?.protein  || 120);
  const [results,     setResults]     = useState({});   // { [meal.id]: recipe }
  const [imageUrls,   setImageUrls]   = useState({});   // { [meal.id]: url }
  const [loadingIds,  setLoadingIds]  = useState(new Set());
  const [error,       setError]       = useState(null);
  const [saved,       setSaved]       = useState(false);
  const [showAdd,     setShowAdd]     = useState(false);
  const [customName,  setCustomName]  = useState("");

  // Sync targets when profile loads/changes
  useEffect(() => {
    if (profile?.calories) setDayCalories(profile.calories);
    if (profile?.protein)  setDayProtein(profile.protein);
  }, [profile?.calories, profile?.protein]);

  const totalPct   = meals.reduce((s, m) => s + m.pct, 0);
  const splitsValid = totalPct === 100;
  const anyLoading  = loadingIds.size > 0;
  const hasResults  = Object.keys(results).length > 0;

  // Meal list mutations
  function updatePct(id, val) {
    const n = Math.max(5, Math.min(90, parseInt(val) || 0));
    setMeals(prev => prev.map(m => m.id === id ? { ...m, pct: n } : m));
  }
  function removeMeal(id) {
    const next = autoBalanceMeals(meals.filter(m => m.id !== id));
    setMeals(next);
    setResults(prev => { const c = { ...prev }; delete c[id]; return c; });
    setImageUrls(prev => { const c = { ...prev }; delete c[id]; return c; });
  }
  function addMeal(name) {
    setMeals(prev => autoBalanceMeals([...prev, { id: Date.now(), name, pct: 0 }]));
    setShowAdd(false);
    setCustomName("");
  }

  // Favourites helpers
  function isFavourite(recipe) { return favourites.some(f => f.recipe.name === recipe.name); }
  function toggleFavourite(recipe, imageUrl) {
    setFavourites(prev => {
      const exists = prev.find(f => f.recipe.name === recipe.name);
      const next = exists ? prev.filter(f => f.recipe.name !== recipe.name) : [...prev, { recipe, flavor: "High Protein", imageUrl, savedAt: Date.now() }];
      localStorage.setItem("mealFavourites", JSON.stringify(next));
      return next;
    });
  }

  // Generate a single meal slot
  async function generateOne(meal) {
    setLoadingIds(prev => new Set([...prev, meal.id]));
    setError(null);
    try {
      const cal  = Math.round(dayCalories * (meal.pct / 100));
      const pro  = Math.round(dayProtein  * (meal.pct / 100));
      const recipe = await callClaudeAPI(
        cal, pro,
        defaultIngredientForMeal(meal.name),
        meal.name === "Breakfast" ? "High Protein" : "Balanced",
        {
          dietaryPrefs: genOptions?.dietaryPrefs,
          allergens:    genOptions?.allergens,
          avoidMeals:   getAvoidList(),
          mealFilters:  { mealType: meal.name },
        }
      );
      trackRecentMeal(recipe.name);
      const imageUrl = await fetchGoogleImage(recipe.name, "High Protein");
      setResults(prev => ({ ...prev, [meal.id]: recipe }));
      setImageUrls(prev => ({ ...prev, [meal.id]: imageUrl }));
    } catch {
      setError(`Failed to generate ${meal.name}. Please try again.`);
    } finally {
      setLoadingIds(prev => { const s = new Set(prev); s.delete(meal.id); return s; });
    }
  }

  // Generate all meals sequentially
  async function generateAll() {
    if (!splitsValid) return;
    setError(null);
    setResults({});
    setImageUrls({});
    for (const meal of meals) {
      await generateOne(meal);
    }
  }

  function saveDayToPlanner() {
    const today   = new Date().toISOString().slice(0, 10);
    const stored  = JSON.parse(localStorage.getItem("weeklyPlanner") || "{}");
    const slots   = stored.slots || {};
    meals.forEach(meal => {
      if (results[meal.id]) slots[`${today}_${meal.name}`] = { recipe: results[meal.id], flavor: "High Protein", imageUrl: imageUrls[meal.id] || "" };
    });
    localStorage.setItem("weeklyPlanner", JSON.stringify({ ...stored, slots }));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const usedNames      = meals.map(m => m.name);
  const availablePresets = EXTRA_MEAL_PRESETS.filter(p => !usedNames.includes(p));
  const allResultsMeals  = {};
  meals.forEach(m => { if (results[m.id]) allResultsMeals[m.name] = results[m.id]; });

  return (
    <div>
      <div style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 8, padding: "24px", marginBottom: 20 }}>

        {/* ── Daily Targets ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "#888", letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 700 }}>Daily Targets</div>
            {profile?.calories && (
              <button onClick={() => { setDayCalories(profile.calories); setDayProtein(profile.protein); }}
                style={{ background: "none", border: "none", fontSize: 11, color: "#C9A84C", cursor: "pointer", fontFamily: "sans-serif", padding: 0, textDecoration: "underline" }}>
                Reset to profile
              </button>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Calories (kcal)", value: dayCalories, min: 800,  max: 5000, set: v => setDayCalories(parseInt(v) || 1800) },
              { label: "Protein (g)",     value: dayProtein,  min: 20,   max: 500,  set: v => setDayProtein(parseInt(v)  || 120)  },
            ].map(({ label, value, min, max, set }) => (
              <div key={label}>
                <label style={{ display: "block", fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: 1, fontFamily: "sans-serif", marginBottom: 5 }}>{label}</label>
                <input type="number" min={min} max={max} value={value} onChange={e => set(e.target.value)}
                  style={{ width: "100%", background: "#fafaf8", border: "1px solid #e8e4dc", borderRadius: 4, padding: "10px 12px", fontSize: 16, fontWeight: 700, color: "#1e2d4a", fontFamily: "Georgia, serif", outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Meal Splits ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "#888", letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 700 }}>Meal Splits</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 11, fontFamily: "sans-serif", color: splitsValid ? SHOP_COLOR : "#c0392b", fontWeight: 700 }}>
                {totalPct}% {splitsValid ? "✓" : "(must = 100%)"}
              </span>
              <button onClick={() => setMeals(autoBalanceMeals(meals))}
                style={{ background: "rgba(30,45,74,0.06)", border: "1px solid rgba(30,45,74,0.18)", borderRadius: 4, padding: "4px 10px", fontSize: 10, color: "#1e2d4a", cursor: "pointer", fontFamily: "sans-serif", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>
                Auto-Balance
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {meals.map(meal => (
              <div key={meal.id} style={{ display: "grid", gridTemplateColumns: "1fr 76px 30px", gap: 8, alignItems: "center" }}>
                {/* Meal label + macro preview */}
                <div style={{ background: "#fafaf8", border: "1px solid #e8e4dc", borderRadius: 6, padding: "10px 14px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1e2d4a", fontFamily: "sans-serif" }}>{meal.name}</div>
                  <div style={{ fontSize: 10, color: "#C9A84C", fontFamily: "sans-serif", marginTop: 2 }}>
                    {Math.round(dayCalories * (meal.pct / 100))} kcal · {Math.round(dayProtein * (meal.pct / 100))}g P
                  </div>
                </div>
                {/* % input */}
                <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <input type="number" min={5} max={90} value={meal.pct} onChange={e => updatePct(meal.id, e.target.value)}
                    style={{ width: "100%", background: "#fff", border: `1px solid ${splitsValid ? "#e8e4dc" : "rgba(192,57,43,0.35)"}`, borderRadius: 4, padding: "8px 4px", textAlign: "center", fontSize: 15, fontWeight: 700, color: "#1e2d4a", fontFamily: "Georgia, serif", outline: "none" }} />
                  <span style={{ fontSize: 11, color: "#aaa", fontFamily: "sans-serif" }}>%</span>
                </div>
                {/* Remove */}
                {meals.length > 1
                  ? <button onClick={() => removeMeal(meal.id)} title="Remove meal"
                      style={{ background: "none", border: "1px solid #e8e4dc", borderRadius: 4, color: "#bbb", fontSize: 16, cursor: "pointer", padding: "3px 7px", lineHeight: 1 }}>×</button>
                  : <div />
                }
              </div>
            ))}
          </div>
        </div>

        {/* ── Add Extra Meal ── */}
        <div style={{ marginBottom: 22 }}>
          {showAdd ? (
            <div style={{ background: "#fafaf8", border: "1px solid #e8e4dc", borderRadius: 6, padding: 14 }}>
              <div style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: 1, fontFamily: "sans-serif", marginBottom: 10 }}>Choose or name a meal</div>
              {availablePresets.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                  {availablePresets.map(p => (
                    <button key={p} onClick={() => addMeal(p)}
                      style={{ background: "rgba(30,45,74,0.05)", border: "1px solid rgba(30,45,74,0.18)", borderRadius: 20, padding: "5px 12px", fontSize: 11, color: "#1e2d4a", cursor: "pointer", fontFamily: "sans-serif" }}>{p}</button>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Custom meal name..."
                  onKeyDown={e => { if (e.key === "Enter" && customName.trim()) addMeal(customName.trim()); }}
                  style={{ flex: 1, background: "#fff", border: "1px solid #e8e4dc", borderRadius: 4, padding: "8px 12px", fontSize: 13, color: "#1e2d4a", fontFamily: "sans-serif", outline: "none" }} />
                <button onClick={() => customName.trim() && addMeal(customName.trim())}
                  style={{ background: "#1e2d4a", border: "none", borderRadius: 4, padding: "8px 16px", color: "#fff", fontSize: 12, cursor: "pointer", fontFamily: "sans-serif", fontWeight: 700 }}>Add</button>
                <button onClick={() => setShowAdd(false)}
                  style={{ background: "none", border: "1px solid #e8e4dc", borderRadius: 4, padding: "8px 12px", color: "#aaa", fontSize: 12, cursor: "pointer", fontFamily: "sans-serif" }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAdd(true)}
              style={{ width: "100%", background: "none", border: "1px dashed #C9A84C", borderRadius: 6, padding: "10px", color: "#C9A84C", fontSize: 12, cursor: "pointer", fontFamily: "sans-serif", fontWeight: 700, letterSpacing: 1 }}>
              + Add Extra Meal
            </button>
          )}
        </div>

        {!profile?.calories && (
          <p style={{ fontSize: 12, color: "#aaa", fontFamily: "sans-serif", marginBottom: 14, textAlign: "center" }}>
            Using default targets. <Link href="/profile" style={{ color: "#1e2d4a" }}>Set your macros</Link> for personalised results.
          </p>
        )}

        <button onClick={generateAll} disabled={anyLoading || !splitsValid}
          style={{ width: "100%", padding: "14px", border: "none", borderRadius: 4, background: anyLoading || !splitsValid ? "#ccc" : "#1e2d4a", color: "#fff", fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", fontFamily: "sans-serif", cursor: anyLoading || !splitsValid ? "not-allowed" : "pointer" }}>
          {anyLoading ? "Generating meals..." : "✦ Generate My Day Plan"}
        </button>
      </div>

      {error && (
        <div style={{ background: "rgba(220,53,53,0.06)", border: "1px solid rgba(220,53,53,0.2)", borderRadius: 4, padding: 12, marginBottom: 14, color: "#c0392b", fontSize: 13, fontFamily: "sans-serif" }}>⚠ {error}</div>
      )}

      {/* ── Per-meal results (show each as it arrives) ── */}
      {meals.map(meal => (
        (results[meal.id] || loadingIds.has(meal.id)) ? (
          <div key={meal.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, marginTop: 4 }}>
              <div style={{ fontSize: 11, color: "#C9A84C", letterSpacing: 3, textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 700 }}>{meal.name}</div>
              {results[meal.id] && !loadingIds.has(meal.id) && (
                <button onClick={() => generateOne(meal)}
                  style={{ background: "none", border: "1px solid rgba(30,45,74,0.2)", borderRadius: 4, padding: "4px 10px", fontSize: 10, color: "#1e2d4a", cursor: "pointer", fontFamily: "sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  ↺ Regenerate
                </button>
              )}
            </div>
            {loadingIds.has(meal.id)
              ? <div style={{ textAlign: "center", padding: "16px 0", color: "#C9A84C", fontSize: 13, fontFamily: "sans-serif" }}>✦ Creating {meal.name}...</div>
              : results[meal.id] && (
                <RecipeCard
                  recipe={results[meal.id]}
                  flavor="High Protein"
                  imageUrl={imageUrls[meal.id] || ""}
                  isFavourite={isFavourite(results[meal.id])}
                  onToggleFavourite={(r, url) => toggleFavourite(r, url)}
                  compact
                />
              )
            }
          </div>
        ) : null
      ))}

      {hasResults && !anyLoading && (
        <>
          <ShoppingListAccordion
            mealsObj={allResultsMeals}
            label={`Day Plan — ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long" })}`}
          />
          <div style={{ textAlign: "center", marginTop: 16, marginBottom: 24 }}>
            {saved
              ? <div style={{ padding: "12px 24px", background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.35)", borderRadius: 4, color: "#9a7a28", fontSize: 13, fontFamily: "sans-serif", display: "inline-block" }}>✓ Saved to today&apos;s planner!</div>
              : <button onClick={saveDayToPlanner} style={{ padding: "13px 32px", border: "none", borderRadius: 4, background: "#1e2d4a", color: "#fff", fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "sans-serif", cursor: "pointer" }}>
                  Save to Today&apos;s Planner
                </button>
            }
          </div>
        </>
      )}
    </div>
  );
}

// ── Tab: Day Planner ─────────────────────────────────────────────────────────
function DayPlannerTab({ favourites }) {
  const today = new Date().toISOString().slice(0, 10);
  // Dynamic list of named slots: [{ id, name, data }]
  const [slots, setSlots] = useState([
    { id: "Breakfast", name: "Breakfast", data: null },
    { id: "Lunch",     name: "Lunch",     data: null },
    { id: "Dinner",    name: "Dinner",    data: null },
  ]);
  const [saved,       setSaved]       = useState(false);
  const [favList,     setFavList]     = useState([]);
  const [showAdd,     setShowAdd]     = useState(false);
  const [customName,  setCustomName]  = useState("");

  useEffect(() => {
    try { setFavList(JSON.parse(localStorage.getItem("mealFavourites") || "[]")); } catch { /* ignore */ }
    const stored = JSON.parse(localStorage.getItem("weeklyPlanner") || "{}");
    const s = stored.slots || {};
    // Load any saved slots for today (including extras)
    const todayKeys = Object.keys(s).filter(k => k.startsWith(`${today}_`));
    const loaded = todayKeys.map(k => {
      const name = k.replace(`${today}_`, "");
      return { id: name, name, data: s[k] };
    });
    if (loaded.length) {
      // Merge: keep B/L/D order first, then any extras
      const base = ["Breakfast", "Lunch", "Dinner"];
      const merged = base.map(n => loaded.find(l => l.name === n) || { id: n, name: n, data: null });
      const extras = loaded.filter(l => !base.includes(l.name));
      setSlots([...merged, ...extras]);
    }
  }, [today]);

  function setSlotData(id, data) {
    setSlots(prev => prev.map(s => s.id === id ? { ...s, data } : s));
  }
  function clearSlot(id) { setSlotData(id, null); }
  function removeSlot(id) { setSlots(prev => prev.filter(s => s.id !== id)); }

  function addSlot(name) {
    const id = name + "_" + Date.now();
    setSlots(prev => [...prev, { id, name, data: null }]);
    setShowAdd(false);
    setCustomName("");
  }

  function savePlan() {
    const stored   = JSON.parse(localStorage.getItem("weeklyPlanner") || "{}");
    const existing = stored.slots || {};
    // Clear old today slots
    Object.keys(existing).filter(k => k.startsWith(`${today}_`)).forEach(k => delete existing[k]);
    // Write current slots
    slots.forEach(({ name, data }) => {
      if (data) existing[`${today}_${name}`] = data;
    });
    localStorage.setItem("weeklyPlanner", JSON.stringify({ ...stored, slots: existing }));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const totalCal = slots.filter(s => s.data).reduce((acc, s) => acc + (s.data.recipe?.calories || 0), 0);
  const totalPro = slots.filter(s => s.data).reduce((acc, s) => acc + (s.data.recipe?.protein  || 0), 0);

  const mealsObj   = {};
  slots.forEach(s => { if (s.data?.recipe) mealsObj[s.name] = s.data.recipe; });
  const hasMeals   = slots.some(s => s.data);

  const usedNames       = slots.map(s => s.name);
  const availablePresets = EXTRA_MEAL_PRESETS.filter(p => !usedNames.includes(p));

  return (
    <div>
      <div style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 8, padding: "24px", marginBottom: 20 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: "#C9A84C", letterSpacing: 3, textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 700 }}>Today</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#1e2d4a", fontFamily: "Georgia, serif", marginTop: 2 }}>
              {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
            </div>
          </div>
          {totalCal > 0 && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1e2d4a", fontFamily: "Georgia, serif" }}>{totalCal} kcal</div>
              <div style={{ fontSize: 11, color: "#C9A84C", fontFamily: "sans-serif" }}>{totalPro}g protein</div>
            </div>
          )}
        </div>

        {/* Slots */}
        {slots.map(slot => (
          <div key={slot.id} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "sans-serif" }}>{slot.name}</div>
              {!["Breakfast","Lunch","Dinner"].includes(slot.name) && (
                <button onClick={() => removeSlot(slot.id)} style={{ background: "none", border: "none", color: "#ccc", fontSize: 12, cursor: "pointer", fontFamily: "sans-serif", padding: 0 }}>Remove</button>
              )}
            </div>
            {slot.data ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#fafaf8", border: "1px solid #e8e4dc", borderRadius: 6, padding: "10px 14px" }}>
                <img src={slot.data.imageUrl || getFallbackImage(slot.data.flavor)} alt="" style={{ width: 44, height: 44, borderRadius: 5, objectFit: "cover", flexShrink: 0 }} onError={e => { e.target.src = getFallbackImage(slot.data.flavor); }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1e2d4a", fontFamily: "sans-serif" }}>{slot.data.recipe.name}</div>
                  <div style={{ fontSize: 11, color: "#aaa", fontFamily: "sans-serif", marginTop: 2 }}>{slot.data.recipe.calories} cal · {slot.data.recipe.protein}g P</div>
                </div>
                <button onClick={() => clearSlot(slot.id)} style={{ background: "none", border: "none", color: "#ccc", fontSize: 18, cursor: "pointer", padding: 0 }}>×</button>
              </div>
            ) : (
              <div style={{ background: "#fafaf8", border: "1px dashed #d8d4cc", borderRadius: 6, padding: "10px 14px" }}>
                <select onChange={e => { const fav = favList[parseInt(e.target.value)]; if (fav) setSlotData(slot.id, { recipe: fav.recipe, flavor: fav.flavor, imageUrl: fav.imageUrl }); e.target.value = ""; }}
                  style={{ width: "100%", background: "transparent", border: "none", color: "#aaa", fontSize: 13, fontFamily: "sans-serif", outline: "none", cursor: "pointer" }}>
                  <option value="">+ Add from saved favourites...</option>
                  {favList.map((fav, i) => <option key={i} value={i}>{fav.recipe.name}</option>)}
                </select>
              </div>
            )}
          </div>
        ))}

        {/* Add extra slot */}
        <div style={{ marginBottom: 16 }}>
          {showAdd ? (
            <div style={{ background: "#fafaf8", border: "1px solid #e8e4dc", borderRadius: 6, padding: 14 }}>
              <div style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: 1, fontFamily: "sans-serif", marginBottom: 10 }}>Add a meal slot</div>
              {availablePresets.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                  {availablePresets.map(p => (
                    <button key={p} onClick={() => addSlot(p)}
                      style={{ background: "rgba(30,45,74,0.05)", border: "1px solid rgba(30,45,74,0.18)", borderRadius: 20, padding: "5px 12px", fontSize: 11, color: "#1e2d4a", cursor: "pointer", fontFamily: "sans-serif" }}>{p}</button>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Custom meal name..."
                  onKeyDown={e => { if (e.key === "Enter" && customName.trim()) addSlot(customName.trim()); }}
                  style={{ flex: 1, background: "#fff", border: "1px solid #e8e4dc", borderRadius: 4, padding: "8px 12px", fontSize: 13, color: "#1e2d4a", fontFamily: "sans-serif", outline: "none" }} />
                <button onClick={() => customName.trim() && addSlot(customName.trim())}
                  style={{ background: "#1e2d4a", border: "none", borderRadius: 4, padding: "8px 16px", color: "#fff", fontSize: 12, cursor: "pointer", fontFamily: "sans-serif", fontWeight: 700 }}>Add</button>
                <button onClick={() => setShowAdd(false)}
                  style={{ background: "none", border: "1px solid #e8e4dc", borderRadius: 4, padding: "8px 12px", color: "#aaa", fontSize: 12, cursor: "pointer", fontFamily: "sans-serif" }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAdd(true)}
              style={{ width: "100%", background: "none", border: "1px dashed #C9A84C", borderRadius: 6, padding: "9px", color: "#C9A84C", fontSize: 12, cursor: "pointer", fontFamily: "sans-serif", fontWeight: 700, letterSpacing: 1 }}>
              + Add Extra Meal
            </button>
          )}
        </div>

        <button onClick={savePlan} style={{ width: "100%", marginTop: 4, padding: "13px", border: "none", borderRadius: 4, background: "#1e2d4a", color: "#fff", fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", fontFamily: "sans-serif", cursor: "pointer" }}>
          Save to Weekly Planner
        </button>
        {saved && <div style={{ textAlign: "center", marginTop: 10, fontSize: 13, color: "#9a7a28", fontFamily: "sans-serif" }}>✓ Saved!</div>}
      </div>

      {hasMeals && (
        <ShoppingListAccordion
          mealsObj={mealsObj}
          label={`Day Planner — ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long" })}`}
        />
      )}

      <div style={{ textAlign: "center", marginTop: 20 }}>
        <Link href="/planner" style={{ fontSize: 12, color: "#555", fontFamily: "sans-serif", textDecoration: "none" }}>View full weekly planner →</Link>
      </div>
    </div>
  );
}

// ── Tab: Favourites ──────────────────────────────────────────────────────────
function FavouritesTab({ favourites, setFavourites }) {
  function remove(savedAt) {
    const next = favourites.filter(f => f.savedAt !== savedAt);
    setFavourites(next);
    localStorage.setItem("mealFavourites", JSON.stringify(next));
  }

  if (!favourites.length) {
    return (
      <div style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 8, padding: "60px 32px", textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>🤍</div>
        <div style={{ fontSize: 17, color: "#1e2d4a", fontFamily: "Georgia, serif", marginBottom: 10 }}>No saved favourites yet</div>
        <p style={{ fontSize: 14, color: "#aaa", fontFamily: "sans-serif", lineHeight: 1.7 }}>
          Tap the heart on any meal to save it here for quick access.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: "#C9A84C", letterSpacing: 3, textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 700 }}>
          {favourites.length} Saved Meal{favourites.length !== 1 ? "s" : ""}
        </div>
        <button onClick={() => { setFavourites([]); localStorage.setItem("mealFavourites", "[]"); }} style={{ background: "none", border: "1px solid #e8e4dc", borderRadius: 4, padding: "6px 12px", fontSize: 11, color: "#aaa", cursor: "pointer", fontFamily: "sans-serif" }}>
          Clear All
        </button>
      </div>
      {favourites.map(fav => (
        <RecipeCard
          key={fav.savedAt}
          recipe={fav.recipe}
          flavor={fav.flavor}
          imageUrl={fav.imageUrl}
          isFavourite={true}
          onToggleFavourite={() => remove(fav.savedAt)}
        />
      ))}
    </div>
  );
}

// ── Tab: My Goals ────────────────────────────────────────────────────────────
function GoalsTab({ user }) {
  const [goals, setGoals] = useState("");
  const [wellness, setWellness] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      if (!user) { setLoading(false); return; }
      const supabase = createClient();
      const { data } = await supabase.from("profiles").select("goals_text, wellness_notes").eq("user_id", user.id).single();
      if (data) { setGoals(data.goals_text || ""); setWellness(data.wellness_notes || ""); }
      setLoading(false);
    }
    load();
  }, [user]);

  async function handleSave() {
    if (!user) return;
    setSaving(true); setError(null); setSaved(false);
    const supabase = createClient();
    const { error: err } = await supabase.from("profiles").upsert({ user_id: user.id, goals_text: goals, wellness_notes: wellness, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (err) setError("Could not save. Please try again.");
    else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    setSaving(false);
  }

  if (loading) return <div style={{ textAlign: "center", padding: 40, color: "#aaa", fontFamily: "sans-serif" }}>Loading...</div>;

  return (
    <div>
      <div style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 8, padding: "28px 28px", marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: "#C9A84C", letterSpacing: 3, textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 700, marginBottom: 20 }}>My Goals &amp; Wellness</div>
        <div style={{ marginBottom: 22 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 8, letterSpacing: 1, textTransform: "uppercase", fontFamily: "sans-serif" }}>My Goals</label>
          <textarea value={goals} onChange={e => setGoals(e.target.value)} placeholder="What are you working towards? e.g. lose 5kg by summer, build lean muscle, improve energy levels..." rows={5} style={{ width: "100%", background: "#fff", border: "1px solid #e8e4dc", borderRadius: 4, padding: "12px 14px", color: "#1a1a1a", fontSize: 14, fontFamily: "sans-serif", outline: "none", resize: "vertical", lineHeight: 1.7, boxSizing: "border-box" }} />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 8, letterSpacing: 1, textTransform: "uppercase", fontFamily: "sans-serif" }}>Wellness Notes</label>
          <textarea value={wellness} onChange={e => setWellness(e.target.value)} placeholder="How are you feeling? Track your progress, energy, sleep, mood, wins of the week..." rows={5} style={{ width: "100%", background: "#fff", border: "1px solid #e8e4dc", borderRadius: 4, padding: "12px 14px", color: "#1a1a1a", fontSize: 14, fontFamily: "sans-serif", outline: "none", resize: "vertical", lineHeight: 1.7, boxSizing: "border-box" }} />
        </div>
        {error && <div style={{ background: "rgba(220,53,53,0.06)", border: "1px solid rgba(220,53,53,0.2)", borderRadius: 4, padding: 12, marginBottom: 14, color: "#c0392b", fontSize: 13, fontFamily: "sans-serif" }}>⚠ {error}</div>}
        {saved && <div style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 4, padding: 12, marginBottom: 14, color: "#9a7a28", fontSize: 13, fontFamily: "sans-serif" }}>✓ Saved!</div>}
        <button onClick={handleSave} disabled={saving} style={{ width: "100%", padding: "14px", border: "none", borderRadius: 4, background: saving ? "#ccc" : "#1e2d4a", color: "#fff", fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", fontFamily: "sans-serif", cursor: saving ? "not-allowed" : "pointer" }}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
      {/* Achievements panel */}
      <AchievementsPanel />

      <div style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 8, padding: "20px 24px" }}>
        <div style={{ fontSize: 11, color: "#C9A84C", letterSpacing: 3, textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 700, marginBottom: 12 }}>Quick Links</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Link href="/profile" style={{ fontSize: 13, color: "#1e2d4a", fontFamily: "sans-serif", textDecoration: "none" }}>📊 Update Your Macros →</Link>
          <Link href="/planner" style={{ fontSize: 13, color: "#1e2d4a", fontFamily: "sans-serif", textDecoration: "none" }}>📅 Weekly Meal Planner →</Link>
          <Link href="/tracker" style={{ fontSize: 13, color: "#1e2d4a", fontFamily: "sans-serif", textDecoration: "none" }}>📈 Daily Tracker →</Link>
          <Link href="/progress" style={{ fontSize: 13, color: "#1e2d4a", fontFamily: "sans-serif", textDecoration: "none" }}>⚖️ Progress Log →</Link>
        </div>
      </div>
    </div>
  );
}

// ── Achievements Panel (used in Goals tab) ────────────────────────────────────
function AchievementsPanel() {
  const [unlocked, setUnlocked] = useState([]);
  useEffect(() => {
    try { setUnlocked(JSON.parse(localStorage.getItem("achievements") || "[]")); } catch { /* ignore */ }
  }, []);

  return (
    <div style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 8, padding: "24px", marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ fontSize: 11, color: "#C9A84C", letterSpacing: 3, textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 700 }}>Your Achievements</div>
        <div style={{ fontSize: 12, color: "#aaa", fontFamily: "sans-serif" }}>{unlocked.length} / {ACHIEVEMENTS.length} unlocked</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 }}>
        {ACHIEVEMENTS.map(a => {
          const earned = unlocked.includes(a.id);
          return (
            <div key={a.id} title={a.desc} style={{ background: earned ? "rgba(201,168,76,0.07)" : "#fafaf8", border: `1px solid ${earned ? "rgba(201,168,76,0.3)" : "#e8e4dc"}`, borderRadius: 8, padding: "12px 10px", textAlign: "center", opacity: earned ? 1 : 0.45, transition: "all 0.2s" }}>
              <div style={{ fontSize: 22, marginBottom: 6, filter: earned ? "none" : "grayscale(1)" }}>{a.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: earned ? "#1e2d4a" : "#aaa", fontFamily: "sans-serif", lineHeight: 1.3 }}>{a.title}</div>
              <div style={{ fontSize: 9, color: "#bbb", fontFamily: "sans-serif", marginTop: 3, lineHeight: 1.4 }}>{a.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Nav ──────────────────────────────────────────────────────────────────────
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
        <Link href="/planner" style={{ fontSize: 12, color: "#555", fontFamily: "sans-serif", textDecoration: "none", letterSpacing: 0.5 }}>Weekly Planner</Link>
        <Link href="/tracker" style={{ fontSize: 12, color: "#555", fontFamily: "sans-serif", textDecoration: "none", letterSpacing: 0.5 }}>Tracker</Link>
        <Link href="/progress" style={{ fontSize: 12, color: "#555", fontFamily: "sans-serif", textDecoration: "none", letterSpacing: 0.5 }}>Progress</Link>
        <Link href="/profile" style={{ fontSize: 12, color: "#555", fontFamily: "sans-serif", textDecoration: "none", letterSpacing: 0.5 }}>Your Macros</Link>
        {user && (
          <>
            <span style={{ fontSize: 12, color: "#bbb", fontFamily: "sans-serif" }}>{user.email}</span>
            <button onClick={onSignOut} style={{ padding: "8px 16px", background: "transparent", color: "#1e2d4a", border: "1px solid #e8e4dc", borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase", fontFamily: "sans-serif" }}>Sign Out</button>
          </>
        )}
      </div>
    </nav>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
const TABS = [
  { id: "generate", label: "Generate Meal" },
  { id: "dayplan", label: "Day Plan" },
  { id: "planner", label: "Day Planner" },
  { id: "favourites", label: "❤ Favourites" },
  { id: "goals", label: "My Goals" },
];

export default function GeneratorPage() {
  const [activeTab, setActiveTab] = useState("generate");
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [favourites, setFavourites] = useState([]);
  const [todayEaten, setTodayEaten] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [plannerSlots, setPlannerSlots] = useState({});
  const [unlockedIds, setUnlockedIds] = useState([]);
  const [newAchievement, setNewAchievement] = useState(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const favs = JSON.parse(localStorage.getItem("mealFavourites") || "[]");
      setFavourites(favs);

      // Load planner slots
      const slots = JSON.parse(localStorage.getItem("weeklyPlanner") || "{}").slots || {};
      setPlannerSlots(slots);

      // Compute today's eaten macros
      const today = new Date().toISOString().slice(0, 10);
      const plannerTotal = ["Breakfast","Lunch","Dinner"].reduce((acc, m) => {
        const d = slots[`${today}_${m}`];
        if (!d) return acc;
        return { calories: acc.calories + (d.recipe.calories||0), protein: acc.protein + (d.recipe.protein||0), carbs: acc.carbs + (d.recipe.carbs||0), fat: acc.fat + (d.recipe.fat||0) };
      }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
      const extras = JSON.parse(localStorage.getItem(`extraLog_${today}`) || "[]");
      const extrasTotal = extras.reduce((acc, e) => ({ calories: acc.calories + (e.calories||0), protein: acc.protein + (e.protein||0), carbs: acc.carbs + (e.carbs||0), fat: acc.fat + (e.fat||0) }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
      setTodayEaten({ calories: plannerTotal.calories + extrasTotal.calories, protein: plannerTotal.protein + extrasTotal.protein, carbs: plannerTotal.carbs + extrasTotal.carbs, fat: plannerTotal.fat + extrasTotal.fat });
    } catch { /* ignore */ }

    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user);
      if (user) {
        const { data } = await supabase.from("profiles").select("name,calories,protein,carbs,fat,goal,goals_text,wellness_notes,dietary_pref,allergens_list").eq("user_id", user.id).single();
        if (data) {
          setProfile(data);
          // Check for progress log entries (achievement)
          const { data: progressData } = await supabase.from("progress_logs").select("id").eq("user_id", user.id).limit(1);
          // Evaluate achievements after profile load
          setTimeout(() => {
            try {
              const slots = JSON.parse(localStorage.getItem("weeklyPlanner") || "{}").slots || {};
              const streak = calcStreak();
              const conditions = checkAchievements(data, streak, slots);
              if (progressData?.length) conditions.progress_start = true;
              const earned = ACHIEVEMENTS.filter(a => conditions[a.id]).map(a => a.id);
              const prev = JSON.parse(localStorage.getItem("achievements") || "[]");
              const newOnes = earned.filter(id => !prev.includes(id));
              if (newOnes.length) {
                const updated = [...new Set([...prev, ...earned])];
                localStorage.setItem("achievements", JSON.stringify(updated));
                setUnlockedIds(updated);
                const first = ACHIEVEMENTS.find(a => a.id === newOnes[0]);
                if (first) { setNewAchievement(first); setTimeout(() => setNewAchievement(null), 5000); }
              } else {
                setUnlockedIds(earned);
              }
            } catch { /* ignore */ }
          }, 500);
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

  const showSidebar = activeTab === "generate" || activeTab === "dayplan";
  const genOptions = {
    dietaryPrefs: profile?.dietary_pref ? profile.dietary_pref.split(",").filter(Boolean) : [],
    allergens: profile?.allergens_list ? profile.allergens_list.split(",").filter(Boolean) : [],
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fafaf8", fontFamily: "Georgia, serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        .gen-sidebar { display: block; }
        @media (max-width: 900px) { .gen-sidebar { display: none; } }
        @media (max-width: 768px) {
          .gen-nav-links { display: none; }
          nav { padding: 16px 20px !important; }
          .gen-tabs { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .gen-tabs::-webkit-scrollbar { display: none; }
          .dash-rings { display: none !important; }
        }
        textarea { transition: border-color 0.2s; }
        textarea:focus { border-color: #1e2d4a !important; outline: none; }
        input[type="number"]::-webkit-inner-spin-button { opacity: 0.4; }
        .tab-btn { transition: background 0.15s, color 0.15s; }
        .tab-btn:hover { background: rgba(30,45,74,0.06) !important; }
        .gen-btn-primary { transition: opacity 0.2s, transform 0.1s; }
        .gen-btn-primary:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .gen-btn-primary:active:not(:disabled) { transform: translateY(0); }
        .recipe-card-hover { transition: box-shadow 0.2s, transform 0.2s; }
        .recipe-card-hover:hover { box-shadow: 0 12px 40px rgba(30,45,74,0.12) !important; transform: translateY(-2px); }
      `}</style>

      <Nav user={user} onSignOut={handleSignOut} />

      {/* Personalised Dashboard */}
      <DashboardPanel
        profile={profile}
        todayEaten={todayEaten}
        streak={calcStreak()}
        unlockedIds={unlockedIds}
        plannerSlots={plannerSlots}
        favouriteCount={favourites.length}
      />

      {/* Tab bar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e8e4dc", padding: "0 24px" }}>
        <div className="gen-tabs" style={{ maxWidth: 1000, margin: "0 auto", display: "flex", gap: 0, overflowX: "auto" }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="tab-btn"
              style={{
                padding: "16px 20px",
                background: "transparent",
                color: activeTab === tab.id ? "#1e2d4a" : "#aaa",
                border: "none",
                borderBottom: `2px solid ${activeTab === tab.id ? "#1e2d4a" : "transparent"}`,
                fontSize: 11, fontWeight: 700, cursor: "pointer",
                letterSpacing: 0.8, fontFamily: "sans-serif",
                whiteSpace: "nowrap",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body: main + sidebar */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px 80px", display: "flex", gap: 28, alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {activeTab === "generate" && <GenerateTab profile={profile} favourites={favourites} setFavourites={setFavourites} genOptions={genOptions} />}
          {activeTab === "dayplan" && <DayPlanTab profile={profile} favourites={favourites} setFavourites={setFavourites} genOptions={genOptions} />}
          {activeTab === "planner" && <DayPlannerTab favourites={favourites} />}
          {activeTab === "favourites" && <FavouritesTab favourites={favourites} setFavourites={setFavourites} />}
          {activeTab === "goals" && <GoalsTab user={user} />}
        </div>

        {showSidebar && (
          <div className="gen-sidebar" style={{ width: 220, flexShrink: 0 }}>
            <MacrosPanel profile={profile} />
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

      <AchievementToast achievement={newAchievement} onDismiss={() => setNewAchievement(null)} />
    </div>
  );
}
