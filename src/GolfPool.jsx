import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

// ── 2026 US OPEN FIELD — DRAFTKINGS ODDS — BALANCED 6 TIERS ─────────────────
// Tier sizing: T1=10, T2=10, T3=12, T4=14, T5=16, T6=20+ (most in T6)
// All odds sourced from DraftKings Sportsbook, June 2026
const TIERS = [
  {
    tier: 1,
    label: "Tier 1",
    subtitle: "Elite Favorites",
    range: "+460 – +2200",
    color: "#c8a84b",
    desc: "The best players in the world — short odds, lower ceiling",
    players: [
      { name: "Scottie Scheffler",   odds: "+460"  },
      { name: "Rory McIlroy",        odds: "+800"  },
      { name: "Jon Rahm",            odds: "+1100" },
      { name: "Cameron Young",       odds: "+1400" },
      { name: "Ludvig Åberg",        odds: "+1600" },
      { name: "Xander Schauffele",   odds: "+1800" },
      { name: "Bryson DeChambeau",   odds: "+2000" },
      { name: "Matt Fitzpatrick",    odds: "+2000" },
      { name: "Tommy Fleetwood",     odds: "+2200" },
      { name: "Viktor Hovland",      odds: "+2200" },
    ],
  },
  {
    tier: 2,
    label: "Tier 2",
    subtitle: "Strong Contenders",
    range: "+2500 – +3500",
    color: "#5a9a5a",
    desc: "Proven major contenders with realistic winning chances",
    players: [
      { name: "Brooks Koepka",       odds: "+2500" },
      { name: "Collin Morikawa",     odds: "+2500" },
      { name: "Tyrrell Hatton",      odds: "+2800" },
      { name: "Robert MacIntyre",    odds: "+2800" },
      { name: "Justin Thomas",       odds: "+3000" },
      { name: "Shane Lowry",         odds: "+3000" },
      { name: "Hideki Matsuyama",    odds: "+3000" },
      { name: "Patrick Cantlay",     odds: "+3200" },
      { name: "Justin Rose",         odds: "+3200" },
      { name: "Joaquin Niemann",     odds: "+3500" },
    ],
  },
  {
    tier: 3,
    label: "Tier 3",
    subtitle: "Solid Longshots",
    range: "+3500 – +5000",
    color: "#5a8abf",
    desc: "Real threats who could easily win this US Open",
    players: [
      { name: "Sepp Straka",         odds: "+3500" },
      { name: "Chris Gotterup",      odds: "+3500" },
      { name: "Patrick Reed",        odds: "+4000" },
      { name: "Si Woo Kim",          odds: "+4000" },
      { name: "Sam Burns",           odds: "+4500" },
      { name: "Russell Henley",      odds: "+4500" },
      { name: "Wyndham Clark",       odds: "+4500" },
      { name: "Jordan Spieth",       odds: "+4500" },
      { name: "Ben Griffin",         odds: "+5000" },
      { name: "Corey Conners",       odds: "+5000" },
      { name: "Akshay Bhatia",       odds: "+5000" },
      { name: "Min Woo Lee",         odds: "+5000" },
    ],
  },
  {
    tier: 4,
    label: "Tier 4",
    subtitle: "Value Picks",
    range: "+5500 – +7000",
    color: "#9a6abf",
    desc: "Under-the-radar players who could make a run",
    players: [
      { name: "Maverick McNealy",    odds: "+5500" },
      { name: "Adam Scott",          odds: "+5500" },
      { name: "Tony Finau",          odds: "+5500" },
      { name: "Jason Day",           odds: "+6000" },
      { name: "Aaron Rai",           odds: "+6000" },
      { name: "JJ Spaun",            odds: "+6000" },
      { name: "Will Zalatoris",      odds: "+6500" },
      { name: "Jake Knapp",          odds: "+6500" },
      { name: "Cameron Smith",       odds: "+6500" },
      { name: "Rickie Fowler",       odds: "+7000" },
      { name: "Jacob Bridgeman",     odds: "+7000" },
      { name: "Keegan Bradley",      odds: "+7000" },
      { name: "Sungjae Im",          odds: "+7000" },
      { name: "Harris English",      odds: "+7000" },
    ],
  },
  {
    tier: 5,
    label: "Tier 5",
    subtitle: "Sleepers",
    range: "+8000 – +12000",
    color: "#bf6a3a",
    desc: "Boom or bust — high risk, massive upside",
    players: [
      { name: "Sahith Theegala",     odds: "+8000" },
      { name: "Patrick Rodgers",     odds: "+8000" },
      { name: "Alex Smalley",        odds: "+8000" },
      { name: "Nicolai Højgaard",    odds: "+8000" },
      { name: "Kurt Kitayama",       odds: "+9000" },
      { name: "Ryan Gerard",         odds: "+9000" },
      { name: "Harry Hall",          odds: "+9000" },
      { name: "Nick Taylor",         odds: "+9000" },
      { name: "Andrew Novak",        odds: "+9000" },
      { name: "Seamus Power",        odds: "+10000" },
      { name: "Denny McCarthy",      odds: "+10000" },
      { name: "Tom Kim",             odds: "+10000" },
      { name: "Davis Riley",         odds: "+10000" },
      { name: "Alex Fitzpatrick",    odds: "+10000" },
      { name: "Kristoffer Reitan",   odds: "+12000" },
      { name: "Matthias Schmid",     odds: "+12000" },
    ],
  },
  {
    tier: 6,
    label: "Tier 6",
    subtitle: "Field Players",
    range: "+15000+",
    color: "#7a8a7a",
    desc: "Qualifiers and longshots — anyone can be a hero at Shinnecock",
    players: [
      { name: "Neal Shipley",        odds: "+15000" },
      { name: "Carl Yuan",           odds: "+15000" },
      { name: "Graeme McDowell",     odds: "+15000" },
      { name: "Peter Uihlein",       odds: "+15000" },
      { name: "Caleb Surratt",       odds: "+15000" },
      { name: "Lucas Herbert",       odds: "+18000" },
      { name: "Laurie Canter",       odds: "+18000" },
      { name: "Adrien Saddier",      odds: "+18000" },
      { name: "Jayden Schaper",      odds: "+18000" },
      { name: "MJ Daffue",           odds: "+20000" },
      { name: "David Skinns",        odds: "+20000" },
      { name: "Beau Hossler",        odds: "+20000" },
      { name: "Taylor Moore",        odds: "+20000" },
      { name: "Ben Kohles",          odds: "+20000" },
      { name: "Hayden Buckley",      odds: "+20000" },
      { name: "Eric Cole",           odds: "+25000" },
      { name: "Austin Smotherman",   odds: "+25000" },
      { name: "Trevor Werbylo",      odds: "+25000" },
      { name: "Sudarshan Yellamaraju", odds: "+30000" },
      { name: "Sam Bennett",         odds: "+30000" },
    ],
  },
];

const ALL_PLAYERS = TIERS.flatMap(t => t.players.map(p => p.name));
const DEFAULT_SCORES = Object.fromEntries(ALL_PLAYERS.map(p => [p, 0]));

// ESPN hidden API — US Open 2026 tournament ID discovered from ESPN leaderboard
const ESPN_TOURNAMENT_ID = "401811952";
const ESPN_URL = `https://site.api.espn.com/apis/site/v2/sports/golf/pga/leaderboard?event=${ESPN_TOURNAMENT_ID}`;

// Name normalization — ESPN may use slightly different spellings
// Build a lookup: last name -> our canonical name
function buildLastNameMap() {
  const map = {};
  ALL_PLAYERS.forEach(p => {
    const last = p.split(" ").pop().toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // strip accents
    map[last] = p;
  });
  return map;
}
const LAST_NAME_MAP = buildLastNameMap();

function normalizeName(espnName) {
  // Try exact match first
  if (ALL_PLAYERS.includes(espnName)) return espnName;
  // Try accent-stripped exact match
  const stripped = espnName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const match = ALL_PLAYERS.find(p =>
    p.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === stripped.toLowerCase()
  );
  if (match) return match;
  // Try last name match
  const lastName = espnName.split(" ").pop().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return LAST_NAME_MAP[lastName] || null;
}

// Parse ESPN's score format: "E", "-5", "+3", "CUT", "WD", "DQ"
function parseESPNScore(espnScore) {
  if (!espnScore || espnScore === "--") return 0;
  const s = espnScore.toString().trim().toUpperCase();
  if (s === "E") return 0;
  if (s === "CUT" || s === "WD" || s === "DQ" || s === "MDF") return "CUT";
  const n = parseInt(s);
  return isNaN(n) ? 0 : n;
}

function scoreDisplay(val) {
  if (val === "CUT") return "CUT";
  if (val === 0) return "E";
  if (typeof val === "number") return val > 0 ? `+${val}` : `${val}`;
  return "E";
}
function scoreValue(val) {
  if (val === "CUT") return 20;
  return typeof val === "number" ? val : 0;
}
function scoreColor(val) {
  if (val === "CUT") return "#e05050";
  if (typeof val === "number" && val < 0) return "#4aba6a";
  if (typeof val === "number" && val === 0) return "#7a9a7a";
  return "#e0905a";
}
function calcTeam(picks, scores) {
  const all = picks.map(p => ({ name: p, raw: scores[p] ?? 0, val: scoreValue(scores[p] ?? 0) }));
  all.sort((a, b) => a.val - b.val);
  return { total: all.slice(0, 4).reduce((s, p) => s + p.val, 0), top4: all.slice(0, 4), dropped: all.slice(4) };
}
function genCode() { return Math.random().toString(36).substring(2, 7).toUpperCase(); }

const DB_KEY = "usopen_v4";
function loadDB() {
  try { return JSON.parse(localStorage.getItem(DB_KEY)) || { groups: {}, scores: { ...DEFAULT_SCORES } }; }
  catch { return { groups: {}, scores: { ...DEFAULT_SCORES } }; }
}
function saveDB(db) { try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch {} }

const ODDS_API_KEY = "508a276e0e0d9e86981620679aaf66f5";
const ODDS_SPORT_KEY = "golf_us_open_winner";

// ── ENTRY DEADLINE & ODDS CUTOFF ─────────────────────────────────────────────
// Picks lock Wednesday June 17, 2026 at 11:59 PM ET
// After this, odds pulls stop and draft is closed
const ENTRY_DEADLINE = new Date("2026-06-18T03:59:00Z"); // 11:59 PM ET = 3:59 AM UTC
const ODDS_CACHE_HOURS = 24; // Only fetch fresh odds once per 24 hours
const ODDS_CACHE_KEY = "usopen_odds_cache_v1";

function isDeadlinePassed() { return new Date() > ENTRY_DEADLINE; }

function loadCachedOdds() {
  try {
    const raw = localStorage.getItem(ODDS_CACHE_KEY);
    if (!raw) return null;
    const { odds, cachedAt } = JSON.parse(raw);
    const ageHours = (Date.now() - cachedAt) / (1000 * 60 * 60);
    if (ageHours < ODDS_CACHE_HOURS) return odds;
    return null; // cache expired
  } catch { return null; }
}

function saveCachedOdds(odds) {
  try { localStorage.setItem(ODDS_CACHE_KEY, JSON.stringify({ odds, cachedAt: Date.now() })); } catch {}
}

const DISPLAY = "'Bebas Neue', sans-serif";
const BODY = "'Inter', sans-serif";

const S = {
  app: { fontFamily: BODY, minHeight: "100vh", background: "#2c2c2e", color: "#f0f2f5" },
  hdr: { background: "rgba(44,44,46,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 58, position: "sticky", top: 0, zIndex: 100 },
  logoTxt: { fontFamily: DISPLAY, fontSize: 20, letterSpacing: "0.08em", color: "#c8a84b", lineHeight: 1 },
  logoSub: { fontSize: 10, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.12em", marginTop: 2, fontFamily: BODY, fontWeight: 500 },
  main: { maxWidth: 820, margin: "0 auto", padding: "24px 16px 60px" },
  card: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 22, marginBottom: 14 },
  h2: { fontFamily: DISPLAY, fontSize: 18, letterSpacing: "0.06em", color: "#c8a84b", marginBottom: 14 },
  lbl: { fontSize: 10, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 6, display: "block", fontWeight: 600 },
  inp: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#f0f2f5", padding: "11px 14px", fontSize: 14, width: "100%", outline: "none", fontFamily: BODY, boxSizing: "border-box" },
  btnGold: { background: "rgba(200,168,75,0.15)", color: "#d4b050", border: "1px solid rgba(200,168,75,0.3)", borderRadius: 8, padding: "11px 24px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: BODY },
  btnGreen: { background: "rgba(74,232,74,0.1)", color: "#4ae84a", border: "1px solid rgba(74,232,74,0.2)", borderRadius: 8, padding: "11px 24px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: BODY },
  btnSm: { background: "transparent", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "7px 14px", fontSize: 12, cursor: "pointer", fontFamily: BODY },
  btnRed: { background: "transparent", color: "#e05050", border: "1px solid rgba(224,80,80,0.2)", borderRadius: 8, padding: "7px 14px", fontSize: 12, cursor: "pointer", fontFamily: BODY },
  err: { color: "#e05050", background: "rgba(224,80,80,0.08)", border: "1px solid rgba(224,80,80,0.2)", borderRadius: 8, padding: "9px 13px", marginBottom: 12, fontSize: 13 },
  ok: { color: "#4ae84a", background: "rgba(74,232,74,0.06)", border: "1px solid rgba(74,232,74,0.15)", borderRadius: 8, padding: "9px 13px", marginBottom: 12, fontSize: 13 },
  warn: { color: "#e8b84a", background: "rgba(232,184,74,0.06)", border: "1px solid rgba(232,184,74,0.15)", borderRadius: 8, padding: "9px 13px", marginBottom: 12, fontSize: 13 },
  codeBox: { background: "rgba(200,168,75,0.06)", border: "2px dashed rgba(200,168,75,0.2)", borderRadius: 12, padding: "14px 20px", textAlign: "center", marginBottom: 14 },
  code: { fontFamily: "monospace", fontSize: 36, fontWeight: "bold", color: "#c8a84b", letterSpacing: "0.25em" },
  dot: (color) => ({ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: color, marginRight: 6 }),
};

// ── US OPEN TROPHY SVG — drawn to match the iconic USGA silver loving cup ───

export default function GolfPool({ onBack }) {
  const [db, setDB] = useState(loadDB);
  const [loading, setLoading] = useState(false);
  const [groupData, setGroupData] = useState(null);
  const [view, setView] = useState("home");
  const [cg, setCG] = useState(null);
  const [cu, setCU] = useState(null);
  const [picks, setPicks] = useState({});
  const [name, setName] = useState("");
  const [grpName, setGrpName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [liveOdds, setLiveOdds] = useState({});
  const [scoreInput, setScoreInput] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminPwInput, setAdminPwInput] = useState("");
  const [adminPwErr, setAdminPwErr] = useState(false);

  // Live score state
  const [liveStatus, setLiveStatus] = useState("idle"); // idle | fetching | live | error | pre-tournament
  const [liveMsg, setLiveMsg] = useState("");
  const [lastSync, setLastSync] = useState(null);
  const [espnRound, setEspnRound] = useState(null);
  const [matchedCount, setMatchedCount] = useState(0);

  const persist = (d) => { setDB(d); saveDB(d); };
  const flash = (m, isErr = false) => {
    isErr ? setErr(m) : setMsg(m);
    setTimeout(() => isErr ? setErr("") : setMsg(""), 4000);
  };

  // ── ESPN LIVE SCORE FETCH ──────────────────────────────────────────────────
  const fetchESPNScores = useCallback(async (silent = false) => {
    if (!silent) setLiveStatus("fetching");

    // Tournament hasn't started yet — June 18 is the start date
    const now = new Date();
    const tournamentStart = new Date("2026-06-18T07:00:00-04:00"); // Thursday 7am ET
    if (now < tournamentStart) {
      setLiveStatus("pre-tournament");
      const days = Math.ceil((tournamentStart - now) / (1000 * 60 * 60 * 24));
      setLiveMsg(`Tournament starts June 18 · ${days} day${days !== 1 ? "s" : ""} to go`);
      return;
    }

    try {
      const res = await fetch(ESPN_URL);

      // Non-200 but not a crash — treat as pre/unavailable
      if (!res.ok) {
        setLiveStatus("pre-tournament");
        setLiveMsg("Scores not yet posted by ESPN. Will auto-sync once available.");
        return;
      }

      const data = await res.json();

      const competition = data?.events?.[0]?.competitions?.[0];
      const competitors = competition?.competitors || [];

      // No competitors yet = field not posted / round not started
      if (!competition || competitors.length === 0) {
        setLiveStatus("pre-tournament");
        setLiveMsg("ESPN hasn't posted scores yet — check back at tee time.");
        return;
      }

      // Detect round
      const status = data?.events?.[0]?.status;
      const roundNum = status?.period || competition?.status?.period;
      setEspnRound(roundNum);

      const newScores = { ...db.scores };
      let matched = 0;
      let cutCount = 0;

      competitors.forEach(comp => {
        const espnName = comp.athlete?.displayName || comp.athlete?.fullName || "";
        if (!espnName) return;
        const ourName = normalizeName(espnName);
        if (!ourName) return;

        const statusName = (comp.status?.type?.name || "").toUpperCase();
        const statusDesc = (comp.status?.type?.description || "").toUpperCase();
        const isCut = statusName.includes("CUT") || statusDesc.includes("CUT") ||
                      statusName.includes("WD") || statusName.includes("WITHDRAWN") ||
                      statusName.includes("DQ") || statusName.includes("DISQUALIFIED");

        if (isCut) {
          newScores[ourName] = "CUT";
          cutCount++;
          matched++;
          return;
        }

        const scoreStr = comp.score || comp.linescores?.slice(-1)?.[0]?.value?.toString() || "E";
        newScores[ourName] = parseESPNScore(scoreStr);
        matched++;
      });

      if (matched === 0) {
        setLiveStatus("pre-tournament");
        setLiveMsg("ESPN has the event but no scores yet. Will update at tee time.");
        return;
      }

      persist({ ...db, scores: newScores });
      setMatchedCount(matched);
      setLastSync(new Date());
      setLiveStatus("live");
      setLiveMsg(`${matched} players synced${cutCount > 0 ? `, ${cutCount} cut` : ""}${roundNum ? ` · Round ${roundNum}` : ""}`);

    } catch (e) {
      // Network error or ESPN changed their structure — show gentle warning, not scary error
      setLiveStatus("pre-tournament");
      setLiveMsg("Couldn't reach ESPN right now — will retry automatically.");
    }
  }, [db]);

  // Auto-refresh every 8 minutes
  useEffect(() => {
    fetchESPNScores(true);
    const t = setInterval(() => fetchESPNScores(true), 8 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  // ── ODDS API — pull live odds for draft tiers ──────────────────────────────
  const fetchLiveOdds = useCallback(async (force = false) => {
    // Hard stop: deadline passed, never pull odds again
    if (isDeadlinePassed()) return;

    // Use cache if available and not forcing refresh
    if (!force) {
      const cached = loadCachedOdds();
      if (cached) { setLiveOdds(cached); return; }
    }

    try {
      const url = `https://api.the-odds-api.com/v4/sports/${ODDS_SPORT_KEY}/odds?regions=us&markets=outrights&oddsFormat=american&apiKey=${ODDS_API_KEY}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      const oddsMap = {};
      data.forEach(ev => {
        ev.bookmakers?.forEach(bk => {
          bk.markets?.forEach(mkt => {
            mkt.outcomes?.forEach(o => {
              if (!oddsMap[o.name] || o.price < oddsMap[o.name]) oddsMap[o.name] = o.price;
            });
          });
        });
      });
      const formatted = {};
      Object.entries(oddsMap).forEach(([n, p]) => { formatted[n] = p > 0 ? `+${p}` : `${p}`; });
      setLiveOdds(formatted);
      saveCachedOdds(formatted); // cache for 24 hours
    } catch {}
  }, []);

  // Load cached odds on mount, only hit API if cache is stale and deadline hasn't passed
  useEffect(() => { fetchLiveOdds(); }, [fetchLiveOdds]);

  // ── MANUAL SCORE UPDATE ────────────────────────────────────────────────────
  function applyManualScores() {
    const newScores = { ...db.scores };
    let count = 0;
    scoreInput.split(/[\n,]+/).forEach(part => {
      const t = part.trim();
      if (!t) return;
      const m = t.match(/^(.+?)\s+([-+]?\d+|CUT|E|WD|DQ)$/i);
      if (!m) return;
      const pname = m[1].trim();
      const val = m[2].toUpperCase();
      const match = normalizeName(pname);
      if (match) {
        newScores[match] = val === "CUT" || val === "WD" || val === "DQ" ? "CUT" : val === "E" ? 0 : parseInt(val);
        count++;
      }
    });
    persist({ ...db, scores: newScores });
    flash(`✓ Updated ${count} player score${count !== 1 ? "s" : ""}`);
    setScoreInput("");
  }

  function resetScores() {
    persist({ ...db, scores: { ...DEFAULT_SCORES } });
    flash("✓ All scores reset to E");
  }

  // ── GROUP ACTIONS ──────────────────────────────────────────────────────────
  const loadGroup = async (code) => {
    setLoading(true);
    const { data: grpRow } = await supabase.from("groups").select("*").eq("id", code).single();
    const { data: memberRows } = await supabase.from("members").select("*").eq("group_id", code);
    if (grpRow && memberRows) {
      const membersObj = {};
      memberRows.forEach(m => { membersObj[m.id] = { name: m.name, picks: m.picks?.picks || [] }; });
      setGroupData({ ...grpRow, members: membersObj });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (view === "leaderboard" && cg) {
      loadGroup(cg);
      const t = setInterval(() => loadGroup(cg), 15000);
      return () => clearInterval(t);
    }
  }, [view, cg]);

  async function createGroup() {
    if (!grpName.trim() || !name.trim()) { flash("Enter your name and a group name.", true); return; }
    setLoading(true);
    const code = genCode(), uid = genCode();
    await supabase.from("groups").insert({ id: code, pool: "golf", name: grpName.trim() });
    await supabase.from("members").insert({ id: uid, group_id: code, name: name.trim(), picks: {} });
    const localDB = loadDB();
    localDB.groups[code] = { code, name: grpName.trim(), myId: uid };
    saveDB(localDB); setDB(localDB);
    setCG(code); setCU(uid); setPicks({}); await loadGroup(code);
    setView("draft"); setErr(""); setLoading(false);
  }

  async function joinGroup() {
    const code = joinCode.trim().toUpperCase();
    if (!name.trim()) { flash("Enter your name.", true); return; }
    setLoading(true);
    const { data: grpRow } = await supabase.from("groups").select("*").eq("id", code).eq("pool", "golf").single();
    if (!grpRow) { flash("Group not found. Check the code.", true); setLoading(false); return; }
    const uid = genCode();
    await supabase.from("members").insert({ id: uid, group_id: code, name: name.trim(), picks: {} });
    const localDB = loadDB();
    localDB.groups[code] = { code, name: grpRow.name, myId: uid };
    saveDB(localDB); setDB(localDB);
    setCG(code); setCU(uid); setPicks({}); await loadGroup(code);
    setView("draft"); setErr(""); setLoading(false);
  }

  async function submitPicks() {
    if (Object.keys(picks).length < 6) { flash("Select one golfer from each tier.", true); return; }
    setLoading(true);
    const arr = TIERS.map(t => picks[t.tier]);
    await supabase.from("members").update({ picks: { picks: arr } }).eq("id", cu);
    await loadGroup(cg);
    setView("leaderboard"); setErr(""); setLoading(false);
  }

  // ── DERIVED ────────────────────────────────────────────────────────────────
  const group = groupData || (cg ? db.groups[cg] : null);
  const scores = db.scores;
  const deadlinePassed = isDeadlinePassed();
  const tiersWithOdds = TIERS.map(t => ({ ...t, players: t.players.map(p => ({ ...p, odds: liveOdds[p.name] || p.odds })) }));

  const leaderboard = group
    ? Object.entries(group.members)
        .filter(([, m]) => m.picks.length === 6)
        .map(([id, m]) => { const { total, top4, dropped } = calcTeam(m.picks, scores); return { id, name: m.name, total, top4, dropped }; })
        .sort((a, b) => a.total - b.total)
    : [];

  const myEntry = leaderboard.find(e => e.id === cu);

  // ── LIVE STATUS BADGE ──────────────────────────────────────────────────────
  function LiveBadge() {
    const configs = {
      live:             { dot: "#4aba6a", label: `🔴 Live · ESPN${espnRound ? ` R${espnRound}` : ""}`, sub: liveMsg },
      fetching:         { dot: "#c8a84b", label: "⏳ Syncing…", sub: "" },
      "pre-tournament": { dot: "#c8a84b", label: "⏰ Awaiting Tee Times", sub: liveMsg },
      error:            { dot: "#c8a84b", label: "⏰ Awaiting Tee Times", sub: liveMsg },
      idle:             { dot: "#c8a84b", label: "⏰ Awaiting Tee Times", sub: "Auto-syncs when tournament begins" },
    };
    const c = configs[liveStatus] || configs.idle;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={S.dot(c.dot)} />
        <div>
          <div style={{ fontSize: 13, color: "#c8a84b", fontWeight: "bold" }}>{c.label}</div>
          {c.sub && <div style={{ fontSize: 11, color: "rgba(200,168,75,0.6)" }}>{c.sub}</div>}
          {lastSync && <div style={{ fontSize: 10, color: "rgba(200,168,75,0.5)" }}>Updated {lastSync.toLocaleTimeString()}</div>}
        </div>
      </div>
    );
  }

  // ── HOME VIEW ──────────────────────────────────────────────────────────────
  if (view === "home") return (
    <div style={S.app}>
      <header style={S.hdr}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>⛳</span>
          <div><div style={S.logoTxt}>The US Open Pool</div><div style={S.logoSub}>2026 · Shinnecock Hills · June 18–21</div></div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={S.btnSm} onClick={() => setView("admin")}>⚙ Admin</button>
          <button style={{ ...S.btnSm, color: "#4ab8f0", borderColor: "rgba(74,184,240,0.3)" }} onClick={onBack}>← Fellowship</button>
        </div>
      </header>
      <div style={S.main}>
        <div style={{ textAlign: "center", padding: "48px 0 36px" }}>
          <div style={{ fontSize: 52, marginBottom: 20 }}>🏆</div>
          <div style={{ fontFamily: DISPLAY, fontSize: 60, letterSpacing: "0.06em", color: "#c8a84b", lineHeight: 0.95, marginBottom: 12 }}>THE US OPEN POOL</div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.25em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: 14, fontFamily: BODY }}>Shinnecock Hills · June 18–21, 2026</div>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, maxWidth: 420, margin: "0 auto 8px", fontWeight: 400, lineHeight: 1.6 }}>
            Pick 1 golfer from each of 6 tiers. Best 4 of 6 scores count. Missed cut = +20. Lowest total wins.
          </p>
          <div style={{ display: "inline-block", background: "rgba(200,168,75,0.1)", border: "1px solid rgba(200,168,75,0.3)", borderRadius: 8, padding: "8px 18px", marginTop: 4 }}>
            <LiveBadge />
          </div>
        </div>

        {err && <div style={S.err}>{err}</div>}
        {msg && <div style={S.ok}>{msg}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div style={S.card}>
            <div style={S.h2}>🆕 Create a Group</div>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginBottom: 14 }}>Start a pool and share the invite code.</p>
            <label style={S.lbl}>Your name</label>
            <input style={{ ...S.inp, marginBottom: 10 }} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mike" />
            <label style={S.lbl}>Group name</label>
            <input style={{ ...S.inp, marginBottom: 14 }} value={grpName} onChange={e => setGrpName(e.target.value)} placeholder="e.g. Work Pool" />
            <button style={S.btnGold} onClick={createGroup}>Create & Pick →</button>
          </div>
          <div style={S.card}>
            <div style={S.h2}>🔗 Join a Group</div>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginBottom: 14 }}>Got a code? Jump in and pick your team.</p>
            <label style={S.lbl}>Your name</label>
            <input style={{ ...S.inp, marginBottom: 10 }} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sarah" />
            <label style={S.lbl}>Group code</label>
            <input style={{ ...S.inp, marginBottom: 14 }} value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="e.g. AB3X7" />
            <button style={S.btnGold} onClick={joinGroup}>Join & Pick →</button>
          </div>
        </div>

        {Object.keys(db.groups).length > 0 && (
          <div style={S.card}>
            <div style={S.h2}>📋 Your Groups</div>
            {Object.entries(db.groups).map(([code, g]) => (
              <div key={code} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.04)", padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 8 }}>
                <div>
                  <span style={{ color: "#c8a84b", fontWeight: "bold", marginRight: 10 }}>{g.name}</span>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontFamily: "monospace" }}>{code}</span>
                </div>
                <button style={S.btnGold} onClick={async () => { setCG(code); setCU(g.myId); await loadGroup(code); setView("leaderboard"); }}>Leaderboard →</button>
              </div>
            ))}
          </div>
        )}

        <div style={S.card}>
          <div style={{ ...S.h2, marginBottom: 14 }}>SCORING</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
            {[["Score", "Cumulative tournament score taken for each golfer"],
              ["+20", "Missed cut penalty per golfer"],
              ["4 of 6", "Only best 4 scores count"],
              ["Lowest", "Lowest combined total wins"]
            ].map(([pts, desc]) => (
              <div key={pts} style={{ textAlign: "center", padding: 14, background: "rgba(255,255,255,0.04)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 24, color: "#c8a84b", letterSpacing: "0.04em", marginBottom: 4 }}>{pts}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontFamily: BODY, lineHeight: 1.4 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ── ADMIN PASSWORD GATE ────────────────────────────────────────────────────
  if (view === "admin" && !adminUnlocked) return (
    <div style={S.app}>
      <header style={S.hdr}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>⛳</span>
          <div><div style={S.logoTxt}>The US Open Pool</div><div style={S.logoSub}>Admin Access</div></div>
        </div>
        <button style={S.btnSm} onClick={() => setView("home")}>← Back</button>
      </header>
      <div style={S.main}>
        <div style={{ maxWidth: 360, margin: "80px auto 0", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
          <div style={{ fontFamily: DISPLAY, fontSize: 28, color: "#c8a84b", letterSpacing: "0.06em", marginBottom: 8 }}>ADMIN ACCESS</div>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginBottom: 24, fontFamily: BODY }}>Enter the admin password to continue.</p>
          <input
            type="password"
            style={{ ...S.inp, marginBottom: 12, textAlign: "center", letterSpacing: "0.1em" }}
            placeholder="Password"
            value={adminPwInput}
            onChange={e => { setAdminPwInput(e.target.value); setAdminPwErr(false); }}
            onKeyDown={e => { if (e.key === "Enter") { if (adminPwInput === "Fellowshiptothemoon") { setAdminUnlocked(true); setAdminPwInput(""); } else setAdminPwErr(true); }}}
          />
          {adminPwErr && <div style={{ color: "#e05050", fontSize: 13, marginBottom: 10, fontFamily: BODY }}>Incorrect password.</div>}
          <button style={S.btnGold} onClick={() => { if (adminPwInput === "Fellowshiptothemoon") { setAdminUnlocked(true); setAdminPwInput(""); } else setAdminPwErr(true); }}>
            Unlock →
          </button>
        </div>
      </div>
    </div>
  );

  // ── ADMIN VIEW ─────────────────────────────────────────────────────────────
  if (view === "admin") return (
    <div style={S.app}>
      <header style={S.hdr}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>⛳</span>
          <div><div style={S.logoTxt}>The US Open Pool</div><div style={S.logoSub}>Admin</div></div>
        </div>
        <button style={S.btnSm} onClick={() => setView("home")}>← Home</button>
          <button style={S.btnSm} onClick={onBack}>← Fellowship</button>
      </header>
      <div style={S.main}>
        {msg && <div style={S.ok}>{msg}</div>}
        {err && <div style={S.err}>{err}</div>}

        {/* Odds API status */}
        <div style={S.card}>
          <div style={S.h2}>📈 DraftKings Live Odds</div>
          {deadlinePassed ? (
            <div style={{ ...S.warn, marginBottom: 0 }}>
              🔒 Entry deadline passed (Wed June 17 · 11:59 PM ET). Odds pulls are permanently disabled — picks are locked.
            </div>
          ) : (
            <>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginBottom: 10 }}>
                Odds are cached for 24 hours — 20 friends opening the app won't burn 20 requests.
                Pulls stop automatically at the entry deadline: <strong style={{ color: "#8aaa8a" }}>Wed June 17 · 11:59 PM ET</strong>.
              </p>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button style={S.btnGold} onClick={() => fetchLiveOdds(true)}>Force Refresh Odds</button>
                <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
                  {loadCachedOdds() ? "✓ Cache active — serving fresh odds" : "No cache yet — will fetch when draft opens"}
                </span>
              </div>
            </>
          )}
        </div>

        {/* ESPN Live Score Status */}
        <div style={S.card}>
          <div style={S.h2}>📡 ESPN Live Scores</div>
          <div style={{ marginBottom: 14 }}><LiveBadge /></div>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginBottom: 14 }}>
            Scores pull automatically from ESPN's API every 8 minutes during the tournament.
            No API key needed — completely free. Tournament ID: <code style={{ color: "#7a9a7a" }}>{ESPN_TOURNAMENT_ID}</code>
          </p>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button style={S.btnGold} onClick={() => fetchESPNScores(false)} disabled={liveStatus === "fetching"}>
              {liveStatus === "fetching" ? "Syncing…" : "Sync Now"}
            </button>
            {(liveStatus === "pre-tournament" || liveStatus === "error") && (
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                Will auto-sync once the tournament begins June 18.
              </span>
            )}
          </div>

          {liveStatus === "pre-tournament" && (
            <div style={{ ...S.warn, marginTop: 14, marginBottom: 0 }}>
              ⏰ The US Open starts <strong>Thursday June 18</strong>. ESPN scores will appear here automatically once play begins.
              Scores will auto-refresh every 8 minutes during rounds.
            </div>
          )}

          {matchedCount > 0 && (
            <div style={{ marginTop: 12, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
              Last sync matched <strong style={{ color: "#5a8a5a" }}>{matchedCount}</strong> players from ESPN to our field.
            </div>
          )}
        </div>

        {/* Manual override */}
        <div style={S.card}>
          <div style={S.h2}>✏️ Manual Score Override</div>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginBottom: 8 }}>
            Backup option if ESPN sync fails. One entry per line — use last name or full name.
          </p>
          <div style={{ display: "flex", gap: 20, marginBottom: 12 }}>
            {[["Under par", "Scheffler -8"], ["Over par", "Rahm +3"], ["Even", "McIlroy E"], ["Cut", "Spieth CUT"]].map(([lbl, ex]) => (
              <div key={lbl} style={{ fontSize: 11 }}>
                <div style={{ color: "rgba(255,255,255,0.45)", marginBottom: 2 }}>{lbl}</div>
                <code style={{ color: "#7a9a7a" }}>{ex}</code>
              </div>
            ))}
          </div>
          <textarea
            style={{ ...S.inp, height: 140, resize: "vertical", marginBottom: 10 }}
            placeholder={"Scheffler -8\nMcIlroy -5\nRahm +3\nSpieth CUT\n..."}
            value={scoreInput}
            onChange={e => setScoreInput(e.target.value)}
          />
          <div style={{ display: "flex", gap: 10 }}>
            <button style={S.btnGold} onClick={applyManualScores}>Apply</button>
            <button style={S.btnRed} onClick={resetScores}>Reset All to E</button>
          </div>
        </div>

        {/* Score preview */}
        <div style={S.card}>
          <div style={{ ...S.h2, marginBottom: 10 }}>📊 Current Scores</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 4, maxHeight: 300, overflowY: "auto" }}>
            {ALL_PLAYERS.map(p => (
              <div key={p} style={{ display: "flex", justifyContent: "space-between", padding: "5px 8px", borderRadius: 5, background: "#0a1208", fontSize: 12 }}>
                <span style={{ color: "rgba(255,255,255,0.5)" }}>{p}</span>
                <strong style={{ color: scoreColor(scores[p]) }}>{scoreDisplay(scores[p])}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ── DRAFT VIEW ─────────────────────────────────────────────────────────────
  if (view === "draft") return (
    <div style={S.app}>
      <header style={S.hdr}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>⛳</span>
          <div><div style={S.logoTxt}>The US Open Pool</div><div style={S.logoSub}>{deadlinePassed ? "Picks Locked" : "Make Your Picks"}</div></div>
        </div>
        <button style={S.btnSm} onClick={() => setView("home")}>← Home</button>
          <button style={S.btnSm} onClick={onBack}>← Fellowship</button>
      </header>
      <div style={S.main}>
        {group && (
          <div style={S.codeBox}>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 4 }}>Share This Code With Friends</div>
            <div style={S.code}>{group.code}</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 4 }}>{group.name}</div>
          </div>
        )}

        {deadlinePassed ? (
          <div style={{ ...S.warn, textAlign: "center", padding: 28, marginBottom: 0 }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>🔒</div>
            <div style={{ fontSize: 16, color: "#c8a84b", fontWeight: "bold", marginBottom: 6 }}>Picks are locked</div>
            <div style={{ color: "#7a6a3a", fontSize: 14 }}>The entry deadline was Wednesday June 17 at 11:59 PM ET. The tournament is underway — check the leaderboard!</div>
            <button style={{ ...S.btnGold, marginTop: 16 }} onClick={() => setView("leaderboard")}>View Leaderboard →</button>
          </div>
        ) : (
          <>
        <p style={{ color: "rgba(255,255,255,0.45)", textAlign: "center", marginBottom: 18, fontSize: 14 }}>
          Pick <strong style={{ color: "#c8a84b" }}>1 golfer from each tier</strong> — your best 4 of 6 scores count.
          {" "}<span style={{ color: "rgba(255,255,255,0.4)" }}>Deadline: Wed June 17 · 11:59 PM ET</span>
        </p>
        {err && <div style={S.err}>{err}</div>}

        {tiersWithOdds.map(t => (
          <div key={t.tier} style={{ ...S.card, borderLeft: `3px solid ${t.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <span style={{ color: t.color, fontWeight: "bold", fontSize: 14 }}>{t.label}</span>
                <span style={{ color: "#7a9a7a", fontSize: 13, marginLeft: 8 }}>{t.subtitle}</span>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 }}>{t.desc}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontStyle: "italic" }}>{t.range}</div>
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{t.players.length} players</div>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {t.players.map(p => {
                const sel = picks[t.tier] === p.name;
                return (
                  <button key={p.name} onClick={() => setPicks(prev => ({ ...prev, [t.tier]: p.name }))} style={{
                    background: sel ? t.color : "#1a1f1a",
                    color: sel ? "#0a1208" : "#9ab89a",
                    border: `1px solid ${sel ? t.color : "#1e3a1f"}`,
                    borderRadius: 18, padding: "6px 12px", fontSize: 12,
                    cursor: "pointer", fontWeight: sel ? "bold" : "normal",
                    transition: "all 0.1s",
                  }}>
                    {p.name} <span style={{ opacity: 0.55, fontSize: 10 }}>{p.odds}</span>
                  </button>
                );
              })}
            </div>
            {picks[t.tier] && (
              <div style={{ marginTop: 6, color: "#4aba6a", fontSize: 12 }}>✓ <strong>{picks[t.tier]}</strong></div>
            )}
          </div>
        ))}

        <div style={{ position: "sticky", bottom: 12, background: "#1a1f1a", border: "1px solid #1e3a1f", borderRadius: 12, padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <span style={{ color: "#c8a84b", fontWeight: "bold", fontSize: 20 }}>{Object.keys(picks).length}</span>
            <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}> / 6 tiers picked</span>
          </div>
          {err && <span style={{ color: "#e05050", fontSize: 12 }}>{err}</span>}
          <button style={{ ...S.btnGold, opacity: Object.keys(picks).length < 6 ? 0.4 : 1 }} onClick={submitPicks}>
            Lock In Picks →
          </button>
        </div>
          </>
        )}
      </div>
    </div>
  );

  // ── LEADERBOARD VIEW ───────────────────────────────────────────────────────
  if (view === "leaderboard") return (
    <div style={S.app}>
      <header style={S.hdr}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>⛳</span>
          <div><div style={S.logoTxt}>The US Open Pool</div><div style={S.logoSub}>{group?.name}</div></div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={S.btnSm} onClick={() => setView("admin")}>⚙</button>
          {!deadlinePassed && <button style={S.btnSm} onClick={() => { setPicks({}); setView("draft"); }}>Edit Picks</button>}
          <button style={S.btnSm} onClick={() => setView("home")}>Home</button>
          <button style={{ ...S.btnSm, color: "#4ab8f0", borderColor: "rgba(74,184,240,0.3)" }} onClick={onBack}>← Fellowship</button>
        </div>
      </header>
      <div style={S.main}>
        {/* Group header */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "stretch" }}>
          <div style={{ ...S.codeBox, flex: "0 0 auto", margin: 0, padding: "12px 18px" }}>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em" }}>Invite Code</div>
            <div style={{ ...S.code, fontSize: 26 }}>{group?.code}</div>
          </div>
          <div style={{ ...S.card, flex: 1, margin: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
            <LiveBadge />
            {myEntry && (
              <div style={{ color: "#c8a84b", fontSize: 14 }}>
                Your score: <strong style={{ fontSize: 20 }}>
                  {myEntry.total === 0 ? "E" : myEntry.total > 0 ? `+${myEntry.total}` : myEntry.total}
                </strong>
              </div>
            )}
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>
              {Object.keys(group?.members || {}).length} members · {leaderboard.length} picks submitted
            </div>
          </div>
        </div>

        {msg && <div style={S.ok}>{msg}</div>}

        {leaderboard.length === 0 ? (
          <div style={{ ...S.card, textAlign: "center", padding: 32 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
            <p style={{ color: "rgba(255,255,255,0.45)" }}>No picks submitted yet — be the first!</p>
            <button style={{ ...S.btnGold, marginTop: 10 }} onClick={() => { setPicks({}); setView("draft"); }}>Make Picks →</button>
          </div>
        ) : leaderboard.map((e, i) => {
          const isMe = e.id === cu;
          const exp = expanded === e.id;
          const medals = ["🥇", "🥈", "🥉"];
          const totDisp = e.total === 0 ? "E" : e.total > 0 ? `+${e.total}` : `${e.total}`;
          const totColor = e.total < 0 ? "#4aba6a" : e.total === 0 ? "rgba(255,255,255,0.5)" : "#e0905a";
          const allPicks = [...e.top4.map(p => ({ ...p, counting: true })), ...e.dropped.map(p => ({ ...p, counting: false }))];
          return (
            <div key={e.id} style={{ ...S.card, borderColor: isMe ? "rgba(200,168,75,0.3)" : "rgba(255,255,255,0.06)", cursor: "pointer" }}
              onClick={() => setExpanded(exp ? null : e.id)}>

              {/* Row: rank + name + total */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 30, textAlign: "center", fontSize: i < 3 ? 18 : 13, color: "rgba(255,255,255,0.4)", fontWeight: "bold" }}>
                  {i < 3 ? medals[i] : `#${i + 1}`}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, color: isMe ? "#c8a84b" : "#f0f2f5", fontWeight: isMe ? 700 : 400, fontFamily: BODY }}>
                    {e.name} {isMe && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>(you)</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: BODY, marginTop: 2 }}>
                    Best 4 of 6 count · {e.dropped.length > 0 ? `${e.dropped.map(p => p.name.split(" ").pop()).join(", ")} dropped` : "all counting"}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 28, letterSpacing: "0.04em", color: totColor }}>{totDisp}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: BODY, letterSpacing: "0.1em", textTransform: "uppercase" }}>Total</div>
                </div>
                <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>{exp ? "▲" : "▼"}</div>
              </div>

              {/* Golfer scores — always visible */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginTop: 12 }}>
                {allPicks.map(p => (
                  <div key={p.name} style={{
                    background: p.counting ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${p.counting ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)"}`,
                    borderRadius: 8, padding: "8px 10px",
                    opacity: p.counting ? 1 : 0.45,
                  }}>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: BODY, marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {p.name}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ color: scoreColor(p.raw), fontSize: 14, fontFamily: BODY }}>{scoreDisplay(p.raw)}</strong>
                      {!p.counting && <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontFamily: BODY, textTransform: "uppercase", letterSpacing: "0.08em" }}>dropped</span>}
                      {p.counting && <span style={{ fontSize: 9, color: "rgba(200,168,75,0.5)", fontFamily: BODY, textTransform: "uppercase", letterSpacing: "0.08em" }}>counts</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Expanded: cumulative breakdown */}
              {exp && (
                <div style={{ marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: BODY, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                      Cumulative Score (best 4)
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {e.top4.map((p, idx) => (
                        <span key={p.name} style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: BODY }}>
                          <span style={{ color: scoreColor(p.raw) }}>{scoreDisplay(p.raw)}</span>
                          {idx < e.top4.length - 1 && <span style={{ color: "rgba(255,255,255,0.2)", margin: "0 4px" }}>+</span>}
                        </span>
                      ))}
                      <span style={{ color: "rgba(255,255,255,0.2)", margin: "0 4px" }}>=</span>
                      <span style={{ fontFamily: DISPLAY, fontSize: 20, color: totColor, letterSpacing: "0.04em" }}>{totDisp}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {!myEntry && (
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <button style={S.btnGold} onClick={() => { setPicks({}); setView("draft"); }}>Make Your Picks →</button>
          </div>
        )}
      </div>
    </div>
  );

  return null;
}
