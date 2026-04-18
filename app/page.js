"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import MacroCalculator from "./_components/MacroCalculator";

export default function LandingPage() {
  const router = useRouter();
  const calcRef     = useRef(null);
  const postReveal  = useRef(null);
  const [revealed, setRevealed] = useState(false);

  // If the user previously completed the flow, show post-reveal sections on load
  useEffect(() => {
    try {
      const raw = localStorage.getItem("macroCalcProgress_v1");
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved?.completed || saved?.step === 8) setRevealed(true);
    } catch { /* ignore */ }
  }, []);

  function scrollToCalc() {
    calcRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleReveal() {
    setRevealed(true);
  }

  // Smooth-scroll to the reveal sections once they appear
  useEffect(() => {
    if (!revealed) return;
    // Let the DOM paint the new sections first
    const t = setTimeout(() => {
      postReveal.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 500);
    return () => clearTimeout(t);
  }, [revealed]);

  function handleUnlock() {
    router.push("/login?from=calc");
  }

  return (
    <div style={{ fontFamily: "'Georgia', serif", background: "#f5f5f3", minHeight: "100vh", color: "#1a1a1a" }}>
      <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap" rel="stylesheet" />

      <style>{`
        * { box-sizing: border-box; }

        /* NAV */
        .nav { display: flex; justify-content: space-between; align-items: center; padding: 18px 48px; border-bottom: 1px solid #e8e4dc; background: rgba(255,255,255,0.92); backdrop-filter: blur(10px); position: sticky; top: 0; z-index: 50; }
        .nav-logo { flex: 0 0 auto; font-size: 20px; color: #1e2d4a; line-height: 1; }
        .nav-buttons { flex: 0 0 auto; display: flex; gap: 10px; align-items: center; }
        .btn-outline { padding: 11px 22px; background: transparent; color: #1e2d4a; border: 1px solid #1e2d4a; border-radius: 4px; font-size: 11px; font-weight: 700; cursor: pointer; letter-spacing: 1.5px; text-transform: uppercase; font-family: sans-serif; white-space: nowrap; text-decoration: none; display: inline-block; transition: all 0.15s; }
        .btn-outline:hover { background: #1e2d4a; color: #fff; }
        .btn-navy { padding: 11px 22px; background: #1e2d4a; color: #fff; border: none; border-radius: 4px; font-size: 11px; font-weight: 700; cursor: pointer; letter-spacing: 1.5px; text-transform: uppercase; font-family: sans-serif; white-space: nowrap; text-decoration: none; display: inline-block; transition: all 0.15s; }
        .btn-navy:hover { background: #152138; }

        /* HERO */
        .hero { background: linear-gradient(180deg, #fafaf8 0%, #f5f2ea 50%, #fafaf8 100%); padding: 72px 48px 40px; text-align: center; position: relative; overflow: hidden; }
        .hero::before { content: ""; position: absolute; top: -100px; right: -100px; width: 400px; height: 400px; background: radial-gradient(circle, rgba(201,168,76,0.15) 0%, transparent 70%); border-radius: 50%; pointer-events: none; }
        .hero::after  { content: ""; position: absolute; bottom: -140px; left: -100px; width: 420px; height: 420px; background: radial-gradient(circle, rgba(30,45,74,0.08) 0%, transparent 70%); border-radius: 50%; pointer-events: none; }
        .hero-inner { position: relative; z-index: 1; max-width: 780px; margin: 0 auto; }
        .hero-label { display: inline-block; background: rgba(201,168,76,0.14); border: 1px solid rgba(201,168,76,0.4); border-radius: 20px; padding: 6px 18px; font-size: 11px; color: #9a7a28; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 24px; font-family: sans-serif; font-weight: 700; }
        .hero h1 { font-size: clamp(38px, 5.5vw, 64px); font-weight: 400; line-height: 1.08; margin: 0 0 22px; color: #1a1a1a; letter-spacing: -1px; }
        .hero h1 em { color: #C9A84C; font-style: italic; font-weight: 400; }
        .hero-sub { font-size: 18px; color: #777; max-width: 540px; margin: 0 auto 34px; line-height: 1.7; font-family: sans-serif; font-weight: 300; }
        .hero-cta-row { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-bottom: 20px; }
        .btn-gold { padding: 17px 36px; background: #C9A84C; color: #1a1a1a; border: none; border-radius: 6px; font-size: 13px; font-weight: 800; cursor: pointer; letter-spacing: 1.5px; text-transform: uppercase; font-family: sans-serif; text-decoration: none; display: inline-block; transition: all 0.18s; box-shadow: 0 4px 18px rgba(201,168,76,0.35); }
        .btn-gold:hover { background: #b89640; transform: translateY(-1px); box-shadow: 0 6px 22px rgba(201,168,76,0.45); }
        .btn-ghost { padding: 17px 28px; background: transparent; color: #1e2d4a; border: 1px solid #1e2d4a; border-radius: 6px; font-size: 13px; font-weight: 700; cursor: pointer; letter-spacing: 1px; font-family: sans-serif; text-decoration: none; display: inline-block; transition: all 0.15s; }
        .btn-ghost:hover { background: #1e2d4a; color: #fff; }
        .trust-row { display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; font-size: 11px; color: #999; font-family: sans-serif; margin-top: 8px; }
        .trust-row span { display: inline-flex; align-items: center; gap: 5px; }
        .trust-row .check { color: #2d7a4f; font-weight: 800; }

        /* CALC SECTION */
        .calc-section { padding: 40px 24px 70px; background: linear-gradient(180deg, #fafaf8 0%, #f5f5f3 100%); }
        .calc-header { text-align: center; margin-bottom: 30px; max-width: 600px; margin-left: auto; margin-right: auto; padding: 0 16px; }
        .calc-sublabel { font-size: 11px; color: #C9A84C; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 12px; font-family: sans-serif; font-weight: 700; }
        .calc-header h2 { font-size: clamp(26px, 4vw, 36px); font-weight: 400; color: #1a1a1a; margin: 0 0 12px; letter-spacing: -0.5px; }
        .calc-header p { font-size: 15px; color: #888; margin: 0; line-height: 1.7; font-family: sans-serif; }

        /* POST-REVEAL (hidden until calculator completes) */
        .post-reveal { animation: fadeSlideUp 0.7s cubic-bezier(0.4,0,0.2,1); }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }

        /* FEATURES */
        .features { max-width: 980px; margin: 0 auto; padding: 90px 48px; background: #f5f5f3; }
        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: #ddd; border-radius: 8px; overflow: hidden; }
        .feature-card { background: #fff; padding: 40px 32px; transition: background 0.2s; }
        .feature-card:hover { background: #fafaf8; }

        /* HOW IT WORKS */
        .how { background: #fff; padding: 90px 48px; border-top: 1px solid #e8e4dc; border-bottom: 1px solid #e8e4dc; }
        .how-inner { max-width: 860px; margin: 0 auto; text-align: center; }
        .how-steps { display: flex; gap: 48px; justify-content: center; flex-wrap: wrap; margin-top: 56px; }
        .how-step { max-width: 230px; flex: 1; min-width: 200px; }

        /* PRICING */
        .pricing { max-width: 600px; margin: 0 auto; padding: 90px 48px; text-align: center; }
        .pricing-card { background: #fff; border: 1px solid #e8e4dc; border-radius: 12px; padding: 50px 44px; box-shadow: 0 6px 38px rgba(0,0,0,0.06); }
        .btn-dark-full { display: block; width: 100%; margin-top: 32px; padding: 16px; background: #1a1a1a; color: #fff; border: none; border-radius: 6px; font-size: 13px; font-weight: 700; cursor: pointer; letter-spacing: 2px; text-transform: uppercase; font-family: sans-serif; text-decoration: none; transition: background 0.15s; }
        .btn-dark-full:hover { background: #333; }

        /* CTA */
        .cta { background: linear-gradient(135deg, #1e2d4a 0%, #2a3d5e 50%, #1e2d4a 100%); padding: 80px 48px; text-align: center; color: #fff; }

        /* FOOTER */
        .footer { background: #fff; border-top: 1px solid #e8e4dc; padding: 32px 48px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }

        .sublabel { font-size: 11px; color: #C9A84C; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 14px; font-family: sans-serif; font-weight: 700; }

        /* MOBILE */
        @media (max-width: 768px) {
          .nav { padding: 14px 18px; }
          .nav-logo { flex: 1; font-size: 18px; }
          .btn-outline { padding: 9px 14px; font-size: 10px; }
          .btn-navy   { padding: 9px 14px; font-size: 10px; }

          .hero { padding: 48px 22px 30px; }
          .hero-sub { font-size: 15px; }

          .calc-section { padding: 30px 16px 50px; }

          .features { padding: 56px 18px; }
          .features-grid { grid-template-columns: 1fr; }

          .how { padding: 56px 22px; }
          .how-steps { gap: 32px; }
          .how-step { max-width: 100%; }

          .pricing { padding: 56px 18px; }
          .pricing-card { padding: 32px 22px; }

          .cta { padding: 56px 22px; }
          .footer { padding: 24px 22px; flex-direction: column; text-align: center; }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          .features-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      {/* NAV — minimal, just calculator + log in */}
      <nav className="nav">
        <div className="nav-logo">
          <span style={{ fontStyle: "italic", fontWeight: 300, color: "#1e2d4a" }}>her</span>
          <span style={{ fontWeight: 800, color: "#1e2d4a" }}>coach.</span>
          <span style={{ color: "#C9A84C", fontFamily: "'Great Vibes', cursive", fontWeight: 400, fontSize: 16, marginLeft: 1, verticalAlign: "middle" }}>Jess</span>
        </div>
        <div className="nav-buttons">
          <Link href="/login" className="btn-outline">Log In</Link>
          <button onClick={scrollToCalc} className="btn-navy">Calculate My Macros</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-label">✨ Free Macro Calculator</div>
          <h1>
            Get your personalised<br />
            macro blueprint in <em>60 seconds</em>
          </h1>
          <p className="hero-sub">
            A free science-backed calculator that reveals exactly what to eat for your body, your goal and your timeline. No account needed to find out.
          </p>
          <div className="hero-cta-row">
            <button onClick={scrollToCalc} className="btn-gold">Calculate My Macros ↓</button>
            <Link href="/login" className="btn-ghost">Log In →</Link>
          </div>
          <div className="trust-row">
            <span><span className="check">✓</span> No credit card</span>
            <span><span className="check">✓</span> No spam</span>
            <span><span className="check">✓</span> 60 seconds</span>
          </div>
        </div>
      </section>

      {/* THE CALCULATOR — the whole lead magnet */}
      <section ref={calcRef} className="calc-section" id="calculator">
        <div className="calc-header">
          <div className="calc-sublabel">Your Free Blueprint</div>
          <h2>Let&apos;s build your plan</h2>
          <p>Answer 8 quick questions and we&apos;ll reveal the exact calories and macros your body needs to hit your goal.</p>
        </div>
        <MacroCalculator mode="landing" onUnlock={handleUnlock} onReveal={handleReveal} />
      </section>

      {/* ─── POST-REVEAL CONTENT ─── only rendered after user hits the reveal slide */}
      {revealed && (
        <div ref={postReveal} className="post-reveal">

          {/* FEATURES */}
          <section id="features" className="features">
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <div className="sublabel">What&apos;s Included</div>
              <h2 style={{ fontSize: 34, fontWeight: 400, color: "#1a1a1a", margin: 0, letterSpacing: -0.5 }}>Everything you need to eat well</h2>
              <p style={{ fontSize: 15, color: "#888", margin: "14px auto 0", maxWidth: 520, lineHeight: 1.7, fontFamily: "sans-serif" }}>
                Now you have your numbers — here&apos;s what the full app unlocks to help you actually hit them every day.
              </p>
            </div>
            <div className="features-grid">
              {[
                ["🍽", "AI Meal Generator", "Tell us your macros. Get a perfectly matched meal in seconds."],
                ["📅", "Weekly Planner", "Plan your full week across breakfast, lunch, dinner & snacks."],
                ["🛒", "Smart Shopping List", "Ingredients compiled, grouped and ready to shop or print."],
                ["📊", "Client Profile", "Recalculate your BMR & targets anytime your body changes."],
                ["❤️", "Save Favourites", "Build your personal library of go-to meals."],
                ["📄", "PDF Download", "Download your plan to keep, print or share."],
              ].map(([icon, title, desc]) => (
                <div key={title} className="feature-card">
                  <div style={{ fontSize: 28, marginBottom: 14 }}>{icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", marginBottom: 10, fontFamily: "sans-serif" }}>{title}</div>
                  <div style={{ fontSize: 13, color: "#888", lineHeight: 1.8, fontFamily: "sans-serif" }}>{desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* HOW IT WORKS */}
          <section id="how-it-works" className="how">
            <div className="how-inner">
              <div className="sublabel">How It Works</div>
              <h2 style={{ fontSize: 34, fontWeight: 400, color: "#1a1a1a", margin: 0, letterSpacing: -0.5 }}>You&apos;ve done step one</h2>
              <p style={{ fontSize: 15, color: "#888", margin: "14px auto 0", maxWidth: 540, lineHeight: 1.7, fontFamily: "sans-serif" }}>
                Here&apos;s what happens when you create an account and unlock the app.
              </p>
              <div className="how-steps">
                {[
                  ["01", "Calculate ✓", "You&apos;ve already done this — your macro blueprint is ready."],
                  ["02", "Generate", "Our AI creates meals matched to your macros, preferences and favourite ingredients."],
                  ["03", "Plan", "Fill your 7-day planner, download your shopping list and crush your goal."],
                ].map(([num, title, desc], i) => (
                  <div key={num} className="how-step">
                    <div style={{ fontSize: 11, color: i === 0 ? "#2d7a4f" : "#C9A84C", letterSpacing: 3, marginBottom: 14, fontFamily: "sans-serif", fontWeight: 700 }}>{num}</div>
                    <div style={{ width: 1, height: 32, background: "#e8e4dc", margin: "0 auto 18px" }} />
                    <div style={{ fontSize: 16, color: "#1a1a1a", marginBottom: 10, fontFamily: "sans-serif", fontWeight: 700 }} dangerouslySetInnerHTML={{ __html: title }} />
                    <div style={{ fontSize: 13, color: "#888", lineHeight: 1.8, fontFamily: "sans-serif" }} dangerouslySetInnerHTML={{ __html: desc }} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* PRICING */}
          <section id="pricing" className="pricing">
            <div className="sublabel">Ready to unlock?</div>
            <h2 style={{ fontSize: 34, fontWeight: 400, color: "#1a1a1a", marginBottom: 16, letterSpacing: -0.5 }}>One simple plan</h2>
            <p style={{ fontSize: 14, color: "#999", marginBottom: 40, fontFamily: "sans-serif", lineHeight: 1.7 }}>
              Your macro calculation is free forever. Unlock the full app to generate meals, build weekly plans and track progress.
            </p>
            <div className="pricing-card">
              <div className="sublabel">Monthly</div>
              <div style={{ fontSize: 60, color: "#1a1a1a", marginBottom: 4, fontWeight: 300 }}>£<span style={{ fontFamily: "sans-serif" }}>19</span></div>
              <div style={{ fontSize: 13, color: "#aaa", marginBottom: 36, fontFamily: "sans-serif" }}>per month · cancel anytime</div>
              {["AI Meal Generator", "Weekly Planner", "Smart Shopping List", "Client Profile & BMR", "PDF Downloads", "Save Favourites"].map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, textAlign: "left" }}>
                  <span style={{ color: "#C9A84C", fontSize: 13, fontWeight: 800 }}>✓</span>
                  <span style={{ fontSize: 14, color: "#555", fontFamily: "sans-serif" }}>{f}</span>
                </div>
              ))}
              <Link href="/login" className="btn-dark-full">Create My Account</Link>
              <div style={{ fontSize: 11, color: "#aaa", marginTop: 14, fontFamily: "sans-serif" }}>
                Already a member? <Link href="/login" style={{ color: "#1e2d4a", fontWeight: 700, textDecoration: "none" }}>Log in →</Link>
              </div>
            </div>
          </section>

          {/* CTA BANNER */}
          <section className="cta">
            <div className="sublabel">Your plan is ready</div>
            <h2 style={{ fontSize: 36, fontWeight: 400, marginBottom: 12, letterSpacing: -0.5 }}>Let&apos;s turn it into meals.</h2>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 15, marginBottom: 36, fontFamily: "sans-serif" }}>Create your account and we&apos;ll carry your blueprint straight into the app.</p>
            <Link href="/login" className="btn-gold">Create My Account →</Link>
          </section>
        </div>
      )}

      {/* FOOTER always visible */}
      <footer className="footer">
        <div style={{ fontSize: 18, color: "#1e2d4a", lineHeight: 1 }}>
          <span style={{ fontStyle: "italic", fontWeight: 300 }}>her</span>
          <span style={{ fontWeight: 800 }}>coach.</span>
          <span style={{ color: "#C9A84C", fontFamily: "'Great Vibes', cursive", fontWeight: 400, fontSize: 16, marginLeft: 1, verticalAlign: "middle" }}>Jess</span>
        </div>
        <div style={{ fontSize: 12, color: "#bbb", fontFamily: "sans-serif" }}>© 2026 HerCoachJess. All rights reserved.</div>
      </footer>
    </div>
  );
}
