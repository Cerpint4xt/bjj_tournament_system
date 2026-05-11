"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

// ─── Palettes ─────────────────────────────────────────────────────────────────

interface PaletteColors {
  hex: string;
  scoreHover: string;   // Tailwind hover classes for score card zones
  miniHover: string;    // Tailwind hover classes for mini cards
  panelBg: string;      // subtle tint behind each athlete half (dark mode)
  panelBgLight: string; // stronger tint for light mode
}

interface Palette {
  label: string;
  a: PaletteColors;
  b: PaletteColors;
}

const PALETTES: Palette[] = [
  {
    label: "Blue / Red",
    a: { hex: "#2563EB", scoreHover: "hover:bg-blue-600/40 active:bg-blue-600/60",     miniHover: "hover:bg-blue-600/40 active:bg-blue-600/60",     panelBg: "bg-blue-600/25",   panelBgLight: "bg-blue-600/75"  },
    b: { hex: "#DC2626", scoreHover: "hover:bg-red-600/40  active:bg-red-600/60",      miniHover: "hover:bg-red-600/40  active:bg-red-600/60",      panelBg: "bg-red-600/25",    panelBgLight: "bg-red-600/75"   },
  },
  {
    label: "Blue / Orange",
    a: { hex: "#1D4ED8", scoreHover: "hover:bg-blue-700/40 active:bg-blue-700/60",     miniHover: "hover:bg-blue-700/40 active:bg-blue-700/60",     panelBg: "bg-blue-700/25",   panelBgLight: "bg-blue-700/75"  },
    b: { hex: "#EA580C", scoreHover: "hover:bg-orange-600/40 active:bg-orange-600/60", miniHover: "hover:bg-orange-600/40 active:bg-orange-600/60", panelBg: "bg-orange-600/25", panelBgLight: "bg-orange-600/75" },
  },
  {
    label: "Navy / Gold",
    a: { hex: "#1E3A8A", scoreHover: "hover:bg-blue-900/40 active:bg-blue-900/60",     miniHover: "hover:bg-blue-900/40 active:bg-blue-900/60",     panelBg: "bg-blue-900/30",   panelBgLight: "bg-blue-900/75"  },
    b: { hex: "#D97706", scoreHover: "hover:bg-amber-600/40 active:bg-amber-600/60",   miniHover: "hover:bg-amber-600/40 active:bg-amber-600/60",   panelBg: "bg-amber-600/25",  panelBgLight: "bg-amber-600/75" },
  },
  {
    label: "Teal / Crimson",
    a: { hex: "#0F766E", scoreHover: "hover:bg-teal-700/40 active:bg-teal-700/60",     miniHover: "hover:bg-teal-700/40 active:bg-teal-700/60",     panelBg: "bg-teal-700/25",   panelBgLight: "bg-teal-700/75"  },
    b: { hex: "#9F1239", scoreHover: "hover:bg-rose-800/40  active:bg-rose-800/60",    miniHover: "hover:bg-rose-800/40  active:bg-rose-800/60",    panelBg: "bg-rose-800/25",   panelBgLight: "bg-rose-800/75"  },
  },
  {
    label: "Indigo / Emerald",
    a: { hex: "#4338CA", scoreHover: "hover:bg-indigo-700/40 active:bg-indigo-700/60", miniHover: "hover:bg-indigo-700/40 active:bg-indigo-700/60", panelBg: "bg-indigo-700/25", panelBgLight: "bg-indigo-700/75" },
    b: { hex: "#059669", scoreHover: "hover:bg-emerald-600/40 active:bg-emerald-600/60", miniHover: "hover:bg-emerald-600/40 active:bg-emerald-600/60", panelBg: "bg-emerald-600/25", panelBgLight: "bg-emerald-600/75" },
  },
];

// ─── Theme ────────────────────────────────────────────────────────────────────

type Theme = "dark" | "light";

const T = {
  dark: {
    page:           "bg-gray-950 text-white",
    border:         "border-white/10",
    divider:        "bg-white/10",
    muted:          "text-white/30",
    inputBorder:    "border-white/20 focus:border-white/60",
    cardBorder:     "border-transparent",
    cardLine:       "border-transparent",
    miniCardBorder: "border-transparent",
    miniCardLine:   "border-transparent",
    labelMuted:     "text-white/40",
    zoneLabel:      "text-white/0 hover:text-white/80 transition-colors duration-150",
    pmHint:         "text-white/30",
    btnBase:        "bg-white/10 hover:bg-white/20 active:bg-white/30 border-white/20",
    iconBtn:        "text-white/40 hover:text-white/80 hover:bg-white/10",
    timerInput:     "border-white/50 text-white",
  },
  light: {
    page:           "bg-white text-gray-900",
    border:         "border-zinc-200",
    divider:        "bg-zinc-200",
    muted:          "text-zinc-500",
    inputBorder:    "border-zinc-300 focus:border-zinc-600",
    cardBorder:     "border-transparent",
    cardLine:       "border-transparent",
    miniCardBorder: "border-transparent",
    miniCardLine:   "border-transparent",
    labelMuted:     "text-zinc-500",
    zoneLabel:      "text-gray-900/0 hover:text-zinc-800 transition-colors duration-150",
    pmHint:         "text-zinc-400",
    btnBase:        "bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 border-zinc-200",
    iconBtn:        "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100",
    timerInput:     "border-zinc-400 text-gray-900",
  },
} satisfies Record<Theme, Record<string, string>>;

// ─── Data ─────────────────────────────────────────────────────────────────────

interface Athlete { name: string; academy: string; score: number; adv: number; pen: number; scoreHistory: number[]; }
interface MatchState {
  athleteA: Athlete; athleteB: Athlete;
  timer: number; timerRunning: boolean;
  category: string; round: string; mat: string;
}

const DEFAULT_DURATION = 5 * 60;
const DEFAULT_STATE: MatchState = {
  athleteA: { name: "Athlete A", academy: "Academy", score: 0, adv: 0, pen: 0, scoreHistory: [] },
  athleteB: { name: "Athlete B", academy: "Academy", score: 0, adv: 0, pen: 0, scoreHistory: [] },
  timer: DEFAULT_DURATION, timerRunning: false,
  category: "Adult Black Belt Light", round: "Semifinal", mat: "Mat 1",
};

type PersistedAthlete = Omit<Athlete, "scoreHistory"> & { scoreHistory?: number[]; lastDelta?: number | null };
type PersistedMatchState = Omit<MatchState, "athleteA" | "athleteB"> & {
  athleteA?: PersistedAthlete;
  athleteB?: PersistedAthlete;
};

function normalizeAthlete(athlete: PersistedAthlete | undefined, fallback: Athlete): Athlete {
  if (!athlete) return fallback;

  const scoreHistory = Array.isArray(athlete.scoreHistory)
    ? athlete.scoreHistory.filter((delta) => typeof delta === "number" && Number.isFinite(delta) && delta !== 0)
    : typeof athlete.lastDelta === "number" && Number.isFinite(athlete.lastDelta) && athlete.lastDelta !== 0
      ? [athlete.lastDelta]
      : [];

  return {
    name: typeof athlete.name === "string" ? athlete.name : fallback.name,
    academy: typeof athlete.academy === "string" ? athlete.academy : fallback.academy,
    score: typeof athlete.score === "number" && Number.isFinite(athlete.score) ? athlete.score : fallback.score,
    adv: typeof athlete.adv === "number" && Number.isFinite(athlete.adv) ? athlete.adv : fallback.adv,
    pen: typeof athlete.pen === "number" && Number.isFinite(athlete.pen) ? athlete.pen : fallback.pen,
    scoreHistory,
  };
}

function normalizeMatchState(state: PersistedMatchState | null | undefined): MatchState {
  if (!state) return DEFAULT_STATE;

  return {
    athleteA: normalizeAthlete(state.athleteA, DEFAULT_STATE.athleteA),
    athleteB: normalizeAthlete(state.athleteB, DEFAULT_STATE.athleteB),
    timer: typeof state.timer === "number" && Number.isFinite(state.timer) ? state.timer : DEFAULT_STATE.timer,
    timerRunning: typeof state.timerRunning === "boolean" ? state.timerRunning : DEFAULT_STATE.timerRunning,
    category: typeof state.category === "string" ? state.category : DEFAULT_STATE.category,
    round: typeof state.round === "string" ? state.round : DEFAULT_STATE.round,
    mat: typeof state.mat === "string" ? state.mat : DEFAULT_STATE.mat,
  };
}

function loadState(): MatchState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const r = localStorage.getItem("bjj:current_match");
    return r ? normalizeMatchState(JSON.parse(r) as PersistedMatchState) : DEFAULT_STATE;
  }
  catch { return DEFAULT_STATE; }
}
function saveState(s: MatchState) { localStorage.setItem("bjj:current_match", JSON.stringify(s)); }
function formatTime(s: number) { return `${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`; }
function parseTime(val: string): number | null {
  const p = val.split(":");
  if (p.length === 2) { const m = +p[0], s = +p[1]; if (!isNaN(m) && !isNaN(s) && s < 60) return m*60+s; }
  const n = parseInt(val, 10); return isNaN(n) ? null : n*60;
}

// ─── Components ───────────────────────────────────────────────────────────────

function EditableText({ value, onChange, className, placeholder, t }: {
  value: string; onChange: (v: string) => void; className?: string; placeholder?: string; t: typeof T.dark;
}) {
  return (
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className={`bg-transparent border-b ${t.inputBorder} outline-none text-center w-full transition-colors ${className ?? ""}`} />
  );
}

function TimerDisplay({ timer, timerRunning, timerColor, onChangeTimer, t }: {
  timer: number; timerRunning: boolean; timerColor: string; onChangeTimer: (s: number) => void; t: typeof T.dark;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  function startEdit() { if (timerRunning) return; setDraft(formatTime(timer)); setEditing(true); }
  function commit() { const p = parseTime(draft); if (p !== null && p > 0) onChangeTimer(p); setEditing(false); }

  if (editing) return (
    <input autoFocus type="text" value={draft} onChange={(e) => setDraft(e.target.value)}
      onBlur={commit} onKeyDown={(e) => { if (e.key === "Enter") commit(); }}
      className={`scoreboard-timer text-8xl font-black tabular-nums tracking-tight bg-transparent text-center outline-none border-b-2 w-72 max-w-[60vw] ${t.timerInput}`} />
  );
  return (
    <div onClick={startEdit} title={timerRunning ? undefined : "Click to edit time"}
      className={`scoreboard-timer text-8xl font-black tabular-nums tracking-tight ${timerColor} ${!timerRunning ? "cursor-pointer hover:opacity-70" : "cursor-default"} transition-opacity`}>
      {formatTime(timer)}
    </div>
  );
}

const TOP_ZONES = [
  { pts: 4, label: "+4" }, { pts: 3, label: "+3" }, { pts: 2, label: "+2" },
];

function ScoreCard({ score, onScore, onUndo, canUndo, pc, t }: {
  score: number; onScore: (pts: number) => void; onUndo: () => void; canUndo: boolean; pc: PaletteColors; t: typeof T.dark;
}) {
  return (
    <div className={`scoreboard-scorecard relative w-full flex-1 flex flex-col rounded-2xl overflow-hidden border ${t.cardBorder} ${pc.panelBg} min-h-0`}>
      {/* Top row — +4 +3 +2 */}
      <div className="flex flex-1">
        {TOP_ZONES.map(({ pts, label }) => (
          <button key={pts} onClick={() => onScore(pts)}
            className={`flex-1 flex justify-center items-center ${t.zoneLabel} ${pc.scoreHover} transition-all text-4xl font-bold select-none`}>
            {label}
          </button>
        ))}
      </div>
      {/* Bottom row — +1 | Undo */}
      <div className="flex flex-1">
        <button onClick={() => onScore(1)}
          className={`flex-1 flex justify-center items-center ${t.zoneLabel} ${pc.scoreHover} transition-all text-4xl font-bold select-none`}>
          +1
        </button>
        <button onClick={onUndo} disabled={!canUndo}
          className={`flex-1 flex justify-center items-center ${t.zoneLabel} ${pc.scoreHover} transition-all select-none disabled:opacity-25`}>
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
          </svg>
        </button>
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="scoreboard-score text-[9rem] font-black tabular-nums leading-none drop-shadow-lg">{score}</span>
      </div>
    </div>
  );
}

function MiniCard({ label, value, onPlus, onMinus, t, cardBg, hoverCls, valueColor }: {
  label: string; value: number; onPlus: () => void; onMinus: () => void; t: typeof T.dark;
  cardBg: string; hoverCls: string; valueColor?: string;
}) {
  return (
    <div className="scoreboard-mini flex flex-col items-center gap-1.5 min-w-0">
      <span className={`scoreboard-mini-label text-2xl font-bold uppercase tracking-widest ${t.labelMuted}`}>{label}</span>
      <div className={`scoreboard-mini-card relative grid grid-cols-2 rounded-xl overflow-hidden border ${t.miniCardBorder} ${cardBg} w-72 h-52 max-w-full`}>
        <button onClick={onPlus}  className={`${hoverCls} transition-colors`} />
        <button onClick={onMinus} className={`${hoverCls} transition-colors border-l ${t.miniCardLine}`} />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className={`scoreboard-mini-value text-8xl font-black tabular-nums ${valueColor ?? ""}`}>{value}</span>
        </div>
        <div className={`absolute inset-0 flex items-center justify-between px-5 pointer-events-none ${t.pmHint}`}>
          <span className="text-xl font-bold">+</span>
          <span className="text-xl font-bold">−</span>
        </div>
      </div>
    </div>
  );
}

function FullscreenButton({ t }: { t: typeof T.dark }) {
  const [isFs, setIsFs] = useState(false);
  useEffect(() => {
    function h() { setIsFs(!!document.fullscreenElement); }
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);
  function toggle() { !document.fullscreenElement ? document.documentElement.requestFullscreen() : document.exitFullscreen(); }
  return (
    <button onClick={toggle} title={isFs ? "Exit fullscreen" : "Fullscreen"} className={`p-2 rounded-lg transition-all ${t.iconBtn}`}>
      {isFs
        ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/></svg>
        : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
      }
    </button>
  );
}

function ThemeButton({ theme, onToggle, t }: { theme: Theme; onToggle: () => void; t: typeof T.dark }) {
  return (
    <button onClick={onToggle} title="Toggle dark/light" className={`p-2 rounded-lg transition-all ${t.iconBtn}`}>
      {theme === "dark"
        ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      }
    </button>
  );
}

function BrandLogo({ theme }: { theme: Theme }) {
  const src = theme === "dark" ? "/img/Stacked_Red.png" : "/img/Stacked_Black.png";
  const alt = "BJJ tournament scoreboard";

  return (
    <div className="pointer-events-none shrink-0">
      <Image
        src={src}
        alt={alt}
        width={152}
        height={48}
        priority
        className="h-8 w-auto max-w-[11rem] opacity-90 md:h-9 md:max-w-[15rem]"
      />
    </div>
  );
}

function CenterShield({ theme }: { theme: Theme }) {
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-[50.5%] -translate-y-[10%]">
      <Image
        src="/img/Red_Shield.png"
        alt="Tournament shield"
        width={320}
        height={320}
        className={`h-[8.75rem] w-auto md:h-[12.5rem] ${theme === "light" ? "opacity-18" : "opacity-22"}`}
      />
    </div>
  );
}

// Palette picker — 5 swatch buttons on the left showing A|B split circle
function PalettePicker({ selected, onSelect, t }: {
  selected: number; onSelect: (i: number) => void; t: typeof T.dark;
}) {
  return (
    <div className="flex flex-row flex-wrap gap-2">
      {PALETTES.map((p, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          title={p.label}
          className={`w-8 h-8 rounded-full overflow-hidden transition-all ring-2 ${selected === i ? "ring-white/70 scale-110" : "ring-transparent hover:ring-white/30"}`}
          style={{ background: `linear-gradient(135deg, ${p.a.hex} 50%, ${p.b.hex} 50%)` }}
        />
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Scoreboard() {
  const [match, setMatch]       = useState<MatchState>(DEFAULT_STATE);
  const [theme, setTheme]       = useState<Theme>("dark");
  const [paletteIdx, setPaletteIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const t  = T[theme];
  const pal = PALETTES[paletteIdx];
  function resolvePC(pc: PaletteColors): PaletteColors {
    return theme === "light" ? { ...pc, panelBg: pc.panelBgLight } : pc;
  }
  const pcA = resolvePC(pal.a);
  const pcB = resolvePC(pal.b);

  useEffect(() => { setMatch(loadState()); }, []);
  useEffect(() => { saveState(match); }, [match]);

  useEffect(() => {
    if (match.timerRunning) {
      intervalRef.current = setInterval(() => {
        setMatch((prev) => {
          if (prev.timer <= 1) { clearInterval(intervalRef.current!); intervalRef.current = null; return { ...prev, timer: 0, timerRunning: false }; }
          return { ...prev, timer: prev.timer - 1 };
        });
      }, 1000);
    } else {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    }
    return () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
  }, [match.timerRunning]);

  function addScore(side: "athleteA" | "athleteB", pts: number) {
    setMatch((p) => {
      const newScore = Math.max(0, p[side].score + pts);
      const applied = newScore - p[side].score;
      if (applied === 0) return p;
      return { ...p, [side]: { ...p[side], score: newScore, scoreHistory: [...p[side].scoreHistory, applied] } };
    });
  }
  function undoScore(side: "athleteA" | "athleteB") {
    setMatch((p) => {
      const delta = p[side].scoreHistory.at(-1);
      if (delta === undefined) return p;
      return {
        ...p,
        [side]: {
          ...p[side],
          score: Math.max(0, p[side].score - delta),
          scoreHistory: p[side].scoreHistory.slice(0, -1),
        },
      };
    });
  }
  function adjustAdv(side: "athleteA" | "athleteB", delta: number) {
    setMatch((p) => ({ ...p, [side]: { ...p[side], adv: Math.max(0, p[side].adv + delta) } }));
  }
  function adjustPen(side: "athleteA" | "athleteB", delta: number) {
    setMatch((p) => ({ ...p, [side]: { ...p[side], pen: Math.max(0, p[side].pen + delta) } }));
  }
  function updateAthlete(side: "athleteA" | "athleteB", patch: Partial<Athlete>) {
    setMatch((p) => ({ ...p, [side]: { ...p[side], ...patch } }));
  }
  function startTimer() { if (match.timer > 0) setMatch((p) => ({ ...p, timerRunning: true })); }
  function pauseTimer() { setMatch((p) => ({ ...p, timerRunning: false })); }
  function resetMatch() {
    setMatch((p) => ({
      ...p,
      athleteA: { ...p.athleteA, score: 0, adv: 0, pen: 0, scoreHistory: [] },
      athleteB: { ...p.athleteB, score: 0, adv: 0, pen: 0, scoreHistory: [] },
      timer: DEFAULT_DURATION, timerRunning: false,
    }));
  }

  const timerColor = match.timer <= 30 ? "text-red-500" : match.timer <= 60 ? "text-yellow-500" : "";
  const advBg    = theme === "light" ? "bg-slate-300" : "bg-slate-600/50";
  const advHover = "hover:bg-slate-400 active:bg-slate-500";
  const penBg    = theme === "light" ? "bg-slate-300" : "bg-slate-600/50";
  const penHover = "hover:bg-slate-400 active:bg-slate-500";


  return (
    <div className={`scoreboard-shell h-screen flex flex-col select-none overflow-hidden transition-colors duration-300 ${t.page}`}>

      {/* Top bar */}
      <div className={`scoreboard-topbar relative flex flex-col items-center pt-4 pb-3 gap-3 border-b ${t.border} shrink-0`}>

        <div className="absolute left-3 top-3 flex max-w-[40vw] flex-col items-start gap-2 md:max-w-none">
          <PalettePicker selected={paletteIdx} onSelect={setPaletteIdx} t={t} />
          <BrandLogo theme={theme} />
        </div>

        {/* Theme + Fullscreen — far right */}
        <div className="absolute right-3 top-3 flex gap-1">
          <ThemeButton theme={theme} onToggle={() => setTheme(theme === "dark" ? "light" : "dark")} t={t} />
          <FullscreenButton t={t} />
        </div>

        <div className="absolute right-3 top-14 flex max-w-[40vw] flex-col items-end gap-2 md:top-16 md:max-w-none">
          <BrandLogo theme={theme} />
        </div>

        <TimerDisplay timer={match.timer} timerRunning={match.timerRunning} timerColor={timerColor} t={t}
          onChangeTimer={(s) => setMatch((p) => ({ ...p, timer: s, timerRunning: false }))} />

        <div className="scoreboard-controls flex flex-wrap justify-center gap-3 px-16">
          <button onClick={startTimer} disabled={match.timerRunning || match.timer === 0}
            className="px-6 py-2 rounded-lg bg-green-700 hover:bg-green-600 active:bg-green-500 text-white disabled:opacity-30 disabled:cursor-not-allowed font-semibold transition-colors text-sm">
            START
          </button>
          <button onClick={pauseTimer} disabled={!match.timerRunning}
            className="px-6 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-500 active:bg-yellow-400 text-white disabled:opacity-30 disabled:cursor-not-allowed font-semibold transition-colors text-sm">
            PAUSE
          </button>
          <button onClick={resetMatch}
            className={`px-6 py-2 rounded-lg border font-semibold transition-colors text-sm ${t.btnBase}`}>
            RESET
          </button>
        </div>

        <div className="scoreboard-meta flex items-center gap-2">
          <EditableText value={match.category} onChange={(v) => setMatch((p) => ({ ...p, category: v }))}
            className={`text-[10px] tracking-widest uppercase w-44 ${t.muted}`} placeholder="Category" t={t} />
          <span className={`text-xs ${t.muted}`}>·</span>
          <EditableText value={match.round} onChange={(v) => setMatch((p) => ({ ...p, round: v }))}
            className={`text-[10px] tracking-widest uppercase w-24 ${t.muted}`} placeholder="Round" t={t} />
          <span className={`text-xs ${t.muted}`}>·</span>
          <EditableText value={match.mat} onChange={(v) => setMatch((p) => ({ ...p, mat: v }))}
            className={`text-[10px] tracking-widest uppercase w-16 ${t.muted}`} placeholder="Mat" t={t} />
        </div>
      </div>

      {/* Athletes */}
      <div className="scoreboard-athletes relative flex flex-1 gap-3 p-3 min-h-0">

        <CenterShield theme={theme} />

        {/* Athlete A */}
        <div className="flex-1 flex flex-col gap-2 min-h-0">
          <div className="scoreboard-athlete-head text-center shrink-0">
            <EditableText value={match.athleteA.name} onChange={(v) => updateAthlete("athleteA", { name: v })}
              className="text-2xl font-bold" placeholder="Athlete A" t={t} />
            <EditableText value={match.athleteA.academy} onChange={(v) => updateAthlete("athleteA", { academy: v })}
              className={`text-sm mt-0.5 ${t.muted}`} placeholder="Academy" t={t} />
          </div>
          <ScoreCard score={match.athleteA.score} onScore={(pts) => addScore("athleteA", pts)} onUndo={() => undoScore("athleteA")} canUndo={match.athleteA.scoreHistory.length > 0} pc={pcA} t={t} />
          <div className="scoreboard-minis flex items-center justify-center gap-6 lg:gap-20 shrink-0 py-1">
            <MiniCard label="ADV" value={match.athleteA.adv} cardBg={advBg} hoverCls={advHover} valueColor="text-green-400" t={t}
              onPlus={() => adjustAdv("athleteA", 1)} onMinus={() => adjustAdv("athleteA", -1)} />
            <MiniCard label="PEN" value={match.athleteA.pen} cardBg={penBg} hoverCls={penHover} valueColor="text-red-500" t={t}
              onPlus={() => adjustPen("athleteA", 1)} onMinus={() => adjustPen("athleteA", -1)} />
          </div>
        </div>

        <div className={`w-px shrink-0 ${t.divider}`} />

        {/* Athlete B */}
        <div className="flex-1 flex flex-col gap-2 min-h-0">
          <div className="scoreboard-athlete-head text-center shrink-0">
            <EditableText value={match.athleteB.name} onChange={(v) => updateAthlete("athleteB", { name: v })}
              className="text-2xl font-bold" placeholder="Athlete B" t={t} />
            <EditableText value={match.athleteB.academy} onChange={(v) => updateAthlete("athleteB", { academy: v })}
              className={`text-sm mt-0.5 ${t.muted}`} placeholder="Academy" t={t} />
          </div>
          <ScoreCard score={match.athleteB.score} onScore={(pts) => addScore("athleteB", pts)} onUndo={() => undoScore("athleteB")} canUndo={match.athleteB.scoreHistory.length > 0} pc={pcB} t={t} />
          <div className="scoreboard-minis flex items-center justify-center gap-6 lg:gap-20 shrink-0 py-1">
            <MiniCard label="ADV" value={match.athleteB.adv} cardBg={advBg} hoverCls={advHover} valueColor="text-green-400" t={t}
              onPlus={() => adjustAdv("athleteB", 1)} onMinus={() => adjustAdv("athleteB", -1)} />
            <MiniCard label="PEN" value={match.athleteB.pen} cardBg={penBg} hoverCls={penHover} valueColor="text-red-500" t={t}
              onPlus={() => adjustPen("athleteB", 1)} onMinus={() => adjustPen("athleteB", -1)} />
          </div>
        </div>
      </div>
    </div>
  );
}
