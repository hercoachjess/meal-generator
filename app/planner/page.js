"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { jsPDF } from "jspdf";
import { useSession, signOut } from "next-auth/react";

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const FLAVOR_PROFILES = ["Mediterranean", "Spicy", "Comfort Food", "Asian", "High Protein", "Vegetarian"];

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

function MacroPill({ value, unit, color }) {
  return (
    <span style={{ background: `${color}22`, color, fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 8, border: `1px solid ${color}44` }}>
      {value}{unit}
    </span>
  );
}

function MealSlot({ dateKey, mealType, slotData, onAdd, onClear }) {
  if (!slotData) {
    return (
      <div
        onClick={onAdd}
        style={{ minHeight: 72, border: "1px dashed rgba(255,255,255,0.12)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#555", fontSize: 12, fontWeight: 600, transition: "all 0.15s", background: "rgba(255,255,255,0.02)" }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "#4ecdc4"; e.currentTarget.style.color = "#4ecdc4"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#555"; }}
      >
        + Add
      </div>
    );
  }

  return (
    <div style={{ minHeight: 72, background: "linear-gradient(160deg,#1a1a2e,#16213e)", border: "1px solid #2a2a4a", borderRadius: 12, padding: "8px 10px", position: "relative", cursor: "default" }}>
      <button
        onClick={onClear}
        style={{ position: "absolute", top: 5, right: 6, background: "none", border: "none", color: "#555", fontSize: 14, cursor: "pointer", lineHeight: 1, padding: 0 }}
        aria-label="Remove meal"
      >×</button>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", lineHeight: 1.3, marginBottom: 5, paddingRight: 14, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
        {slotData.recipe.name}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
        <MacroPill value={slotData.recipe.calories} unit="cal" color="#ff6b6b" />
        <MacroPill value={slotData.recipe.protein} unit="g P" color="#4ecdc4" />
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

  const tabBtn = (t, label) => (
    <button
      onClick={() => setTab(t)}
      style={{ flex: 1, padding: "10px 0", background: tab === t ? "#4ecdc4" : "rgba(255,255,255,0.05)", border: "none", color: tab === t ? "#000" : "#aaa", fontWeight: 700, fontSize: 13, cursor: "pointer", borderRadius: t === "favourites" ? "10px 0 0 10px" : "0 10px 10px 0" }}
    >
      {label}
    </button>
  );

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "linear-gradient(160deg,#1a1a2e,#16213e)", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 500, maxHeight: "85vh", overflowY: "auto", padding: 24, border: "1px solid #2a2a4a" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", fontFamily: "Georgia, serif" }}>
            Add to {target?.mealType} · {target?.dateKey}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#888", fontSize: 22, cursor: "pointer" }}>×</button>
        </div>

        <div style={{ display: "flex", marginBottom: 18 }}>
          {tabBtn("favourites", `❤️ Saved (${favourites.length})`)}
          {tabBtn("generate", "✨ Generate")}
        </div>

        {tab === "favourites" && (
          <>
            {favourites.length === 0 ? (
              <div style={{ textAlign: "center", color: "#555", padding: 32, fontSize: 13 }}>
                No saved favourites yet. Generate a meal and tap ❤️ to save it.
              </div>
            ) : (
              favourites.map(fav => (
                <div
                  key={fav.savedAt}
                  onClick={() => onAdd({ recipe: fav.recipe, flavor: fav.flavor, imageUrl: fav.imageUrl })}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px", borderRadius: 12, border: "1px solid #2a2a4a", marginBottom: 10, cursor: "pointer", background: "rgba(255,255,255,0.03)", transition: "border-color 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "#4ecdc4"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "#2a2a4a"}
                >
                  <img src={fav.imageUrl} alt={fav.recipe.name} style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} onError={e => { e.target.src = getFallbackImage(fav.flavor); }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fav.recipe.name}</div>
                    <div style={{ display: "flex", gap: 5 }}>
                      <MacroPill value={fav.recipe.calories} unit="cal" color="#ff6b6b" />
                      <MacroPill value={fav.recipe.protein} unit="g P" color="#4ecdc4" />
                      <MacroPill value={fav.recipe.carbs} unit="g C" color="#ffe66d" />
                    </div>
                  </div>
                  <span style={{ color: "#4ecdc4", fontSize: 18 }}>+</span>
                </div>
              ))
            )}
          </>
        )}

        {tab === "generate" && (
          <div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#ccc", marginBottom: 6 }}>
                🔥 Calories: <span style={{ color: "#ff6b6b", fontWeight: 700 }}>{calories} kcal</span>
              </label>
              <input type="range" min={300} max={900} value={calories} onChange={e => setCalories(+e.target.value)} style={{ width: "100%", accentColor: "#ff6b6b" }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#ccc", marginBottom: 6 }}>
                💪 Protein: <span style={{ color: "#4ecdc4", fontWeight: 700 }}>{protein}g</span>
              </label>
              <input type="range" min={10} max={80} value={protein} onChange={e => setProtein(+e.target.value)} style={{ width: "100%", accentColor: "#4ecdc4" }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#ccc", marginBottom: 6 }}>🥩 Key Ingredient</label>
              <input type="text" placeholder="e.g. salmon, tofu, chicken..." value={ingredient} onChange={e => setIngredient(e.target.value)} style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "10px 12px", color: "#fff", fontSize: 13, boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#ccc", marginBottom: 6 }}>🌶️ Flavor Profile</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {FLAVOR_PROFILES.map(f => (
                  <button key={f} onClick={() => setFlavor(f)} style={{ padding: "6px 11px", borderRadius: 20, fontSize: 11, cursor: "pointer", fontWeight: 600, background: flavor === f ? "#4ecdc4" : "rgba(255,255,255,0.07)", color: flavor === f ? "#000" : "#aaa", border: flavor === f ? "1px solid #4ecdc4" : "1px solid rgba(255,255,255,0.1)" }}>{f}</button>
                ))}
              </div>
            </div>
            {error && <div style={{ color: "#ff6b6b", fontSize: 12, marginBottom: 10 }}>⚠️ {error}</div>}
            {generated && (
              <div style={{ background: "rgba(78,205,196,0.08)", border: "1px solid #4ecdc444", borderRadius: 12, padding: 14, marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <img src={generated.imageUrl} alt={generated.recipe.name} style={{ width: 50, height: 50, borderRadius: 8, objectFit: "cover" }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{generated.recipe.name}</div>
                    <div style={{ display: "flex", gap: 5, marginTop: 4 }}>
                      <MacroPill value={generated.recipe.calories} unit="cal" color="#ff6b6b" />
                      <MacroPill value={generated.recipe.protein} unit="g P" color="#4ecdc4" />
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onAdd(generated)}
                  style={{ width: "100%", padding: "10px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#4ecdc4,#2bb5ad)", color: "#000", fontSize: 13, fontWeight: 800, cursor: "pointer" }}
                >
                  ✓ Add to Planner
                </button>
              </div>
            )}
            <button
              onClick={handleGenerate}
              disabled={generating}
              style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", background: generating ? "#333" : "linear-gradient(135deg,#ff6b6b,#e05555)", color: generating ? "#666" : "#fff", fontSize: 14, fontWeight: 800, cursor: generating ? "not-allowed" : "pointer" }}
            >
              {generating ? "✨ Generating..." : "✨ Generate Meal"}
            </button>
          </div>
        )}
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

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(30, 30, 60);
  doc.text("Weekly Meal Plan", margin, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 120);
  const label = `${weekOffset === 0 ? "This Week · " : ""}${formatWeekLabel(weekDates)}`;
  doc.text(label, margin, 21);

  const startY = 30;

  // Day headers
  doc.setFillColor(240, 245, 255);
  doc.rect(margin + 22, startY, colW * 7, 9, "F");
  DAYS.forEach((day, i) => {
    const x = margin + 22 + i * colW + colW / 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 120);
    doc.text(day, x, startY + 4, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(130, 130, 160);
    doc.text(weekDates[i].slice(5), x, startY + 8, { align: "center" });
  });

  // Meal rows
  MEAL_TYPES.forEach((mealType, rowIdx) => {
    const y = startY + 9 + rowIdx * rowH;

    // Alternating row background
    if (rowIdx % 2 === 0) {
      doc.setFillColor(250, 250, 255);
      doc.rect(margin, y, pageW - margin * 2, rowH, "F");
    }

    // Meal type label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 120);
    doc.text(mealType, margin + 2, y + rowH / 2 + 1);

    weekDates.forEach((dateKey, colIdx) => {
      const slotData = plannerSlots[`${dateKey}_${mealType}`];
      const x = margin + 22 + colIdx * colW;

      // Cell border
      doc.setDrawColor(220, 220, 240);
      doc.setLineWidth(0.3);
      doc.rect(x, y, colW, rowH);

      if (slotData) {
        // Meal name
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(30, 30, 60);
        const name = doc.splitTextToSize(slotData.recipe.name, colW - 4);
        doc.text(name.slice(0, 2), x + 2, y + 5);

        // Macros
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6);
        doc.setTextColor(160, 80, 80);
        doc.text(`${slotData.recipe.calories} cal`, x + 2, y + rowH - 8);
        doc.setTextColor(60, 140, 130);
        doc.text(`${slotData.recipe.protein}g P`, x + 2, y + rowH - 3);
      }
    });
  });

  // Daily totals row
  const totalsY = startY + 9 + MEAL_TYPES.length * rowH;
  doc.setFillColor(230, 240, 255);
  doc.rect(margin, totalsY, pageW - margin * 2, 10, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(60, 60, 120);
  doc.text("Daily Total", margin + 2, totalsY + 7);

  weekDates.forEach((dateKey, colIdx) => {
    const daySlots = MEAL_TYPES.map(m => plannerSlots[`${dateKey}_${m}`]).filter(Boolean);
    if (daySlots.length === 0) return;
    const x = margin + 22 + colIdx * colW;
    const cal = daySlots.reduce((s, sl) => s + (sl.recipe.calories || 0), 0);
    const pro = daySlots.reduce((s, sl) => s + (sl.recipe.protein || 0), 0);
    doc.setTextColor(160, 80, 80);
    doc.text(`${cal} cal`, x + 2, totalsY + 5);
    doc.setTextColor(60, 140, 130);
    doc.text(`${pro}g P`, x + 2, totalsY + 9);
  });

  // Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(180, 180, 200);
  doc.text("Generated by Macro Meal Generator", margin, pageH - 6);
  doc.text(new Date().toLocaleDateString("en-GB"), pageW - margin, pageH - 6, { align: "right" });

  doc.save(`meal-plan-${weekDates[0]}.pdf`);
}

export default function PlannerPage() {
  const { data: session } = useSession();
  const [weekOffset, setWeekOffset] = useState(0);
  const [plannerSlots, setPlannerSlots] = useState({});
  const [favourites, setFavourites] = useState([]);
  const [modalTarget, setModalTarget] = useState(null);

  const weekDates = getWeekDates(weekOffset);

  useEffect(() => {
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

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at top left,#0f0c29,#302b63,#24243e)", padding: "0 0 60px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", padding: "40px 20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 400, margin: "0 auto 16px", padding: "0 4px" }}>
          <Link href="/" style={{ color: "#4ecdc4", fontSize: 13, fontWeight: 600, textDecoration: "none", opacity: 0.8 }}>
            ← Back to Generator
          </Link>
          {session && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {session.user.image && <img src={session.user.image} alt="" style={{ width: 26, height: 26, borderRadius: "50%", border: "2px solid #4ecdc444" }} />}
              <button onClick={() => signOut({ callbackUrl: "/login" })} style={{ background: "none", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#666", fontSize: 11, padding: "4px 10px", cursor: "pointer", fontWeight: 600 }}>Sign out</button>
            </div>
          )}
        </div>
        <div style={{ fontSize: 12, color: "#ff6b6b", letterSpacing: 2, textTransform: "uppercase", fontWeight: 800, marginBottom: 4, fontFamily: "Georgia, serif" }}>HerCoachJess</div>
        <h1 style={{ fontSize: "clamp(24px,4vw,40px)", fontFamily: "Georgia, serif", color: "#fff", margin: 0, lineHeight: 1.1 }}>
          Weekly Meal <span style={{ color: "#4ecdc4" }}>Planner</span>
        </h1>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 16 }}>
          <button onClick={() => changeWeek(-1)} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: 10, padding: "7px 14px", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>‹</button>
          <span style={{ color: "#ccc", fontSize: 14, fontWeight: 600, minWidth: 160, textAlign: "center" }}>
            {weekOffset === 0 ? "This Week" : weekOffset === 1 ? "Next Week" : weekOffset === -1 ? "Last Week" : `Week of`} {formatWeekLabel(weekDates)}
          </span>
          <button onClick={() => changeWeek(1)} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: 10, padding: "7px 14px", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>›</button>
        </div>
        <div style={{ marginTop: 14 }}>
          <button
            onClick={() => downloadPDF(weekDates, plannerSlots, weekOffset)}
            style={{ padding: "9px 22px", borderRadius: 20, border: "1px solid rgba(255,107,107,0.4)", background: "rgba(255,107,107,0.08)", color: "#ff6b6b", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            ⬇ Download PDF
          </button>
        </div>
      </div>

      {/* Grid — horizontal scroll on mobile */}
      <div style={{ overflowX: "auto", padding: "0 16px" }}>
        <div style={{ minWidth: 560, maxWidth: 900, margin: "0 auto" }}>
          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "80px repeat(7, 1fr)", gap: 6, marginBottom: 6 }}>
            <div />
            {weekDates.map((date, i) => {
              const isToday = date === new Date().toISOString().slice(0, 10);
              return (
                <div key={date} style={{ textAlign: "center", padding: "8px 4px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: isToday ? "#4ecdc4" : "#888", textTransform: "uppercase", letterSpacing: 1 }}>{DAYS[i]}</div>
                  <div style={{ fontSize: 11, color: isToday ? "#4ecdc4" : "#555", marginTop: 2 }}>{date.slice(5)}</div>
                </div>
              );
            })}
          </div>

          {/* Meal rows */}
          {MEAL_TYPES.map(mealType => (
            <div key={mealType} style={{ display: "grid", gridTemplateColumns: "80px repeat(7, 1fr)", gap: 6, marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: 1 }}>{mealType}</span>
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
                    onClear={() => clearSlot(dateKey, mealType)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Totals row */}
      <div style={{ overflowX: "auto", padding: "8px 16px 0" }}>
        <div style={{ minWidth: 560, maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "80px repeat(7, 1fr)", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: 1 }}>Total</span>
            </div>
            {weekDates.map(dateKey => {
              const daySlots = MEAL_TYPES.map(m => plannerSlots[`${dateKey}_${m}`]).filter(Boolean);
              const totalCal = daySlots.reduce((s, sl) => s + (sl.recipe.calories || 0), 0);
              const totalPro = daySlots.reduce((s, sl) => s + (sl.recipe.protein || 0), 0);
              if (daySlots.length === 0) return <div key={dateKey} />;
              return (
                <div key={dateKey} style={{ padding: "6px 4px", textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "#ff6b6b", fontWeight: 700 }}>{totalCal} cal</div>
                  <div style={{ fontSize: 10, color: "#4ecdc4", fontWeight: 700 }}>{totalPro}g P</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

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
