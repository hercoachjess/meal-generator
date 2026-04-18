"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import MacroCalculator from "../_components/MacroCalculator";

const STORAGE_KEY = "macroCalcProgress_v1";

function Nav() {
  return (
    <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 32px", borderBottom: "1px solid #e8e4dc", background: "#fff", position: "sticky", top: 0, zIndex: 50 }}>
      <Link href="/" style={{ fontSize: 20, color: "#1e2d4a", lineHeight: 1, textDecoration: "none" }}>
        <span style={{ fontStyle: "italic", fontWeight: 300 }}>her</span>
        <span style={{ fontWeight: 800 }}>coach.</span>
        <span style={{ color: "#C9A84C", fontFamily: "'Great Vibes', cursive", fontWeight: 400, fontSize: 16, marginLeft: 1, verticalAlign: "middle" }}>Jess</span>
      </Link>
      <Link href="/generator" style={{ fontSize: 12, color: "#aaa", fontFamily: "sans-serif", textDecoration: "none" }}>
        Skip →
      </Link>
    </nav>
  );
}

function OnboardingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isUpdate = searchParams.get("update") === "1";

  const [user, setUser] = useState(null);
  const [initialData, setInitialData] = useState(null);
  const [ready, setReady] = useState(false);

  // Load user and any cached calc data
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = createClient();
      const { data: { user: u } } = await supabase.auth.getUser();
      if (cancelled) return;
      setUser(u);

      // Check landing-page localStorage — if present, pre-fill calculator
      let cached = null;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.data) cached = parsed.data;
        }
      } catch { /* ignore */ }

      // If updating, prefer their saved Supabase profile values
      if (isUpdate && u) {
        const { data } = await supabase.from("profiles").select("name, gender, age, height_cm, weight_kg, activity_level, goal").eq("user_id", u.id).single();
        if (data) {
          cached = {
            name: data.name || cached?.name || "",
            gender: data.gender || cached?.gender || "",
            age: data.age?.toString() || cached?.age || "",
            height_cm: data.height_cm?.toString() || cached?.height_cm || "",
            weight_kg: data.weight_kg?.toString() || cached?.weight_kg || "",
            activity_level: data.activity_level || cached?.activity_level || "",
            goal: data.goal || cached?.goal || "",
            timeline: cached?.timeline || "",
          };
        }
      }

      if (cached) setInitialData(cached);
      setReady(true);
    }
    load();
    return () => { cancelled = true; };
  }, [isUpdate]);

  async function handleComplete(data, macros) {
    if (!user || !macros) { router.push("/generator"); return; }
    const supabase = createClient();
    const { error } = await supabase.from("profiles").upsert({
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
    if (error) {
      console.error("Profile save error:", error.message);
      throw error;
    }
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    router.push(isUpdate ? "/profile?updated=1" : "/generator");
  }

  if (!ready) {
    return (
      <div style={{ minHeight: "100vh", background: "#fafaf8", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", color: "#888", fontSize: 14 }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#fafaf8" }}>
      <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap" rel="stylesheet" />
      <Nav />
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "36px 20px 80px" }}>
        {isUpdate && (
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: "#C9A84C", letterSpacing: 3, textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 700, marginBottom: 8 }}>Update Your Blueprint</div>
            <div style={{ fontSize: 16, color: "#1e2d4a", fontFamily: "Georgia, serif" }}>Changes to your stats or goal? Let&apos;s recalculate your macros.</div>
          </div>
        )}
        <MacroCalculator
          mode={isUpdate ? "profile" : "onboarding"}
          user={user}
          initialData={initialData}
          onComplete={handleComplete}
          hideResume={isUpdate}
        />
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#fafaf8" }} />}>
      <OnboardingInner />
    </Suspense>
  );
}
