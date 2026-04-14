"use client";

export default function LandingPreview() {
  return (
    <div style={{ fontFamily: "'Georgia', serif", background: "#f5f5f3", minHeight: "100vh", color: "#1a1a1a" }}>
      <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 48px", borderBottom: "1px solid #e8e4dc", background: "#fff", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ flex: "0 0 180px", fontSize: 20, color: "#1e2d4a", lineHeight: 1 }}>
          <span style={{ fontStyle: "italic", fontWeight: 300, color: "#1e2d4a" }}>her</span>
          <span style={{ fontWeight: 800, color: "#1e2d4a" }}>coach.</span>
          <span style={{ color: "#C9A84C", fontFamily: "'Great Vibes', cursive", fontWeight: 400, fontSize: 16, marginLeft: 1, verticalAlign: "middle" }}>Jess</span>
        </div>
        <div style={{ flex: 1, display: "flex", justifyContent: "center", gap: 32, fontSize: 12, letterSpacing: 0.5, fontFamily: "sans-serif", whiteSpace: "nowrap" }}>
          <span style={{ cursor: "pointer", color: "#555" }}>Features</span>
          <span style={{ cursor: "pointer", color: "#555" }}>How It Works</span>
          <span style={{ cursor: "pointer", color: "#555" }}>Pricing</span>
        </div>
        <div style={{ flex: "0 0 auto", display: "flex", gap: 12, alignItems: "center", justifyContent: "flex-end", marginLeft: 40 }}>
          <button style={{ padding: "11px 22px", background: "transparent", color: "#1e2d4a", border: "1px solid #1e2d4a", borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "sans-serif", whiteSpace: "nowrap" }}>
            Log In
          </button>
          <button style={{ padding: "11px 28px", background: "#1e2d4a", color: "#fff", border: "none", borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "sans-serif", whiteSpace: "nowrap" }}>
            Get Started
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background: "#fafaf8", padding: "110px 64px 90px", textAlign: "center" }}>
        <div style={{ display: "inline-block", background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.4)", borderRadius: 20, padding: "6px 18px", fontSize: 11, color: "#C9A84C", letterSpacing: 3, textTransform: "uppercase", marginBottom: 28, fontFamily: "sans-serif", fontWeight: 700 }}>
          AI-Powered Nutrition Planning
        </div>
        <h1 style={{ fontSize: "clamp(42px, 6vw, 70px)", fontWeight: 400, lineHeight: 1.1, margin: "0 0 24px", color: "#1a1a1a", letterSpacing: -1 }}>
          Meals matched<br />to <span style={{ color: "#C9A84C", fontStyle: "italic" }}>your macros.</span>
        </h1>
        <p style={{ fontSize: 17, color: "#888", maxWidth: 500, margin: "0 auto 48px", lineHeight: 1.9, fontFamily: "sans-serif", fontWeight: 300 }}>
          AI-generated meal plans personalised to your body, goals and taste. Built for women who want real results without the guesswork.
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <button style={{ padding: "15px 40px", background: "#C9A84C", color: "#1a1a1a", border: "none", borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "sans-serif" }}>
            Start Free Trial
          </button>
          <button style={{ padding: "15px 40px", background: "#1e2d4a", color: "#fff", border: "none", borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: "pointer", letterSpacing: 1, fontFamily: "sans-serif" }}>
            See How It Works →
          </button>
        </div>
      </section>

      {/* HERO IMAGE PLACEHOLDER */}
      <section style={{ maxWidth: 900, margin: "0 auto 0", padding: "0 64px" }}>
        <div style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)", borderRadius: 12, height: 320, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e8e4dc", overflow: "hidden", position: "relative" }}>
          <div style={{ display: "flex", gap: 16, padding: 24, width: "100%", justifyContent: "center" }}>
            {["🥗 Lemon Herb Chicken", "🍜 Asian Beef Bowl", "🥑 Salmon Avocado"].map((meal, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "20px 20px", minWidth: 190, backdropFilter: "blur(10px)" }}>
                <div style={{ fontSize: 22, marginBottom: 10 }}>{meal.split(" ")[0]}</div>
                <div style={{ fontSize: 13, color: "#fff", fontFamily: "sans-serif", fontWeight: 600, marginBottom: 6 }}>{meal.slice(3)}</div>
                <div style={{ fontSize: 11, color: "#C9A84C", fontFamily: "sans-serif" }}>548 cal · 41g protein</div>
                <div style={{ marginTop: 12, display: "flex", gap: 6 }}>
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
      <section style={{ display: "flex", justifyContent: "center", gap: 0, padding: "80px 64px", flexWrap: "wrap", maxWidth: 800, margin: "0 auto", background: "#fff" }}>
        {[["500+", "Meals Generated"], ["98%", "Client Retention"], ["4.9★", "Average Rating"]].map(([num, label], i) => (
          <div key={label} style={{ textAlign: "center", flex: 1, padding: "0 40px", borderRight: i < 2 ? "1px solid #e8e4dc" : "none" }}>
            <div style={{ fontSize: 40, color: "#1a1a1a", fontWeight: 400, marginBottom: 8 }}>{num}</div>
            <div style={{ fontSize: 11, color: "#aaa", letterSpacing: 2, textTransform: "uppercase", fontFamily: "sans-serif" }}>{label}</div>
          </div>
        ))}
      </section>

      {/* DIVIDER */}
      <div style={{ borderTop: "1px solid #e8e4dc", maxWidth: 860, margin: "0 auto" }} />

      {/* FEATURES */}
      <section style={{ maxWidth: 960, margin: "0 auto", padding: "100px 64px", background: "#f5f5f3" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{ fontSize: 11, color: "#C9A84C", letterSpacing: 4, textTransform: "uppercase", marginBottom: 16, fontFamily: "sans-serif", fontWeight: 700 }}>What's Included</div>
          <h2 style={{ fontSize: 34, fontWeight: 400, color: "#1a1a1a", margin: 0 }}>Everything you need to eat well</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "#ddd" }}>
          {[
            ["🍽", "AI Meal Generator", "Tell us your macros. Get a perfectly matched meal in seconds."],
            ["📅", "Weekly Planner", "Plan your full week across breakfast, lunch and dinner."],
            ["🛒", "Smart Shopping List", "Ingredients compiled, grouped and ready to shop."],
            ["📊", "Client Profile", "Your BMR and calorie goals via Harris-Benedict formula."],
            ["❤️", "Save Favourites", "Build your personal library of go-to meals."],
            ["📄", "PDF Download", "Download your weekly plan to keep, print or share."],
          ].map(([icon, title, desc]) => (
            <div key={title} style={{ background: "#fff", padding: "44px 36px" }}>
              <div style={{ fontSize: 24, marginBottom: 16 }}>{icon}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", marginBottom: 10, fontFamily: "sans-serif" }}>{title}</div>
              <div style={{ fontSize: 13, color: "#999", lineHeight: 1.8, fontFamily: "sans-serif" }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ background: "#fff", padding: "100px 64px", borderTop: "1px solid #e8e4dc", borderBottom: "1px solid #e8e4dc" }}>
        <div style={{ maxWidth: 820, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#C9A84C", letterSpacing: 4, textTransform: "uppercase", marginBottom: 16, fontFamily: "sans-serif", fontWeight: 700 }}>Simple Process</div>
          <h2 style={{ fontSize: 34, fontWeight: 400, color: "#1a1a1a", marginBottom: 72 }}>Three steps to your perfect meal plan</h2>
          <div style={{ display: "flex", gap: 60, justifyContent: "center", flexWrap: "wrap" }}>
            {[
              ["01", "Set Your Goals", "Enter your weight, height and target. We calculate your exact calorie and macro needs."],
              ["02", "Generate Meals", "Our AI creates meals matched to your macros, preferences and key ingredients."],
              ["03", "Plan Your Week", "Fill your 7-day planner and download your shopping list in one tap."],
            ].map(([num, title, desc]) => (
              <div key={num} style={{ maxWidth: 220 }}>
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
      <section style={{ maxWidth: 600, margin: "0 auto", padding: "100px 64px", textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "#C9A84C", letterSpacing: 4, textTransform: "uppercase", marginBottom: 16, fontFamily: "sans-serif", fontWeight: 700 }}>Pricing</div>
        <h2 style={{ fontSize: 34, fontWeight: 400, color: "#1a1a1a", marginBottom: 56 }}>One simple plan</h2>
        <div style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 8, padding: "56px 48px", boxShadow: "0 4px 40px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 11, color: "#C9A84C", letterSpacing: 3, textTransform: "uppercase", marginBottom: 16, fontFamily: "sans-serif", fontWeight: 700 }}>Monthly</div>
          <div style={{ fontSize: 60, color: "#1a1a1a", marginBottom: 4, fontWeight: 300 }}>£<span style={{ fontFamily: "sans-serif" }}>19</span></div>
          <div style={{ fontSize: 13, color: "#aaa", marginBottom: 40, fontFamily: "sans-serif" }}>per month · cancel anytime</div>
          {["AI Meal Generator", "Weekly Planner", "Shopping List", "Client Profile & BMR", "PDF Downloads", "Save Favourites"].map(f => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, textAlign: "left" }}>
              <span style={{ color: "#C9A84C", fontSize: 13, fontWeight: 700 }}>✓</span>
              <span style={{ fontSize: 14, color: "#555", fontFamily: "sans-serif" }}>{f}</span>
            </div>
          ))}
          <button style={{ width: "100%", marginTop: 36, padding: "16px", background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: 2, textTransform: "uppercase", fontFamily: "sans-serif" }}>
            Start Free Trial
          </button>
        </div>
      </section>

      {/* CTA BANNER */}
      <section style={{ background: "#1e2d4a", padding: "80px 64px", textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "#C9A84C", letterSpacing: 4, textTransform: "uppercase", marginBottom: 20, fontFamily: "sans-serif", fontWeight: 700 }}>Ready to start?</div>
        <h2 style={{ fontSize: 36, fontWeight: 400, color: "#fff", marginBottom: 12 }}>Your perfect meal plan is waiting.</h2>
        <p style={{ color: "#666", fontSize: 15, marginBottom: 40, fontFamily: "sans-serif" }}>Join hundreds of women eating smarter every week.</p>
        <button style={{ padding: "16px 48px", background: "#C9A84C", color: "#1a1a1a", border: "none", borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: 2, textTransform: "uppercase", fontFamily: "sans-serif" }}>
          Get Started Today
        </button>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#fff", borderTop: "1px solid #e8e4dc", padding: "36px 64px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
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
