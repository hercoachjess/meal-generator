"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

// ── Options ──────────────────────────────────────────────────────────────────
const GENDER_OPTIONS = [
  { value: "female", label: "Female", emoji: "👩" },
  { value: "male",   label: "Male",   emoji: "👨" },
];

const ACTIVITY_OPTIONS = [
  { value: "sedentary",         label: "Sedentary",         sub: "Desk job, little exercise",     emoji: "🪑", multiplier: 1.2   },
  { value: "lightly_active",    label: "Lightly Active",    sub: "Light exercise 1–3 days/week",  emoji: "🚶‍♀️", multiplier: 1.375 },
  { value: "moderately_active", label: "Moderately Active", sub: "Exercise 3–5 days/week",        emoji: "🏃‍♀️", multiplier: 1.55  },
  { value: "very_active",       label: "Very Active",       sub: "Hard exercise 6–7 days/week",   emoji: "🏋️‍♀️", multiplier: 1.725 },
  { value: "extra_active",      label: "Extra Active",      sub: "Physical job + daily training", emoji: "🔥",   multiplier: 1.9   },
];

const GOAL_OPTIONS = [
  {
    value: "lose",
    label: "Lose Weight",
    sub: "Gentle deficit — sustainable fat loss",
    emoji: "📉",
    delta: -400,
    color: "#d97a5c",
    summary: "A gentle 400kcal daily deficit to drop body fat steadily without feeling hungry or drained.",
  },
  {
    value: "maintain",
    label: "Maintain",
    sub: "Keep shape, fuel performance",
    emoji: "⚖️",
    delta: 0,
    color: "#1e2d4a",
    summary: "Balanced targets to hold your current physique while keeping energy and performance high.",
  },
  {
    value: "build",
    label: "Build Muscle",
    sub: "Lean surplus — strength & shape",
    emoji: "💪",
    delta: 300,
    color: "#2d7a4f",
    summary: "A smart 300kcal surplus to build lean muscle without unwanted fat gain.",
  },
];

const TIMELINE_OPTIONS = [
  { value: "4w",  label: "4 Weeks",   sub: "Kickstart",    emoji: "⚡" },
  { value: "8w",  label: "8 Weeks",   sub: "Steady shift", emoji: "🌱" },
  { value: "12w", label: "12 Weeks",  sub: "Full reset",   emoji: "🌟" },
  { value: "6m",  label: "6 Months+", sub: "Lifestyle",    emoji: "🏔️" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function round5(n) { return Math.round(n / 5) * 5; }

function calcMacros({ gender, age, height_cm, weight_kg, activity_level, goal }) {
  if (!age || !height_cm || !weight_kg) return null;
  const ag = parseFloat(age), ht = parseFloat(height_cm), wt = parseFloat(weight_kg);
  if (!ag || !ht || !wt) return null;

  const bmr = gender === "male"
    ? 10 * wt + 6.25 * ht - 5 * ag + 5
    : 10 * wt + 6.25 * ht - 5 * ag - 161;

  const actOpt  = ACTIVITY_OPTIONS.find(a => a.value === activity_level) || ACTIVITY_OPTIONS[0];
  const goalOpt = GOAL_OPTIONS.find(g => g.value === goal) || GOAL_OPTIONS[0];

  const calories = Math.round(bmr * actOpt.multiplier + goalOpt.delta);
  const protein  = round5(2 * wt);
  const fat      = round5((calories * 0.25) / 9);
  const carbs    = round5((calories - protein * 4 - fat * 9) / 4);
  return { calories, protein, carbs, fat };
}

// ── Nav ──────────────────────────────────────────────────────────────────────
function Nav() {
  return (
    <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 32px", borderBottom: "1px solid #e8e4dc", background: "#fff", position: "sticky", top: 0, zIndex: 50 }}>
      <Link href="/" style={{ fontSize: 20, color: "#1e2d4a", lineHeight: 1, textDecoration: "none" }}>
        <span style={{ fontStyle: "italic", fontWeight: 300 }}>her</span>
        <span style={{ fontWeight: 800 }}>coach.</span>
        <span style={{ color: "#C9A84C", fontFamily: "'Great Vibes', cursive", fontWeight: 400, fontSize: 16, marginLeft: 1, verticalAlign: "middle" }}>Jess</span>
      </Link>
    </nav>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────
function ProgressBar({ step, total }) {
  const pct = Math.round((step / (total - 1)) * 100);
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 10, color: "#aaa", letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 700 }}>
          Step {step + 1} of {total}
        </div>
        <div style={{ fontSize: 10, color: "#C9A84C", letterSpacing: 1, fontFamily: "sans-serif", fontWeight: 700 }}>
          {pct}% complete
        </div>
      </div>
      <div style={{ height: 4, background: "#eee4d1", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #C9A84C, #d9b85f)", transition: "width 0.4s cubic-bezier(0.4,0,0.2,1)" }} />
      </div>
    </div>
  );
}

// ── "Your Plan So Far" chip row ───────────────────────────────────────────────
function PlanChips({ data }) {
  const chips = [];
  if (data.name)          chips.push({ icon: "✨",  text: data.name });
  if (data.gender)        chips.push({ icon: GENDER_OPTIONS.find(g => g.value === data.gender)?.emoji, text: GENDER_OPTIONS.find(g => g.value === data.gender)?.label });
  if (data.age)           chips.push({ icon: "🎂", text: `${data.age} yrs` });
  if (data.height_cm)     chips.push({ icon: "📏", text: `${data.height_cm}cm` });
  if (data.weight_kg)     chips.push({ icon: "⚖️", text: `${data.weight_kg}kg` });
  if (data.activity_level) {
    const a = ACTIVITY_OPTIONS.find(x => x.value === data.activity_level);
    chips.push({ icon: a?.emoji, text: a?.label });
  }
  if (data.goal) {
    const g = GOAL_OPTIONS.find(x => x.value === data.goal);
    chips.push({ icon: g?.emoji, text: g?.label });
  }
  if (data.timeline) {
    const t = TIMELINE_OPTIONS.find(x => x.value === data.timeline);
    chips.push({ icon: t?.emoji, text: t?.label });
  }
  if (!chips.length) return null;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: 24 }}>
      {chips.map((c, i) => (
        <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.35)", borderRadius: 20, padding: "5px 11px", fontSize: 11, color: "#9a7a28", fontFamily: "sans-serif", fontWeight: 600 }}>
          <span style={{ fontSize: 12 }}>{c.icon}</span>
          <span>{c.text}</span>
        </div>
      ))}
    </div>
  );
}

// ── Step Shell ───────────────────────────────────────────────────────────────
function StepShell({ icon, eyebrow, title, subtitle, children }) {
  return (
    <div className="step-in" style={{ textAlign: "center" }}>
      <div style={{ fontSize: 44, marginBottom: 16, lineHeight: 1 }}>{icon}</div>
      {eyebrow && (
        <div style={{ fontSize: 11, color: "#C9A84C", letterSpacing: 3, textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 700, marginBottom: 10 }}>
          {eyebrow}
        </div>
      )}
      <h1 style={{ fontSize: 26, fontWeight: 400, color: "#1a1a1a", margin: "0 0 12px", lineHeight: 1.25, fontFamily: "Georgia, serif" }}>{title}</h1>
      {subtitle && (
        <p style={{ color: "#999", fontSize: 14, margin: "0 0 28px", lineHeight: 1.7, fontFamily: "sans-serif", fontWeight: 300 }}>
          {subtitle}
        </p>
      )}
      {children}
    </div>
  );
}

// ── Clickable card ────────────────────────────────────────────────────────────
function OptionCard({ icon, label, sub, selected, onClick, accent = "#1e2d4a", full = false }) {
  return (
    <button type="button" onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        width: full ? "100%" : undefined,
        textAlign: "left",
        background: selected ? "rgba(30,45,74,0.04)" : "#fff",
        border: `1.5px solid ${selected ? accent : "#e8e4dc"}`,
        borderRadius: 10, padding: "16px 18px",
        cursor: "pointer",
        fontFamily: "sans-serif",
        transition: "all 0.18s ease",
        boxShadow: selected ? `0 2px 14px rgba(30,45,74,0.08)` : "none",
      }}>
      <div style={{ fontSize: 28, lineHeight: 1, flexShrink: 0, width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center", background: selected ? accent : "#fafaf8", borderRadius: 10, transition: "background 0.18s" }}>
        <span style={{ filter: selected ? "grayscale(0) brightness(1.1)" : "none" }}>{icon}</span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: selected ? accent : "#1a1a1a" }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{sub}</div>}
      </div>
      {selected && (
        <div style={{ width: 20, height: 20, borderRadius: "50%", background: accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>✓</div>
      )}
    </button>
  );
}

// ── Animated Macro Ring (for reveal slide) ─────────────────────────────────────
function MacroBigRing({ label, value, suffix, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ width: 86, height: 86, borderRadius: "50%", background: `conic-gradient(${color} 360deg, #f2eee5 0deg)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", position: "relative" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#1e2d4a", fontFamily: "Georgia, serif", lineHeight: 1 }}>{value}</div>
          {suffix && <div style={{ fontSize: 9, color: "#aaa", fontFamily: "sans-serif", letterSpacing: 0.5, marginTop: 2 }}>{suffix}</div>}
        </div>
      </div>
      <div style={{ fontSize: 10, color: color, textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "sans-serif", fontWeight: 700 }}>{label}</div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    name: "",
    gender: "",
    age: "",
    height_cm: "",
    weight_kg: "",
    activity_level: "",
    goal: "",
    timeline: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function update(patch) { setData(prev => ({ ...prev, ...patch })); }

  const macros   = useMemo(() => calcMacros(data), [data]);
  const goalInfo = GOAL_OPTIONS.find(g => g.value === data.goal);

  // Step definitions
  const steps = [
    // 0 — Welcome
    {
      render: () => (
        <StepShell
          icon="✨"
          eyebrow="Welcome to HerCoach.Jess"
          title="Let's build your personal macro blueprint"
          subtitle="In just a few minutes I'll calculate your perfect daily targets and create a plan tailored to your body, your life, and your goals."
        >
          <div style={{ background: "linear-gradient(135deg, #1e2d4a 0%, #2a3d5e 50%, #1e2d4a 100%)", borderRadius: 14, padding: "28px 24px", margin: "0 0 24px", color: "#fff", textAlign: "left" }}>
            <div style={{ fontSize: 11, color: "#C9A84C", letterSpacing: 2, textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 700, marginBottom: 14 }}>
              What you'll get
            </div>
            {[
              { i: "🎯", t: "Personalised calorie & macro targets",         s: "Based on your body, activity & goal" },
              { i: "🍽️", t: "AI meal generator that knows your numbers", s: "Every recipe hits your macros on the nose" },
              { i: "📈", t: "Progress, streaks & weekly planning",          s: "Stay on track without the guesswork" },
            ].map((x, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ fontSize: 22, flexShrink: 0, width: 28 }}>{x.i}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "sans-serif" }}>{x.t}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontFamily: "sans-serif", marginTop: 2 }}>{x.s}</div>
                </div>
              </div>
            ))}
          </div>
        </StepShell>
      ),
      canNext: () => true,
      cta: "Let's Begin →",
    },

    // 1 — Name
    {
      render: () => (
        <StepShell icon="👋" eyebrow="First — the basics" title="What should we call you?" subtitle="Totally optional — but it makes your dashboard feel like yours.">
          <input
            type="text"
            autoFocus
            placeholder="e.g. Jessica"
            value={data.name}
            onChange={e => update({ name: e.target.value })}
            style={{ width: "100%", background: "#fff", border: "1.5px solid #e8e4dc", borderRadius: 10, padding: "16px 18px", fontSize: 17, fontFamily: "Georgia, serif", color: "#1a1a1a", outline: "none", textAlign: "center", boxSizing: "border-box" }}
          />
        </StepShell>
      ),
      canNext: () => true,
      cta: data => data.name ? `Nice to meet you, ${data.name.split(" ")[0]} →` : "Skip this step →",
    },

    // 2 — Gender
    {
      render: () => (
        <StepShell icon="💫" eyebrow="Body Basics" title="Which should we use for your calculations?" subtitle="This helps us apply the right BMR formula for accurate macros.">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {GENDER_OPTIONS.map(o => (
              <OptionCard key={o.value} icon={o.emoji} label={o.label} selected={data.gender === o.value} onClick={() => update({ gender: o.value })} full />
            ))}
          </div>
        </StepShell>
      ),
      canNext: () => !!data.gender,
    },

    // 3 — Age
    {
      render: () => (
        <StepShell icon="🎂" eyebrow="A little more" title="How old are you?" subtitle="Age affects your metabolic rate — we'll factor this into your plan.">
          <div style={{ position: "relative", maxWidth: 200, margin: "0 auto" }}>
            <input
              type="number"
              min={14}
              max={90}
              placeholder="28"
              value={data.age}
              onChange={e => update({ age: e.target.value })}
              style={{ width: "100%", background: "#fff", border: "1.5px solid #e8e4dc", borderRadius: 12, padding: "24px 18px", fontSize: 42, fontFamily: "Georgia, serif", color: "#1e2d4a", fontWeight: 700, outline: "none", textAlign: "center", boxSizing: "border-box" }}
            />
            <div style={{ fontSize: 11, color: "#aaa", letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "sans-serif", marginTop: 10 }}>years old</div>
          </div>
        </StepShell>
      ),
      canNext: () => !!data.age && parseFloat(data.age) > 0,
    },

    // 4 — Height & Weight
    {
      render: () => (
        <StepShell icon="📐" eyebrow="Your Measurements" title="Height & weight" subtitle="These stay private — we use them only to calculate your targets.">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, maxWidth: 380, margin: "0 auto" }}>
            {[
              { lbl: "Height", unit: "cm", field: "height_cm", placeholder: "165", min: 100, max: 250 },
              { lbl: "Weight", unit: "kg", field: "weight_kg", placeholder: "65",  min: 30,  max: 300 },
            ].map(f => (
              <div key={f.field}>
                <label style={{ display: "block", fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "sans-serif", fontWeight: 700, marginBottom: 8 }}>{f.lbl}</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="number" min={f.min} max={f.max} placeholder={f.placeholder}
                    value={data[f.field]}
                    onChange={e => update({ [f.field]: e.target.value })}
                    style={{ width: "100%", background: "#fff", border: "1.5px solid #e8e4dc", borderRadius: 10, padding: "18px 48px 18px 18px", fontSize: 22, fontFamily: "Georgia, serif", color: "#1e2d4a", fontWeight: 700, outline: "none", boxSizing: "border-box" }}
                  />
                  <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#aaa", fontFamily: "sans-serif", letterSpacing: 0.5 }}>{f.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </StepShell>
      ),
      canNext: () => !!data.height_cm && !!data.weight_kg && parseFloat(data.height_cm) > 0 && parseFloat(data.weight_kg) > 0,
    },

    // 5 — Activity
    {
      render: () => (
        <StepShell icon="⚡" eyebrow="Your Lifestyle" title="How active are you day-to-day?" subtitle="Be honest — this swings your calorie target by 500+ either way.">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ACTIVITY_OPTIONS.map(o => (
              <OptionCard key={o.value} icon={o.emoji} label={o.label} sub={o.sub} selected={data.activity_level === o.value} onClick={() => update({ activity_level: o.value })} full />
            ))}
          </div>
        </StepShell>
      ),
      canNext: () => !!data.activity_level,
    },

    // 6 — Goal
    {
      render: () => (
        <StepShell icon="🎯" eyebrow="Your Goal" title="What are you working towards?" subtitle="Pick the one that fires you up most right now.">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {GOAL_OPTIONS.map(o => (
              <OptionCard key={o.value} icon={o.emoji} label={o.label} sub={o.sub} selected={data.goal === o.value} onClick={() => update({ goal: o.value })} accent={o.color} full />
            ))}
          </div>
          {goalInfo && (
            <div style={{ marginTop: 18, background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 10, padding: "14px 18px", textAlign: "left" }}>
              <div style={{ fontSize: 10, color: "#C9A84C", letterSpacing: 2, textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 700, marginBottom: 5 }}>Your goal summary</div>
              <div style={{ fontSize: 13, color: "#1e2d4a", fontFamily: "sans-serif", lineHeight: 1.6 }}>{goalInfo.summary}</div>
            </div>
          )}
        </StepShell>
      ),
      canNext: () => !!data.goal,
    },

    // 7 — Timeline
    {
      render: () => (
        <StepShell icon="📅" eyebrow="Your Timeline" title="How long are you committing for?" subtitle="No pressure — you can always extend. We'll tailor your pacing to match.">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {TIMELINE_OPTIONS.map(o => (
              <OptionCard key={o.value} icon={o.emoji} label={o.label} sub={o.sub} selected={data.timeline === o.value} onClick={() => update({ timeline: o.value })} full />
            ))}
          </div>
        </StepShell>
      ),
      canNext: () => !!data.timeline,
    },

    // 8 — Reveal
    {
      render: () => (
        <StepShell icon="✦" eyebrow={`${data.name ? data.name.split(" ")[0] + ", " : ""}Here's Your Plan`} title="Your personalised macro blueprint" subtitle="These are your daily targets — built on your body, your goal & your timeline.">
          {macros && goalInfo && (
            <>
              {/* Big animated rings */}
              <div style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 14, padding: "28px 20px", marginBottom: 16, boxShadow: "0 4px 18px rgba(30,45,74,0.06)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                  <MacroBigRing label="Calories" value={macros.calories} suffix="kcal" color="#1e2d4a" />
                  <MacroBigRing label="Protein"  value={macros.protein}   suffix="g"    color="#C9A84C" />
                  <MacroBigRing label="Carbs"    value={macros.carbs}     suffix="g"    color="#2d7a4f" />
                  <MacroBigRing label="Fat"      value={macros.fat}       suffix="g"    color="#d97a5c" />
                </div>
              </div>

              {/* Goal summary card */}
              <div style={{ background: `linear-gradient(135deg, ${goalInfo.color}, ${goalInfo.color}dd)`, color: "#fff", borderRadius: 14, padding: "22px 20px", marginBottom: 16, textAlign: "left" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <div style={{ fontSize: 30 }}>{goalInfo.emoji}</div>
                  <div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", letterSpacing: 2, textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 700 }}>Your mission</div>
                    <div style={{ fontSize: 17, fontWeight: 700, fontFamily: "Georgia, serif" }}>{goalInfo.label}</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.7, fontFamily: "sans-serif", color: "rgba(255,255,255,0.92)" }}>
                  {goalInfo.summary}
                </div>
              </div>

              {/* Why these numbers */}
              <div style={{ background: "#fafaf8", border: "1px solid #e8e4dc", borderRadius: 10, padding: "16px 18px", marginBottom: 8, textAlign: "left" }}>
                <div style={{ fontSize: 10, color: "#C9A84C", letterSpacing: 2, textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 700, marginBottom: 8 }}>Why these numbers?</div>
                <div style={{ fontSize: 12, color: "#555", fontFamily: "sans-serif", lineHeight: 1.7 }}>
                  We calculated your BMR using the Mifflin–St Jeor formula, multiplied by your activity level
                  {data.activity_level && <>  (<b>{ACTIVITY_OPTIONS.find(a => a.value === data.activity_level)?.label.toLowerCase()}</b>)</>},
                  then adjusted for your goal
                  {goalInfo.delta !== 0 && <> (<b>{goalInfo.delta > 0 ? "+" : ""}{goalInfo.delta}kcal</b>)</>}.
                  Protein is set at 2g per kg bodyweight, fat at 25% of calories, and the rest as carbs.
                </div>
              </div>
            </>
          )}
        </StepShell>
      ),
      canNext: () => !!macros,
      cta: "Save & Enter My App →",
      isLast: true,
    },
  ];

  const currentStep = steps[step];
  const isLast = !!currentStep.isLast;
  const ctaLabel = typeof currentStep.cta === "function" ? currentStep.cta(data) : (currentStep.cta || "Continue →");

  async function handleFinish() {
    setError(null);
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user && macros) {
        const { error: err } = await supabase.from("profiles").upsert({
          user_id: user.id,
          name: data.name || null,
          gender: data.gender,
          age: parseFloat(data.age),
          weight_kg: parseFloat(data.weight_kg),
          height_cm: parseFloat(data.height_cm),
          activity_level: data.activity_level,
          goal: data.goal,
          calories: macros.calories,
          protein: macros.protein,
          carbs: macros.carbs,
          fat: macros.fat,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
        if (err) console.error("Profile save error:", err.message);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setSaving(false);
      router.push("/generator");
    }
  }

  function handleNext() {
    if (isLast) { handleFinish(); return; }
    if (!currentStep.canNext()) return;
    setStep(s => Math.min(s + 1, steps.length - 1));
  }
  function handleBack() { setStep(s => Math.max(s - 1, 0)); }

  return (
    <div style={{ minHeight: "100vh", background: "#fafaf8" }}>
      <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; }
        @keyframes stepIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .step-in { animation: stepIn 0.35s cubic-bezier(0.4,0,0.2,1); }
        .cta-primary {
          width: 100%; padding: 16px; border: none; border-radius: 8px;
          background: #1e2d4a; color: #fff; font-size: 13px; font-weight: 700;
          letter-spacing: 2px; text-transform: uppercase; font-family: sans-serif;
          cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 12px rgba(30,45,74,0.18);
        }
        .cta-primary:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }
        .cta-primary:hover:not(:disabled) { background: #162238; transform: translateY(-1px); box-shadow: 0 4px 18px rgba(30,45,74,0.28); }
        .cta-back {
          background: none; border: none; color: #888; font-size: 12px;
          cursor: pointer; fontFamily: sans-serif; padding: 10px 16px;
          letter-spacing: 1; text-transform: uppercase; font-weight: 600;
        }
        .cta-back:hover { color: #1e2d4a; }
        @media (max-width: 600px) {
          .ob-nav   { padding: 16px 20px !important; }
          .ob-card  { padding: 32px 22px !important; }
          .ob-wrap  { padding: 24px 16px 80px !important; }
        }
      `}</style>

      <Nav />

      <div className="ob-wrap" style={{ maxWidth: 560, margin: "0 auto", padding: "36px 20px 80px" }}>

        <ProgressBar step={step} total={steps.length} />
        <PlanChips data={data} />

        <div className="ob-card" style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 14, padding: "40px 36px", boxShadow: "0 6px 28px rgba(0,0,0,0.04)", minHeight: 340 }}>
          {currentStep.render()}
        </div>

        {/* Navigation */}
        <div style={{ marginTop: 20 }}>
          <button className="cta-primary" disabled={!currentStep.canNext() || saving} onClick={handleNext}>
            {saving ? "Saving..." : ctaLabel}
          </button>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
            {step > 0
              ? <button className="cta-back" onClick={handleBack}>← Back</button>
              : <span />
            }
            {step === 0 && (
              <Link href="/generator" style={{ fontSize: 12, color: "#aaa", fontFamily: "sans-serif", textDecoration: "none", padding: "10px 0" }}>
                Skip — I&apos;ll do this later
              </Link>
            )}
          </div>
        </div>

        {error && (
          <div style={{ marginTop: 16, background: "rgba(220,53,53,0.06)", border: "1px solid rgba(220,53,53,0.25)", borderRadius: 4, padding: "11px 14px", color: "#c0392b", fontSize: 13, fontFamily: "sans-serif" }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
