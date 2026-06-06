import { useState, useEffect, useCallback } from "react";

function useIsMobile() {
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return mobile;
}
import { supabase } from "./supabase";

// ── SUPABASE SYNC (background only — localStorage is source of truth) ─────────
async function sbSync(pool, groupCode, groupName, memberId, memberName, picks, createdBy = null) {
  try {
    const groupData = { id: groupCode, pool, name: groupName };
    if (createdBy) groupData.created_by = createdBy;
    await supabase.from("groups").upsert(groupData, { onConflict: "id" });
    await supabase.from("members").upsert({ id: memberId, group_id: groupCode, name: memberName, picks }, { onConflict: "id" });
  } catch (e) { /* silent fail */ }
}

async function sbDeleteMember(memberId) {
  try { await supabase.from("members").delete().eq("id", memberId); } catch {}
}

async function sbDeleteGroup(groupCode) {
  try {
    await supabase.from("members").delete().eq("group_id", groupCode);
    await supabase.from("groups").delete().eq("id", groupCode);
  } catch {}
}

async function sbLoadUserGroups(userId, pool) {
  try {
    const { data } = await supabase.from("members").select("group_id, groups(id, name, pool, created_by)").eq("id", userId);
    return (data || []).filter(r => r.groups?.pool === pool).map(r => r.groups);
  } catch { return []; }
}
async function sbGetMembers(groupCode) {
  try {
    const { data } = await supabase.from("members").select("*").eq("group_id", groupCode);
    return data || [];
  } catch { return []; }
}

const DISPLAY = "'Bebas Neue', sans-serif";
const BODY = "'Inter', sans-serif";

// ── 2026 SUPER REGIONALS ──────────────────────────────────────────────────────
// CWS bracket side predetermined from original NCAA bracket (no reseeding)
// Bracket 1: Seeds 3,4,15,16 | Bracket 2: Seeds 5,6,7, Troy (seed 8's half)
const TEAM_INFO = {
  "Georgia":        { color: "#BA0C2F", logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/61.png" },
  "Mississippi St": { color: "#5D1F7A", logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/344.png" },
  "Auburn":         { color: "#0C2340", logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/2.png" },
  "Ole Miss":       { color: "#CE1126", logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/145.png" },
  "Kansas":         { color: "#0051A5", logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/2305.png" },
  "Oklahoma":       { color: "#841617", logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/201.png" },
  "West Virginia":  { color: "#002855", logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/277.png" },
  "Cal Poly":       { color: "#154734", logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/13.png" },
  "North Carolina": { color: "#7BAFD4", logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/153.png" },
  "USC":            { color: "#990000", logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/30.png" },
  "Texas":          { color: "#BF5700", logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/251.png" },
  "Oregon":         { color: "#154733", logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/2483.png" },
  "Alabama":        { color: "#9E1B32", logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/333.png" },
  "St. John's":     { color: "#D10A13", logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/2599.png" },
  "Troy":           { color: "#8B2332", logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/2653.png" },
  "Little Rock":    { color: "#75174E", logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/2031.png" },
};

function getTeamInfo(name) {
  return TEAM_INFO[name] || { color: "#444", logo: null };
}

const SUPER_REGIONALS = [
  { id: "uga",  host: "Georgia",        hostSeed: 3,  visitor: "Mississippi St", visitorSeed: 14,  location: "Athens, GA",       g1: "Sat June 6 · 11 AM ET",  cwsBracket: 1 },
  { id: "aub",  host: "Auburn",         hostSeed: 4,  visitor: "Ole Miss",       visitorSeed: null, location: "Auburn, AL",       g1: "Fri June 5 · 8 PM ET",   cwsBracket: 1 },
  { id: "kan",  host: "Kansas",         hostSeed: 15, visitor: "Oklahoma",       visitorSeed: null, location: "Lawrence, KS",     g1: "Sat June 6 · 6 PM ET",   cwsBracket: 1 },
  { id: "wvu",  host: "West Virginia",  hostSeed: 16, visitor: "Cal Poly",       visitorSeed: null, location: "Morgantown, WV",   g1: "Fri June 5 · Noon ET",   cwsBracket: 1 },
  { id: "unc",  host: "North Carolina", hostSeed: 5,  visitor: "USC",            visitorSeed: null, location: "Chapel Hill, NC",  g1: "Fri June 5 · 3 PM ET",   cwsBracket: 2 },
  { id: "tex",  host: "Texas",          hostSeed: 6,  visitor: "Oregon",         visitorSeed: 11,   location: "Austin, TX",       g1: "Sat June 6 · 8 PM ET",   cwsBracket: 2 },
  { id: "ala",  host: "Alabama",        hostSeed: 7,  visitor: "St. John's",     visitorSeed: null, location: "Tuscaloosa, AL",   g1: "Sat June 6 · 9 PM ET",   cwsBracket: 2 },
  { id: "troy", host: "Troy",           hostSeed: null,visitor: "Little Rock",   visitorSeed: null, location: "Troy, AL",         g1: "Fri June 5 · 5 PM ET",   cwsBracket: 2 },
];

const SR_DEADLINE  = new Date("2026-06-05T18:59:00Z"); // Fri June 5 2:59 PM ET
const CWS_DEADLINE = new Date("2026-06-12T16:00:00Z"); // Fri June 12 noon ET
const srDeadlinePassed  = () => new Date() > SR_DEADLINE;
const cwsDeadlinePassed = () => new Date() > CWS_DEADLINE;

function genCode() { return Math.random().toString(36).substring(2, 7).toUpperCase(); }

const DB_KEY = "fellowship_baseball_v2";
function loadDB() { try { return JSON.parse(localStorage.getItem(DB_KEY)) || { groups: {} }; } catch { return { groups: {} }; } }
function saveDB(db) { try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch {} }

const ESPN_BB_URL = "https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard?limit=50&groups=50&dates=20260605-20260610";

const bBtn = (color) => ({
  background: `${color}22`, color, border: `1px solid ${color}44`,
  borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 600,
  cursor: "pointer", fontFamily: BODY, letterSpacing: "0.02em",
});
const inp = {
  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 8, color: "#f0f2f5", padding: "11px 14px", fontSize: 14,
  width: "100%", outline: "none", fontFamily: BODY, boxSizing: "border-box",
};
const card = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 22, marginBottom: 14 };
const lbl  = { fontSize: 10, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 6, display: "block", fontWeight: 600 };

function nameMatch(pick, winner) {
  if (!pick || !winner) return false;
  return pick.toLowerCase().includes(winner.toLowerCase().split(" ").pop()) ||
         winner.toLowerCase().includes(pick.toLowerCase().split(" ").pop());
}

function TeamBtn({ team, seed, selected, onClick, isWinner }) {
  const info = getTeamInfo(team);
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 10, width: "100%",
      background: selected ? `${info.color}25` : isWinner ? "rgba(74,232,74,0.08)" : "rgba(255,255,255,0.03)",
      color: selected ? "#ffffff" : isWinner ? "#4ae84a" : "rgba(255,255,255,0.7)",
      border: `1px solid ${selected ? info.color : isWinner ? "rgba(74,232,74,0.2)" : "rgba(255,255,255,0.06)"}`,
      borderLeft: selected ? `3px solid ${info.color}` : isWinner ? "3px solid #4ae84a" : "3px solid transparent",
      borderRadius: 8, padding: "9px 14px", fontSize: 13, cursor: "pointer",
      fontWeight: selected ? 600 : 400, textAlign: "left", fontFamily: BODY,
    }}>
      {info.logo && (
        <img src={info.logo} alt={team} style={{ width: 22, height: 22, objectFit: "contain", flexShrink: 0 }}
          onError={e => e.target.style.display = "none"} />
      )}
      {seed && <span style={{ fontSize: 10, opacity: 0.45, minWidth: 18, fontWeight: 600 }}>#{seed}</span>}
      <span style={{ flex: 1 }}>{team}</span>
      {isWinner && <span style={{ fontSize: 10, color: "#4ae84a", fontWeight: 600 }}>ADV ✓</span>}
      {selected && !isWinner && <span style={{ fontSize: 10, color: info.color, filter: "brightness(1.5)" }}>● PICK</span>}
    </button>
  );
}

function SRCard({ sr, picks, onChange, liveResults, liveGames }) {
  const winner = liveResults[sr.id];
  const game = liveGames?.[sr.id];
  const userPick = picks[sr.id];
  const pickInfo = userPick ? getTeamInfo(userPick) : null;
  const hostInfo = getTeamInfo(sr.host);
  const visitorInfo = getTeamInfo(sr.visitor);

  const isLive = game?.statusState === "in";
  const isFinal = game?.completed;

  return (
    <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.07)", borderLeft: pickInfo ? `3px solid ${pickInfo.color}` : "3px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 14, cursor: "pointer" }}>

      {/* Header: location + live/final status */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontFamily: BODY }}>{sr.location} · {sr.g1}</div>
        {isLive && <div style={{ fontSize: 10, color: "#4ae84a", fontWeight: 600, fontFamily: BODY }}>● LIVE</div>}
        {isFinal && !game?.seriesComplete && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600, fontFamily: BODY }}>GAME FINAL</div>}
        {game?.seriesComplete && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600, fontFamily: BODY }}>SERIES FINAL</div>}
      </div>

      {/* Main row: matchup + pick */}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>

        {/* Matchup */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          {/* Host */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {hostInfo.logo && <img src={hostInfo.logo} alt={sr.host} style={{ width: 20, height: 20, objectFit: "contain", flexShrink: 0 }} onError={e => e.target.style.display = "none"} />}
            <span style={{ fontSize: 13, fontFamily: BODY, fontWeight: userPick === sr.host ? 600 : 400, color: userPick === sr.host ? "#ffffff" : "rgba(255,255,255,0.7)" }}>
              {sr.hostSeed && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginRight: 3 }}>#{sr.hostSeed}</span>}
              {sr.host}
            </span>
            {(isLive || isFinal) && <span style={{ marginLeft: "auto", fontSize: 14, fontWeight: 700, color: "#f0f2f5" }}>{game.homeTeam?.toLowerCase().includes(sr.host.split(" ").pop().toLowerCase()) ? game.homeScore : game.awayScore}</span>}
          </div>

          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: BODY, paddingLeft: 28 }}>vs</div>

          {/* Visitor */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {visitorInfo.logo && <img src={visitorInfo.logo} alt={sr.visitor} style={{ width: 20, height: 20, objectFit: "contain", flexShrink: 0 }} onError={e => e.target.style.display = "none"} />}
            <span style={{ fontSize: 13, fontFamily: BODY, fontWeight: userPick === sr.visitor ? 600 : 400, color: userPick === sr.visitor ? "#ffffff" : "rgba(255,255,255,0.7)" }}>
              {sr.visitorSeed && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginRight: 3 }}>#{sr.visitorSeed}</span>}
              {sr.visitor}
            </span>
            {(isLive || isFinal) && <span style={{ marginLeft: "auto", fontSize: 14, fontWeight: 700, color: "#f0f2f5" }}>{game.homeTeam?.toLowerCase().includes(sr.visitor.split(" ").pop().toLowerCase()) ? game.homeScore : game.awayScore}</span>}
          </div>

          {/* Series record — removed from here, shown in bottom bar */}
        </div>

        {/* Pick column */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 64 }}>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", fontFamily: BODY, textTransform: "uppercase", letterSpacing: "0.1em" }}>Pick</div>
          {userPick ? (
            <>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${pickInfo.color}22`, border: `2px solid ${pickInfo.color}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {pickInfo.logo
                  ? <img src={pickInfo.logo} alt={userPick} style={{ width: 24, height: 24, objectFit: "contain" }} onError={e => e.target.style.display = "none"} />
                  : <span style={{ fontSize: 10, color: pickInfo.color, fontWeight: 600 }}>{userPick.split(" ").pop().slice(0,3).toUpperCase()}</span>
                }
              </div>
              <div style={{ fontSize: 11, color: pickInfo.color, fontWeight: 600, fontFamily: BODY, textAlign: "center", lineHeight: 1.2 }}>{userPick.split(" ").pop()}</div>
            </>
          ) : (
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: "1.5px dashed rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 16, color: "rgba(255,255,255,0.2)" }}>?</span>
            </div>
          )}
        </div>
      </div>

      {/* Live scoreboard details */}
      {isLive && (
        <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 10, color: "#4ae84a", fontWeight: 600, fontFamily: BODY, minWidth: 40 }}>
            {game.isTopInning ? "▲" : "▼"}{game.inning}
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            {/* outs */}
            <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: i < game.outs ? "#e05050" : "rgba(255,255,255,0.15)" }} />
              ))}
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", marginLeft: 4, fontFamily: BODY }}>{game.outs} out{game.outs !== 1 ? "s" : ""}</span>
            </div>
          </div>
          {/* Bases */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 2, width: 30 }}>
            <div /><div style={{ width: 10, height: 10, transform: "rotate(45deg)", background: game.onSecond ? "#f0a500" : "rgba(255,255,255,0.15)", borderRadius: 2 }} /><div />
            <div style={{ width: 10, height: 10, transform: "rotate(45deg)", background: game.onThird ? "#f0a500" : "rgba(255,255,255,0.15)", borderRadius: 2 }} />
            <div />
            <div style={{ width: 10, height: 10, transform: "rotate(45deg)", background: game.onFirst ? "#f0a500" : "rgba(255,255,255,0.15)", borderRadius: 2 }} />
          </div>
        </div>
      )}

      {/* Series record bottom bar */}
      {game?.seriesWins && (() => {
        const entries = Object.entries(game.seriesWins);
        const leader = entries.reduce((a, b) => a[1] >= b[1] ? a : b, ["", 0]);
        const isTied = entries.length === 2 && entries[0][1] === entries[1][1];
        const leaderInfo = leader[0] ? getTeamInfo(leader[0]) : null;
        const barColor = isTied ? "rgba(255,255,255,0.08)" : (leaderInfo?.color || "rgba(255,255,255,0.08)");
        const opacity = game.seriesComplete ? 0.25 : 0.12;
        const totalGames = entries.reduce((s, [,w]) => s + w, 0);
        const gameLabel = `Game ${totalGames + (game.seriesComplete ? 0 : 0)}`;
        return (
          <div style={{ margin: "10px -14px -14px", padding: "5px 14px", background: `${barColor.startsWith("rgba") ? barColor : barColor + Math.round(opacity * 255).toString(16).padStart(2,"0")}`, borderTop: `1px solid ${isTied ? "rgba(255,255,255,0.06)" : `${leaderInfo?.color || "#fff"}22`}`, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: BODY }}>Series</span>
            <span style={{ fontSize: 11, fontWeight: 600, fontFamily: BODY, color: isTied ? "rgba(255,255,255,0.5)" : (leaderInfo?.color || "rgba(255,255,255,0.5)") }}>
              {entries.map(([team, wins]) => `${team.split(" ").pop()} ${wins}`).join(" · ")}
              {game.seriesComplete && " — series final"}
            </span>
          </div>
        );
      })()}

      {/* Winner pt result */}
      {winner && game?.seriesComplete && userPick && (
        <div style={{ marginTop: 6, fontSize: 11, fontFamily: BODY, fontWeight: 600, color: nameMatch(userPick, winner) ? "#4ae84a" : "#e05050" }}>
          {nameMatch(userPick, winner) ? "✓ Correct pick · +1 pt" : `✗ ${winner} won the series · 0 pts`}
        </div>
      )}

      {/* Tap to pick hint when no pick yet */}
      {!userPick && !winner && !isLive && !isFinal && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 5 }}>
          {[{ team: sr.host, seed: sr.hostSeed, info: hostInfo }, { team: sr.visitor, seed: sr.visitorSeed, info: visitorInfo }].map(({ team, seed, info }) => (
            <button key={team} onClick={() => onChange(sr.id, team)} style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontFamily: BODY,
              color: "rgba(255,255,255,0.6)", fontSize: 13, textAlign: "left",
            }}>
              {info.logo && <img src={info.logo} alt={team} style={{ width: 20, height: 20, objectFit: "contain" }} onError={e => e.target.style.display = "none"} />}
              {seed && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>#{seed}</span>}
              <span style={{ flex: 1 }}>{team}</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>Pick →</span>
            </button>
          ))}
        </div>
      )}
      {/* Change pick buttons when pick exists but game not started */}
      {userPick && !winner && !isLive && !isFinal && (
        <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
          {[sr.host, sr.visitor].filter(t => t !== userPick).map(t => (
            <button key={t} onClick={() => onChange(sr.id, t)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "rgba(255,255,255,0.35)", fontSize: 10, cursor: "pointer", fontFamily: BODY, padding: "3px 8px" }}>
              Switch to {t.split(" ").pop()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CWSBracketSide({ bracketNum, srPicks, liveResults, winnerPick, runnerUpPick, onPickWinner, onPickRunnerUp, accentColor, locked }) {
  const mySRs = SUPER_REGIONALS.filter(sr => sr.cwsBracket === bracketNum);
  const teams = mySRs.map(sr => ({
    sr,
    team: liveResults[sr.id] || srPicks[sr.id] || null,
    confirmed: !!liveResults[sr.id],
  }));
  const allKnown = teams.every(t => t.team);

  function getLabel(team) {
    if (winnerPick === team)   return { text: "● WINNER",    color: accentColor };
    if (runnerUpPick === team) return { text: "● RUNNER-UP", color: "#c8a84b" };
    return null;
  }

  function handleClick(team) {
    if (locked || !team) return;
    // First click = winner, second click on different = runner-up, click winner again = deselect
    if (!winnerPick) { onPickWinner(team); return; }
    if (winnerPick === team) { onPickWinner(null); if (runnerUpPick) onPickRunnerUp(null); return; }
    if (!runnerUpPick) { onPickRunnerUp(team); return; }
    if (runnerUpPick === team) { onPickRunnerUp(null); return; }
    // Already have both — swap runner-up
    onPickRunnerUp(team);
  }

  return (
    <div style={{ flex: 1, background: `${accentColor}08`, border: `1px solid ${accentColor}25`, borderRadius: 14, padding: 18 }}>
      <div style={{ fontFamily: DISPLAY, fontSize: 22, letterSpacing: "0.06em", color: accentColor, marginBottom: 4 }}>BRACKET {bracketNum}</div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: BODY, marginBottom: 6, lineHeight: 1.5 }}>
        4 teams · Double elimination<br/>
        1st click = Winner · 2nd click = Runner-up
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: "#4ae84a", fontFamily: BODY, fontWeight: 600 }}>Winner = 2 pts</div>
        <div style={{ fontSize: 11, color: "#e05050", fontFamily: BODY, fontWeight: 600 }}>Runner-up = 1 pt</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 }}>
        {teams.map(({ sr, team, confirmed }) => {
          const badge = team ? getLabel(team) : null;
          const isWinner   = winnerPick === team;
          const isRunnerUp = runnerUpPick === team;
          const info = team ? getTeamInfo(team) : null;
          return (
            <div key={sr.id} onClick={() => handleClick(team)} style={{
              display: "flex", alignItems: "center", gap: 10,
              background: isWinner ? `${info?.color || accentColor}20` : isRunnerUp ? `${info?.color || "#c8a84b"}20` : "rgba(255,255,255,0.03)",
              border: `1px solid ${isWinner ? (info?.color || accentColor) : isRunnerUp ? (info?.color || "#c8a84b") : "rgba(255,255,255,0.06)"}`,
              borderLeft: info ? `3px solid ${info.color}` : "3px solid transparent",
              borderRadius: 8, padding: "10px 14px",
              cursor: !locked && team ? "pointer" : "default", opacity: team ? 1 : 0.4,
              transition: "all 0.1s",
            }}>
              {info?.logo && <img src={info.logo} alt={team} style={{ width: 22, height: 22, objectFit: "contain", flexShrink: 0 }} onError={e => e.target.style.display = "none"} />}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", fontFamily: BODY, fontWeight: isWinner || isRunnerUp ? 600 : 400 }}>
                  {team || `Winner: ${sr.host} vs ${sr.visitor}`}
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: BODY, marginTop: 1 }}>
                  {confirmed ? "✓ Confirmed" : team ? "From your SR pick" : sr.location}
                </div>
              </div>
              {isWinner   && <span style={{ fontSize: 10, color: "#4ae84a", fontWeight: 600, whiteSpace: "nowrap" }}>● WINNER</span>}
              {isRunnerUp && <span style={{ fontSize: 10, color: "#e05050", fontWeight: 600, whiteSpace: "nowrap" }}>● RUNNER-UP</span>}
            </div>
          );
        })}
      </div>

      {!allKnown && !locked && (
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: BODY, fontStyle: "italic", marginBottom: 10 }}>
          ⚠ Complete all SR picks to unlock
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {[[winnerPick, "Winner", "2 pts"], [runnerUpPick, "Runner-up", "1 pt"]].map(([pick, label, pts]) => {
          const info = pick ? getTeamInfo(pick) : null;
          return (
            <div key={label} style={{ background: info ? `${info.color}20` : "rgba(255,255,255,0.02)", border: `1px solid ${info ? info.color : "rgba(255,255,255,0.04)"}`, borderLeft: info ? `3px solid ${info.color}` : undefined, borderRadius: 8, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {info?.logo && <img src={info.logo} alt={pick} style={{ width: 20, height: 20, objectFit: "contain" }} onError={e => e.target.style.display = "none"} />}
                <div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: BODY, marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 13, color: pick ? "#ffffff" : "rgba(255,255,255,0.4)", fontWeight: 600, fontFamily: BODY }}>{pick || "Not selected"}</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: BODY }}>{pts}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function BaseballPool({ onBack, user }) {
  const isMobile = useIsMobile();
  const [db, setDB]               = useState(loadDB);
  const [view, setView]           = useState("home");
  const [cg, setCG]               = useState(null);
  const [cu, setCU]               = useState(null);
  const [name, setName]           = useState("");
  const [grpName, setGrpName]     = useState("");
  const [joinCode, setJoinCode]   = useState("");
  const [err, setErr]             = useState("");
  const [msg, setMsg]             = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminPwInput, setAdminPwInput]   = useState("");
  const [adminPwErr, setAdminPwErr]       = useState(false);
  const [adminScoreInput, setAdminScoreInput] = useState("");
  const [srPicks, setSrPicks]     = useState({});
  const [b1Pick, setB1Pick]       = useState(null);
  const [b1Runner, setB1Runner]   = useState(null);
  const [b2Pick, setB2Pick]       = useState(null);
  const [b2Runner, setB2Runner]   = useState(null);
  const [champPick, setChampPick] = useState(null);
  const [activeTab, setActiveTab] = useState("sr");
  const [expandedUser, setExpandedUser] = useState(null);
  const [liveResults, setLiveResults]   = useState({});
  const [liveGames, setLiveGames]       = useState({});
  const [liveStatus, setLiveStatus]     = useState("idle");
  const [lastSync, setLastSync]         = useState(null);

  const deadlineSR  = srDeadlinePassed();
  const deadlineCWS = cwsDeadlinePassed();

  const persist = (d) => { setDB(d); saveDB(d); };
  const flash   = (m, isErr = false) => { isErr ? setErr(m) : setMsg(m); setTimeout(() => isErr ? setErr("") : setMsg(""), 4000); };

  // Load user's groups from Supabase when logged in
  useEffect(() => {
    if (!user?.id) return;
    sbLoadUserGroups(user.id, "baseball").then(groups => {
      if (!groups.length) return;
      const localDB = loadDB();
      groups.forEach(g => {
        localDB.groups[g.id] = { code: g.id, name: g.name, myId: user.id, createdBy: g.created_by, members: {} };
      });
      saveDB(localDB); setDB(localDB);
    });
  }, [user?.id]);

  const fetchScores = useCallback(async (silent = false) => {
    if (!silent) setLiveStatus("fetching");
    try {
      const res  = await fetch(ESPN_BB_URL);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const seriesWins = {}; // { srId: { teamName: wins } }
      const games = {};
      const results = {};

      (data.events || []).forEach(ev => {
        const comp = ev.competitions?.[0];
        if (!comp) return;
        const teams = comp.competitors || [];
        const home = teams.find(t => t.homeAway === "home");
        const away = teams.find(t => t.homeAway === "away");
        const status = ev.status;
        const situation = comp.situation || {};
        const allNames = [...teams.map(t => t.team?.shortDisplayName?.toLowerCase() || ""), ...teams.map(t => t.team?.displayName?.toLowerCase() || "")];

        // Match SR by requiring BOTH teams to be present in the game
        const sr = SUPER_REGIONALS.find(s => {
          const hostLast = s.host.split(" ").pop().toLowerCase();
          const visitorLast = s.visitor.split(" ").pop().toLowerCase();
          const hostMatch = allNames.some(n => n.includes(hostLast) || hostLast.includes(n.split(" ").pop()));
          const visitorMatch = allNames.some(n => n.includes(visitorLast) || visitorLast.includes(n.split(" ").pop()));
          return hostMatch && visitorMatch;
        });
        if (!sr) return;

        // Track most recent game data for live/final display
        const isLiveOrDone = status?.type?.state === "in" || status?.type?.state === "post" || status?.type?.completed;
        if (isLiveOrDone) {
          games[sr.id] = {
            homeTeam: home?.team?.shortDisplayName || "",
            awayTeam: away?.team?.shortDisplayName || "",
            homeScore: home?.score ?? "0",
            awayScore: away?.score ?? "0",
            inning: status?.period || 0,
            isTopInning: situation?.isTopInning ?? true,
            outs: situation?.outs || 0,
            onFirst: !!situation?.onFirst,
            onSecond: !!situation?.onSecond,
            onThird: !!situation?.onThird,
            statusState: status?.type?.state || "pre",
            statusDetail: status?.type?.shortDetail || "",
            completed: !!status?.type?.completed,
          };
        }

        // Track series wins — only count completed games
        if (status?.type?.completed) {
          const winner = teams.find(t => t.winner);
          if (winner) {
            const wName = winner.team?.shortDisplayName || winner.team?.displayName || "";
            if (!seriesWins[sr.id]) seriesWins[sr.id] = {};
            seriesWins[sr.id][wName] = (seriesWins[sr.id][wName] || 0) + 1;
          }
        }
      });

      // Determine series winners — team with 2 wins wins the series
      Object.entries(seriesWins).forEach(([srId, wins]) => {
        const seriesWinner = Object.entries(wins).find(([, w]) => w >= 2);
        if (seriesWinner) results[srId] = seriesWinner[0];
      });

      // Add series record to games display
      Object.keys(games).forEach(srId => {
        if (seriesWins[srId]) {
          games[srId].seriesWins = seriesWins[srId];
          games[srId].seriesComplete = !!results[srId];
        }
      });

      setLiveResults(results);
      setLiveGames(games);
      setLastSync(new Date());
      setLiveStatus(Object.keys(games).length > 0 ? "live" : "pre");
    } catch { setLiveStatus("pre"); }
  }, []);

  useEffect(() => {
    fetchScores(true);
    const t = setInterval(() => fetchScores(true), 8 * 60 * 1000);
    return () => clearInterval(t);
  }, [fetchScores]);

  function createGroup() {
    if (!grpName.trim() || !name.trim()) { flash("Enter your name and group name.", true); return; }
    const code = genCode();
    const uid = user?.id || genCode();
    const memberName = user?.user_metadata?.full_name || name.trim();
    const g = { code, name: grpName.trim(), members: { [uid]: { name: memberName, srPicks: {}, b1Pick: null, b1Runner: null, b2Pick: null, b2Runner: null, champPick: null, submitted: false } }, createdAt: Date.now() };
    persist({ ...db, groups: { ...db.groups, [code]: g } });
    sbSync("baseball", code, grpName.trim(), uid, memberName, {}, uid);
    setCG(code); setCU(uid); setSrPicks({}); setB1Pick(null); setB1Runner(null); setB2Pick(null); setB2Runner(null); setChampPick(null);
    setView("draft"); setErr("");
  }

  async function joinGroup() {
    const code = joinCode.trim().toUpperCase();
    if (!name.trim()) { flash("Enter your name.", true); return; }
    const uid = user?.id || genCode();
    const memberName = user?.user_metadata?.full_name || name.trim();
    let groupName = db.groups[code]?.name;
    if (!groupName) {
      try {
        const { data } = await supabase.from("groups").select("*").eq("id", code).eq("pool", "baseball").single();
        if (!data) { flash("Group not found. Check the code.", true); return; }
        groupName = data.name;
        const localDB = loadDB();
        if (!localDB.groups[code]) localDB.groups[code] = { code, name: groupName, members: {} };
        saveDB(localDB); setDB(localDB);
      } catch { flash("Group not found. Check the code.", true); return; }
    }
    const currentDB = loadDB();
    const g = { ...(currentDB.groups[code] || { code, name: groupName, members: {} }), members: { ...(currentDB.groups[code]?.members || {}), [uid]: { name: memberName, srPicks: {}, b1Pick: null, b1Runner: null, b2Pick: null, b2Runner: null, champPick: null, submitted: false } } };
    persist({ ...currentDB, groups: { ...currentDB.groups, [code]: g } });
    sbSync("baseball", code, groupName, uid, memberName, {});
    setCG(code); setCU(uid); setSrPicks({}); setB1Pick(null); setB1Runner(null); setB2Pick(null); setB2Runner(null); setChampPick(null);
    setView("draft"); setErr("");
  }

  function submitPicks() {
    if (Object.keys(srPicks).length < 8) { flash("Pick a winner for all 8 Super Regionals first.", true); return; }
    const picksData = { srPicks, b1Pick, b1Runner, b2Pick, b2Runner, champPick, submitted: true };
    const g = { ...db.groups[cg], members: { ...db.groups[cg].members, [cu]: { ...db.groups[cg].members[cu], ...picksData } } };
    persist({ ...db, groups: { ...db.groups, [cg]: g } });
    // Background sync to Supabase
    sbSync("baseball", cg, db.groups[cg].name, cu, db.groups[cg].members[cu].name, picksData);
    setView("leaderboard"); setErr("");
  }

  // Merge localStorage members with Supabase members for leaderboard
  const [sbMembers, setSbMembers] = useState({});
  useEffect(() => {
    if (view === "leaderboard" && cg) {
      sbGetMembers(cg).then(rows => {
        const merged = {};
        rows.forEach(r => {
          if (r.picks?.submitted) merged[r.id] = { name: r.name, ...r.picks };
        });
        setSbMembers(merged);
      });
      const t = setInterval(() => {
        sbGetMembers(cg).then(rows => {
          const merged = {};
          rows.forEach(r => { if (r.picks?.submitted) merged[r.id] = { name: r.name, ...r.picks }; });
          setSbMembers(merged);
        });
      }, 15000);
      return () => clearInterval(t);
    }
  }, [view, cg]);

  function calcScore(member) {
    let pts = 0;
    // 1 pt per correct SR pick
    Object.entries(member.srPicks || {}).forEach(([srId, pick]) => {
      if (nameMatch(pick, liveResults[srId])) pts += 1;
    });
    // CWS bracket scoring (needs actual CWS results — TBD)
    // 2 pts per bracket winner, 1 pt per runner-up, 4 pts for champion
    return pts;
  }

  function getSRPickResult(pick, srId) {
    const winner = liveResults[srId];
    if (!winner) return "pending";
    return nameMatch(pick, winner) ? "correct" : "wrong";
  }

  const group = cg ? db.groups[cg] : null;
  const srComplete = Object.keys(srPicks).length === 8;
  const cwsDone    = b1Pick && b1Runner && b2Pick && b2Runner && champPick;

  // Merge local + Supabase members (Supabase wins for other users)
  const allMembers = { ...(group?.members || {}), ...sbMembers };

  const leaderboard = Object.entries(allMembers).filter(([, m]) => m?.submitted)
    .map(([id, m]) => ({ id, name: m.name, pts: calcScore(m), member: m }))
    .sort((a, b) => b.pts - a.pts);
  const myEntry = leaderboard.find(e => e.id === cu);

  const Header = ({ sub }) => (
    <header style={{ background: "rgba(44,44,46,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: isMobile ? "0 12px" : "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 54, position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>⚾</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: DISPLAY, fontSize: isMobile ? 15 : 20, letterSpacing: "0.06em", color: "#e05050", lineHeight: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>NCAA BASEBALL</div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 2, fontFamily: BODY, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
        {view === "leaderboard" && !deadlineSR && !isMobile && <button style={bBtn("#e05050")} onClick={() => setView("draft")}>Edit Picks</button>}
        {view !== "home" && <button style={{ ...bBtn("#4ab8f0"), padding: isMobile ? "6px 10px" : "10px 20px", fontSize: isMobile ? 12 : 13 }} onClick={() => setView("home")}>Home</button>}
        <button style={{ ...bBtn("#e05050"), padding: isMobile ? "6px 10px" : "10px 20px", fontSize: isMobile ? 12 : 13 }} onClick={() => setView("admin")}>{isMobile ? "⚙" : "⚙ Admin"}</button>
        <button style={{ ...bBtn("#4ab8f0"), padding: isMobile ? "6px 10px" : "10px 20px", fontSize: isMobile ? 12 : 13 }} onClick={onBack}>{isMobile ? "←" : "← Fellowship"}</button>
      </div>
    </header>
  );

  const wrap = (content, sub) => (
    <div style={{ fontFamily: BODY, minHeight: "100vh", background: "#2c2c2e", color: "#f0f2f5" }}>
      <Header sub={sub} />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: isMobile ? "16px 12px 60px" : "28px 20px 60px" }}>{content}</div>
    </div>
  );

  // ── ADMIN PASSWORD GATE ────────────────────────────────────────────────────
  if (view === "admin" && !adminUnlocked) return wrap(<>
    <div style={{ maxWidth: 360, margin: "80px auto 0", textAlign: "center" }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
      <div style={{ fontFamily: DISPLAY, fontSize: 28, color: "#e05050", letterSpacing: "0.06em", marginBottom: 8 }}>ADMIN ACCESS</div>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginBottom: 24, fontFamily: BODY }}>Enter the admin password to continue.</p>
      <input
        type="password"
        style={{ ...inp, marginBottom: 12, textAlign: "center", letterSpacing: "0.1em" }}
        placeholder="Password"
        value={adminPwInput}
        onChange={e => { setAdminPwInput(e.target.value); setAdminPwErr(false); }}
        onKeyDown={e => { if (e.key === "Enter") { if (adminPwInput === "Fellowshiptothemoon") { setAdminUnlocked(true); setAdminPwInput(""); } else setAdminPwErr(true); }}}
      />
      {adminPwErr && <div style={{ color: "#e05050", fontSize: 13, marginBottom: 10, fontFamily: BODY }}>Incorrect password.</div>}
      <button style={bBtn("#e05050")} onClick={() => { if (adminPwInput === "Fellowshiptothemoon") { setAdminUnlocked(true); setAdminPwInput(""); } else setAdminPwErr(true); }}>
        Unlock →
      </button>
    </div>
  </>, "Admin Access");

  // ── ADMIN VIEW ─────────────────────────────────────────────────────────────
  if (view === "admin") return wrap(<>
    {msg && <div style={{ color: "#4ae84a", background: "rgba(74,232,74,0.06)", border: "1px solid rgba(74,232,74,0.15)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13 }}>{msg}</div>}

    <div style={card}>
      <div style={{ fontFamily: DISPLAY, fontSize: 18, letterSpacing: "0.06em", color: "#e05050", marginBottom: 14 }}>📡 ESPN LIVE SCORES</div>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 14, fontFamily: BODY }}>
        Scores auto-sync from ESPN every 8 minutes. Use the button below to force a refresh.
      </p>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button style={bBtn("#e05050")} onClick={() => fetchScores(false)} disabled={liveStatus === "fetching"}>
          {liveStatus === "fetching" ? "Syncing…" : "Sync Now"}
        </button>
        {lastSync && <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontFamily: BODY }}>Last synced: {lastSync.toLocaleTimeString()}</span>}
      </div>
    </div>

    <div style={card}>
      <div style={{ fontFamily: DISPLAY, fontSize: 18, letterSpacing: "0.06em", color: "#e05050", marginBottom: 8 }}>✏️ MANUAL RESULT OVERRIDE</div>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 10, fontFamily: BODY }}>
        If ESPN misses a result, enter it manually. Format: <code style={{ color: "rgba(255,255,255,0.6)" }}>Georgia</code> (just the winning team name, one per line).
      </p>
      <textarea
        style={{ ...inp, height: 120, resize: "vertical", marginBottom: 10 }}
        placeholder={"Georgia\nAuburn\nNorth Carolina\n..."}
        value={adminScoreInput}
        onChange={e => setAdminScoreInput(e.target.value)}
      />
      <div style={{ display: "flex", gap: 10 }}>
        <button style={bBtn("#e05050")} onClick={() => {
          const lines = adminScoreInput.split("\n").map(l => l.trim()).filter(Boolean);
          const newResults = { ...liveResults };
          lines.forEach(winner => {
            const sr = SUPER_REGIONALS.find(s =>
              s.host.toLowerCase().includes(winner.toLowerCase()) ||
              s.visitor.toLowerCase().includes(winner.toLowerCase()) ||
              winner.toLowerCase().includes(s.host.split(" ").pop().toLowerCase()) ||
              winner.toLowerCase().includes(s.visitor.split(" ").pop().toLowerCase())
            );
            if (sr) newResults[sr.id] = winner;
          });
          setLiveResults(newResults);
          flash(`✓ Updated ${lines.length} result${lines.length !== 1 ? "s" : ""}`);
          setAdminScoreInput("");
        }}>Apply Results</button>
        <button style={bBtn("rgba(255,255,255,0.3)")} onClick={() => { setLiveResults({}); flash("✓ Results cleared"); }}>Clear All</button>
      </div>
    </div>

    <div style={card}>
      <div style={{ fontFamily: DISPLAY, fontSize: 18, letterSpacing: "0.06em", color: "rgba(255,255,255,0.3)", marginBottom: 12 }}>📊 CURRENT RESULTS</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {SUPER_REGIONALS.map(sr => (
          <div key={sr.id} style={{ display: "flex", justifyContent: "space-between", background: "rgba(255,255,255,0.04)", padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: BODY }}>{sr.host} vs {sr.visitor}</span>
            <span style={{ fontSize: 12, color: liveResults[sr.id] ? "#4ae84a" : "rgba(255,255,255,0.2)", fontWeight: 600, fontFamily: BODY }}>{liveResults[sr.id] || "TBD"}</span>
          </div>
        ))}
      </div>
    </div>
  </>, "Admin");

  // ── HOME ──────────────────────────────────────────────────────────────────
  if (view === "home") return wrap(<>
    <div style={{ textAlign: "center", padding: "48px 0 40px" }}>
      <div style={{ fontSize: 48, marginBottom: 20 }}>⚾</div>
      <div style={{ fontFamily: DISPLAY, fontSize: 58, letterSpacing: "0.06em", color: "#e05050", lineHeight: 0.95, marginBottom: 12 }}>ROAD TO OMAHA</div>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.25em", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", marginBottom: 14, fontFamily: BODY }}>2026 NCAA Baseball · Super Regionals + CWS Bracket</div>
      <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, maxWidth: 500, margin: "0 auto 18px", fontWeight: 400, lineHeight: 1.7 }}>
        Pick all 8 Super Regional winners. Then pick the winner and runner-up of each side of the CWS bracket, plus the national champion.
      </p>
      <div style={{ display: "inline-block", background: "rgba(224,80,80,0.08)", border: "1px solid rgba(224,80,80,0.2)", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontFamily: BODY }}>
        {deadlineSR
          ? <span style={{ color: "#e05050", fontWeight: 600 }}>🔒 Picks Locked · Tournament Underway</span>
          : <span style={{ color: "rgba(255,255,255,0.5)" }}>⏰ Deadline: <strong style={{ color: "#e05050" }}>Fri June 5 · 2:59 PM ET</strong></span>
        }
      </div>
    </div>

    {err && <div style={{ color: "#e05050", background: "rgba(224,80,80,0.08)", border: "1px solid rgba(224,80,80,0.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13 }}>{err}</div>}
    {msg && <div style={{ color: "#4ae84a", background: "rgba(74,232,74,0.06)", border: "1px solid rgba(74,232,74,0.15)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13 }}>{msg}</div>}

    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14, marginBottom: 14 }}>
      <div style={card}>
        <div style={{ fontFamily: DISPLAY, fontSize: 18, letterSpacing: "0.06em", color: "#e05050", marginBottom: 6 }}>🆕 Create a Group</div>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginBottom: 14, fontFamily: BODY, fontWeight: 300 }}>Start a pool and share the invite code with friends.</p>
        <label style={lbl}>Your Name</label>
        <input style={{ ...inp, marginBottom: 12 }} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mike" />
        <label style={lbl}>Group Name</label>
        <input style={{ ...inp, marginBottom: 16 }} value={grpName} onChange={e => setGrpName(e.target.value)} placeholder="e.g. Office Pool" />
        <button style={bBtn("#e05050")} onClick={createGroup}>Create & Pick →</button>
      </div>
      <div style={card}>
        <div style={{ fontFamily: DISPLAY, fontSize: 18, letterSpacing: "0.06em", color: "#e05050", marginBottom: 6 }}>🔗 Join a Group</div>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginBottom: 14, fontFamily: BODY, fontWeight: 300 }}>Got a code? Jump in and pick your team.</p>
        <label style={lbl}>Your Name</label>
        <input style={{ ...inp, marginBottom: 12 }} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sarah" />
        <label style={lbl}>Group Code</label>
        <input style={{ ...inp, marginBottom: 16 }} value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="e.g. AB3X7" />
        <button style={bBtn("#e05050")} onClick={joinGroup}>Join & Pick →</button>
      </div>
    </div>

    {Object.keys(db.groups).length > 0 && (
      <div style={card}>
        <div style={{ fontFamily: DISPLAY, fontSize: 18, letterSpacing: "0.06em", color: "#e05050", marginBottom: 14 }}>YOUR GROUPS</div>
        {Object.entries(db.groups).map(([code, g]) => {
          const isCreator = g.createdBy === user?.id || g.myId === user?.id;
          return (
            <div key={code} style={{ background: "rgba(255,255,255,0.06)", padding: "12px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div>
                  <span style={{ color: "#e05050", fontWeight: 600, marginRight: 10, fontSize: 14 }}>{g.name}</span>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontFamily: "monospace" }}>{code}</span>
                </div>
                <button style={bBtn("#e05050")} onClick={() => { setCG(code); setCU(g.myId); setView("leaderboard"); }}>Leaderboard →</button>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {g.myId && (
                  <button onClick={async () => {
                    if (!confirm("Remove your entry from this group?")) return;
                    await sbDeleteMember(g.myId);
                    const localDB = loadDB();
                    delete localDB.groups[code];
                    saveDB(localDB); setDB(localDB);
                  }} style={{ background: "none", border: "1px solid rgba(224,80,80,0.2)", borderRadius: 6, color: "rgba(224,80,80,0.6)", fontSize: 11, cursor: "pointer", fontFamily: BODY, padding: "4px 10px" }}>
                    Remove my entry
                  </button>
                )}
                {isCreator && (
                  <button onClick={async () => {
                    if (!confirm(`Delete group "${g.name}" for everyone? This cannot be undone.`)) return;
                    await sbDeleteGroup(code);
                    const localDB = loadDB();
                    delete localDB.groups[code];
                    saveDB(localDB); setDB(localDB);
                  }} style={{ background: "none", border: "1px solid rgba(224,80,80,0.3)", borderRadius: 6, color: "#e05050", fontSize: 11, cursor: "pointer", fontFamily: BODY, padding: "4px 10px" }}>
                    Delete group
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    )}

    <div style={card}>
      <div style={{ fontFamily: DISPLAY, fontSize: 18, letterSpacing: "0.06em", color: "#e05050", marginBottom: 14 }}>SCORING</div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 10 }}>
        {[["1 pt", "Per correct Super Regional pick"],
          ["1 pt", "Correct bracket runner-up (×2)"],
          ["2 pts", "Correct bracket winner (×2)"],
          ["4 pts", "Correct national champion"]].map(([pts, desc]) => (
          <div key={desc} style={{ textAlign: "center", padding: 14, background: "rgba(255,255,255,0.06)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.04)" }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 24, color: "#e05050", letterSpacing: "0.04em" }}>{pts}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: BODY, marginTop: 4, lineHeight: 1.4 }}>{desc}</div>
          </div>
        ))}
      </div>
    </div>
  </>, isMobile ? "Road to Omaha 2026" : "Fellowship Sports · Road to Omaha 2026");

  // ── DRAFT ─────────────────────────────────────────────────────────────────
  if (view === "draft") return wrap(<>
    {group && (
      <div style={{ background: "rgba(224,80,80,0.06)", border: "2px dashed rgba(224,80,80,0.2)", borderRadius: 12, padding: "14px 20px", textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 6, fontWeight: 600 }}>Share Code With Friends</div>
        <div style={{ fontFamily: "monospace", fontSize: 36, fontWeight: "bold", color: "#e05050", letterSpacing: "0.25em" }}>{group.code}</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{group.name}</div>
      </div>
    )}

    {err && <div style={{ color: "#e05050", background: "rgba(224,80,80,0.08)", border: "1px solid rgba(224,80,80,0.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13 }}>{err}</div>}

    {/* Phase tabs */}
    <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
      {[
        { key: "sr",  label: isMobile ? `SR Picks ${srComplete ? "✓" : `(${Object.keys(srPicks).length}/8)`}` : `Phase 1: Super Regionals ${srComplete ? "✓" : `(${Object.keys(srPicks).length}/8)`}`, color: "#e05050" },
        { key: "cws", label: isMobile ? `CWS Bracket ${cwsDone ? "✓" : ""}` : `Phase 2: CWS Bracket ${cwsDone ? "✓" : "(required)"}`, color: "#4ab8f0" },
      ].map(({ key, label, color }) => (
        <button key={key} onClick={() => setActiveTab(key)} style={{
          flex: 1, padding: 12, borderRadius: 10, cursor: "pointer", fontFamily: BODY, fontWeight: 600, fontSize: 13,
          background: activeTab === key ? `${color}15` : "rgba(255,255,255,0.03)",
          color: activeTab === key ? color : "rgba(255,255,255,0.5)",
          border: `1px solid ${activeTab === key ? `${color}40` : "rgba(255,255,255,0.06)"}`,
        }}>{label}</button>
      ))}
    </div>

    {/* ── PHASE 1: SUPER REGIONALS ── */}
    {activeTab === "sr" && (<>
      {deadlineSR ? (
        <div style={{ textAlign: "center", padding: 32, ...card }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>🔒</div>
          <div style={{ fontFamily: DISPLAY, fontSize: 22, color: "#e05050", letterSpacing: "0.06em", marginBottom: 8 }}>SUPER REGIONAL PICKS LOCKED</div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontFamily: BODY, marginBottom: 16 }}>Switch to Phase 2 to make your CWS bracket picks!</div>
          <button style={bBtn("#4ab8f0")} onClick={() => setActiveTab("cws")}>Go to CWS Bracket →</button>
        </div>
      ) : (<>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, fontFamily: BODY, fontWeight: 300, textAlign: "center", marginBottom: 20 }}>
            Pick the winner of all <strong style={{ color: "#f0f2f5" }}>8 Super Regionals</strong> · 1 point for each winner
          </p>

        <div style={{ ...card, marginBottom: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
            {SUPER_REGIONALS.filter(sr => sr.cwsBracket === 1).map(sr => (
              <SRCard key={sr.id} sr={sr} picks={srPicks} onChange={(id, t) => setSrPicks(p => ({ ...p, [id]: t }))} liveResults={liveResults} />
            ))}
          </div>
        </div>

        <div style={card}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
            {SUPER_REGIONALS.filter(sr => sr.cwsBracket === 2).map(sr => (
              <SRCard key={sr.id} sr={sr} picks={srPicks} onChange={(id, t) => setSrPicks(p => ({ ...p, [id]: t }))} liveResults={liveResults} />
            ))}
          </div>
        </div>

      
      </>)}
    </>)}

    {/* ── PHASE 2: CWS BRACKET ── */}
    {activeTab === "cws" && (<>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, fontFamily: BODY, fontWeight: 300 }}>
          Pick who wins each CWS bracket side, then the national champion · 2pts + 4pts
        </p>
        {!srComplete && <div style={{ fontSize: 12, color: "#e0a84b", marginTop: 6, fontFamily: BODY }}>⚠ Complete all SR picks first to see your bracket matchups</div>}
      </div>

      {deadlineCWS ? (
        <div style={{ textAlign: "center", padding: 32, ...card }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>🔒</div>
          <div style={{ fontFamily: DISPLAY, fontSize: 22, color: "#4ab8f0", letterSpacing: "0.06em" }}>CWS BRACKET LOCKED</div>
        </div>
      ) : (<>
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 14, marginBottom: 14 }}>
          <CWSBracketSide bracketNum={1} srPicks={srPicks} liveResults={liveResults} winnerPick={b1Pick} runnerUpPick={b1Runner} onPickWinner={setB1Pick} onPickRunnerUp={setB1Runner} accentColor="#4ab8f0" locked={deadlineCWS} />
          <CWSBracketSide bracketNum={2} srPicks={srPicks} liveResults={liveResults} winnerPick={b2Pick} runnerUpPick={b2Runner} onPickWinner={setB2Pick} onPickRunnerUp={setB2Runner} accentColor="#e05050" locked={deadlineCWS} />
        </div>

        {b1Pick && b2Pick && (
          <div style={card}>
            <div style={{ fontFamily: DISPLAY, fontSize: 22, letterSpacing: "0.06em", color: "#e05050", marginBottom: 6 }}>🏆 NATIONAL CHAMPION</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontFamily: BODY, marginBottom: 16 }}>Championship Series · June 20-22 · Best of 3 · 4 points</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[b1Pick, b2Pick].map(team => {
                const info = team ? getTeamInfo(team) : null;
                const selected = champPick === team;
                return (
                  <button key={team} onClick={() => setChampPick(team)} style={{
                    background: selected ? `${info?.color}30` : "rgba(255,255,255,0.03)",
                    color: selected ? "#ffffff" : "rgba(255,255,255,0.6)",
                    border: `2px solid ${selected ? (info?.color || "#c8a84b") : "rgba(255,255,255,0.06)"}`,
                    borderRadius: 10, padding: "16px 18px", cursor: "pointer", fontFamily: BODY,
                    fontSize: 16, fontWeight: selected ? 700 : 400, textAlign: "center",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  }}>
                    {info?.logo && <img src={info.logo} alt={team} style={{ width: 32, height: 32, objectFit: "contain" }} onError={e => e.target.style.display = "none"} />}
                    {team}
                    {selected && <div style={{ fontSize: 11, color: info?.color || "#c8a84b", filter: "brightness(1.5)" }}>● YOUR CHAMPION</div>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </>)}
    </>)}

    {/* Sticky submit */}
    <div style={{ position: "sticky", bottom: isMobile ? 80 : 12, background: "rgba(44,44,46,0.97)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontFamily: BODY }}>
        {!srComplete && <span>⚾ <strong style={{ color: "#e05050" }}>{Object.keys(srPicks).length}/8</strong> Super Regional picks</span>}
        {srComplete && activeTab === "sr" && <span style={{ color: "#4ab8f0" }}>✓ 8/8 Super Regional Picks</span>}
        {srComplete && activeTab === "cws" && !cwsDone && <span style={{ color: "#4ab8f0" }}>Complete your CWS bracket picks</span>}
        {srComplete && activeTab === "cws" && cwsDone && <span style={{ color: "#4ae84a" }}>✓ All picks complete!</span>}
      </div>
      {activeTab === "sr" ? (
        <button style={{ ...bBtn("#4ab8f0"), opacity: srComplete ? 1 : 0.4 }} onClick={() => { if (srComplete) setActiveTab("cws"); }}>
          Continue to CWS Bracket →
        </button>
      ) : (
        <button style={{ ...bBtn("#4ab8f0"), opacity: cwsDone ? 1 : 0.4 }} onClick={() => { if (cwsDone) submitPicks(); }}>
          Lock In All Picks →
        </button>
      )}
    </div>
  </>, "Make Your Picks");

  // ── LEADERBOARD ────────────────────────────────────────────────────────────
  if (view === "leaderboard") return wrap(<>
    <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
      <div style={{ background: "rgba(224,80,80,0.06)", border: "2px dashed rgba(224,80,80,0.2)", borderRadius: 12, padding: "12px 20px", textAlign: "center", flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 600, fontFamily: BODY }}>Invite Code</div>
        <div style={{ fontFamily: "monospace", fontSize: 26, fontWeight: "bold", color: "#e05050", letterSpacing: "0.25em" }}>{group?.code}</div>
      </div>
      <div style={{ ...card, flex: 1, margin: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 5 }}>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", fontFamily: BODY }}>
          {Object.keys(group?.members || {}).length} members · {leaderboard.length} picks submitted
        </div>
        {liveStatus === "live"
          ? <div style={{ color: "#4ae84a", fontSize: 12, fontWeight: 600, fontFamily: BODY }}>● LIVE · Updated {lastSync?.toLocaleTimeString()}</div>
          : <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontFamily: BODY }}>Scores auto-sync when games begin</div>
        }
        {myEntry && <div style={{ color: "#e05050", fontSize: 14, fontFamily: BODY, fontWeight: 600 }}>Your score: <span style={{ fontSize: 20 }}>{myEntry.pts} pts</span></div>}
      </div>
    </div>

    {leaderboard.length === 0 ? (
      <div style={{ textAlign: "center", padding: 48, ...card }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>⏳</div>
        <p style={{ color: "rgba(255,255,255,0.45)", fontFamily: BODY }}>No picks yet.</p>
        <button style={{ ...bBtn("#e05050"), marginTop: 14 }} onClick={() => setView("draft")}>Make Picks →</button>
      </div>
    ) : leaderboard.map((e, i) => {
      const isMe = e.id === cu;
      const exp  = expandedUser === e.id;
      const medals = ["🥇","🥈","🥉"];
      const srCorrect = SUPER_REGIONALS.filter(sr => nameMatch(e.member.srPicks?.[sr.id], liveResults[sr.id])).length;
      const srPending = SUPER_REGIONALS.filter(sr => !liveResults[sr.id]).length;
      const champInfo = e.member.champPick ? getTeamInfo(e.member.champPick) : null;

      return (
        <div key={e.id} style={{ ...card, borderColor: isMe ? "rgba(224,80,80,0.25)" : "rgba(255,255,255,0.06)", cursor: "pointer" }}
          onClick={() => setExpandedUser(exp ? null : e.id)}>

          {/* Collapsed row */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, textAlign: "center", fontSize: i < 3 ? 18 : 13, color: "rgba(255,255,255,0.4)", fontWeight: 700, flexShrink: 0 }}>
              {i < 3 ? medals[i] : `#${i+1}`}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, color: isMe ? "#e05050" : "#f0f2f5", fontWeight: isMe ? 700 : 400, fontFamily: BODY }}>
                {e.name} {isMe && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>(you)</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                <span style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "2px 8px", fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: BODY }}>
                  {srCorrect}/{8 - srPending} SR correct
                </span>
                {e.member.champPick && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "2px 8px" }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: BODY }}>🏆</span>
                    {champInfo?.logo && <img src={champInfo.logo} alt={e.member.champPick} style={{ width: 16, height: 16, objectFit: "contain" }} onError={ev => ev.target.style.display = "none"} />}
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontFamily: BODY }}>{e.member.champPick.split(" ").pop()}</span>
                  </span>
                )}
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 24, letterSpacing: "0.04em", color: "#e05050" }}>{e.pts}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: BODY }}>pts</div>
            </div>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, flexShrink: 0 }}>{exp ? "▲" : "▼"}</div>
          </div>

          {/* Expanded detail */}
          {exp && (
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)" }}>

              {/* SR picks as mini matchup cards */}
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6, fontFamily: BODY, fontWeight: 600 }}>Super Regional Picks</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8, marginBottom: 12 }}>
                {SUPER_REGIONALS.map(sr => {
                  const pick = e.member.srPicks?.[sr.id];
                  const result = getSRPickResult(pick, sr.id);
                  const pickInfo = pick ? getTeamInfo(pick) : null;
                  const hostInfo = getTeamInfo(sr.host);
                  const visitorInfo = getTeamInfo(sr.visitor);
                  const game = liveGames?.[sr.id];
                  const isLive = game?.statusState === "in";
                  const isFinal = game?.completed;

                  const getScore = (teamName) => {
                    if (!game) return null;
                    const isHome = game.homeTeam?.toLowerCase().includes(teamName.split(" ").pop().toLowerCase());
                    return isHome ? game.homeScore : game.awayScore;
                  };

                  return (
                    <div key={sr.id} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderLeft: pickInfo ? `3px solid ${pickInfo.color}` : "3px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 12px" }}>
                      {/* Header */}
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: BODY }}>{sr.location} · {sr.g1}</div>
                        {isLive && <div style={{ fontSize: 10, color: "#4ae84a", fontWeight: 600, fontFamily: BODY }}>● LIVE</div>}
                        {isFinal && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: BODY }}>FINAL</div>}
                      </div>

                      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        {/* Teams + scores */}
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {hostInfo.logo && <img src={hostInfo.logo} alt={sr.host} style={{ width: 16, height: 16, objectFit: "contain" }} onError={ev => ev.target.style.display = "none"} />}
                            <span style={{ fontSize: 12, fontFamily: BODY, color: pick === sr.host ? "#ffffff" : "rgba(255,255,255,0.65)", fontWeight: pick === sr.host ? 600 : 400, flex: 1 }}>
                              {sr.hostSeed && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginRight: 3 }}>#{sr.hostSeed}</span>}
                              {sr.host}
                            </span>
                            {(isLive || isFinal) && <span style={{ fontSize: 13, fontWeight: 700, color: "#f0f2f5" }}>{getScore(sr.host)}</span>}
                          </div>
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: BODY, paddingLeft: 22 }}>vs</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {visitorInfo.logo && <img src={visitorInfo.logo} alt={sr.visitor} style={{ width: 16, height: 16, objectFit: "contain" }} onError={ev => ev.target.style.display = "none"} />}
                            <span style={{ fontSize: 12, fontFamily: BODY, color: pick === sr.visitor ? "#ffffff" : "rgba(255,255,255,0.65)", fontWeight: pick === sr.visitor ? 600 : 400, flex: 1 }}>
                              {sr.visitorSeed && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginRight: 3 }}>#{sr.visitorSeed}</span>}
                              {sr.visitor}
                            </span>
                            {(isLive || isFinal) && <span style={{ fontSize: 13, fontWeight: 700, color: "#f0f2f5" }}>{getScore(sr.visitor)}</span>}
                          </div>
                        </div>

                        {/* Pick circle */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, minWidth: 52 }}>
                          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: BODY, textTransform: "uppercase", letterSpacing: "0.08em" }}>Pick</div>
                          {pick ? (
                            <>
                              <div style={{ width: 32, height: 32, borderRadius: "50%", background: pickInfo ? `${pickInfo.color}22` : "rgba(255,255,255,0.05)", border: `2px solid ${pickInfo?.color || "rgba(255,255,255,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                                {pickInfo?.logo
                                  ? <img src={pickInfo.logo} alt={pick} style={{ width: 22, height: 22, objectFit: "contain" }} onError={ev => ev.target.style.display = "none"} />
                                  : <span style={{ fontSize: 9, color: pickInfo?.color, fontWeight: 600 }}>{pick.split(" ").pop().slice(0,3).toUpperCase()}</span>
                                }
                              </div>
                              <div style={{ fontSize: 10, color: result === "correct" ? "#4ae84a" : result === "wrong" ? "#e05050" : pickInfo?.color || "rgba(255,255,255,0.5)", fontWeight: 600, fontFamily: BODY, textAlign: "center", lineHeight: 1.2 }}>
                                {pick.split(" ").pop()}
                                {result === "correct" && " ✓"}
                                {result === "wrong" && " ✗"}
                              </div>
                            </>
                          ) : (
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.03)", border: "1.5px dashed rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.15)" }}>?</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Live inning/outs/bases */}
                      {isLive && (
                        <div style={{ marginTop: 8, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ fontSize: 10, color: "#4ae84a", fontWeight: 600, fontFamily: BODY }}>{game.isTopInning ? "▲" : "▼"}{game.inning}</div>
                          <div style={{ display: "flex", gap: 3 }}>
                            {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: i < game.outs ? "#e05050" : "rgba(255,255,255,0.15)" }} />)}
                          </div>
                          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: BODY }}>{game.outs} out{game.outs !== 1 ? "s" : ""}</span>
                          <div style={{ marginLeft: "auto", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 2, width: 26 }}>
                            <div /><div style={{ width: 8, height: 8, transform: "rotate(45deg)", background: game.onSecond ? "#f0a500" : "rgba(255,255,255,0.15)", borderRadius: 1 }} /><div />
                            <div style={{ width: 8, height: 8, transform: "rotate(45deg)", background: game.onThird ? "#f0a500" : "rgba(255,255,255,0.15)", borderRadius: 1 }} /><div /><div style={{ width: 8, height: 8, transform: "rotate(45deg)", background: game.onFirst ? "#f0a500" : "rgba(255,255,255,0.15)", borderRadius: 1 }} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* CWS picks */}
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10, fontFamily: BODY, fontWeight: 600 }}>CWS Bracket Picks</div>

              {/* Option A bracket flow */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr auto 1fr", gap: 12, alignItems: "center", marginBottom: 10 }}>
                
                {/* Bracket 1 */}
                <div>
                  <div style={{ fontSize: 10, color: "rgba(74,184,240,0.7)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontFamily: BODY }}>Bracket 1</div>
                  {[["winner", e.member.b1Pick, "2pts"], ["runner-up", e.member.b1Runner, "1pt"]].map(([role, pick, pts]) => {
                    const info = pick ? getTeamInfo(pick) : null;
                    return (
                      <div key={role} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "rgba(255,255,255,0.04)", borderRadius: 8, borderLeft: info ? `2px solid ${info.color}` : "2px solid rgba(255,255,255,0.1)", marginBottom: 5 }}>
                        {info?.logo ? <img src={info.logo} alt={pick} style={{ width: 24, height: 24, objectFit: "contain", flexShrink: 0 }} onError={ev => ev.target.style.display = "none"} /> : <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(255,255,255,0.06)", flexShrink: 0 }} />}
                        <span style={{ flex: 1, fontSize: 12, fontFamily: BODY, color: pick ? "#f0f2f5" : "rgba(255,255,255,0.25)", fontWeight: pick ? 500 : 400 }}>{pick ? pick.split(" ").pop() : "—"}</span>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: BODY }}>{role} · {pts}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Center connector */}
                {!isMobile && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.1)" }} />
                    <div style={{ padding: "3px 10px", background: "rgba(255,255,255,0.05)", borderRadius: 20, fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: BODY }}>final</div>
                    <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.1)" }} />
                  </div>
                )}

                {/* Bracket 2 */}
                <div>
                  <div style={{ fontSize: 10, color: "rgba(224,80,80,0.7)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontFamily: BODY, textAlign: isMobile ? "left" : "right" }}>Bracket 2</div>
                  {[["winner", e.member.b2Pick, "2pts"], ["runner-up", e.member.b2Runner, "1pt"]].map(([role, pick, pts]) => {
                    const info = pick ? getTeamInfo(pick) : null;
                    return (
                      <div key={role} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "rgba(255,255,255,0.04)", borderRadius: 8, borderRight: !isMobile && info ? `2px solid ${info.color}` : undefined, borderLeft: isMobile && info ? `2px solid ${info.color}` : isMobile ? "2px solid rgba(255,255,255,0.1)" : undefined, marginBottom: 5 }}>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: BODY }}>{role} · {pts}</span>
                        <span style={{ flex: 1, fontSize: 12, fontFamily: BODY, color: pick ? "#f0f2f5" : "rgba(255,255,255,0.25)", fontWeight: pick ? 500 : 400, textAlign: isMobile ? "left" : "right" }}>{pick ? pick.split(" ").pop() : "—"}</span>
                        {info?.logo ? <img src={info.logo} alt={pick} style={{ width: 24, height: 24, objectFit: "contain", flexShrink: 0 }} onError={ev => ev.target.style.display = "none"} /> : <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(255,255,255,0.06)", flexShrink: 0 }} />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Champion */}
              {e.member.champPick && (() => {
                const info = getTeamInfo(e.member.champPick);
                return (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: `${info.color}15`, border: `1px solid ${info.color}40`, borderRadius: 8 }}>
                    {info.logo && <img src={info.logo} alt={e.member.champPick} style={{ width: 28, height: 28, objectFit: "contain" }} onError={ev => ev.target.style.display = "none"} />}
                    <div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: BODY, textTransform: "uppercase", letterSpacing: "0.08em" }}>National Champion</div>
                      <div style={{ fontSize: 14, color: "#f0f2f5", fontWeight: 600, fontFamily: BODY }}>{e.member.champPick}</div>
                    </div>
                    <span style={{ marginLeft: "auto", fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: BODY }}>4pts</span>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      );
    })}

    {!myEntry && <div style={{ textAlign: "center", marginTop: 8 }}><button style={bBtn("#e05050")} onClick={() => setView("draft")}>Make Your Picks →</button></div>}
  </>, group?.name || "Leaderboard");

  return null;
}
