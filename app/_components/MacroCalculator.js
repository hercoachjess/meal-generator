"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";

// ── Options ──────────────────────────────────────────────────────────────────
export const GENDER_OPTIONS = [
  { value: "female", label: "Female" },
  { value: "male",   label: "Male"   },
];

export const ACTIVITY_OPTIONS = [
  { value: "sedentary",         label: "Sedentary",         sub: "Desk job, little exercise",     emoji: "🪑", multiplier: 1.2   },
  { value: "lightly_active",    label: "Lightly Active",    sub: "Light exercise 1–3 days/week",  emoji: "🚶‍♀️", multiplier: 1.375 },
  { value: "moderately_active", label: "Moderately Active", sub: "Exercise 3–5 days/week",        emoji: "🏃‍♀️", multiplier: 1.55  },
  { value: "very_active",       label: "Very Active",       sub: "Hard exercise 6–7 days/week",   emoji: "🏋️‍♀️", multiplier: 1.725 },
  { value: "extra_active",      label: "Extra Active",      sub: "Physical job + daily training", emoji: "🔥",   multiplier: 1.9   },
];

export const GOAL_OPTIONS = [
  { value: "lose",     label: "Lose Weight",  sub: "Gentle deficit — sustainable fat loss",    emoji: "📉", delta: -400, color: "#d97a5c", gradient: "linear-gradient(135deg, #f4d1bc 0%, #f8ede4 50%, #fce7d3 100%)", summary: "A gentle 400kcal daily deficit to drop body fat steadily without feeling hungry or drained." },
  { value: "maintain", label: "Maintain",     sub: "Keep shape, fuel performance",             emoji: "⚖️", delta: 0,    color: "#1e2d4a", gradient: "linear-gradient(135deg, #d5ddeb 0%, #ebeef4 50%, #e5e9f2 100%)", summary: "Balanced targets to hold your current physique while keeping energy and performance high." },
  { value: "build",    label: "Build Muscle", sub: "Lean surplus — strength & shape",          emoji: "💪", delta: 300,  color: "#2d7a4f", gradient: "linear-gradient(135deg, #c7e0cf 0%, #e4f0e8 50%, #d4e8dc 100%)", summary: "A smart 300kcal surplus to build lean muscle without unwanted fat gain." },
];

export const TIMELINE_OPTIONS = [
  { value: "4w",  label: "4 Weeks",  sub: "Kickstart",    emoji: "⚡" },
  { value: "8w",  label: "8 Weeks",  sub: "Steady shift", emoji: "🌱" },
  { value: "12w", label: "12 Weeks", sub: "Full reset",   emoji: "🌟" },
  { value: "6m",  label: "6 Months+",sub: "Lifestyle",    emoji: "🏔️" },
];

// ── Food imagery (Unsplash — stable curated CDN IDs) ──────────────────────────
const SLIDE_IMAGERY = {
  0: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&q=75", // berry bowl
  1: "https://images.unsplash.com/photo-1543362906-acfc16c67564?w=1200&q=75",    // smoothie
  2: "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=1200&q=75", // light wellness
  3: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1200&q=75", // stretching
  4: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1200&q=75", // fresh produce
  5: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=75", // active shoes
  6: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&q=75",    // salad bowl
  7: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=1200&q=75", // pancakes
  8: "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=1200&q=75", // plated meal
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function round5(n) { return Math.round(n / 5) * 5; }

export function calcMacros({ gender, age, height_cm, weight_kg, activity_level, goal }) {
  if (!age || !height_cm || !weight_kg) return null;
  const ag = parseFloat(age), ht = parseFloat(height_cm), wt = parseFloat(weight_kg);
  if (!ag || !ht || !wt) return null;

  const bmr = gender === "male"
    ? 10 * wt + 6.25 * ht - 5 * ag + 5
    : 10 * wt + 6.25 * ht - 5 * ag - 161;

  const actOpt  = ACTIVITY_OPTIONS.find(a => a.value === activity_level) || ACTIVITY_OPTIONS[2];
  const goalOpt = GOAL_OPTIONS.find(g => g.value === goal) || GOAL_OPTIONS[1];

  const calories = Math.round(bmr * actOpt.multiplier + goalOpt.delta);
  const protein  = round5(2 * wt);
  const fat      = round5((calories * 0.25) / 9);
  const carbs    = round5((calories - protein * 4 - fat * 9) / 4);
  return { calories, protein, carbs, fat };
}

// ── Animated count-up hook ───────────────────────────────────────────────────
function useCountUp(target, duration = 1400, delay = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) { setVal(0); return; }
    let raf;
    const t0 = performance.now() + delay;
    const step = (t) => {
      const dt = t - t0;
      if (dt < 0) { raf = requestAnimationFrame(step); return; }
      const p = Math.min(dt / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, delay]);
  return val;
}

// ── Progress dots ────────────────────────────────────────────────────────────
function ProgressDots({ step, total, onJump, allowForward = false }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginBottom: 28 }}>
      {Array.from({ length: total }).map((_, i) => {
        const reachable = i <= step || allowForward;
        return (
          <button key={i} onClick={() => reachable && onJump?.(i)}
            aria-label={`Step ${i + 1}`}
            style={{
              width: i === step ? 24 : 8, height: 8, borderRadius: 6,
              background: i < step ? "#C9A84C" : i === step ? "#1e2d4a" : (allowForward ? "#c9b98c" : "#e2ddd0"),
              border: "none", padding: 0,
              cursor: reachable ? "pointer" : "default",
              transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
            }}
          />
        );
      })}
    </div>
  );
}

// ── Plan chips row ───────────────────────────────────────────────────────────
function PlanChips({ data }) {
  const chips = [];
  if (data.name)           chips.push({ i: "✨", t: data.name });
  if (data.gender)         chips.push({ i: data.gender === "male" ? "♂" : "♀", t: GENDER_OPTIONS.find(g => g.value === data.gender)?.label });
  if (data.age)            chips.push({ i: "🎂", t: `${data.age} yrs` });
  if (data.height_cm)      chips.push({ i: "📏", t: `${data.height_cm}cm` });
  if (data.weight_kg)      chips.push({ i: "⚖️", t: `${data.weight_kg}kg` });
  if (data.activity_level) { const a = ACTIVITY_OPTIONS.find(x => x.value === data.activity_level); chips.push({ i: a?.emoji, t: a?.label }); }
  if (data.goal)           { const g = GOAL_OPTIONS.find(x => x.value === data.goal);               chips.push({ i: g?.emoji, t: g?.label }); }
  if (data.timeline)       { const t = TIMELINE_OPTIONS.find(x => x.value === data.timeline);       chips.push({ i: t?.emoji, t: t?.label }); }
  if (!chips.length) return <div style={{ height: 26 }} />;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: 22 }}>
      {chips.map((c, idx) => (
        <div key={idx} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.4)", borderRadius: 20, padding: "5px 11px", fontSize: 11, color: "#9a7a28", fontFamily: "sans-serif", fontWeight: 600 }}>
          <span style={{ fontSize: 12 }}>{c.i}</span>
          <span>{c.t}</span>
        </div>
      ))}
    </div>
  );
}

// ── Option Card ───────────────────────────────────────────────────────────────
function OptionCard({ icon, label, sub, selected, onClick, accent = "#1e2d4a", full = true }) {
  return (
    <button type="button" onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        width: full ? "100%" : undefined,
        textAlign: "left",
        background: selected ? "rgba(30,45,74,0.04)" : "#fff",
        border: `1.5px solid ${selected ? accent : "#e8e4dc"}`,
        borderRadius: 10, padding: "16px 18px",
        cursor: "pointer", fontFamily: "sans-serif",
        transition: "all 0.18s ease",
        boxShadow: selected ? `0 2px 14px rgba(30,45,74,0.1)` : "none",
      }}>
      <div style={{ fontSize: 26, lineHeight: 1, flexShrink: 0, width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center", background: selected ? accent : "#fafaf8", borderRadius: 10, transition: "background 0.18s" }}>
        <span>{icon}</span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: selected ? accent : "#1a1a1a" }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{sub}</div>}
      </div>
      {selected && <div style={{ width: 20, height: 20, borderRadius: "50%", background: accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>✓</div>}
    </button>
  );
}

// ── Body Silhouette SVGs ──────────────────────────────────────────────────────
function BodySilhouette({ type, selected, accent }) {
  const stroke = selected ? "#fff" : "#1e2d4a";
  const fill   = selected ? "rgba(255,255,255,0.08)" : "rgba(30,45,74,0.04)";
  if (type === "female") {
    return (
      <svg viewBox="0 0 80 180" width="68" height="120" style={{ display: "block", margin: "0 auto" }}>
        <circle cx="40" cy="22" r="13" fill={fill} stroke={stroke} strokeWidth="2" />
        <path d="M27 36 Q26 54 32 66 Q26 80 28 100 Q24 118 30 132 L34 176 L46 176 L50 132 Q56 118 52 100 Q54 80 48 66 Q54 54 53 36 Z" fill={fill} stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 80 180" width="68" height="120" style={{ display: "block", margin: "0 auto" }}>
      <circle cx="40" cy="22" r="13" fill={fill} stroke={stroke} strokeWidth="2" />
      <path d="M22 38 Q22 56 28 68 Q28 90 30 110 Q28 130 32 150 L34 176 L46 176 L48 150 Q52 130 50 110 Q52 90 52 68 Q58 56 58 38 Z" fill={fill} stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function BodyCard({ type, label, selected, onClick }) {
  const accent = "#1e2d4a";
  return (
    <button type="button" onClick={onClick}
      style={{
        flex: 1, padding: "26px 18px 20px",
        background: selected ? accent : "#fff",
        border: `1.5px solid ${selected ? accent : "#e8e4dc"}`,
        borderRadius: 14, cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: selected ? "0 6px 20px rgba(30,45,74,0.18)" : "none",
      }}>
      <BodySilhouette type={type} selected={selected} accent={accent} />
      <div style={{ fontSize: 14, fontWeight: 700, color: selected ? "#fff" : "#1a1a1a", fontFamily: "sans-serif", marginTop: 8 }}>{label}</div>
    </button>
  );
}

// ── Visual Slider (with ruler ticks) ──────────────────────────────────────────
function VisualSlider({ min, max, value, onChange, unit, step = 1 }) {
  const safeVal = value || Math.round((min + max) / 2);
  return (
    <div style={{ padding: "8px 4px" }}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ display: "inline-flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontSize: 56, fontWeight: 700, color: "#1e2d4a", fontFamily: "Georgia, serif", lineHeight: 1 }}>{safeVal}</span>
          <span style={{ fontSize: 16, color: "#C9A84C", fontFamily: "sans-serif", letterSpacing: 1, textTransform: "uppercase", fontWeight: 700 }}>{unit}</span>
        </div>
      </div>
      <div style={{ position: "relative", padding: "0 4px" }}>
        <input type="range" min={min} max={max} step={step} value={safeVal}
          onChange={e => onChange(e.target.value)}
          className="vs-range"
          style={{ width: "100%" }}
        />
        {/* Ruler ticks */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, padding: "0 2px" }}>
          {Array.from({ length: 11 }).map((_, i) => {
            const tickVal = Math.round(min + ((max - min) * i) / 10);
            const isMajor = i % 2 === 0;
            return (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ width: 1, height: isMajor ? 8 : 4, background: "#d8d4cc" }} />
                {isMajor && <div style={{ fontSize: 10, color: "#bbb", fontFamily: "sans-serif" }}>{tickVal}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Macro Ring with animated count ────────────────────────────────────────────
function MacroBigRing({ label, value, suffix, color, delay }) {
  const animated = useCountUp(value || 0, 1400, delay);
  const pct = value ? Math.min(100, (animated / value) * 100) : 0;
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ width: 96, height: 96, borderRadius: "50%", background: `conic-gradient(${color} ${pct * 3.6}deg, #f2eee5 0deg)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", transition: "background 0.05s linear" }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#1e2d4a", fontFamily: "Georgia, serif", lineHeight: 1 }}>{animated}</div>
          {suffix && <div style={{ fontSize: 9, color: "#aaa", fontFamily: "sans-serif", letterSpacing: 0.5, marginTop: 2 }}>{suffix}</div>}
        </div>
      </div>
      <div style={{ fontSize: 10, color, textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "sans-serif", fontWeight: 700 }}>{label}</div>
    </div>
  );
}

// ── Slide imagery background ──────────────────────────────────────────────────
function SlideImage({ src, accent }) {
  if (!src) return null;
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: "inherit", pointerEvents: "none", zIndex: 0 }}>
      <div style={{ position: "absolute", inset: 0, background: `url(${src}) center/cover no-repeat`, opacity: 0.14, filter: "saturate(1.1)" }} />
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.92) 60%, #fff 100%)` }} />
      {accent && <div style={{ position: "absolute", inset: 0, background: accent, mixBlendMode: "multiply", opacity: 0.22 }} />}
    </div>
  );
}

// ── Step Shell ────────────────────────────────────────────────────────────────
function StepShell({ icon, eyebrow, title, subtitle, children }) {
  return (
    <div className="step-in" style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
      {icon && <div style={{ fontSize: 44, marginBottom: 14, lineHeight: 1 }}>{icon}</div>}
      {eyebrow && <div style={{ fontSize: 11, color: "#C9A84C", letterSpacing: 3, textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 700, marginBottom: 10 }}>{eyebrow}</div>}
      <h2 style={{ fontSize: 26, fontWeight: 400, color: "#1a1a1a", margin: "0 0 12px", lineHeight: 1.25, fontFamily: "Georgia, serif" }}>{title}</h2>
      {subtitle && <p style={{ color: "#888", fontSize: 14, margin: "0 0 28px", lineHeight: 1.7, fontFamily: "sans-serif", fontWeight: 300, maxWidth: 440, marginLeft: "auto", marginRight: "auto" }}>{subtitle}</p>}
      {children}
    </div>
  );
}

// ── Teaser meal (locked) ──────────────────────────────────────────────────────
function TeaserMeal({ macros, onUnlock }) {
  // Build a quick teaser that's plausibly inside the calorie band
  const teaser = {
    name: "Honey-Glazed Salmon, Herbed Quinoa & Asparagus",
    img: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=70",
    cal: Math.min(macros.calories, Math.round(macros.calories * 0.38)),
    pro: Math.min(macros.protein,  Math.round(macros.protein  * 0.45)),
  };
  return (
    <div style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 14, overflow: "hidden", marginBottom: 16, boxShadow: "0 4px 18px rgba(30,45,74,0.06)" }}>
      <div style={{ fontSize: 10, color: "#C9A84C", letterSpacing: 2, textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 700, padding: "14px 18px 0" }}>Preview · A meal built for your numbers</div>
      <div style={{ display: "flex", gap: 14, padding: "14px 18px", alignItems: "center", textAlign: "left" }}>
        <img src={teaser.img} alt="" style={{ width: 78, height: 78, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1e2d4a", fontFamily: "Georgia, serif", lineHeight: 1.3 }}>{teaser.name}</div>
          <div style={{ fontSize: 11, color: "#888", fontFamily: "sans-serif", marginTop: 4 }}>{teaser.cal} kcal · {teaser.pro}g protein</div>
        </div>
      </div>
      <div style={{ position: "relative", padding: "14px 18px", background: "linear-gradient(180deg, #fafaf8 0%, #f5f2ea 100%)", borderTop: "1px dashed #e8e4dc" }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 10, filter: "blur(2.5px)", opacity: 0.55 }}>
          {["🥣 Greek Yogurt Bowl", "🥗 Chicken Caesar", "🍜 Thai Peanut Noodles"].map((m, i) => (
            <div key={i} style={{ flex: 1, padding: "10px 8px", background: "#fff", border: "1px solid #e8e4dc", borderRadius: 8, fontSize: 10, color: "#666", fontFamily: "sans-serif", textAlign: "center" }}>{m}</div>
          ))}
        </div>
        <button onClick={onUnlock}
          style={{ width: "100%", padding: "12px", border: "none", borderRadius: 6, background: "#C9A84C", color: "#1a1a1a", fontSize: 12, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", fontFamily: "sans-serif", cursor: "pointer", boxShadow: "0 4px 14px rgba(201,168,76,0.35)" }}>
          🔒 Unlock 500+ Meals for Your Macros
        </button>
      </div>
    </div>
  );
}

// ── Trust strip ───────────────────────────────────────────────────────────────
function TrustStrip() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center", marginTop: 14, fontSize: 11, color: "#999", fontFamily: "sans-serif" }}>
      {[
        { i: "✓", t: "No credit card" },
        { i: "✓", t: "No spam" },
        { i: "✓", t: "60 seconds" },
      ].map((x, i) => (
        <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <span style={{ color: "#2d7a4f", fontWeight: 800 }}>{x.i}</span>
          <span>{x.t}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
const STORAGE_KEY = "macroCalcProgress_v1";
const DEFAULTS = {
  name: "", gender: "", age: "", height_cm: "", weight_kg: "",
  activity_level: "", goal: "", timeline: "",
};

export default function MacroCalculator({
  mode = "landing",        // "landing" | "onboarding" | "profile"
  user = null,             // Supabase user (for onboarding/profile)
  initialData = null,
  onComplete,              // optional callback(data, macros)
  onUnlock,                // what to do at reveal if no account yet
  onReveal,                // fires once when user first reaches the reveal slide
  hideResume = false,
}) {
  // If caller provides complete initial data (e.g. from landing localStorage or a profile update),
  // jump straight to the reveal slide so the user doesn't re-click through filled steps.
  const prefillComplete = !!(initialData && calcMacros(initialData) && initialData.timeline);
  const [step, setStep] = useState(prefillComplete ? 8 : 0);
  const [data, setData] = useState(initialData || DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [resumeOffer, setResumeOffer] = useState(null);
  const saveTimer = useRef(null);

  // Load resume from localStorage on mount (landing mode only)
  useEffect(() => {
    if (hideResume || mode !== "landing") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved?.step > 0 && saved?.data) {
        setResumeOffer(saved);
      }
    } catch { /* ignore */ }
  }, [hideResume, mode]);

  // Persist progress to localStorage
  useEffect(() => {
    if (mode !== "landing") return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, data, savedAt: Date.now() })); } catch { /* ignore */ }
    }, 300);
    return () => saveTimer.current && clearTimeout(saveTimer.current);
  }, [step, data, mode]);

  // Auto-populate slider defaults so "Continue" is enabled on first entry
  // (sliders display a default but don't write to data until dragged)
  useEffect(() => {
    if (step === 3 && !data.age) {
      setData(prev => ({ ...prev, age: "30" }));
    } else if (step === 4) {
      setData(prev => {
        const next = { ...prev };
        if (!next.height_cm) next.height_cm = "165";
        if (!next.weight_kg) next.weight_kg = "65";
        return next;
      });
    }
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fire onReveal once when the user reaches the final slide
  const revealFired = useRef(false);
  useEffect(() => {
    if (step === 8 && !revealFired.current && onReveal) {
      revealFired.current = true;
      onReveal();
    }
  }, [step, onReveal]);

  function update(patch) { setData(prev => ({ ...prev, ...patch })); }

  const macros   = useMemo(() => calcMacros(data), [data]);
  const goalInfo = GOAL_OPTIONS.find(g => g.value === data.goal);

  // Dynamic background tint — neutral until goal chosen, then goal colour
  const cardBg = goalInfo ? goalInfo.gradient : "#fff";

  function acceptResume() {
    if (!resumeOffer) return;
    setData(resumeOffer.data);
    setStep(resumeOffer.step);
    setResumeOffer(null);
  }
  function startFresh() {
    setResumeOffer(null);
    setData(DEFAULTS);
    setStep(0);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }

  // ── Slides ──────────────────────────────────────────────────────────────────
  const steps = [
    {
      img: SLIDE_IMAGERY[0],
      render: () => (
        <StepShell icon="✨" eyebrow="Your Personalised Blueprint" title="Get your macros in 60 seconds" subtitle="A free, science-backed calculator that tells you exactly what to eat to reach your goal. No accounts, no card — just your numbers.">
          <div style={{ background: "linear-gradient(135deg, #1e2d4a 0%, #2a3d5e 50%, #1e2d4a 100%)", borderRadius: 14, padding: "22px 22px", margin: "0 0 12px", color: "#fff", textAlign: "left" }}>
            <div style={{ fontSize: 11, color: "#C9A84C", letterSpacing: 2, textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 700, marginBottom: 12 }}>What you&apos;ll discover</div>
            {[
              { i: "🎯", t: "Your exact daily calories & macros", s: "Based on your body, activity & goal" },
              { i: "🍽️", t: "Meals built to hit those numbers",  s: "AI-matched recipes, zero calculation" },
              { i: "📈", t: "A clear plan you&apos;ll actually stick to", s: "Weekly planner + shopping list included" },
            ].map((x, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "9px 0", borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ fontSize: 20, flexShrink: 0, width: 24 }}>{x.i}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "sans-serif" }} dangerouslySetInnerHTML={{ __html: x.t }} />
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontFamily: "sans-serif", marginTop: 2 }}>{x.s}</div>
                </div>
              </div>
            ))}
          </div>
          <TrustStrip />
        </StepShell>
      ),
      canNext: () => true,
      cta: () => "Calculate My Macros →",
    },
    {
      img: SLIDE_IMAGERY[1],
      render: () => (
        <StepShell icon="👋" eyebrow="First — the basics" title="What should we call you?" subtitle="Optional — but it makes your dashboard feel like yours.">
          <input type="text" autoFocus placeholder="e.g. Jessica" value={data.name} onChange={e => update({ name: e.target.value })}
            style={{ width: "100%", maxWidth: 320, background: "#fff", border: "1.5px solid #e8e4dc", borderRadius: 10, padding: "16px 18px", fontSize: 17, fontFamily: "Georgia, serif", color: "#1a1a1a", outline: "none", textAlign: "center", boxSizing: "border-box" }} />
        </StepShell>
      ),
      canNext: () => true,
      cta: () => data.name ? `Nice to meet you, ${data.name.split(" ")[0]} →` : "Skip this step →",
    },
    {
      img: SLIDE_IMAGERY[2],
      render: () => (
        <StepShell icon="💫" eyebrow="Body Basics" title="Select the build closest to you" subtitle="We'll use this to apply the right BMR formula for your calculations.">
          <div style={{ display: "flex", gap: 14, marginTop: 4, maxWidth: 380, margin: "0 auto" }}>
            <BodyCard type="female" label="Female" selected={data.gender === "female"} onClick={() => update({ gender: "female" })} />
            <BodyCard type="male"   label="Male"   selected={data.gender === "male"}   onClick={() => update({ gender: "male" })} />
          </div>
        </StepShell>
      ),
      canNext: () => !!data.gender,
    },
    {
      img: SLIDE_IMAGERY[3],
      render: () => (
        <StepShell icon="🎂" eyebrow="A little more" title="How old are you?" subtitle="Age affects your metabolic rate — we factor it into your plan.">
          <div style={{ maxWidth: 380, margin: "0 auto" }}>
            <VisualSlider min={16} max={75} value={parseInt(data.age) || 30} onChange={v => update({ age: v })} unit="years" />
          </div>
        </StepShell>
      ),
      canNext: () => !!data.age && parseFloat(data.age) > 0,
    },
    {
      img: SLIDE_IMAGERY[4],
      render: () => (
        <StepShell icon="📐" eyebrow="Your Measurements" title="Height & weight" subtitle="Drag to dial in. These stay private and are only used to calculate your targets.">
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 22, maxWidth: 420, margin: "0 auto" }}>
            <div>
              <div style={{ fontSize: 10, color: "#aaa", letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 700, marginBottom: 6, textAlign: "left" }}>Height</div>
              <VisualSlider min={140} max={210} value={parseInt(data.height_cm) || 165} onChange={v => update({ height_cm: v })} unit="cm" />
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#aaa", letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 700, marginBottom: 6, textAlign: "left" }}>Weight</div>
              <VisualSlider min={40} max={150} value={parseInt(data.weight_kg) || 65} onChange={v => update({ weight_kg: v })} unit="kg" />
            </div>
          </div>
        </StepShell>
      ),
      canNext: () => !!data.height_cm && !!data.weight_kg,
    },
    {
      img: SLIDE_IMAGERY[5],
      render: () => (
        <StepShell icon="⚡" eyebrow="Your Lifestyle" title="How active are you day-to-day?" subtitle="Be honest — this swings your calorie target by 500+ either way.">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ACTIVITY_OPTIONS.map(o => (
              <OptionCard key={o.value} icon={o.emoji} label={o.label} sub={o.sub} selected={data.activity_level === o.value} onClick={() => update({ activity_level: o.value })} />
            ))}
          </div>
        </StepShell>
      ),
      canNext: () => !!data.activity_level,
    },
    {
      img: SLIDE_IMAGERY[6],
      render: () => (
        <StepShell icon="🎯" eyebrow="Your Goal" title="What are you working towards?" subtitle="Pick the one that fires you up most right now.">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {GOAL_OPTIONS.map(o => (
              <OptionCard key={o.value} icon={o.emoji} label={o.label} sub={o.sub} selected={data.goal === o.value} onClick={() => update({ goal: o.value })} accent={o.color} />
            ))}
          </div>
          {goalInfo && (
            <div style={{ marginTop: 16, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 10, padding: "14px 18px", textAlign: "left" }}>
              <div style={{ fontSize: 10, color: "#C9A84C", letterSpacing: 2, textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 700, marginBottom: 5 }}>Your goal summary</div>
              <div style={{ fontSize: 13, color: "#1e2d4a", fontFamily: "sans-serif", lineHeight: 1.6 }}>{goalInfo.summary}</div>
            </div>
          )}
        </StepShell>
      ),
      canNext: () => !!data.goal,
    },
    {
      img: SLIDE_IMAGERY[7],
      render: () => (
        <StepShell icon="📅" eyebrow="Your Timeline" title="How long are you committing for?" subtitle="No pressure — you can always extend. We'll tailor your pacing to match.">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, maxWidth: 420, margin: "0 auto" }}>
            {TIMELINE_OPTIONS.map(o => (
              <OptionCard key={o.value} icon={o.emoji} label={o.label} sub={o.sub} selected={data.timeline === o.value} onClick={() => update({ timeline: o.value })} />
            ))}
          </div>
        </StepShell>
      ),
      canNext: () => !!data.timeline,
    },
    {
      img: SLIDE_IMAGERY[8],
      render: () => (
        <StepShell icon="✦" eyebrow={`${data.name ? data.name.split(" ")[0] + ", " : ""}Here's Your Plan`} title="Your personalised macro blueprint" subtitle="These are your daily targets — built on your body, goal & timeline.">
          {macros && goalInfo && (
            <>
              <div style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 14, padding: "26px 16px", marginBottom: 16, boxShadow: "0 4px 18px rgba(30,45,74,0.06)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                  <MacroBigRing label="Calories" value={macros.calories} suffix="kcal" color="#1e2d4a" delay={0}   />
                  <MacroBigRing label="Protein"  value={macros.protein}  suffix="g"    color="#C9A84C" delay={150} />
                  <MacroBigRing label="Carbs"    value={macros.carbs}    suffix="g"    color="#2d7a4f" delay={300} />
                  <MacroBigRing label="Fat"      value={macros.fat}      suffix="g"    color="#d97a5c" delay={450} />
                </div>
              </div>
              <div style={{ background: `linear-gradient(135deg, ${goalInfo.color}, ${goalInfo.color}dd)`, color: "#fff", borderRadius: 14, padding: "22px 20px", marginBottom: 16, textAlign: "left" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <div style={{ fontSize: 30 }}>{goalInfo.emoji}</div>
                  <div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", letterSpacing: 2, textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 700 }}>Your mission</div>
                    <div style={{ fontSize: 17, fontWeight: 700, fontFamily: "Georgia, serif" }}>{goalInfo.label}</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.7, fontFamily: "sans-serif", color: "rgba(255,255,255,0.92)" }}>{goalInfo.summary}</div>
              </div>
              {mode === "landing" && <TeaserMeal macros={macros} onUnlock={() => handleFinish()} />}
              <div style={{ background: "rgba(255,255,255,0.85)", border: "1px solid #e8e4dc", borderRadius: 10, padding: "14px 18px", textAlign: "left" }}>
                <div style={{ fontSize: 10, color: "#C9A84C", letterSpacing: 2, textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 700, marginBottom: 8 }}>Why these numbers?</div>
                <div style={{ fontSize: 12, color: "#555", fontFamily: "sans-serif", lineHeight: 1.7 }}>
                  We calculated your BMR using the Mifflin–St Jeor formula, multiplied by your activity level
                  {data.activity_level && <> (<b>{ACTIVITY_OPTIONS.find(a => a.value === data.activity_level)?.label.toLowerCase()}</b>)</>},
                  then adjusted for your goal{goalInfo.delta !== 0 && <> (<b>{goalInfo.delta > 0 ? "+" : ""}{goalInfo.delta}kcal</b>)</>}.
                  Protein at 2g per kg bodyweight, fat at 25% of calories, the rest as carbs.
                </div>
              </div>
            </>
          )}
        </StepShell>
      ),
      canNext: () => !!macros,
      cta: () => mode === "landing" ? "🔒 Unlock 500+ Meals for Your Macros" : "Save & Continue →",
      isLast: true,
    },
  ];

  const currentStep = steps[step];
  const isLast = !!currentStep.isLast;
  const ctaLabel = typeof currentStep.cta === "function" ? currentStep.cta() : (currentStep.cta || "Continue →");

  async function handleFinish() {
    setError(null);
    setSaving(true);

    if (mode === "landing") {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, data, macros, completed: true, savedAt: Date.now() })); } catch { /* ignore */ }
      setSaving(false);
      if (onUnlock) onUnlock(data, macros);
      return;
    }

    // onboarding / profile — save to Supabase
    try {
      if (user && macros && onComplete) {
        await onComplete(data, macros);
      }
    } catch (err) {
      setError("Could not save. Please try again.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  function handleNext() {
    if (isLast) { handleFinish(); return; }
    if (!currentStep.canNext()) return;
    setStep(s => Math.min(s + 1, steps.length - 1));
  }
  function handleBack() { setStep(s => Math.max(s - 1, 0)); }
  function jumpTo(i) {
    // Allow jumping forward once the user has enough data to reach that step
    if (i <= step) { setStep(i); return; }
    const canReachReveal = !!macros && !!data.timeline;
    if (canReachReveal) setStep(i);
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ width: "100%", maxWidth: 620, margin: "0 auto" }}>
      <style>{`
        @keyframes stepIn { from { opacity:0; transform: translateY(14px); } to { opacity:1; transform: translateY(0); } }
        .step-in { animation: stepIn 0.4s cubic-bezier(0.4,0,0.2,1); }
        .mc-cta {
          width: 100%; padding: 17px; border: none; border-radius: 8px;
          background: #1e2d4a; color: #fff; font-size: 13px; font-weight: 700;
          letter-spacing: 2px; text-transform: uppercase; font-family: sans-serif;
          cursor: pointer; transition: all 0.2s; box-shadow: 0 3px 14px rgba(30,45,74,0.22);
        }
        .mc-cta:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }
        .mc-cta:hover:not(:disabled) { background: #152138; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(30,45,74,0.32); }
        .mc-cta.gold { background: #C9A84C; color: #1a1a1a; box-shadow: 0 4px 16px rgba(201,168,76,0.4); }
        .mc-cta.gold:hover:not(:disabled) { background: #b89640; box-shadow: 0 6px 22px rgba(201,168,76,0.5); }
        .mc-back { background: none; border: none; color: #888; font-size: 12px; cursor: pointer; font-family: sans-serif; padding: 10px 16px; letter-spacing: 1px; text-transform: uppercase; font-weight: 600; }
        .mc-back:hover { color: #1e2d4a; }
        .vs-range { -webkit-appearance: none; appearance: none; height: 6px; background: linear-gradient(90deg, #C9A84C, #d9b85f); border-radius: 3px; outline: none; }
        .vs-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 28px; height: 28px; border-radius: 50%; background: #1e2d4a; border: 3px solid #fff; cursor: grab; box-shadow: 0 2px 10px rgba(30,45,74,0.35); transition: transform 0.12s; }
        .vs-range::-webkit-slider-thumb:active { cursor: grabbing; transform: scale(1.1); }
        .vs-range::-moz-range-thumb { width: 28px; height: 28px; border-radius: 50%; background: #1e2d4a; border: 3px solid #fff; cursor: grab; box-shadow: 0 2px 10px rgba(30,45,74,0.35); }
      `}</style>

      {/* Resume banner */}
      {resumeOffer && !hideResume && (
        <div style={{ background: "linear-gradient(135deg, #1e2d4a 0%, #2a3d5e 100%)", color: "#fff", borderRadius: 10, padding: "14px 18px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontSize: 24 }}>👋</div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "sans-serif" }}>Welcome back{resumeOffer.data?.name ? `, ${resumeOffer.data.name.split(" ")[0]}` : ""}!</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", fontFamily: "sans-serif", marginTop: 2 }}>Pick up at step {resumeOffer.step + 1} of {steps.length}?</div>
          </div>
          <button onClick={acceptResume} style={{ background: "#C9A84C", border: "none", borderRadius: 6, padding: "8px 14px", color: "#1a1a1a", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", fontFamily: "sans-serif", cursor: "pointer" }}>Resume</button>
          <button onClick={startFresh} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 6, padding: "8px 14px", color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", fontFamily: "sans-serif", cursor: "pointer" }}>Start Fresh</button>
        </div>
      )}

      <ProgressDots step={step} total={steps.length} onJump={jumpTo} allowForward={!!macros && !!data.timeline} />
      <PlanChips data={data} />

      <div style={{ background: cardBg, border: "1px solid #e8e4dc", borderRadius: 16, padding: "38px 34px", boxShadow: "0 8px 30px rgba(30,45,74,0.08)", minHeight: 360, position: "relative", overflow: "hidden", transition: "background 0.6s ease" }}>
        <SlideImage src={currentStep.img} />
        {currentStep.render()}
      </div>

      <div style={{ marginTop: 18 }}>
        <button className={`mc-cta${isLast && mode === "landing" ? " gold" : ""}`} disabled={!currentStep.canNext() || saving} onClick={handleNext}>
          {saving ? "Saving..." : ctaLabel}
        </button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
          {step > 0 ? <button className="mc-back" onClick={handleBack}>← Back</button> : <span />}
          {step === 0 && mode === "landing" && (
            <span style={{ fontSize: 11, color: "#aaa", fontFamily: "sans-serif", padding: "10px 0" }}>
              Already a member? <Link href="/login" style={{ color: "#1e2d4a", fontWeight: 700, textDecoration: "none" }}>Log in →</Link>
            </span>
          )}
        </div>
      </div>

      {error && <div style={{ marginTop: 14, background: "rgba(220,53,53,0.06)", border: "1px solid rgba(220,53,53,0.25)", borderRadius: 6, padding: "11px 14px", color: "#c0392b", fontSize: 13, fontFamily: "sans-serif", textAlign: "center" }}>{error}</div>}
    </div>
  );
}
