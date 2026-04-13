"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function LoginPage() {
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        router.push("/");
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Account created! Check your email to confirm your address, then sign in.");
        setMode("signin");
      }
    }

    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at top left,#0f0c29,#302b63,#24243e)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", borderRadius: 24, padding: "48px 36px", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 30px 80px rgba(0,0,0,0.4)", textAlign: "center", maxWidth: 380, width: "100%" }}>
        <div style={{ fontSize: 14, color: "#ff6b6b", letterSpacing: 2, textTransform: "uppercase", fontWeight: 800, marginBottom: 8, fontFamily: "Georgia, serif" }}>HerCoachJess</div>
        <h1 style={{ fontSize: 26, fontFamily: "Georgia, serif", color: "#fff", margin: "0 0 6px", lineHeight: 1.2 }}>
          Macro Meal<br /><span style={{ color: "#4ecdc4" }}>Generator</span>
        </h1>
        <p style={{ color: "#555", fontSize: 12, margin: "0 0 28px" }}>
          {mode === "signin" ? "Sign in to your account" : "Create your account"}
        </p>

        {/* Tab toggle */}
        <div style={{ display: "flex", marginBottom: 24, background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 4 }}>
          <button
            onClick={() => { setMode("signin"); setError(null); setMessage(null); }}
            style={{ flex: 1, padding: "9px 0", borderRadius: 9, border: "none", background: mode === "signin" ? "rgba(78,205,196,0.2)" : "transparent", color: mode === "signin" ? "#4ecdc4" : "#666", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode("signup"); setError(null); setMessage(null); }}
            style={{ flex: 1, padding: "9px 0", borderRadius: 9, border: "none", background: mode === "signup" ? "rgba(78,205,196,0.2)" : "transparent", color: mode === "signup" ? "#4ecdc4" : "#666", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ textAlign: "left" }}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#aaa", marginBottom: 6 }}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: "12px 14px", color: "#fff", fontSize: 14, boxSizing: "border-box" }}
            />
          </div>
          <div style={{ marginBottom: 22 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#aaa", marginBottom: 6 }}>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: "12px 14px", color: "#fff", fontSize: 14, boxSizing: "border-box" }}
            />
          </div>

          {error && (
            <div style={{ background: "#ff6b6b22", border: "1px solid #ff6b6b44", borderRadius: 10, padding: "10px 14px", marginBottom: 14, color: "#ff6b6b", fontSize: 13 }}>
              {error}
            </div>
          )}
          {message && (
            <div style={{ background: "#4ecdc422", border: "1px solid #4ecdc444", borderRadius: 10, padding: "10px 14px", marginBottom: 14, color: "#4ecdc4", fontSize: 13 }}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", background: loading ? "#333" : "linear-gradient(135deg,#4ecdc4,#2bb5ad)", color: loading ? "#666" : "#000", fontSize: 15, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", boxShadow: loading ? "none" : "0 8px 30px rgba(78,205,196,0.3)" }}
          >
            {loading ? "..." : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        {mode === "signup" && (
          <p style={{ color: "#444", fontSize: 11, marginTop: 20, lineHeight: 1.6 }}>
            You&apos;ll receive a confirmation email before your account is activated.
          </p>
        )}
      </div>
    </div>
  );
}
