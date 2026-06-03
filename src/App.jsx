import { useState } from "react";
import BaseballPool from "./BaseballPool";
import GolfPool from "./GolfPool";

// Google Fonts — inject into head
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700&display=swap";
document.head.appendChild(fontLink);

const DISPLAY = "'Bebas Neue', sans-serif";
const BODY = "'Inter', sans-serif";

export default function App() {
  const [tab, setTab] = useState("home");

  if (tab === "baseball") return <BaseballPool onBack={() => setTab("home")} />;
  if (tab === "golf") return <GolfPool onBack={() => setTab("home")} />;

  return (
    <div style={{ fontFamily: BODY, minHeight: "100vh", background: "#2c2c2e", color: "#f0f2f5" }}>

      {/* Header */}
      <header style={{
        background: "rgba(44,44,46,0.97)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "0 28px", display: "flex", alignItems: "center",
        justifyContent: "space-between", height: 58,
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setTab("home")}>
          <span style={{ fontSize: 20 }}>🏟️</span>
          <div style={{ fontFamily: DISPLAY, fontSize: 22, letterSpacing: "0.08em", color: "#4ab8f0", lineHeight: 1 }}>
            FELLOWSHIP SPORTS
          </div>
        </div>
        <nav style={{ display: "flex", gap: 6 }}>
          {[
            { key: "home", label: "Home", accent: "#4ab8f0" },
            { key: "baseball", label: "⚾  Baseball", accent: "#e05050" },
            { key: "golf", label: "⛳  Golf", accent: "#c8a84b" },
          ].map(({ key, label, accent }) => (
            <button key={key} onClick={() => setTab(key)} style={{
              background: tab === key ? `${accent}18` : "transparent",
              color: tab === key ? accent : "rgba(255,255,255,0.4)",
              border: `1px solid ${tab === key ? `${accent}50` : "rgba(255,255,255,0.08)"}`,
              borderRadius: 8, padding: "6px 16px", fontSize: 13,
              fontFamily: BODY, fontWeight: 500, cursor: "pointer",
              letterSpacing: "0.01em",
            }}>{label}</button>
          ))}
        </nav>
      </header>

      {/* Hero */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 20px" }}>
        <div style={{ textAlign: "center", padding: "72px 0 56px" }}>
          <div style={{ fontSize: 56, marginBottom: 28 }}>🏟️</div>
          <div style={{
            fontFamily: DISPLAY, fontSize: 72, letterSpacing: "0.06em",
            color: "#4ab8f0", lineHeight: 0.95, marginBottom: 14,
          }}>
            FELLOWSHIP SPORTS
          </div>
          <div style={{
            fontSize: 11, fontWeight: 600, letterSpacing: "0.3em",
            color: "#4ab8f0", textTransform: "uppercase", marginBottom: 16,
          }}>
            Compete · Connect · Win Together
          </div>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 15, maxWidth: 400, margin: "0 auto", fontWeight: 300, lineHeight: 1.6 }}>
            Pick'em pools for you and your crew. Two pools live now — jump in before the deadlines.
          </p>
        </div>

        {/* Pool Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          {/* Baseball */}
          <div onClick={() => setTab("baseball")} style={{
            background: "rgba(224,80,80,0.12)",
            border: "1px solid rgba(224,80,80,0.2)", borderTop: "3px solid #e05050",
            borderRadius: 16, padding: 28, cursor: "pointer",
          }}>
            <div style={{ fontSize: 32, marginBottom: 14 }}>⚾</div>
            <div style={{ fontFamily: DISPLAY, fontSize: 28, letterSpacing: "0.06em", color: "#ff6060", marginBottom: 8 }}>
              NCAA BASEBALL
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 20, lineHeight: 1.6, fontWeight: 300 }}>
              Pick all 8 Super Regional winners · CWS bracket winner & runner-up · National champion.
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 3, fontWeight: 600 }}>Entry Deadline</div>
                <div style={{ fontSize: 13, color: "#e05050", fontWeight: 600 }}>Thu June 5 · 2:59 PM ET</div>
              </div>
              <div style={{ background: "rgba(74,232,74,0.1)", color: "#4ae84a", fontSize: 11, padding: "5px 12px", borderRadius: 20, border: "1px solid rgba(74,232,74,0.2)", fontWeight: 600, letterSpacing: "0.05em" }}>
                ● OPEN
              </div>
            </div>
          </div>

          {/* Golf */}
          <div onClick={() => setTab("golf")} style={{
            background: "rgba(200,168,75,0.1)",
            border: "1px solid rgba(200,168,75,0.2)", borderTop: "3px solid #c8a84b",
            borderRadius: 16, padding: 28, cursor: "pointer",
          }}>
            <div style={{ fontSize: 32, marginBottom: 14 }}>⛳</div>
            <div style={{ fontFamily: DISPLAY, fontSize: 28, letterSpacing: "0.06em", color: "#d4b050", marginBottom: 8 }}>
              US OPEN GOLF
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 20, lineHeight: 1.6, fontWeight: 300 }}>
              Pick 1 golfer from each of 6 tiers · Best 4 scores count · Lowest total wins.
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 3, fontWeight: 600 }}>Entry Deadline</div>
                <div style={{ fontSize: 13, color: "#c8a84b", fontWeight: 600 }}>Wed June 17 · 11:59 PM ET</div>
              </div>
              <div style={{ background: "rgba(74,232,74,0.1)", color: "#4ae84a", fontSize: 11, padding: "5px 12px", borderRadius: 20, border: "1px solid rgba(74,232,74,0.2)", fontWeight: 600, letterSpacing: "0.05em" }}>
                ● OPEN
              </div>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "28px 32px", marginBottom: 40 }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 20, letterSpacing: "0.08em", color: "rgba(255,255,255,0.5)", marginBottom: 20, textAlign: "center" }}>
            HOW IT WORKS
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {[
              ["01", "Pick a Pool", "Choose Baseball or Golf. Create a group and share your invite code with friends."],
              ["02", "Make Picks", "Lock in your picks before the deadline. Every pool has its own format and scoring."],
              ["03", "Compete Live", "Scores sync from ESPN automatically. Leaderboard updates in real time."],
            ].map(([num, title, desc]) => (
              <div key={num} style={{ padding: "20px 16px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 32, color: "#4ab8f0", opacity: 0.3, marginBottom: 8, letterSpacing: "0.05em" }}>{num}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.8)", marginBottom: 6 }}>{title}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, fontWeight: 300 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
