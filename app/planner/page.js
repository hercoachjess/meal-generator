"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { jsPDF } from "jspdf";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const FLAVOR_PROFILES = ["Mediterranean", "Spicy", "Comfort Food", "Asian", "High Protein", "Vegetarian"];
const SHOP_COLOR = "#2d7a4f";

function getWeekDates(offset) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

function formatWeekLabel(dates) {
  const start = new Date(dates[0]);
  const end = new Date(dates[6]);
  const opts = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-GB", opts)} – ${end.toLocaleDateString("en-GB", opts)}`;
}

function getFallbackImage(flavor) {
  const seeds = { Mediterranean: 292, Spicy: 431, "Comfort Food": 167, Asian: 312, "High Protein": 488, Vegetarian: 145 };
  return `https://picsum.photos/seed/${seeds[flavor] || 200}/800/500`;
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

function MealSlot({ dateKey, mealType, slotData, onAdd, onClear, isInShopList, onToggleShop }) {
  if (!slotData) {
    return (
      <div
        onClick={onAdd}
        style={{ minHeight: 68, border: "1px dashed #d8d4cc", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#ccc", fontSize: 18, fontWeight: 300, transition: "all 0.15s", background: "#fff" }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "#C9A84C"; e.currentTarget.style.color = "#C9A84C"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "#d8d4cc"; e.currentTarget.style.color = "#ccc"; }}
      >
        +
      </div>
    );
  }

  return (
    <div style={{ minHeight: 68, background: isInShopList ? "rgba(45,122,79,0.04)" : "#fff", border: `1px solid ${isInShopList ? "rgba(45,122,79,0.35)" : "#e8e4dc"}`, borderRadius: 6, padding: "8px 10px", position: "relative", transition: "all 0.15s" }}>
      <button
        onClick={onClear}
        style={{ position: "absolute", top: 4, right: 6, background: "none", border: "none", color: "#ccc", fontSize: 16, cursor: "pointer", lineHeight: 1, padding: 0 }}
        aria-label="Remove meal"
      >×</button>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#1e2d4a", lineHeight: 1.35, marginBottom: 5, paddingRight: 14, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", fontFamily: "sans-serif" }}>
        {slotData.recipe.name}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 3 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          <span style={{ fontSize: 9, background: "rgba(30,45,74,0.08)", color: "#1e2d4a", padding: "2px 6px", borderRadius: 10, fontFamily: "sans-serif", fontWeight: 700 }}>{slotData.recipe.calories} cal</span>
          <span style={{ fontSize: 9, background: "rgba(201,168,76,0.12)", color: "#9a7a28", padding: "2px 6px", borderRadius: 10, fontFamily: "sans-serif", fontWeight: 700 }}>{slotData.recipe.protein}g P</span>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onToggleShop(); }}
          title={isInShopList ? "Remove from shopping list" : "Add to shopping list"}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, opacity: isInShopList ? 1 : 0.35, color: SHOP_COLOR, padding: "0 2px", lineHeight: 1 }}
        >🛒</button>
      </div>
    </div>
  );
}

function AddMealModal({ target, favourites, onClose, onAdd }) {
  const [tab, setTab] = useState("favourites");
  const [calories, setCalories] = useState(550);
  const [protein, setProtein] = useState(40);
  const [ingredient, setIngredient] = useState("");
  const [flavor, setFlavor] = useState("Mediterranean");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    setGenerated(null);
    try {
      const recipe = await callClaudeAPI(calories, protein, ingredient || "chicken", flavor);
      const imageUrl = await fetchGoogleImage(recipe.name, flavor);
      setGenerated({ recipe, flavor, imageUrl });
    } catch {
      setError("Generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#fff", borderRadius: "12px 12px 0 0", width: "100%", maxWidth: 500, maxHeight: "88vh", overflowY: "auto", border: "1px solid #e8e4dc", borderBottom: "none", boxShadow: "0 -8px 40px rgba(0,0,0,0.12)" }}>

        {/* Modal header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px 16px", borderBottom: "1px solid #e8e4dc" }}>
          <div>
            <div style={{ fontSize: 11, color: "#C9A84C", letterSpacing: 3, textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 700, marginBottom: 2 }}>{target?.mealType}</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#1e2d4a", fontFamily: "Georgia, serif" }}>Add a meal</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#aaa", fontSize: 24, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #e8e4dc" }}>
          {[["favourites", `❤️ Saved (${favourites.length})`], ["generate", "✦ Generate New"]].map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "12px 0", background: "none", border: "none", borderBottom: `2px solid ${tab === t ? "#1e2d4a" : "transparent"}`, color: tab === t ? "#1e2d4a" : "#aaa", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "sans-serif", transition: "all 0.15s" }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ padding: 24 }}>
          {/* Favourites tab */}
          {tab === "favourites" && (
            <>
              {favourites.length === 0 ? (
                <div style={{ textAlign: "center", color: "#aaa", padding: "32px 0", fontSize: 13, fontFamily: "sans-serif" }}>
                  No saved favourites yet.<br />Generate a meal and tap ❤️ to save it.
                </div>
              ) : (
                favourites.map(fav => (
                  <div
                    key={fav.savedAt}
                    onClick={() => onAdd({ recipe: fav.recipe, flavor: fav.flavor, imageUrl: fav.imageUrl })}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px", borderRadius: 6, border: "1px solid #e8e4dc", marginBottom: 10, cursor: "pointer", background: "#fafaf8", transition: "border-color 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "#1e2d4a"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "#e8e4dc"}
                  >
                    <img src={fav.imageUrl} alt={fav.recipe.name} style={{ width: 52, height: 52, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} onError={e => { e.target.src = getFallbackImage(fav.flavor); }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1e2d4a", marginBottom: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "sans-serif" }}>{fav.recipe.name}</div>
                      <div style={{ display: "flex", gap: 5 }}>
                        <span style={{ fontSize: 10, background: "rgba(30,45,74,0.08)", color: "#1e2d4a", padding: "2px 7px", borderRadius: 10, fontFamily: "sans-serif", fontWeight: 700 }}>{fav.recipe.calories} cal</span>
                        <span style={{ fontSize: 10, background: "rgba(201,168,76,0.12)", color: "#9a7a28", padding: "2px 7px", borderRadius: 10, fontFamily: "sans-serif", fontWeight: 700 }}>{fav.recipe.protein}g P</span>
                      </div>
                    </div>
                    <span style={{ color: "#1e2d4a", fontSize: 20, fontWeight: 300 }}>+</span>
                  </div>
                ))
              )}
            </>
          )}

          {/* Generate tab */}
          {tab === "generate" && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 7, letterSpacing: 1, textTransform: "uppercase", fontFamily: "sans-serif" }}>
                  Calories — <span style={{ color: "#1e2d4a" }}>{calories} kcal</span>
                </label>
                <input type="range" min={300} max={900} value={calories} onChange={e => setCalories(+e.target.value)} style={{ width: "100%", accentColor: "#1e2d4a" }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 7, letterSpacing: 1, textTransform: "uppercase", fontFamily: "sans-serif" }}>
                  Protein — <span style={{ color: "#C9A84C" }}>{protein}g</span>
                </label>
                <input type="range" min={10} max={80} value={protein} onChange={e => setProtein(+e.target.value)} style={{ width: "100%", accentColor: "#C9A84C" }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 7, letterSpacing: 1, textTransform: "uppercase", fontFamily: "sans-serif" }}>Key Ingredient</label>
                <input type="text" placeholder="e.g. salmon, tofu, chicken..." value={ingredient} onChange={e => setIngredient(e.target.value)} style={{ width: "100%", background: "#fff", border: "1px solid #e8e4dc", borderRadius: 4, padding: "11px 14px", color: "#1a1a1a", fontSize: 13, fontFamily: "sans-serif", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 8, letterSpacing: 1, textTransform: "uppercase", fontFamily: "sans-serif" }}>Flavour Profile</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {FLAVOR_PROFILES.map(f => (
                    <button key={f} onClick={() => setFlavor(f)} style={{ padding: "6px 13px", borderRadius: 20, fontSize: 11, cursor: "pointer", fontWeight: 600, background: flavor === f ? "#1e2d4a" : "#fff", color: flavor === f ? "#fff" : "#888", border: `1px solid ${flavor === f ? "#1e2d4a" : "#e8e4dc"}`, fontFamily: "sans-serif" }}>{f}</button>
                  ))}
                </div>
              </div>

              {error && <div style={{ color: "#c0392b", fontSize: 12, marginBottom: 12, fontFamily: "sans-serif" }}>⚠ {error}</div>}

              {generated && (
                <div style={{ background: "#fafaf8", border: "1px solid #e8e4dc", borderRadius: 6, padding: 14, marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <img src={generated.imageUrl} alt={generated.recipe.name} style={{ width: 48, height: 48, borderRadius: 6, objectFit: "cover" }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1e2d4a", fontFamily: "sans-serif" }}>{generated.recipe.name}</div>
                      <div style={{ display: "flex", gap: 5, marginTop: 4 }}>
                        <span style={{ fontSize: 10, background: "rgba(30,45,74,0.08)", color: "#1e2d4a", padding: "2px 7px", borderRadius: 10, fontFamily: "sans-serif", fontWeight: 700 }}>{generated.recipe.calories} cal</span>
                        <span style={{ fontSize: 10, background: "rgba(201,168,76,0.12)", color: "#9a7a28", padding: "2px 7px", borderRadius: 10, fontFamily: "sans-serif", fontWeight: 700 }}>{generated.recipe.protein}g P</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => onAdd(generated)} style={{ width: "100%", padding: "11px", borderRadius: 4, border: "none", background: "#1e2d4a", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "sans-serif" }}>
                    Add to Planner
                  </button>
                </div>
              )}

              <button onClick={handleGenerate} disabled={generating} style={{ width: "100%", padding: "13px", borderRadius: 4, border: "1px solid #C9A84C", background: "transparent", color: generating ? "#ccc" : "#C9A84C", fontSize: 12, fontWeight: 700, cursor: generating ? "not-allowed" : "pointer", letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "sans-serif" }}>
                {generating ? "Generating..." : "✦ Generate Meal"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function downloadPDF(weekDates, plannerSlots, weekOffset) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const colW = (pageW - margin * 2 - 22) / 7;
  const rowH = 24;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(30, 45, 74);
  doc.text("hercoach.Jess — Weekly Meal Plan", margin, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(150, 130, 80);
  const label = `${weekOffset === 0 ? "This Week · " : ""}${formatWeekLabel(weekDates)}`;
  doc.text(label, margin, 21);

  const startY = 30;

  doc.setFillColor(245, 243, 238);
  doc.rect(margin + 22, startY, colW * 7, 9, "F");
  DAYS.forEach((day, i) => {
    const x = margin + 22 + i * colW + colW / 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(30, 45, 74);
    doc.text(day, x, startY + 4, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(150, 130, 80);
    doc.text(weekDates[i].slice(5), x, startY + 8, { align: "center" });
  });

  MEAL_TYPES.forEach((mealType, rowIdx) => {
    const y = startY + 9 + rowIdx * rowH;
    if (rowIdx % 2 === 0) {
      doc.setFillColor(252, 251, 249);
      doc.rect(margin, y, pageW - margin * 2, rowH, "F");
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 45, 74);
    doc.text(mealType, margin + 2, y + rowH / 2 + 1);

    weekDates.forEach((dateKey, colIdx) => {
      const slotData = plannerSlots[`${dateKey}_${mealType}`];
      const x = margin + 22 + colIdx * colW;
      doc.setDrawColor(232, 228, 220);
      doc.setLineWidth(0.3);
      doc.rect(x, y, colW, rowH);
      if (slotData) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(30, 45, 74);
        const name = doc.splitTextToSize(slotData.recipe.name, colW - 4);
        doc.text(name.slice(0, 2), x + 2, y + 5);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6);
        doc.setTextColor(30, 45, 74);
        doc.text(`${slotData.recipe.calories} cal`, x + 2, y + rowH - 8);
        doc.setTextColor(150, 130, 80);
        doc.text(`${slotData.recipe.protein}g P`, x + 2, y + rowH - 3);
      }
    });
  });

  const totalsY = startY + 9 + MEAL_TYPES.length * rowH;
  doc.setFillColor(240, 237, 230);
  doc.rect(margin, totalsY, pageW - margin * 2, 10, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(30, 45, 74);
  doc.text("Daily Total", margin + 2, totalsY + 7);
  weekDates.forEach((dateKey, colIdx) => {
    const daySlots = MEAL_TYPES.map(m => plannerSlots[`${dateKey}_${m}`]).filter(Boolean);
    if (!daySlots.length) return;
    const x = margin + 22 + colIdx * colW;
    const cal = daySlots.reduce((s, sl) => s + (sl.recipe.calories || 0), 0);
    const pro = daySlots.reduce((s, sl) => s + (sl.recipe.protein || 0), 0);
    doc.setTextColor(30, 45, 74);
    doc.text(`${cal} cal`, x + 2, totalsY + 5);
    doc.setTextColor(150, 130, 80);
    doc.text(`${pro}g P`, x + 2, totalsY + 9);
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(180, 180, 180);
  doc.text("Generated by hercoach.Jess", margin, pageH - 6);
  doc.text(new Date().toLocaleDateString("en-GB"), pageW - margin, pageH - 6, { align: "right" });

  doc.save(`meal-plan-${weekDates[0]}.pdf`);
}

function downloadShoppingPDF(items) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  doc.setFillColor(30, 45, 74);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "italic");
  doc.text("her", 14, 17);
  doc.setFont("helvetica", "bold");
  doc.text("coach.", 26, 17);
  doc.setTextColor(201, 168, 76);
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("Jess", 58, 17);
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(9);
  doc.text("Weekly Shopping List", 140, 17);

  doc.setTextColor(30, 45, 74);
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text("Shopping List", 14, 42);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150, 150, 150);
  doc.text(new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }), 14, 50);

  const byMeal = {};
  items.forEach(i => { if (!byMeal[i.meal]) byMeal[i.meal] = []; byMeal[i.meal].push(i); });

  let y = 62;
  Object.entries(byMeal).forEach(([meal, ings]) => {
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFillColor(45, 122, 79);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.roundedRect(14, y, 60, 7, 2, 2, "F");
    doc.text(meal.toUpperCase(), 16, y + 5);
    y += 12;
    ings.forEach(({ item, amount }) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setDrawColor(45, 122, 79);
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

  doc.setTextColor(201, 168, 76);
  doc.setFontSize(8);
  doc.text("Generated by hercoach.Jess — AI-Powered Nutrition", 14, 285);
  doc.save(`shopping-list-weekly-${new Date().toISOString().slice(0, 10)}.pdf`);
}

function PlannerShoppingList({ plannerSlots, shopSelected, setShopSelected }) {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState({});

  const items = [];
  shopSelected.forEach(slotKey => {
    const data = plannerSlots[slotKey];
    if (!data?.recipe?.ingredients) return;
    const parts = slotKey.split("_");
    const mealType = parts[parts.length - 1];
    const date = parts.slice(0, 3).join("-");
    const label = `${mealType} (${new Date(date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })})`;
    const ings = Array.isArray(data.recipe.ingredients) ? data.recipe.ingredients : [];
    ings.forEach(ing => items.push({ item: ing.item, amount: ing.amount, meal: label }));
  });

  if (!shopSelected.size) return null;

  function toggle(key) { setChecked(prev => ({ ...prev, [key]: !prev[key] })); }

  const byMeal = {};
  items.forEach((it, idx) => { if (!byMeal[it.meal]) byMeal[it.meal] = []; byMeal[it.meal].push({ ...it, idx }); });

  return (
    <div style={{ maxWidth: 1000, margin: "24px auto 0", padding: "0 24px" }}>
      <div style={{ border: `1px solid rgba(45,122,79,0.3)`, borderRadius: 8, overflow: "hidden", background: "#fff" }}>
        <button
          onClick={() => setOpen(!open)}
          style={{ width: "100%", background: open ? "rgba(45,122,79,0.06)" : "#fff", border: "none", padding: "16px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
        >
          <span style={{ fontSize: 14, fontWeight: 700, color: SHOP_COLOR, fontFamily: "sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
            🛒 Shopping List — {shopSelected.size} meal{shopSelected.size !== 1 ? "s" : ""} · {items.length} items
          </span>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button
              onClick={e => { e.stopPropagation(); setShopSelected(new Set()); }}
              style={{ background: "none", border: "1px solid rgba(45,122,79,0.3)", borderRadius: 4, padding: "4px 10px", fontSize: 10, color: SHOP_COLOR, cursor: "pointer", fontFamily: "sans-serif", fontWeight: 700, letterSpacing: 0.5 }}
            >Clear</button>
            <span style={{ fontSize: 11, color: SHOP_COLOR, fontFamily: "sans-serif", opacity: 0.7 }}>{open ? "▲" : "▼"}</span>
          </div>
        </button>

        {open && (
          <div style={{ padding: "0 22px 22px", borderTop: `1px solid rgba(45,122,79,0.15)` }}>
            {Object.entries(byMeal).map(([meal, ings]) => (
              <div key={meal} style={{ marginTop: 18 }}>
                <div style={{ display: "inline-block", background: SHOP_COLOR, color: "#fff", borderRadius: 10, padding: "3px 10px", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "sans-serif", marginBottom: 10 }}>{meal}</div>
                {ings.map(({ item, amount, idx }) => (
                  <div key={idx} onClick={() => toggle(idx)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 4px", borderBottom: "1px solid rgba(45,122,79,0.08)", cursor: "pointer" }}>
                    <div style={{ width: 16, height: 16, borderRadius: 3, border: `2px solid ${checked[idx] ? SHOP_COLOR : "#ccc"}`, background: checked[idx] ? SHOP_COLOR : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {checked[idx] && <span style={{ color: "#fff", fontSize: 10, lineHeight: 1 }}>✓</span>}
                    </div>
                    <span style={{ flex: 1, fontSize: 13, color: checked[idx] ? "#bbb" : "#444", fontFamily: "sans-serif", textDecoration: checked[idx] ? "line-through" : "none" }}>{item}</span>
                    <span style={{ fontSize: 12, color: checked[idx] ? "#ccc" : SHOP_COLOR, fontFamily: "sans-serif", fontWeight: 600 }}>{amount}</span>
                  </div>
                ))}
              </div>
            ))}
            <button
              onClick={() => downloadShoppingPDF(items)}
              style={{ marginTop: 20, width: "100%", padding: "12px", border: "none", borderRadius: 4, background: SHOP_COLOR, color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "sans-serif", cursor: "pointer" }}
            >
              ↓ Download Shopping List PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PlannerPage() {
  const [user, setUser] = useState(null);
  const router = useRouter();
  const [weekOffset, setWeekOffset] = useState(0);
  const [plannerSlots, setPlannerSlots] = useState({});
  const [favourites, setFavourites] = useState([]);
  const [modalTarget, setModalTarget] = useState(null);
  const [shopSelected, setShopSelected] = useState(new Set());

  function toggleShop(slotKey) {
    setShopSelected(prev => {
      const next = new Set(prev);
      if (next.has(slotKey)) next.delete(slotKey);
      else next.add(slotKey);
      return next;
    });
  }

  const weekDates = getWeekDates(weekOffset);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    try {
      const saved = JSON.parse(localStorage.getItem("weeklyPlanner") || "{}");
      setPlannerSlots(saved.slots || {});
      if (saved.weekOffset !== undefined) setWeekOffset(saved.weekOffset);
    } catch { /* ignore */ }
    try {
      setFavourites(JSON.parse(localStorage.getItem("mealFavourites") || "[]"));
    } catch { /* ignore */ }
  }, []);

  function saveSlot(dateKey, mealType, entry) {
    setPlannerSlots(prev => {
      const next = { ...prev, [`${dateKey}_${mealType}`]: entry };
      localStorage.setItem("weeklyPlanner", JSON.stringify({ weekOffset, slots: next }));
      return next;
    });
    setModalTarget(null);
  }

  function clearSlot(dateKey, mealType) {
    setPlannerSlots(prev => {
      const next = { ...prev };
      delete next[`${dateKey}_${mealType}`];
      localStorage.setItem("weeklyPlanner", JSON.stringify({ weekOffset, slots: next }));
      return next;
    });
  }

  function changeWeek(delta) {
    const next = weekOffset + delta;
    setWeekOffset(next);
    setPlannerSlots(prev => {
      localStorage.setItem("weeklyPlanner", JSON.stringify({ weekOffset: next, slots: prev }));
      return prev;
    });
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div style={{ minHeight: "100vh", background: "#fafaf8", fontFamily: "Georgia, serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; }
        @media (max-width: 768px) {
          .planner-nav { padding: 16px 20px !important; }
          .planner-nav-links { display: none !important; }
          .planner-header { padding: 28px 16px 16px !important; }
        }
      `}</style>

      {/* Nav */}
      <nav className="planner-nav" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 48px", borderBottom: "1px solid #e8e4dc", background: "#fff", position: "sticky", top: 0, zIndex: 50 }}>
        <Link href="/" style={{ fontSize: 20, color: "#1e2d4a", lineHeight: 1, textDecoration: "none" }}>
          <span style={{ fontStyle: "italic", fontWeight: 300 }}>her</span>
          <span style={{ fontWeight: 800 }}>coach.</span>
          <span style={{ color: "#C9A84C", fontFamily: "'Great Vibes', cursive", fontWeight: 400, fontSize: 16, marginLeft: 1, verticalAlign: "middle" }}>Jess</span>
        </Link>
        <div className="planner-nav-links" style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Link href="/generator" style={{ fontSize: 12, color: "#555", fontFamily: "sans-serif", textDecoration: "none", letterSpacing: 0.5 }}>← Generator</Link>
          <Link href="/profile" style={{ fontSize: 12, color: "#555", fontFamily: "sans-serif", textDecoration: "none", letterSpacing: 0.5 }}>Your Macros</Link>
          {user && (
            <>
              <span style={{ fontSize: 12, color: "#bbb", fontFamily: "sans-serif" }}>{user.email}</span>
              <button onClick={handleSignOut} style={{ padding: "8px 16px", background: "transparent", color: "#1e2d4a", border: "1px solid #e8e4dc", borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase", fontFamily: "sans-serif" }}>
                Sign Out
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Header */}
      <div className="planner-header" style={{ textAlign: "center", padding: "40px 48px 28px" }}>
        <div style={{ fontSize: 11, color: "#C9A84C", letterSpacing: 4, textTransform: "uppercase", marginBottom: 12, fontFamily: "sans-serif", fontWeight: 700 }}>Meal Planning</div>
        <h1 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 400, color: "#1a1a1a", margin: "0 0 24px", lineHeight: 1.1 }}>
          Weekly Meal <span style={{ color: "#C9A84C", fontStyle: "italic" }}>Planner</span>
        </h1>

        {/* Week navigation */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 20 }}>
          <button onClick={() => changeWeek(-1)} style={{ background: "#fff", border: "1px solid #e8e4dc", color: "#1e2d4a", borderRadius: 4, width: 36, height: 36, cursor: "pointer", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
          <span style={{ color: "#555", fontSize: 14, fontFamily: "sans-serif", minWidth: 180, textAlign: "center" }}>
            {weekOffset === 0 ? "This Week · " : weekOffset === 1 ? "Next Week · " : weekOffset === -1 ? "Last Week · " : ""}{formatWeekLabel(weekDates)}
          </span>
          <button onClick={() => changeWeek(1)} style={{ background: "#fff", border: "1px solid #e8e4dc", color: "#1e2d4a", borderRadius: 4, width: 36, height: 36, cursor: "pointer", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
        </div>

        <button
          onClick={() => downloadPDF(weekDates, plannerSlots, weekOffset)}
          style={{ padding: "10px 24px", borderRadius: 4, border: "1px solid #1e2d4a", background: "transparent", color: "#1e2d4a", fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "sans-serif" }}
        >
          ↓ Download PDF
        </button>
      </div>

      {/* Grid */}
      <div style={{ overflowX: "auto", padding: "0 24px 16px" }}>
        <div style={{ minWidth: 600, maxWidth: 1000, margin: "0 auto" }}>

          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "72px repeat(7, 1fr)", gap: 6, marginBottom: 6 }}>
            <div />
            {weekDates.map((date, i) => {
              const isToday = date === new Date().toISOString().slice(0, 10);
              return (
                <div key={date} style={{ textAlign: "center", padding: "8px 4px", background: isToday ? "rgba(201,168,76,0.08)" : "transparent", borderRadius: 4 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: isToday ? "#C9A84C" : "#1e2d4a", textTransform: "uppercase", letterSpacing: 1, fontFamily: "sans-serif" }}>{DAYS[i]}</div>
                  <div style={{ fontSize: 10, color: isToday ? "#C9A84C" : "#aaa", marginTop: 2, fontFamily: "sans-serif" }}>{date.slice(5)}</div>
                </div>
              );
            })}
          </div>

          {/* Meal rows */}
          {MEAL_TYPES.map(mealType => (
            <div key={mealType} style={{ display: "grid", gridTemplateColumns: "72px repeat(7, 1fr)", gap: 6, marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: 1, fontFamily: "sans-serif" }}>{mealType}</span>
              </div>
              {weekDates.map(dateKey => {
                const slotKey = `${dateKey}_${mealType}`;
                return (
                  <MealSlot
                    key={slotKey}
                    dateKey={dateKey}
                    mealType={mealType}
                    slotData={plannerSlots[slotKey] || null}
                    onAdd={() => setModalTarget({ dateKey, mealType })}
                    onClear={() => { clearSlot(dateKey, mealType); setShopSelected(prev => { const n = new Set(prev); n.delete(slotKey); return n; }); }}
                    isInShopList={shopSelected.has(slotKey)}
                    onToggleShop={() => toggleShop(slotKey)}
                  />
                );
              })}
            </div>
          ))}

          {/* Daily totals */}
          <div style={{ display: "grid", gridTemplateColumns: "72px repeat(7, 1fr)", gap: 6, marginTop: 4, borderTop: "1px solid #e8e4dc", paddingTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 10 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: 1, fontFamily: "sans-serif" }}>Total</span>
            </div>
            {weekDates.map(dateKey => {
              const daySlots = MEAL_TYPES.map(m => plannerSlots[`${dateKey}_${m}`]).filter(Boolean);
              const totalCal = daySlots.reduce((s, sl) => s + (sl.recipe.calories || 0), 0);
              const totalPro = daySlots.reduce((s, sl) => s + (sl.recipe.protein || 0), 0);
              if (!daySlots.length) return <div key={dateKey} />;
              return (
                <div key={dateKey} style={{ padding: "6px 4px", textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "#1e2d4a", fontWeight: 700, fontFamily: "sans-serif" }}>{totalCal} cal</div>
                  <div style={{ fontSize: 10, color: "#C9A84C", fontWeight: 700, fontFamily: "sans-serif" }}>{totalPro}g P</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Shopping List */}
      <PlannerShoppingList plannerSlots={plannerSlots} shopSelected={shopSelected} setShopSelected={setShopSelected} />

      {/* Footer */}
      <footer style={{ background: "#fff", borderTop: "1px solid #e8e4dc", padding: "28px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginTop: 40 }}>
        <Link href="/" style={{ fontSize: 18, color: "#1e2d4a", lineHeight: 1, textDecoration: "none" }}>
          <span style={{ fontStyle: "italic", fontWeight: 300 }}>her</span>
          <span style={{ fontWeight: 800 }}>coach.</span>
          <span style={{ color: "#C9A84C", fontFamily: "'Great Vibes', cursive", fontWeight: 400, fontSize: 16, marginLeft: 1, verticalAlign: "middle" }}>Jess</span>
        </Link>
        <div style={{ fontSize: 12, color: "#bbb", fontFamily: "sans-serif" }}>© 2026 HerCoachJess. All rights reserved.</div>
      </footer>

      {modalTarget && (
        <AddMealModal
          target={modalTarget}
          favourites={favourites}
          onClose={() => setModalTarget(null)}
          onAdd={entry => saveSlot(modalTarget.dateKey, modalTarget.mealType, entry)}
        />
      )}
    </div>
  );
}
