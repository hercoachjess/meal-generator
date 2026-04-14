"use client";
import Link from "next/link";

export default function LandingPage() {
  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="landing" style={{ fontFamily: "'Georgia', serif", background: "#f5f5f3", minHeight: "100vh", color: "#1a1a1a" }}>
      <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap" rel="stylesheet" />

      <style>{`
        * { box-sizing: border-box; }

        /* NAV */
        .nav { display: flex; justify-content: space-between; align-items: center; padding: 20px 48px; border-bottom: 1px solid #e8e4dc; background: #fff; position: sticky; top: 0; z-index: 50; }
        .nav-logo { flex: 0 0 180px; font-size: 20px; color: #1e2d4a; line-height: 1; }
        .nav-links { flex: 1; display: flex; justify-content: center; gap: 32px; font-size: 12px; letter-spacing: 0.5px; font-family: sans-serif; white-space: nowrap; }
        .nav-links span { cursor: pointer; color: #555; }
        .nav-links span:hover { color: #1e2d4a; }
        .nav-buttons { flex: 0 0 auto; display: flex; gap: 12px; align-items: center; margin-left: 40px; }
        .btn-outline { padding: 11px 22px; background: transparent; color: #1e2d4a; border: 1px solid #1e2d4a; border-radius: 4px; font-size: 11px; font-weight: 700; cursor: pointer; letter-spacing: 1.5px; text-transform: uppercase; font-family: sans-serif; white-space: nowrap; text-decoration: none; display: inline-block; }
        .btn-navy { padding: 11px 28px; background: #1e2d4a; color: #fff; border: none; border-radius: 4px; font-size: 11px; font-weight: 700; cursor: pointer; letter-spacing: 1.5px; text-transform: uppercase; font-family: sans-serif; white-space: nowrap; text-decoration: none; display: inline-block; }
        .btn-gold { padding: 15px 40px; background: #C9A84C; color: #1a1a1a; border: none; border-radius: 4px; font-size: 13px; font-weight: 700; cursor: pointer; letter-spacing: 1.5px; text-transform: uppercase; font-family: sans-serif; text-decoration: none; display: inline-block; }
        .btn-navy-lg { padding: 15px 40px; background: #1e2d4a; color: #fff; border: none; border-radius: 4px; font-size: 13px; font-weight: 600; cursor: pointer; letter-spacing: 1px; font-family: sans-serif; }

        /* HERO */
        .hero { background: #fafaf8; padding: 110px 64px 90px; text-align: center; }
        .hero h1 { font-size: clamp(38px, 6vw, 70px); font-weight: 400; line-height: 1.1; margin: 0 0 24px; color: #1a1a1a; letter-spacing: -1px; }
        .hero p { font-size: 17px; color: #888; max-width: 500px; margin: 0 auto 48px; line-height: 1.9; font-family: sans-serif; font-weight: 300; }
        .hero-buttons { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }

        /* MOCK CARDS */
        .mock-section { max-width: 900px; margin: 0 auto; padding: 0 64px; }
        .mock-inner { background: linear-gradient(135deg,#1a1a1a,#2d2d2d,#1a1a1a); border-radius: 12px; height: 320px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .mock-cards { display: flex; gap: 16px; padding: 24px; justify-content: center; width: 100%; overflow-x: auto; }
        .mock-card { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 20px; min-width: 190px; flex-shrink: 0; }

        /* STATS */
        .stats { display: flex; justify-content: center; padding: 80px 64px; flex-wrap: wrap; max-width: 800px; margin: 0 auto; background: #fff; }
        .stat { text-align: center; flex: 1; min-width: 140px; padding: 20px 40px; border-right: 1px solid #e8e4dc; }
        .stat:last-child { border-right: none; }

        /* FEATURES */
        .features { max-width: 960px; margin: 0 auto; padding: 100px 64px; background: #f5f5f3; }
        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: #ddd; }
        .feature-card { background: #fff; padding: 44px 36px; }

        /* HOW IT WORKS */
        .how { background: #fff; padding: 100px 64px; border-top: 1px solid #e8e4dc; border-bottom: 1px solid #e8e4dc; }
        .how-inner { max-width: 820px; margin: 0 auto; text-align: center; }
        .how-steps { display: flex; gap: 60px; justify-content: center; flex-wrap: wrap; }
        .how-step { max-width: 220px; }

        /* PRICING */
        .pricing { max-width: 600px; margin: 0 auto; padding: 100px 64px; text-align: center; }
        .pricing-card { background: #fff; border: 1px solid #e8e4dc; border-radius: 8px; padding: 56px 48px; box-shadow: 0 4px 40px rgba(0,0,0,0.06); }
        .btn-dark-full { display: block; width: 100%; margin-top: 36px; padding: 16px; background: #1a1a1a; color: #fff; border: none; border-radius: 4px; font-size: 13px; font-weight: 700; cursor: pointer; letter-spacing: 2px; text-transform: uppercase; font-family: sans-serif; text-decoration: none; }

        /* CTA */
        .cta { background: #1e2d4a; padding: 80px 64px; text-align: center; }

        /* FOOTER */
        .footer { background: #fff; border-top: 1px solid #e8e4dc; padding: 36px 64px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }

        /* LABEL */
        .label { display: inline-block; background: rgba(201,168,76,0.12); border: 1px solid rgba(201,168,76,0.4); border-radius: 20px; padding: 6px 18px; font-size: 11px; color: #C9A84C; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 28px; font-family: sans-serif; font-weight: 700; }
        .sublabel { font-size: 11px; color: #C9A84C; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 16px; font-family: sans-serif; font-weight: 700; }

        /* ── MOBILE ── */
        @media (max-width: 768px) {
          .nav { padding: 16px 20px; }
          .nav-logo { flex: 1; font-size: 18px; }
          .nav-links { display: none; }
          .nav-buttons { margin-left: 0; gap: 8px; }
          .btn-outline { padding: 9px 14px; font-size: 10px; }
          .btn-navy { padding: 9px 14px; font-size: 10px; }

          .hero { padding: 60px 24px 56px; }
          .hero p { font-size: 15px; }

          .mock-section { padding: 0 20px; }
          .mock-inner { height: auto; padding: 16px 0; }
          .mock-cards { gap: 12px; padding: 16px; justify-content: flex-start; }

          .stats { padding: 48px 24px; }
          .stat { padding: 16px 20px; border-right: none; border-bottom: 1px solid #e8e4dc; }
          .stat:last-child { border-bottom: none; }

          .features { padding: 60px 20px; }
          .features-grid { grid-template-columns: 1fr; }

          .how { padding: 60px 24px; }
          .how-steps { gap: 40px; }
          .how-step { max-width: 100%; width: 100%; }

          .pricing { padding: 60px 20px; }
          .pricing-card { padding: 36px 24px; }

          .cta { padding: 60px 24px; }

          .footer { padding: 28px 24px; flex-direction: column; text-align: center; }
        }

        /* ── TABLET ── */
        @media (min-width: 769px) and (max-width: 1024px) {
          .nav { padding: 18px 32px; }
          .hero { padding: 80px 40px 70px; }
          .mock-section { padding: 0 40px; }
          .stats { padding: 60px 40px; }
          .features { padding: 80px 40px; }
          .features-grid { grid-template-columns: repeat(2, 1fr); }
          .how { padding: 80px 40px; }
          .pricing { padding: 80px 40px; }
          .cta { padding: 60px 40px; }
          .footer { padding: 28px 40px; }
        }
      `}</style>

      {/* NAV */}
      <nav className="nav">
        <div className="nav-logo">
          <span style={{ fontStyle: "italic", fontWeight: 300, color: "#1e2d4a" }}>her</span>
          <span style={{ fontWeight: 800, color: "#1e2d4a" }}>coach.</span>
          <span style={{ color: "#C9A84C", fontFamily: "'Great Vibes', cursive", fontWeight: 400, fontSize: 16, marginLeft: 1, verticalAlign: "middle" }}>Jess</span>
        </div>
        <div className="nav-links">
          <span onClick={() => scrollTo("features")}>Features</span>
          <span onClick={() => scrollTo("how-it-works")}>How It Works</span>
          <span onClick={() => scrollTo("pricing")}>Pricing</span>
        </div>
        <div className="nav-buttons">
          <Link href="/login" className="btn-outline">Log In</Link>
          <Link href="/login" className="btn-navy">Get Started</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="label">AI-Powered Nutrition Planning</div>
        <h1>
          Meals matched<br />to <span style={{ color: "#C9A84C", fontStyle: "italic" }}>your macros.</span>
        </h1>
        <p>
          AI-generated meal plans personalised to your body, goals and taste. Built for women who want real results without the guesswork.
        </p>
        <div className="hero-buttons">
          <Link href="/login" className="btn-gold">Start Free Trial</Link>
          <button className="btn-navy-lg" onClick={() => scrollTo("how-it-works")}>See How It Works →</button>
        </div>
      </section>

      {/* MOCK APP PREVIEW */}
      <section className="mock-section">
        <div className="mock-inner">
          <div className="mock-cards">
            {["🥗 Lemon Herb Chicken", "🍜 Asian Beef Bowl", "🥑 Salmon Avocado"].map((meal, i) => (
              <div key={i} className="mock-card">
                <div style={{ fontSize: 22, marginBottom: 10 }}>{meal.split(" ")[0]}</div>
                <div style={{ fontSize: 13, color: "#fff", fontFamily: "sans-serif", fontWeight: 600, marginBottom: 6 }}>{meal.slice(3)}</div>
                <div style={{ fontSize: 11, color: "#C9A84C", fontFamily: "sans-serif" }}>548 cal · 41g protein</div>
                <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {["Low Carb", "High Protein"].map(t => (
                    <span key={t} style={{ fontSize: 9, background: "#C9A84C22", color: "#C9A84C", padding: "3px 8px", borderRadius: 10, fontFamily: "sans-serif", letterSpacing: 1 }}>{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="stats">
        {[["500+", "Meals Generated"], ["98%", "Client Retention"], ["4.9★", "Average Rating"]].map(([num, label]) => (
          <div key={label} className="stat">
            <div style={{ fontSize: 40, color: "#1a1a1a", fontWeight: 400, marginBottom: 8 }}>{num}</div>
            <div style={{ fontSize: 11, color: "#aaa", letterSpacing: 2, textTransform: "uppercase", fontFamily: "sans-serif" }}>{label}</div>
          </div>
        ))}
      </section>

      <div style={{ borderTop: "1px solid #e8e4dc", maxWidth: 860, margin: "0 auto" }} />

      {/* FEATURES */}
      <section id="features" className="features">
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div className="sublabel">What&apos;s Included</div>
          <h2 style={{ fontSize: 34, fontWeight: 400, color: "#1a1a1a", margin: 0 }}>Everything you need to eat well</h2>
        </div>
        <div className="features-grid">
          {[
            ["🍽", "AI Meal Generator", "Tell us your macros. Get a perfectly matched meal in seconds."],
            ["📅", "Weekly Planner", "Plan your full week across breakfast, lunch and dinner."],
            ["🛒", "Smart Shopping List", "Ingredients compiled, grouped and ready to shop."],
            ["📊", "Client Profile", "Your BMR and calorie goals via Harris-Benedict formula."],
            ["❤️", "Save Favourites", "Build your personal library of go-to meals."],
            ["📄", "PDF Download", "Download your weekly plan to keep, print or share."],
          ].map(([icon, title, desc]) => (
            <div key={title} className="feature-card">
              <div style={{ fontSize: 24, marginBottom: 16 }}>{icon}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", marginBottom: 10, fontFamily: "sans-serif" }}>{title}</div>
              <div style={{ fontSize: 13, color: "#999", lineHeight: 1.8, fontFamily: "sans-serif" }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="how">
        <div className="how-inner">
          <div className="sublabel">Simple Process</div>
          <h2 style={{ fontSize: 34, fontWeight: 400, color: "#1a1a1a", marginBottom: 72 }}>Three steps to your perfect meal plan</h2>
          <div className="how-steps">
            {[
              ["01", "Set Your Goals", "Enter your weight, height and target. We calculate your exact calorie and macro needs."],
              ["02", "Generate Meals", "Our AI creates meals matched to your macros, preferences and key ingredients."],
              ["03", "Plan Your Week", "Fill your 7-day planner and download your shopping list in one tap."],
            ].map(([num, title, desc]) => (
              <div key={num} className="how-step">
                <div style={{ fontSize: 11, color: "#C9A84C", letterSpacing: 3, marginBottom: 16, fontFamily: "sans-serif", fontWeight: 700 }}>{num}</div>
                <div style={{ width: 1, height: 32, background: "#e8e4dc", margin: "0 auto 20px" }} />
                <div style={{ fontSize: 16, color: "#1a1a1a", marginBottom: 12, fontFamily: "sans-serif", fontWeight: 600 }}>{title}</div>
                <div style={{ fontSize: 13, color: "#999", lineHeight: 1.8, fontFamily: "sans-serif" }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="pricing">
        <div className="sublabel">Pricing</div>
        <h2 style={{ fontSize: 34, fontWeight: 400, color: "#1a1a1a", marginBottom: 56 }}>One simple plan</h2>
        <div className="pricing-card">
          <div className="sublabel">Monthly</div>
          <div style={{ fontSize: 60, color: "#1a1a1a", marginBottom: 4, fontWeight: 300 }}>£<span style={{ fontFamily: "sans-serif" }}>19</span></div>
          <div style={{ fontSize: 13, color: "#aaa", marginBottom: 40, fontFamily: "sans-serif" }}>per month · cancel anytime</div>
          {["AI Meal Generator", "Weekly Planner", "Shopping List", "Client Profile & BMR", "PDF Downloads", "Save Favourites"].map(f => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, textAlign: "left" }}>
              <span style={{ color: "#C9A84C", fontSize: 13, fontWeight: 700 }}>✓</span>
              <span style={{ fontSize: 14, color: "#555", fontFamily: "sans-serif" }}>{f}</span>
            </div>
          ))}
          <Link href="/login" className="btn-dark-full">Start Free Trial</Link>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="cta">
        <div className="sublabel">Ready to start?</div>
        <h2 style={{ fontSize: 36, fontWeight: 400, color: "#fff", marginBottom: 12 }}>Your perfect meal plan is waiting.</h2>
        <p style={{ color: "#aaa", fontSize: 15, marginBottom: 40, fontFamily: "sans-serif" }}>Join hundreds of women eating smarter every week.</p>
        <Link href="/login" className="btn-gold">Get Started Today</Link>
      </section>

      {/* FOOTER */}
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
