"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

function Nav({ user, onSignOut }) {
  return (
    <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 48px", borderBottom: "1px solid #e8e4dc", background: "#fff", position: "sticky", top: 0, zIndex: 50 }}>
      <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap" rel="stylesheet" />
      <Link href="/" style={{ fontSize: 20, color: "#1e2d4a", lineHeight: 1, textDecoration: "none" }}>
        <span style={{ fontStyle: "italic", fontWeight: 300 }}>her</span>
        <span style={{ fontWeight: 800 }}>coach.</span>
        <span style={{ color: "#C9A84C", fontFamily: "'Great Vibes', cursive", fontWeight: 400, fontSize: 16, marginLeft: 1, verticalAlign: "middle" }}>Jess</span>
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/generator" style={{ fontSize: 12, color: "#555", fontFamily: "sans-serif", textDecoration: "none" }}>← Generator</Link>
        <Link href="/tracker" style={{ fontSize: 12, color: "#555", fontFamily: "sans-serif", textDecoration: "none" }}>Daily Tracker</Link>
        {user && <button onClick={onSignOut} style={{ padding: "8px 16px", background: "transparent", color: "#1e2d4a", border: "1px solid #e8e4dc", borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase", fontFamily: "sans-serif" }}>Sign Out</button>}
      </div>
    </nav>
  );
}

function WeightChart({ logs }) {
  if (logs.length < 2) return null;
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const weights = sorted.map(l => l.weight_kg);
  const min = Math.min(...weights) - 1;
  const max = Math.max(...weights) + 1;
  const range = max - min || 1;
  const W = 600, H = 160, padX = 20, padY = 16;
  const chartW = W - padX * 2;
  const chartH = H - padY * 2;

  const pts = sorted.map((l, i) => ({
    x: padX + (i / (sorted.length - 1)) * chartW,
    y: padY + chartH - ((l.weight_kg - min) / range) * chartH,
    date: l.date,
    weight: l.weight_kg,
  }));

  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`;

  const first = weights[0];
  const last = weights[weights.length - 1];
  const diff = last - first;

  return (
    <div style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 8, padding: "24px", marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: "#C9A84C", letterSpacing: 3, textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 700 }}>Your Journey</div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 13, fontFamily: "sans-serif", color: diff < 0 ? "#2d7a4f" : diff > 0 ? "#c0392b" : "#888" }}>
            {diff < 0 ? "↓" : diff > 0 ? "↑" : "→"} {Math.abs(diff).toFixed(1)} kg {diff < 0 ? "lost" : diff > 0 ? "gained" : "maintained"}
          </div>
          <div style={{ fontSize: 11, color: "#aaa", fontFamily: "sans-serif" }}>since first entry</div>
        </div>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map(t => (
          <line key={t} x1={padX} x2={W - padX} y1={padY + t * chartH} y2={padY + t * chartH} stroke="#f0ece4" strokeWidth="1" />
        ))}
        {/* Area fill */}
        <path d={areaD} fill="rgba(201,168,76,0.07)" />
        {/* Line */}
        <path d={pathD} fill="none" stroke="#C9A84C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots */}
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill="#fff" stroke="#C9A84C" strokeWidth="2.5" />
        ))}
        {/* Start / end labels */}
        <text x={pts[0].x} y={pts[0].y - 8} textAnchor="middle" fontSize="11" fill="#aaa" fontFamily="sans-serif">{first}kg</text>
        <text x={pts[pts.length - 1].x} y={pts[pts.length - 1].y - 8} textAnchor="middle" fontSize="11" fill="#1e2d4a" fontFamily="sans-serif" fontWeight="700">{last}kg</text>
      </svg>
      {/* Date labels */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontSize: 10, color: "#bbb", fontFamily: "sans-serif" }}>{new Date(sorted[0].date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
        {sorted.length > 2 && <span style={{ fontSize: 10, color: "#bbb", fontFamily: "sans-serif" }}>{new Date(sorted[Math.floor(sorted.length / 2)].date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>}
        <span style={{ fontSize: 10, color: "#bbb", fontFamily: "sans-serif" }}>{new Date(sorted[sorted.length - 1].date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
      </div>
    </div>
  );
}

export default function ProgressPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ date: today, weight_kg: "", notes: "" });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      setUser(user);
      const { data } = await supabase.from("progress_logs").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(30);
      if (data) setLogs(data);
      setLoading(false);
    });
  }, [router]);

  async function handleSave(e) {
    e.preventDefault();
    if (!form.weight_kg) return;
    setSaving(true); setError(null); setSaved(false);
    const supabase = createClient();
    const { data, error: err } = await supabase.from("progress_logs").upsert({
      user_id: user.id,
      date: form.date,
      weight_kg: parseFloat(form.weight_kg),
      notes: form.notes || null,
    }, { onConflict: "user_id,date" }).select();
    if (err) { setError(`Could not save — ${err.message}`); }
    else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setLogs(prev => {
        const next = prev.filter(l => l.date !== form.date);
        return [data[0], ...next].sort((a, b) => b.date.localeCompare(a.date));
      });
      setForm({ date: today, weight_kg: "", notes: "" });
    }
    setSaving(false);
  }

  async function handleDelete(id, date) {
    setDeleteId(id);
    const supabase = createClient();
    await supabase.from("progress_logs").delete().eq("id", id);
    setLogs(prev => prev.filter(l => l.id !== id));
    setDeleteId(null);
  }

  const inputStyle = { width: "100%", background: "#fff", border: "1px solid #e8e4dc", borderRadius: 4, padding: "12px 14px", fontSize: 14, fontFamily: "sans-serif", outline: "none", color: "#1a1a1a", boxSizing: "border-box" };
  const labelStyle = { display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 7, letterSpacing: 1, textTransform: "uppercase", fontFamily: "sans-serif" };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#fafaf8" }}>
      <div style={{ textAlign: "center", padding: 80, color: "#C9A84C", fontFamily: "sans-serif" }}>Loading...</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#fafaf8", fontFamily: "Georgia, serif" }}>
      <style>{`* { box-sizing: border-box; } @media(max-width:600px){ nav { padding: 16px 20px !important; } .prog-grid { grid-template-columns: 1fr !important; } }`}</style>
      <Nav user={user} onSignOut={async () => { const s = createClient(); await s.auth.signOut(); router.push("/login"); }} />

      <div style={{ textAlign: "center", padding: "40px 24px 0" }}>
        <div style={{ fontSize: 11, color: "#C9A84C", letterSpacing: 4, textTransform: "uppercase", marginBottom: 10, fontFamily: "sans-serif", fontWeight: 700 }}>Your Journey</div>
        <h1 style={{ fontSize: "clamp(24px,4vw,38px)", fontWeight: 400, color: "#1a1a1a", margin: "0 0 8px" }}>
          Progress <span style={{ color: "#C9A84C", fontStyle: "italic" }}>Log</span>
        </h1>
        <p style={{ fontSize: 14, color: "#aaa", fontFamily: "sans-serif", margin: "0 0 32px" }}>Track your weight and wellness milestones over time.</p>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 24px 80px" }}>

        {/* Log entry form */}
        <div style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 8, padding: "28px", marginBottom: 20, boxShadow: "0 4px 24px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: 11, color: "#C9A84C", letterSpacing: 3, textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 700, marginBottom: 20 }}>Log an Entry</div>
          <form onSubmit={handleSave}>
            <div className="prog-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Date</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} max={today} />
              </div>
              <div>
                <label style={labelStyle}>Weight (kg)</label>
                <input type="number" step="0.1" min="20" max="300" placeholder="e.g. 68.5" value={form.weight_kg} onChange={e => setForm(f => ({ ...f, weight_kg: e.target.value }))} style={inputStyle} required />
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Notes <span style={{ fontWeight: 400, color: "#bbb" }}>(optional)</span></label>
              <input type="text" placeholder="How are you feeling? Any wins this week?" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={inputStyle} />
            </div>
            {error && <div style={{ background: "rgba(220,53,53,0.06)", border: "1px solid rgba(220,53,53,0.2)", borderRadius: 4, padding: 12, marginBottom: 14, color: "#c0392b", fontSize: 13, fontFamily: "sans-serif" }}>⚠ {error}</div>}
            {saved && <div style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 4, padding: 12, marginBottom: 14, color: "#9a7a28", fontSize: 13, fontFamily: "sans-serif" }}>✓ Entry saved!</div>}
            <button type="submit" disabled={saving || !form.weight_kg} style={{ width: "100%", padding: "13px", border: "none", borderRadius: 4, background: saving || !form.weight_kg ? "#ccc" : "#1e2d4a", color: "#fff", fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", fontFamily: "sans-serif", cursor: saving || !form.weight_kg ? "not-allowed" : "pointer" }}>
              {saving ? "Saving..." : "Save Entry"}
            </button>
          </form>
        </div>

        {/* Chart */}
        {logs.length >= 2 && <WeightChart logs={logs} />}

        {/* Log entries */}
        {logs.length > 0 && (
          <div style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 8, padding: "24px" }}>
            <div style={{ fontSize: 11, color: "#C9A84C", letterSpacing: 3, textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 700, marginBottom: 16 }}>Entry History</div>
            {logs.map((log, i) => (
              <div key={log.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: i < logs.length - 1 ? "1px solid #f0ece4" : "none" }}>
                <div style={{ width: 52, textAlign: "center", background: "#fafaf8", border: "1px solid #e8e4dc", borderRadius: 6, padding: "6px 4px", flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1e2d4a", fontFamily: "Georgia, serif" }}>{log.weight_kg}</div>
                  <div style={{ fontSize: 9, color: "#C9A84C", fontFamily: "sans-serif", fontWeight: 700 }}>kg</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#1e2d4a", fontFamily: "sans-serif" }}>
                    {new Date(log.date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </div>
                  {log.notes && <div style={{ fontSize: 12, color: "#888", fontFamily: "sans-serif", marginTop: 3, fontStyle: "italic" }}>&ldquo;{log.notes}&rdquo;</div>}
                </div>
                <button
                  onClick={() => handleDelete(log.id, log.date)}
                  disabled={deleteId === log.id}
                  style={{ background: "none", border: "none", color: "#ddd", fontSize: 16, cursor: "pointer", padding: "4px 6px" }}
                  title="Delete entry"
                >×</button>
              </div>
            ))}
          </div>
        )}

        {logs.length === 0 && (
          <div style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 8, padding: "48px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 14 }}>📈</div>
            <div style={{ fontSize: 16, color: "#1e2d4a", fontFamily: "Georgia, serif", marginBottom: 8 }}>No entries yet</div>
            <p style={{ fontSize: 14, color: "#aaa", fontFamily: "sans-serif", lineHeight: 1.7 }}>Log your first weight entry above and start tracking your journey.</p>
          </div>
        )}
      </div>

      <footer style={{ background: "#fff", borderTop: "1px solid #e8e4dc", padding: "28px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <Link href="/" style={{ fontSize: 18, color: "#1e2d4a", lineHeight: 1, textDecoration: "none" }}>
          <span style={{ fontStyle: "italic", fontWeight: 300 }}>her</span>
          <span style={{ fontWeight: 800 }}>coach.</span>
          <span style={{ color: "#C9A84C", fontFamily: "'Great Vibes', cursive", fontWeight: 400, fontSize: 16, marginLeft: 1, verticalAlign: "middle" }}>Jess</span>
        </Link>
        <div style={{ fontSize: 12, color: "#bbb", fontFamily: "sans-serif" }}>© 2026 HerCoachJess. All rights reserved.</div>
      </footer>
    </div>
  );
}
