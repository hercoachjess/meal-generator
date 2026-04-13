"use client";
import { signIn, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [status, router]);

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at top left,#0f0c29,#302b63,#24243e)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#4ecdc4", fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at top left,#0f0c29,#302b63,#24243e)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", borderRadius: 24, padding: "48px 36px", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 30px 80px rgba(0,0,0,0.4)", textAlign: "center", maxWidth: 380, width: "100%" }}>
        <div style={{ fontSize: 14, color: "#ff6b6b", letterSpacing: 2, textTransform: "uppercase", fontWeight: 800, marginBottom: 8, fontFamily: "Georgia, serif" }}>HerCoachJess</div>
        <h1 style={{ fontSize: 28, fontFamily: "Georgia, serif", color: "#fff", margin: "0 0 8px", lineHeight: 1.2 }}>
          Macro Meal<br /><span style={{ color: "#4ecdc4" }}>Generator</span>
        </h1>
        <p style={{ color: "#666", fontSize: 13, margin: "0 0 36px" }}>
          Sign in to save your meal plans and access them from any device.
        </p>
        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "14px 20px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "background 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.14)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
        <p style={{ color: "#444", fontSize: 11, marginTop: 24, lineHeight: 1.5 }}>
          By signing in you agree to save your meal data linked to your Google account.
        </p>
      </div>
    </div>
  );
}
