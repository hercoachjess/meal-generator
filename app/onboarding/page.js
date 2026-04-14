"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

const ACTIVITY_OPTIONS = [
  { value: "sedentary", label: "Sedentary — little/no exercise", multiplier: 1.2 },
  { value: "lightly_active", label: "Lightly Active — 1-3 days/week", multiplier: 1.375 },
  { value: "moderately_active", label: "Moderately Active — 3-5 days/week", multiplier: 1.55 },
  { value: "very_active", label: "Very Active — 6-7 days/week", multiplier: 1.725 },
  { value: "extra_active", label: "Extra Active — physical job + daily exercise", multiplier: 1.9 },
];

const GOAL_OPTIONS = [
  { value: "lose", label: "Lose Weight — gentle deficit", delta: -400 },
  { value: "maintain", label: "Maintain Weight", delta: 0 },
  { value: "build", label: "Build Muscle — lean bulk", delta: 300 },
];

function round5(n) {
  return Math.round(n / 5) * 5;
}

function calcMacros({ gender, age, height_cm, weight_kg, activity_level, goal }) {
  if (!age || !height_cm || !weight_kg) return null;

  const ag = parseFloat(age);
  const ht = parseFloat(height_cm);
  const wt = parseFloat(weight_kg);
  if (!ag || !ht || !wt) return null;

  const bmr =
    gender === "male"
      ? 10 * wt + 6.25 * ht - 5 * ag + 5
      : 10 * wt + 6.25 * ht - 5 * ag - 161;

  const actOpt = ACTIVITY_OPTIONS.find(a => a.value === activity_level) || ACTIVITY_OPTIONS[0];
  const goalOpt = GOAL_OPTIONS.find(g => g.value === goal) || GOAL_OPTIONS[0];

  const calories = Math.round(bmr * actOpt.multiplier + goalOpt.delta);
  const protein = round5(2 * wt);
  const fat = round5((calories * 0.25) / 9);
  const proteinCals = protein * 4;
  const fatCals = fat * 9;
  const carbs = round5((calories - proteinCals - fatCals) / 4);

  return { calories, protein, carbs, fat };
}

function Nav() {
  return (
    <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 48px", borderBottom: "1px solid #e8e4dc", background: "#fff", position: "sticky", top: 0, zIndex: 50 }}>
      <Link href="/" style={{ fontSize: 20, color: "#1e2d4a", lineHeight: 1, textDecoration: "none" }}>
        <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap" rel="stylesheet" />
        <span style={{ fontStyle: "italic", fontWeight: 300 }}>her</span>
        <span style={{ fontWeight: 800 }}>coach.</span>
        <span style={{ color: "#C9A84C", fontFamily: "'Great Vibes', cursive", fontWeight: 400, fontSize: 16, marginLeft: 1, verticalAlign: "middle" }}>Jess</span>
      </Link>
    </nav>
  );
}

function StatBox({ label, value }) {
  return (
    <div style={{ flex: 1, textAlign: "center", padding: "14px 8px", background: "#fafaf8", borderRadius: 6, border: "1px solid #e8e4dc" }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#1e2d4a", fontFamily: "Georgia, serif", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: "#C9A84C", textTransform: "uppercase", letterSpacing: 1.5, marginTop: 5, fontFamily: "sans-serif", fontWeight: 700 }}>{label}</div>
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [gender, setGender] = useState("female");
  const [age, setAge] = useState("");
  const [height_cm, setHeightCm] = useState("");
  const [weight_kg, setWeightKg] = useState("");
  const [activity_level, setActivityLevel] = useState("moderately_active");
  const [goal, setGoal] = useState("maintain");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const macros = calcMacros({ gender, age, height_cm, weight_kg, activity_level, goal });
  const showPreview = !!(age && height_cm && weight_kg && parseFloat(age) && parseFloat(height_cm) && parseFloat(weight_kg));

  async function handleSave(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user && macros) {
        const { error: upsertError } = await supabase.from("profiles").upsert({
          user_id: user.id,
          name: name || null,
          gender,
          age: parseFloat(age),
          weight_kg: parseFloat(weight_kg),
          height_cm: parseFloat(height_cm),
          activity_level,
          goal,
          calories: macros.calories,
          protein: macros.protein,
          carbs: macros.carbs,
          fat: macros.fat,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

        if (upsertError) {
          console.error("Profile save error:", upsertError.message);
        }
      }
    } catch (err) {
      console.error("Unexpected error saving profile:", err);
    } finally {
      setLoading(false);
      router.push("/generator");
    }
  }

  const labelStyle = {
    display: "block",
    fontSize: 11,
    fontWeight: 700,
    color: "#888",
    marginBottom: 7,
    letterSpacing: 1,
    textTransform: "uppercase",
    fontFamily: "sans-serif",
  };

  const inputStyle = {
    width: "100%",
    background: "#fff",
    border: "1px solid #e8e4dc",
    borderRadius: 4,
    padding: "13px 16px",
    color: "#1a1a1a",
    fontSize: 14,
    fontFamily: "sans-serif",
    outline: "none",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fafaf8", fontFamily: "Georgia, serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; }
        .ob-input {
          width: 100%; background: #fff; border: 1px solid #e8e4dc; border-radius: 4px;
          padding: 13px 16px; color: #1a1a1a; font-size: 14px; font-family: sans-serif;
          outline: none; transition: border-color 0.2s; appearance: none; -webkit-appearance: none;
        }
        .ob-input:focus { border-color: #1e2d4a; }
        .ob-input::placeholder { color: #bbb; }
        .btn-save {
          width: 100%; padding: 15px; border: none; border-radius: 4px;
          background: #1e2d4a; color: #fff; font-size: 13px; font-weight: 700;
          letter-spacing: 2px; text-transform: uppercase; font-family: sans-serif;
          cursor: pointer; transition: opacity 0.2s;
        }
        .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-save:hover:not(:disabled) { opacity: 0.88; }
        @media (max-width: 600px) {
          .ob-nav { padding: 16px 20px !important; }
          .ob-card { padding: 32px 24px !important; }
        }
      `}</style>

      <Nav />

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "48px 20px 80px" }}>

        {/* Progress indicator */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 36 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1e2d4a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, fontFamily: "sans-serif" }}>1</div>
          <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 1, fontFamily: "sans-serif" }}>Step 1 of 1</div>
        </div>

        {/* Main card */}
        <div className="ob-card" style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 8, padding: "44px 40px", boxShadow: "0 4px 24px rgba(0,0,0,0.05)" }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ fontSize: 11, color: "#C9A84C", letterSpacing: 3, textTransform: "uppercase", marginBottom: 12, fontFamily: "sans-serif", fontWeight: 700 }}>
              Welcome to HerCoach.Jess
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 400, color: "#1a1a1a", margin: "0 0 14px", lineHeight: 1.2 }}>
              Let&apos;s work out your macros
            </h1>
            <p style={{ color: "#999", fontSize: 14, margin: 0, lineHeight: 1.8, fontFamily: "sans-serif", fontWeight: 300 }}>
              We&apos;ll use the Mifflin-St Jeor formula to calculate your daily calorie and macro targets — personalised to your body and goals.
            </p>
          </div>

          <form onSubmit={handleSave}>

            {/* Name */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Name <span style={{ fontWeight: 400, color: "#bbb" }}>(optional)</span></label>
              <input
                type="text"
                className="ob-input"
                placeholder="e.g. Jessica"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            {/* Gender */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Gender</label>
              <select
                className="ob-input"
                value={gender}
                onChange={e => setGender(e.target.value)}
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </div>

            {/* Age / Height / Weight row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>Age</label>
                <input
                  type="number"
                  className="ob-input"
                  placeholder="e.g. 28"
                  min={10}
                  max={120}
                  required
                  value={age}
                  onChange={e => setAge(e.target.value)}
                />
              </div>
              <div>
                <label style={labelStyle}>Height (cm)</label>
                <input
                  type="number"
                  className="ob-input"
                  placeholder="e.g. 165"
                  min={100}
                  max={250}
                  required
                  value={height_cm}
                  onChange={e => setHeightCm(e.target.value)}
                />
              </div>
              <div>
                <label style={labelStyle}>Weight (kg)</label>
                <input
                  type="number"
                  className="ob-input"
                  placeholder="e.g. 65"
                  min={30}
                  max={300}
                  required
                  value={weight_kg}
                  onChange={e => setWeightKg(e.target.value)}
                />
              </div>
            </div>

            {/* Activity Level */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Activity Level</label>
              <select
                className="ob-input"
                value={activity_level}
                onChange={e => setActivityLevel(e.target.value)}
              >
                {ACTIVITY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Goal */}
            <div style={{ marginBottom: 28 }}>
              <label style={labelStyle}>Goal</label>
              <select
                className="ob-input"
                value={goal}
                onChange={e => setGoal(e.target.value)}
              >
                {GOAL_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Live preview */}
            {showPreview && macros && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#888", letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "sans-serif", marginBottom: 14, textAlign: "center" }}>
                  Your Daily Targets
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <StatBox label="Calories" value={macros.calories} />
                  <StatBox label="Protein" value={`${macros.protein}g`} />
                  <StatBox label="Carbs" value={`${macros.carbs}g`} />
                  <StatBox label="Fat" value={`${macros.fat}g`} />
                </div>
              </div>
            )}

            {error && (
              <div style={{ background: "rgba(220,53,53,0.06)", border: "1px solid rgba(220,53,53,0.25)", borderRadius: 4, padding: "11px 14px", marginBottom: 16, color: "#c0392b", fontSize: 13, fontFamily: "sans-serif" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-save">
              {loading ? "Saving..." : "Save & Continue"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: 20 }}>
            <Link href="/generator" style={{ fontSize: 13, color: "#aaa", fontFamily: "sans-serif", textDecoration: "none" }}>
              Skip for now — I&apos;ll set this up in my profile later
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
