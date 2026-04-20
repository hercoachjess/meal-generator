"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client";

export const dynamic = "force-dynamic";

const STORAGE_KEY = "macroCalcProgress_v1";

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromCalc = searchParams.get("from") === "calc";

  const [mode, setMode] = useState(fromCalc ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [blueprint, setBlueprint] = useState(null);

  // Load saved calc so we can preview it
  useEffect(() => {
    if (!fromCalc) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.macros) setBlueprint({ data: parsed.data, macros: parsed.macros });
    } catch { /* ignore */ }
  }, [fromCalc]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    const supabase = createClient();

    if (mode === "signin") {
      const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        const user = signInData?.user;
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("onboarding_completed")
            .eq("user_id", user.id)
            .single();
          if (!profile || !profile.onboarding_completed || fromCalc) {
            router.push("/onboarding");
          } else {
            router.push("/generator");
          }
        } else {
          router.push("/generator");
        }
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Account created! Check your email to confirm your address, then sign in here to unlock your blueprint.");
        setMode("signin");
      }
    }

    setLoading(false);
  }

  const firstName = blueprint?.data?.name ? blueprint.data.name.split(" ")[0] : null;

  return (
    <div style={{ fontFamily: "'Georgia', serif", minHeight: "100vh", background: "#fafaf8", color: "#1a1a1a" }}>
      <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap" rel="stylesheet" />

      <style>{`
        * { box-sizing: border-box; }
        .login-input {
          width: 100%;
          background: #fff;
          border: 1px solid #e8e4dc;
          border-radius: 4px;
          padding: 13px 16px;
          color: #1a1a1a;
          font-size: 14px;
          font-family: sans-serif;
          outline: none;
          transition: border-color 0.2s;
        }
        .login-input:focus { border-color: #1e2d4a; }
        .login-input::placeholder { color: #bbb; }
        .tab-btn {
          flex: 1;
          padding: 10px 0;
          border: none;
          background: transparent;
          font-size: 13px;
          font-family: sans-serif;
          font-weight: 600;
          cursor: pointer;
          letter-spacing: 0.5px;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
          color: #aaa;
        }
        .tab-btn.active { color: #1e2d4a; border-bottom-color: #1e2d4a; }
        .submit-btn {
          width: 100%;
          padding: 15px;
          border: none;
          border-radius: 4px;
          background: #1e2d4a;
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          font-family: sans-serif;
          cursor: pointer;
          transition: opacity 0.2s;
          margin-top: 8px;
          box-shadow: 0 3px 14px rgba(30,45,74,0.22);
        }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
        .submit-btn:hover:not(:disabled) { opacity: 0.88; }
        .submit-btn.gold { background: #C9A84C; color: #1a1a1a; box-shadow: 0 4px 16px rgba(201,168,76,0.4); }
        .submit-btn.gold:hover:not(:disabled) { background: #b89640; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.5s cubic-bezier(0.4,0,0.2,1); }
      `}</style>

      {/* NAV */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 48px", borderBottom: "1px solid #e8e4dc", background: "#fff" }}>
        <Link href="/" style={{ fontSize: 20, color: "#1e2d4a", lineHeight: 1, textDecoration: "none" }}>
          <span style={{ fontStyle: "italic", fontWeight: 300 }}>her</span>
          <span style={{ fontWeight: 800 }}>coach.</span>
          <span style={{ color: "#C9A84C", fontFamily: "'Great Vibes', cursive", fontWeight: 400, fontSize: 16, marginLeft: 1, verticalAlign: "middle" }}>Jess</span>
        </Link>
      </nav>

      {/* LOGIN CARD */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "56px 24px 80px" }}>
        <div style={{ width: "100%", maxWidth: 460 }}>

          {/* Welcome banner — only shown if arriving from calc */}
          {fromCalc && blueprint && (
            <div className="fade-in" style={{ background: "linear-gradient(135deg, #1e2d4a 0%, #2a3d5e 50%, #1e2d4a 100%)", color: "#fff", borderRadius: 12, padding: "22px 24px", marginBottom: 20, boxShadow: "0 8px 30px rgba(30,45,74,0.18)" }}>
              <div style={{ fontSize: 11, color: "#C9A84C", letterSpacing: 3, textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 700, marginBottom: 8 }}>
                ✦ Your Blueprint is Ready
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "Georgia, serif", marginBottom: 10 }}>
                {firstName ? `Nice work, ${firstName}!` : "Nice work!"} Let&apos;s save your plan.
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.7, fontFamily: "sans-serif", color: "rgba(255,255,255,0.78)", marginBottom: 14 }}>
                Create your account below and we&apos;ll carry your macros straight into the app — no need to fill out anything again.
              </div>
              {/* Mini macro preview */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, padding: "12px 12px", background: "rgba(255,255,255,0.07)", borderRadius: 8 }}>
                {[
                  { l: "Calories", v: blueprint.macros.calories, s: "kcal" },
                  { l: "Protein",  v: blueprint.macros.protein,  s: "g" },
                  { l: "Carbs",    v: blueprint.macros.carbs,    s: "g" },
                  { l: "Fat",      v: blueprint.macros.fat,      s: "g" },
                ].map(m => (
                  <div key={m.l} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", fontFamily: "Georgia, serif", lineHeight: 1 }}>{m.v}</div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", fontFamily: "sans-serif", marginTop: 3 }}>{m.s}</div>
                    <div style={{ fontSize: 9, color: "#C9A84C", textTransform: "uppercase", letterSpacing: 1, fontFamily: "sans-serif", fontWeight: 700, marginTop: 4 }}>{m.l}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 8, padding: "44px 40px", boxShadow: "0 4px 40px rgba(0,0,0,0.06)" }}>

            {/* Logo mark */}
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ fontSize: 22, color: "#1e2d4a", lineHeight: 1, marginBottom: 8 }}>
                <span style={{ fontStyle: "italic", fontWeight: 300 }}>her</span>
                <span style={{ fontWeight: 800 }}>coach.</span>
                <span style={{ color: "#C9A84C", fontFamily: "'Great Vibes', cursive", fontWeight: 400, fontSize: 18, marginLeft: 1, verticalAlign: "middle" }}>Jess</span>
              </div>
              <div style={{ fontSize: 11, color: "#C9A84C", letterSpacing: 3, textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 700 }}>
                {fromCalc ? "Final Step — Unlock the App" : "AI-Powered Nutrition"}
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", marginBottom: 28, borderBottom: "1px solid #e8e4dc" }}>
              <button className={`tab-btn${mode === "signin" ? " active" : ""}`} onClick={() => { setMode("signin"); setError(null); setMessage(null); }}>
                Sign In
              </button>
              <button className={`tab-btn${mode === "signup" ? " active" : ""}`} onClick={() => { setMode("signup"); setError(null); setMessage(null); }}>
                Create Account
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 7, letterSpacing: 1, textTransform: "uppercase", fontFamily: "sans-serif" }}>Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="login-input"
                />
              </div>
              <div style={{ marginBottom: 22 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 7, letterSpacing: 1, textTransform: "uppercase", fontFamily: "sans-serif" }}>Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="login-input"
                />
              </div>

              {error && (
                <div style={{ background: "rgba(220,53,53,0.06)", border: "1px solid rgba(220,53,53,0.25)", borderRadius: 4, padding: "11px 14px", marginBottom: 16, color: "#c0392b", fontSize: 13, fontFamily: "sans-serif" }}>
                  {error}
                </div>
              )}
              {message && (
                <div style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.35)", borderRadius: 4, padding: "11px 14px", marginBottom: 16, color: "#9a7a28", fontSize: 13, fontFamily: "sans-serif" }}>
                  {message}
                </div>
              )}

              <button type="submit" disabled={loading} className={`submit-btn${fromCalc && mode === "signup" ? " gold" : ""}`}>
                {loading ? "Please wait..." : mode === "signin" ? "Sign In" : fromCalc ? "Unlock My Plan" : "Create Account"}
              </button>
            </form>

            {mode === "signup" && (
              <p style={{ color: "#bbb", fontSize: 12, marginTop: 18, lineHeight: 1.7, textAlign: "center", fontFamily: "sans-serif" }}>
                You&apos;ll receive a confirmation email before your account is activated.
              </p>
            )}

            {/* Trust strip on signup to reinforce */}
            {mode === "signup" && (
              <div style={{ display: "flex", justifyContent: "center", gap: 18, flexWrap: "wrap", fontSize: 11, color: "#999", fontFamily: "sans-serif", marginTop: 18 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ color: "#2d7a4f", fontWeight: 800 }}>✓</span> Cancel anytime</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ color: "#2d7a4f", fontWeight: 800 }}>✓</span> No spam</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ color: "#2d7a4f", fontWeight: 800 }}>✓</span> Secure</span>
              </div>
            )}

            <div style={{ textAlign: "center", marginTop: 24 }}>
              <Link href="/" style={{ fontSize: 12, color: "#aaa", fontFamily: "sans-serif", textDecoration: "none" }}>
                ← Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#fafaf8" }} />}>
      <LoginInner />
    </Suspense>
  );
}
