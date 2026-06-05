import { useState, useEffect } from "react";
import BaseballPool from "./BaseballPool";
import GolfPool from "./GolfPool";
import { supabase } from "./supabase";

// Google Fonts
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700&display=swap";
document.head.appendChild(fontLink);

const DISPLAY = "'Bebas Neue', sans-serif";
const BODY = "'Inter', sans-serif";

function useIsMobile() {
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return mobile;
}

// ── AUTH MODAL ────────────────────────────────────────────────────────────────
function AuthModal({ onClose, onAuth }) {
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const inp = {
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 8, color: "#f0f2f5", padding: "11px 14px", fontSize: 14,
    width: "100%", outline: "none", fontFamily: BODY, boxSizing: "border-box",
  };

  async function handleSubmit() {
    setErr(""); setLoading(true);
    if (mode === "signup") {
      if (!name.trim()) { setErr("Enter your name."); setLoading(false); return; }
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name.trim() } } });
      if (error) { setErr(error.message); setLoading(false); return; }
      // Auto sign in after signup
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (!signInErr && signInData.user) { onAuth(signInData.user); setLoading(false); onClose(); return; }
      setSuccess("Account created! You can now sign in.");
      setLoading(false); setMode("signin");
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setErr(error.message); setLoading(false); return; }
      onAuth(data.user); setLoading(false); onClose();
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#2c2c2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 28, width: "100%", maxWidth: 380, fontFamily: BODY }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 24, letterSpacing: "0.06em", color: "#4ab8f0" }}>
            {mode === "signin" ? "SIGN IN" : "CREATE ACCOUNT"}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>

        {success && <div style={{ color: "#4ae84a", background: "rgba(74,232,74,0.08)", border: "1px solid rgba(74,232,74,0.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13 }}>{success}</div>}
        {err && <div style={{ color: "#e05050", background: "rgba(224,80,80,0.08)", border: "1px solid rgba(224,80,80,0.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13 }}>{err}</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "signup" && (
            <div>
              <label style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 6, display: "block", fontWeight: 600 }}>Your Name</label>
              <input style={inp} placeholder="e.g. Jackson" value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}
          <div>
            <label style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 6, display: "block", fontWeight: 600 }}>Email</label>
            <input style={inp} type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} autoComplete="email" />
          </div>
          <div>
            <label style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 6, display: "block", fontWeight: 600 }}>Password</label>
            <input style={inp} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} autoComplete={mode === "signup" ? "new-password" : "current-password"} />
          </div>
          {mode === "signin" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" id="rememberMe" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#4ab8f0" }} />
              <label htmlFor="rememberMe" style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", cursor: "pointer", fontFamily: BODY }}>Remember me</label>
            </div>
          )}
        </div>

        <button onClick={handleSubmit} disabled={loading} style={{
          width: "100%", marginTop: 20, padding: "12px", borderRadius: 8,
          background: "rgba(74,184,240,0.15)", color: "#4ab8f0",
          border: "1px solid rgba(74,184,240,0.3)", fontSize: 14, fontWeight: 600,
          cursor: "pointer", fontFamily: BODY, opacity: loading ? 0.5 : 1,
        }}>
          {loading ? "..." : mode === "signin" ? "Sign In →" : "Create Account →"}
        </button>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
          {mode === "signin" ? (
            <span>No account? <button onClick={() => { setMode("signup"); setErr(""); setSuccess(""); }} style={{ background: "none", border: "none", color: "#4ab8f0", cursor: "pointer", fontFamily: BODY, fontSize: 13 }}>Create one</button></span>
          ) : (
            <span>Already have an account? <button onClick={() => { setMode("signin"); setErr(""); setSuccess(""); }} style={{ background: "none", border: "none", color: "#4ab8f0", cursor: "pointer", fontFamily: BODY, fontSize: 13 }}>Sign in</button></span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── SIGN IN PAGE ──────────────────────────────────────────────────────────────
function SignInPage({ onAuth }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const inp = {
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10, color: "#f0f2f5", padding: "13px 16px", fontSize: 15,
    width: "100%", outline: "none", fontFamily: BODY, boxSizing: "border-box",
  };

  async function handleSubmit() {
    setErr(""); setLoading(true);
    if (mode === "signup") {
      if (!name.trim()) { setErr("Enter your name."); setLoading(false); return; }
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name.trim() } } });
      if (error) { setErr(error.message); setLoading(false); return; }
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (!signInErr) { onAuth(data.user); setLoading(false); return; }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setErr(error.message); setLoading(false); return; }
      onAuth(data.user);
    }
    setLoading(false);
  }

  return (
    <div style={{ fontFamily: BODY, minHeight: "100vh", background: "#2c2c2e", color: "#f0f2f5", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 400, textAlign: "center" }}>
        {/* Logo */}
        <div style={{ fontSize: 52, marginBottom: 16 }}>🏟️</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 42, letterSpacing: "0.08em", color: "#4ab8f0", lineHeight: 0.95, marginBottom: 8 }}>FELLOWSHIP SPORTS</div>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.3em", color: "rgba(74,184,240,0.6)", textTransform: "uppercase", marginBottom: 32 }}>
          Compete · Connect · Win Together
        </div>

        {/* Card */}
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 28, textAlign: "left" }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 22, letterSpacing: "0.06em", color: "#f0f2f5", marginBottom: 20, textAlign: "center" }}>
            {mode === "signin" ? "SIGN IN" : "CREATE ACCOUNT"}
          </div>

          {err && <div style={{ color: "#e05050", background: "rgba(224,80,80,0.08)", border: "1px solid rgba(224,80,80,0.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13 }}>{err}</div>}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mode === "signup" && (
              <div>
                <label style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 6, display: "block", fontWeight: 600 }}>Your Name</label>
                <input style={inp} placeholder="e.g. Jackson" value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
              </div>
            )}
            <div>
              <label style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 6, display: "block", fontWeight: 600 }}>Email</label>
              <input style={inp} type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} autoComplete="email" />
            </div>
            <div>
              <label style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 6, display: "block", fontWeight: 600 }}>Password</label>
              <input style={inp} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} autoComplete={mode === "signup" ? "new-password" : "current-password"} />
            </div>
          </div>

          <button onClick={handleSubmit} disabled={loading} style={{
            width: "100%", marginTop: 20, padding: "14px",
            borderRadius: 10, background: "rgba(74,184,240,0.15)", color: "#4ab8f0",
            border: "1px solid rgba(74,184,240,0.3)", fontSize: 15, fontWeight: 700,
            cursor: "pointer", fontFamily: BODY, opacity: loading ? 0.5 : 1,
          }}>
            {loading ? "..." : mode === "signin" ? "Sign In →" : "Create Account →"}
          </button>

          <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
            {mode === "signin" ? (
              <span>No account? <button onClick={() => { setMode("signup"); setErr(""); }} style={{ background: "none", border: "none", color: "#4ab8f0", cursor: "pointer", fontFamily: BODY, fontSize: 13 }}>Create one</button></span>
            ) : (
              <span>Already have an account? <button onClick={() => { setMode("signin"); setErr(""); }} style={{ background: "none", border: "none", color: "#4ab8f0", cursor: "pointer", fontFamily: BODY, fontSize: 13 }}>Sign in</button></span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("home");
  const isMobile = useIsMobile();
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
  }

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || null;

  if (tab === "baseball") return <BaseballPool onBack={() => setTab("home")} user={user} />;
  if (tab === "golf") return <GolfPool onBack={() => setTab("home")} user={user} />;

  // Show sign in page if not logged in
  if (!user) return <SignInPage onAuth={setUser} />;

  return (
    <div style={{ fontFamily: BODY, minHeight: "100vh", background: "#2c2c2e", color: "#f0f2f5" }}>

      {/* Header */}
      <header style={{
        background: "rgba(44,44,46,0.97)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: isMobile ? "0 14px" : "0 28px", display: "flex", alignItems: "center",
        justifyContent: "space-between", height: 54,
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => setTab("home")}>
          <span style={{ fontSize: 18 }}>🏟️</span>
          <div style={{ fontFamily: DISPLAY, fontSize: isMobile ? 16 : 22, letterSpacing: "0.08em", color: "#4ab8f0", lineHeight: 1 }}>
            FELLOWSHIP SPORTS
          </div>
        </div>
        <nav style={{ display: "flex", gap: 5, alignItems: "center" }}>
          {[
            { key: "home", label: "Home", accent: "#4ab8f0" },
            { key: "baseball", label: isMobile ? "⚾" : "⚾  Baseball", accent: "#e05050" },
            { key: "golf", label: isMobile ? "⛳" : "⛳  Golf", accent: "#c8a84b" },
          ].map(({ key, label, accent }) => (
            <button key={key} onClick={() => setTab(key)} style={{
              background: tab === key ? `${accent}18` : "transparent",
              color: tab === key ? accent : "rgba(255,255,255,0.4)",
              border: `1px solid ${tab === key ? `${accent}50` : "rgba(255,255,255,0.08)"}`,
              borderRadius: 8, padding: isMobile ? "6px 10px" : "6px 16px", fontSize: isMobile ? 14 : 13,
              fontFamily: BODY, fontWeight: 500, cursor: "pointer",
            }}>{label}</button>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 4 }}>
            {!isMobile && <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: BODY }}>👤 {userName}</span>}
            <button onClick={signOut} style={{
              background: "transparent", color: "rgba(255,255,255,0.4)",
              border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8,
              padding: "6px 10px", fontSize: 12, cursor: "pointer", fontFamily: BODY,
            }}>Sign Out</button>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 16px" }}>
        <div style={{ textAlign: "center", padding: isMobile ? "40px 0 32px" : "72px 0 56px" }}>
          <div style={{ fontSize: isMobile ? 44 : 56, marginBottom: isMobile ? 16 : 28 }}>🏟️</div>
          <div style={{ fontFamily: DISPLAY, fontSize: isMobile ? 48 : 72, letterSpacing: "0.06em", color: "#4ab8f0", lineHeight: 0.95, marginBottom: 14 }}>
            FELLOWSHIP SPORTS
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.3em", color: "#4ab8f0", textTransform: "uppercase", marginBottom: 16 }}>
            Compete · Connect · Win Together
          </div>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, maxWidth: 400, margin: "0 auto", fontWeight: 300, lineHeight: 1.6 }}>
            Pick'em pools for you and your crew. Two pools live now — jump in before the deadlines.
          </p>

          {user && <div style={{ marginTop: 16, fontSize: 13, color: "rgba(255,255,255,0.4)", fontFamily: BODY }}>Welcome back, <strong style={{ color: "#4ab8f0" }}>{userName}</strong> 👋</div>}
        </div>

        {/* Pool Cards */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14, marginBottom: 20 }}>
          <div onClick={() => setTab("baseball")} style={{ background: "rgba(224,80,80,0.12)", border: "1px solid rgba(224,80,80,0.2)", borderTop: "3px solid #e05050", borderRadius: 16, padding: isMobile ? 20 : 28, cursor: "pointer" }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>⚾</div>
            <div style={{ fontFamily: DISPLAY, fontSize: isMobile ? 24 : 28, letterSpacing: "0.06em", color: "#ff6060", marginBottom: 8 }}>NCAA BASEBALL</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 16, lineHeight: 1.6, fontWeight: 300 }}>Pick all 8 Super Regional winners · CWS bracket winner & runner-up · National champion.</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 3, fontWeight: 600 }}>Entry Deadline</div>
                <div style={{ fontSize: 13, color: "#e05050", fontWeight: 600 }}>Thu June 5 · 2:59 PM ET</div>
              </div>
              <div style={{ background: "rgba(74,232,74,0.1)", color: "#4ae84a", fontSize: 11, padding: "5px 10px", borderRadius: 20, border: "1px solid rgba(74,232,74,0.2)", fontWeight: 600 }}>● OPEN</div>
            </div>
          </div>

          <div onClick={() => setTab("golf")} style={{ background: "rgba(200,168,75,0.1)", border: "1px solid rgba(200,168,75,0.2)", borderTop: "3px solid #c8a84b", borderRadius: 16, padding: isMobile ? 20 : 28, cursor: "pointer" }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>⛳</div>
            <div style={{ fontFamily: DISPLAY, fontSize: isMobile ? 24 : 28, letterSpacing: "0.06em", color: "#d4b050", marginBottom: 8 }}>US OPEN GOLF</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 16, lineHeight: 1.6, fontWeight: 300 }}>Pick 1 golfer from each of 6 tiers · Best 4 scores count · Lowest total wins.</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 3, fontWeight: 600 }}>Entry Deadline</div>
                <div style={{ fontSize: 13, color: "#c8a84b", fontWeight: 600 }}>Wed June 17 · 11:59 PM ET</div>
              </div>
              <div style={{ background: "rgba(74,232,74,0.1)", color: "#4ae84a", fontSize: 11, padding: "5px 10px", borderRadius: 20, border: "1px solid rgba(74,232,74,0.2)", fontWeight: 600 }}>● OPEN</div>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: isMobile ? "20px 16px" : "28px 32px", marginBottom: 40 }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 20, letterSpacing: "0.08em", color: "rgba(255,255,255,0.5)", marginBottom: 16, textAlign: "center" }}>HOW IT WORKS</div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 12 }}>
            {[
              ["01", "Pick a Pool", "Choose Baseball or Golf. Create a group and share your invite code with friends."],
              ["02", "Make Picks", "Lock in your picks before the deadline. Every pool has its own format and scoring."],
              ["03", "Compete Live", "Scores sync from ESPN automatically. Leaderboard updates in real time."],
            ].map(([num, title, desc]) => (
              <div key={num} style={{ padding: isMobile ? "14px 12px" : "20px 16px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", display: isMobile ? "flex" : "block", alignItems: "flex-start", gap: 12 }}>
                <div style={{ fontFamily: DISPLAY, fontSize: isMobile ? 24 : 32, color: "#4ab8f0", opacity: 0.3, letterSpacing: "0.05em", flexShrink: 0 }}>{num}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.8)", marginBottom: 4 }}>{title}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, fontWeight: 300 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
