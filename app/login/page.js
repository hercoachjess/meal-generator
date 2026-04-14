"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    const supabase = createClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        router.push("/generator");
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
        .tab-btn.active {
          color: #1e2d4a;
          border-bottom-color: #1e2d4a;
        }
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
        }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .submit-btn:hover:not(:disabled) { opacity: 0.88; }
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 24px" }}>
        <div style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 8, padding: "52px 48px", boxShadow: "0 4px 40px rgba(0,0,0,0.06)", width: "100%", maxWidth: 420 }}>

          {/* Logo mark */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 22, color: "#1e2d4a", lineHeight: 1, marginBottom: 10 }}>
              <span style={{ fontStyle: "italic", fontWeight: 300 }}>her</span>
              <span style={{ fontWeight: 800 }}>coach.</span>
              <span style={{ color: "#C9A84C", fontFamily: "'Great Vibes', cursive", fontWeight: 400, fontSize: 18, marginLeft: 1, verticalAlign: "middle" }}>Jess</span>
            </div>
            <div style={{ fontSize: 11, color: "#C9A84C", letterSpacing: 3, textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 700 }}>
              AI-Powered Nutrition
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", marginBottom: 32, borderBottom: "1px solid #e8e4dc" }}>
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
            <div style={{ marginBottom: 24 }}>
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

            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>

          {mode === "signup" && (
            <p style={{ color: "#bbb", fontSize: 12, marginTop: 20, lineHeight: 1.7, textAlign: "center", fontFamily: "sans-serif" }}>
              You&apos;ll receive a confirmation email before your account is activated.
            </p>
          )}

          <div style={{ textAlign: "center", marginTop: 28 }}>
            <Link href="/" style={{ fontSize: 12, color: "#aaa", fontFamily: "sans-serif", textDecoration: "none" }}>
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
