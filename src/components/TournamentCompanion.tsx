'use client';

import { useState, useMemo, useCallback } from 'react';
import { Creature, Move } from '@/types/creature';
import { Fighter, initFighter } from '@/lib/battle';
import {
  cloneFighter, evaluateMoves, evaluateSwaps, regularMoves,
  resolveMoveExchange, resolveMySwap, resolveOppSwap, resolveBothSwap,
  MoveOption, SwapOption,
} from '@/lib/companion';
import { RARITY_COLORS, RARITY_BG } from '@/lib/labels';

// ── Helpers ───────────────────────────────────────────────────────────────────

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

function hpColor(pct: number) {
  if (pct > 0.6) return 'bg-green-500';
  if (pct > 0.3) return 'bg-yellow-500';
  return 'bg-red-500';
}

const TAG_STYLES: Record<string, string> = {
  KO: 'bg-green-500/20 text-green-300 border-green-500/40',
  favorable: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  neutral: 'bg-slate-700 text-gray-300 border-slate-600',
  risky: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  losing: 'bg-red-500/20 text-red-300 border-red-500/40',
};

// ── Creature picker ───────────────────────────────────────────────────────────

function CreaturePicker({ creatures, value, onChange, exclude = [], placeholder }: {
  creatures: Creature[];
  value: Creature | null;
  onChange: (c: Creature) => void;
  exclude?: string[];
  placeholder?: string;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return creatures.filter(c => !exclude.includes(c.uuid) && c.name.toLowerCase().includes(q)).slice(0, 40);
  }, [creatures, exclude, query]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-left text-sm transition-colors ${
          value
            ? `${RARITY_BG[value.rarity]} ${RARITY_COLORS[value.rarity]}`
            : 'bg-slate-800 border-slate-600 text-gray-500 hover:border-slate-500'
        }`}
      >
        {value ? (
          <>
            <img src={value.image} alt="" className="w-7 h-7 object-contain rounded bg-black/20 shrink-0" />
            <span className="font-medium text-white truncate">{value.name}</span>
          </>
        ) : (
          <span>{placeholder ?? 'Pick creature…'}</span>
        )}
        <svg className="ml-auto shrink-0 text-gray-500" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-slate-700">
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search…"
              className="w-full bg-slate-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 outline-none"
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.map(c => (
              <button key={c.uuid} onClick={() => { onChange(c); setOpen(false); setQuery(''); }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-700 transition-colors text-left"
              >
                <img src={c.image} alt="" className="w-6 h-6 object-contain rounded bg-black/20 shrink-0" />
                <span className="text-sm text-white truncate">{c.name}</span>
                <span className={`ml-auto text-xs ${RARITY_COLORS[c.rarity].split(' ')[0]}`}>{cap(c.rarity)}</span>
              </button>
            ))}
            {filtered.length === 0 && <p className="text-center text-gray-600 text-sm py-4">No results</p>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── HP bar ────────────────────────────────────────────────────────────────────

function HpBar({ hp, maxHp }: { hp: number; maxHp: number }) {
  const pct = Math.max(0, hp / maxHp);
  return (
    <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
      <div className={`h-full rounded-full transition-all ${hpColor(pct)}`} style={{ width: `${pct * 100}%` }} />
    </div>
  );
}

// ── Creature card (live battle) ───────────────────────────────────────────────

function LiveCard({ fighter, label, deaths, isActive }: {
  fighter: Fighter;
  label: string;
  deaths: number;
  isActive?: boolean;
}) {
  const hpPct = fighter.hp / fighter.maxHp;
  return (
    <div className={`flex flex-col gap-2 p-3 rounded-xl border ${isActive ? `${RARITY_BG[fighter.creature.rarity]} ${RARITY_COLORS[fighter.creature.rarity].split(' ').find(c => c.startsWith('border-')) ?? 'border-slate-600'}` : 'bg-slate-800 border-slate-700'}`}>
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <span>{label}</span>
        <span className="ml-auto">{'💀'.repeat(deaths)}</span>
      </div>
      <div className="flex items-center gap-2">
        <img src={fighter.creature.image} alt="" className="w-12 h-12 object-contain rounded-lg bg-black/20 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm truncate">{fighter.creature.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{Math.max(0, fighter.hp).toLocaleString()} / {fighter.maxHp.toLocaleString()}</p>
          <HpBar hp={fighter.hp} maxHp={fighter.maxHp} />
          <p className={`text-xs mt-0.5 ${hpPct > 0.6 ? 'text-green-400' : hpPct > 0.3 ? 'text-yellow-400' : 'text-red-400'}`}>
            {Math.round(hpPct * 100)}%
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Move recommendation row ───────────────────────────────────────────────────

function MoveRow({ opt, selected, onSelect }: {
  opt: MoveOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      disabled={!opt.available}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
        selected
          ? 'bg-blue-600/30 border-blue-500/60 ring-1 ring-blue-500/40'
          : opt.available
            ? 'bg-slate-800 border-slate-700 hover:bg-slate-700/60 hover:border-slate-600'
            : 'bg-slate-800/40 border-slate-800 opacity-50 cursor-not-allowed'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-white text-sm truncate">{opt.move.name}</p>
          {!opt.available && <span className="text-xs text-gray-600">CD</span>}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          {opt.iGoFirst ? '⚡ First' : '🐢 Second'} · deals ~{opt.myDmg.toLocaleString()} · takes ~{opt.oppDmg.toLocaleString()}
        </p>
      </div>
      <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border ${TAG_STYLES[opt.tag]}`}>
        {cap(opt.tag)}
      </span>
    </button>
  );
}

// ── Swap recommendation row ───────────────────────────────────────────────────

function SwapRow({ opt, onSelect, selected }: {
  opt: SwapOption;
  onSelect: () => void;
  selected: boolean;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl border text-left transition-all ${
        selected
          ? 'bg-blue-600/30 border-blue-500/60 ring-1 ring-blue-500/40'
          : 'bg-slate-800 border-slate-700 hover:bg-slate-700/60'
      }`}
    >
      <img src={opt.fighter.creature.image} alt="" className="w-8 h-8 object-contain rounded bg-black/20 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{opt.fighter.creature.name}</p>
        <p className="text-xs text-gray-500">
          {Math.round(opt.fighter.hp / opt.fighter.maxHp * 100)}% HP
          {opt.swapInDmg > 0 && ` · swap-in ~${opt.swapInDmg.toLocaleString()}`}
        </p>
      </div>
      {opt.recommended && (
        <span className="shrink-0 text-xs text-green-300 bg-green-500/20 border border-green-500/40 px-2 py-0.5 rounded-full font-medium">
          Swap in
        </span>
      )}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface TeamSlot {
  creature: Creature;
  fighter: Fighter;
  alive: boolean;
}

interface GameState {
  level: number;
  myTeam: TeamSlot[];
  myActiveIdx: number;
  myDeaths: number;
  oppTeam: TeamSlot[];     // grows as we see opponent creatures
  oppActiveIdx: number;
  oppDeaths: number;
  log: string[];
}

type MyAction =
  | { type: 'move'; moveUuid: string }
  | { type: 'swap'; toIdx: number };

type OppAction =
  | { type: 'move'; moveUuid: string }
  | { type: 'swap'; newCreature: Creature };

export default function TournamentCompanion({ creatures }: { creatures: Creature[] }) {
  const [level, setLevel] = useState(35);
  const [mySlots, setMySlots] = useState<(Creature | null)[]>([null, null, null, null]);
  const [oppCreature, setOppCreature] = useState<Creature | null>(null);
  const [game, setGame] = useState<GameState | null>(null);
  const [myAction, setMyAction] = useState<MyAction | null>(null);
  const [oppAction, setOppAction] = useState<OppAction | null>(null);
  const [pendingOppSwapCreature, setPendingOppSwapCreature] = useState<Creature | null>(null);

  const pickedUuids = useMemo(() => mySlots.filter(Boolean).map(c => c!.uuid), [mySlots]);
  const canStart = mySlots.every(Boolean) && oppCreature !== null;

  function startBattle() {
    if (!canStart) return;
    const lvl = level;
    const myTeam: TeamSlot[] = (mySlots as Creature[]).map(c => ({
      creature: c,
      fighter: initFighter('A', c, lvl),
      alive: true,
    }));
    const oppF = initFighter('B', oppCreature!, lvl);
    setGame({
      level: lvl,
      myTeam,
      myActiveIdx: 0,
      myDeaths: 0,
      oppTeam: [{ creature: oppCreature!, fighter: oppF, alive: true }],
      oppActiveIdx: 0,
      oppDeaths: 0,
      log: [],
    });
    setMyAction(null);
    setOppAction(null);
  }

  function submitTurn() {
    if (!game || !myAction || !oppAction) return;

    const state = game;
    const meSlot = state.myTeam[state.myActiveIdx];
    const oppSlot = state.oppTeam[state.oppActiveIdx];

    // Clone fighters to mutate
    const meFighter = cloneFighter(meSlot.fighter);
    const oppFighter = cloneFighter(oppSlot.fighter);

    let events: string[] = [];
    let newMyActiveIdx = state.myActiveIdx;
    let newOppActiveIdx = state.oppActiveIdx;
    let newOppTeam = [...state.oppTeam];

    const myIsSwap = myAction.type === 'swap';
    const oppIsSwap = oppAction.type === 'swap';

    if (!myIsSwap && !oppIsSwap) {
      // Both attack
      const myMove = meSlot.creature.moves.find(m => m.uuid === myAction.moveUuid)!;
      const oppMove = oppSlot.creature.moves.find(m => m.uuid === oppAction.moveUuid)!;
      events = resolveMoveExchange(meFighter, oppFighter, myMove, oppMove);
    } else if (myIsSwap && !oppIsSwap) {
      // I swap, they attack
      const myToIdx = (myAction as Extract<MyAction, { type: 'swap' }>).toIdx;
      const myIncomingFighter = cloneFighter(state.myTeam[myToIdx].fighter);
      const oppMove = oppSlot.creature.moves.find(m => m.uuid === (oppAction as Extract<OppAction, { type: 'move' }>).moveUuid)!;
      events = resolveMySwap(meFighter, myIncomingFighter, oppFighter, oppMove);
      // Commit swap
      const newMyTeam = state.myTeam.map((s, i) =>
        i === state.myActiveIdx ? { ...s, fighter: meFighter } :
        i === myToIdx ? { ...s, fighter: myIncomingFighter } : s
      );
      const newState: GameState = {
        ...state,
        myTeam: newMyTeam,
        myActiveIdx: myToIdx,
        oppTeam: newOppTeam.map((s, i) => i === state.oppActiveIdx ? { ...s, fighter: oppFighter } : s),
        log: [...state.log, ...events].slice(-20),
      };
      checkDeathsAndSet(newState);
      setMyAction(null);
      setOppAction(null);
      return;
    } else if (!myIsSwap && oppIsSwap) {
      // They swap, I attack
      const oppSwapAct = oppAction as Extract<OppAction, { type: 'swap' }>;
      const newOppCreature = oppSwapAct.newCreature;
      const oppLeavingFighter = cloneFighter(oppFighter);
      let oppIncomingFighter: Fighter;
      const existingOppIdx = newOppTeam.findIndex(s => s.creature.uuid === newOppCreature.uuid);
      if (existingOppIdx >= 0) {
        oppIncomingFighter = cloneFighter(newOppTeam[existingOppIdx].fighter);
      } else {
        oppIncomingFighter = initFighter('B', newOppCreature, state.level);
        newOppTeam = [...newOppTeam, { creature: newOppCreature, fighter: oppIncomingFighter, alive: true }];
      }
      const myMove = meSlot.creature.moves.find(m => m.uuid === (myAction as Extract<MyAction, { type: 'move' }>).moveUuid)!;
      events = resolveOppSwap(meFighter, myMove, oppLeavingFighter, oppIncomingFighter);
      const newOppActiveIdx2 = existingOppIdx >= 0 ? existingOppIdx : newOppTeam.length - 1;
      const newState: GameState = {
        ...state,
        myTeam: state.myTeam.map((s, i) => i === state.myActiveIdx ? { ...s, fighter: meFighter } : s),
        oppTeam: newOppTeam.map((s, i) => {
          if (i === state.oppActiveIdx) return { ...s, fighter: oppLeavingFighter };
          if (i === newOppActiveIdx2) return { ...s, fighter: oppIncomingFighter };
          return s;
        }),
        oppActiveIdx: newOppActiveIdx2,
        log: [...state.log, ...events].slice(-20),
      };
      checkDeathsAndSet(newState);
      setMyAction(null);
      setOppAction(null);
      setPendingOppSwapCreature(null);
      return;
    } else {
      // Both swap
      const myToIdx = (myAction as Extract<MyAction, { type: 'swap' }>).toIdx;
      const myIncomingFighter = cloneFighter(state.myTeam[myToIdx].fighter);
      const oppSwapAct = oppAction as Extract<OppAction, { type: 'swap' }>;
      const newOppCreature = oppSwapAct.newCreature;
      let oppIncomingFighter: Fighter;
      const existingOppIdx = newOppTeam.findIndex(s => s.creature.uuid === newOppCreature.uuid);
      if (existingOppIdx >= 0) {
        oppIncomingFighter = cloneFighter(newOppTeam[existingOppIdx].fighter);
      } else {
        oppIncomingFighter = initFighter('B', newOppCreature, state.level);
        newOppTeam = [...newOppTeam, { creature: newOppCreature, fighter: oppIncomingFighter, alive: true }];
      }
      const oppLeavingFighter = cloneFighter(oppFighter);
      events = resolveBothSwap(meFighter, myIncomingFighter, oppLeavingFighter, oppIncomingFighter);
      const newOppActiveIdx2 = existingOppIdx >= 0 ? existingOppIdx : newOppTeam.length - 1;
      const newState: GameState = {
        ...state,
        myTeam: state.myTeam.map((s, i) =>
          i === state.myActiveIdx ? { ...s, fighter: meFighter } :
          i === myToIdx ? { ...s, fighter: myIncomingFighter } : s
        ),
        myActiveIdx: myToIdx,
        oppTeam: newOppTeam.map((s, i) => {
          if (i === state.oppActiveIdx) return { ...s, fighter: oppLeavingFighter };
          if (i === newOppActiveIdx2) return { ...s, fighter: oppIncomingFighter };
          return s;
        }),
        oppActiveIdx: newOppActiveIdx2,
        log: [...state.log, ...events].slice(-20),
      };
      checkDeathsAndSet(newState);
      setMyAction(null);
      setOppAction(null);
      setPendingOppSwapCreature(null);
      return;
    }

    // Update state for both-attack case
    const updatedMyTeam = game.myTeam.map((s, i) => i === state.myActiveIdx ? { ...s, fighter: meFighter } : s);
    const updatedOppTeam = newOppTeam.map((s, i) => i === state.oppActiveIdx ? { ...s, fighter: oppFighter } : s);
    const newState: GameState = {
      ...state,
      myTeam: updatedMyTeam,
      oppTeam: updatedOppTeam,
      log: [...state.log, ...events].slice(-20),
    };
    checkDeathsAndSet(newState);
    setMyAction(null);
    setOppAction(null);
  }

  function checkDeathsAndSet(state: GameState) {
    let s = { ...state };
    const mySlotNow = s.myTeam[s.myActiveIdx];
    const oppSlotNow = s.oppTeam[s.oppActiveIdx];

    if (mySlotNow.fighter.hp <= 0 && mySlotNow.alive) {
      s.myTeam = s.myTeam.map((t, i) => i === s.myActiveIdx ? { ...t, alive: false } : t);
      s.myDeaths += 1;
      s.log = [...s.log, `Your ${mySlotNow.creature.name} fainted!`];
    }
    if (oppSlotNow.fighter.hp <= 0 && oppSlotNow.alive) {
      s.oppTeam = s.oppTeam.map((t, i) => i === s.oppActiveIdx ? { ...t, alive: false } : t);
      s.oppDeaths += 1;
      s.log = [...s.log, `Opponent's ${oppSlotNow.creature.name} fainted!`];
    }
    setGame(s);
  }

  // Force-replace after death
  function replaceMyCreature(idx: number) {
    if (!game) return;
    setGame(g => g ? {
      ...g,
      myActiveIdx: idx,
      log: [...g.log, `You sent in ${g.myTeam[idx].creature.name}`].slice(-20),
    } : g);
  }

  function revealOppCreature(c: Creature) {
    if (!game) return;
    const existing = game.oppTeam.findIndex(s => s.creature.uuid === c.uuid);
    let newOppTeam = game.oppTeam;
    let newOppActiveIdx = existing;
    if (existing < 0) {
      const f = initFighter('B', c, game.level);
      newOppTeam = [...game.oppTeam, { creature: c, fighter: f, alive: true }];
      newOppActiveIdx = newOppTeam.length - 1;
    }
    setGame(g => g ? {
      ...g,
      oppTeam: newOppTeam,
      oppActiveIdx: newOppActiveIdx,
      log: [...g.log, `Opponent sent in ${c.name}`].slice(-20),
    } : g);
  }

  // ── Derived state for rendering ─────────────────────────────────────────────

  const myActive = game?.myTeam[game.myActiveIdx];
  const oppActive = game?.oppTeam[game.oppActiveIdx];
  const myBench = useMemo(() =>
    game ? game.myTeam.filter((_, i) => i !== game.myActiveIdx && game.myTeam[i].alive) : [],
    [game]
  );
  const myDied = game ? !game.myTeam[game.myActiveIdx].alive : false;
  const oppDied = game ? !game.oppTeam[game.oppActiveIdx].alive : false;

  const moveOptions = useMemo(() =>
    myActive && oppActive && myActive.alive && oppActive.alive
      ? evaluateMoves(myActive.fighter, oppActive.fighter)
      : [],
    [myActive, oppActive]
  );

  const swapOptions = useMemo(() =>
    myBench.length > 0 && oppActive
      ? evaluateSwaps(myBench.map(s => s.fighter), oppActive.fighter)
      : [],
    [myBench, oppActive]
  );

  const myMoveSelected = myAction?.type === 'move' ? myAction.moveUuid : null;
  const mySwapSelected = myAction?.type === 'swap' ? myAction.toIdx : null;
  const oppMoveSelected = oppAction?.type === 'move' ? oppAction.moveUuid : null;

  const canSubmit = myAction !== null && oppAction !== null &&
    (oppAction.type !== 'swap' || oppAction.newCreature !== null);

  // ── Setup screen ────────────────────────────────────────────────────────────
  if (!game) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <div className="border-b border-slate-800 px-4 sm:px-6 py-4 flex items-center gap-3">
          <a href="/" className="text-gray-400 hover:text-white transition-colors text-sm">← Dinodex</a>
          <span className="text-gray-700">/</span>
          <h1 className="text-sm font-semibold text-white">Tournament Companion</h1>
        </div>
        <div className="max-w-xl mx-auto px-4 py-8 flex flex-col gap-6">
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Your Team (4 creatures)</h2>
            <div className="grid grid-cols-2 gap-2">
              {mySlots.map((c, i) => (
                <CreaturePicker key={i} creatures={creatures} value={c}
                  exclude={[...pickedUuids.filter(u => u !== c?.uuid), oppCreature?.uuid ?? ''].filter(Boolean)}
                  onChange={creature => setMySlots(s => s.map((x, j) => j === i ? creature : x))}
                  placeholder={`Creature ${i + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Opponent's Starting Creature</h2>
            <CreaturePicker creatures={creatures} value={oppCreature}
              exclude={pickedUuids}
              onChange={setOppCreature}
              placeholder="Their first creature…"
            />
          </div>

          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Level</h2>
            <div className="flex items-center gap-3">
              <input type="range" min={1} max={35} value={level}
                onChange={e => setLevel(Number(e.target.value))}
                className="flex-1 accent-blue-500"
              />
              <span className="text-white font-semibold w-6 text-right">{level}</span>
            </div>
          </div>

          <button onClick={startBattle} disabled={!canStart}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
          >
            Start Battle
          </button>
        </div>
      </div>
    );
  }

  // ── Battle screen ───────────────────────────────────────────────────────────

  const needMyReplacement = myDied && game.myDeaths < 3;
  const needOppReveal = oppDied && game.oppDeaths < 3;
  const battleOver = game.myDeaths >= 3 || game.oppDeaths >= 3;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="border-b border-slate-800 px-4 sm:px-6 py-4 flex items-center gap-3">
        <a href="/" className="text-gray-400 hover:text-white transition-colors text-sm">← Dinodex</a>
        <span className="text-gray-700">/</span>
        <a href="/companion" onClick={e => { e.preventDefault(); setGame(null); }} className="text-gray-400 hover:text-white transition-colors text-sm">Companion</a>
        <span className="text-gray-700">/</span>
        <span className="text-sm text-white">Battle</span>
        <button onClick={() => setGame(null)} className="ml-auto text-xs text-gray-500 hover:text-white transition-colors">Reset</button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">

        {/* Matchup */}
        <div className="grid grid-cols-2 gap-3">
          {myActive && (
            <LiveCard fighter={myActive.fighter} label="You" deaths={game.myDeaths} isActive />
          )}
          {oppActive && (
            <LiveCard fighter={oppActive.fighter} label="Opponent" deaths={game.oppDeaths} isActive />
          )}
        </div>

        {/* My bench */}
        {game.myTeam.filter((_, i) => i !== game.myActiveIdx).length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {game.myTeam.map((s, i) => {
              if (i === game.myActiveIdx) return null;
              const pct = s.fighter.hp / s.fighter.maxHp;
              return (
                <div key={i} className={`shrink-0 flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg border ${s.alive ? 'bg-slate-800 border-slate-700' : 'bg-slate-900 border-slate-800 opacity-40'}`}>
                  <img src={s.creature.image} alt="" className="w-8 h-8 object-contain rounded bg-black/20" />
                  <div className="w-8 h-1 rounded-full bg-slate-700 overflow-hidden">
                    <div className={`h-full rounded-full ${hpColor(pct)}`} style={{ width: `${pct * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Death / end states */}
        {battleOver && (
          <div className={`text-center py-6 rounded-2xl border ${game.oppDeaths >= 3 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
            <p className="text-2xl font-bold text-white">{game.oppDeaths >= 3 ? '🏆 You win!' : '💀 You lose'}</p>
            <button onClick={() => setGame(null)} className="mt-3 text-sm text-gray-400 hover:text-white transition-colors">Play again</button>
          </div>
        )}

        {!battleOver && needMyReplacement && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 flex flex-col gap-3">
            <p className="text-sm font-semibold text-white">Your {myActive?.creature.name} fainted — choose your next creature:</p>
            <div className="flex flex-col gap-2">
              {game.myTeam.map((s, i) => {
                if (i === game.myActiveIdx || !s.alive) return null;
                return (
                  <button key={i} onClick={() => replaceMyCreature(i)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 border border-slate-600 transition-colors text-left"
                  >
                    <img src={s.creature.image} alt="" className="w-8 h-8 object-contain rounded bg-black/20" />
                    <span className="text-sm font-medium text-white">{s.creature.name}</span>
                    <span className="ml-auto text-xs text-gray-500">{Math.round(s.fighter.hp / s.fighter.maxHp * 100)}% HP</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {!battleOver && needOppReveal && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 flex flex-col gap-3">
            <p className="text-sm font-semibold text-white">Opponent's creature fainted — which creature did they send in?</p>
            <CreaturePicker creatures={creatures}
              value={null}
              exclude={game.myTeam.map(s => s.creature.uuid)}
              onChange={c => revealOppCreature(c)}
              placeholder="Their next creature…"
            />
          </div>
        )}

        {/* Move recommendations */}
        {!battleOver && !needMyReplacement && !needOppReveal && myActive?.alive && oppActive?.alive && (
          <>
            <div className="flex flex-col gap-2">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Move Recommendations</h2>
              {moveOptions.map(opt => (
                <MoveRow key={opt.move.uuid} opt={opt} selected={myMoveSelected === opt.move.uuid}
                  onSelect={() => setMyAction({ type: 'move', moveUuid: opt.move.uuid })}
                />
              ))}
            </div>

            {swapOptions.length > 0 && (
              <div className="flex flex-col gap-2">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Swap Options</h2>
                {swapOptions.map((opt) => {
                  const actualTeamIdx = game.myTeam.findIndex(s => s.fighter === opt.fighter || s.creature.uuid === opt.fighter.creature.uuid);
                  return (
                    <SwapRow key={opt.fighter.creature.uuid} opt={opt} selected={mySwapSelected === actualTeamIdx}
                      onSelect={() => setMyAction({ type: 'swap', toIdx: actualTeamIdx })}
                    />
                  );
                })}
              </div>
            )}

            {/* Report what happened */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider text-xs">Report What Happened</h2>

              <div className="flex flex-col gap-2">
                <p className="text-xs text-gray-500">What did you do?</p>
                {myAction && (
                  <div className="text-xs text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-1.5">
                    {myAction.type === 'move'
                      ? `Used: ${myActive.creature.moves.find(m => m.uuid === myAction.moveUuid)?.name ?? '?'}`
                      : `Swapped to: ${game.myTeam[myAction.toIdx]?.creature.name ?? '?'}`
                    }
                  </div>
                )}
                {!myAction && <p className="text-xs text-gray-600 italic">Select a move or swap option above</p>}
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-xs text-gray-500">What did they do?</p>
                <div className="flex flex-col gap-1.5">
                  {oppActive.creature.moves.filter(m => m.type === 'regular').map(m => (
                    <button key={m.uuid}
                      onClick={() => setOppAction({ type: 'move', moveUuid: m.uuid })}
                      className={`text-left text-sm px-3 py-2 rounded-xl border transition-all ${
                        oppMoveSelected === m.uuid
                          ? 'bg-blue-600/30 border-blue-500/60 text-white ring-1 ring-blue-500/40'
                          : 'bg-slate-800 border-slate-700 hover:bg-slate-700/60 text-gray-300'
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setOppAction({ type: 'swap', newCreature: pendingOppSwapCreature! });
                    }}
                    className={`text-left text-sm px-3 py-2 rounded-xl border transition-all ${
                      oppAction?.type === 'swap'
                        ? 'bg-purple-600/30 border-purple-500/60 text-white ring-1 ring-purple-500/40'
                        : 'bg-slate-800 border-slate-700 hover:bg-slate-700/60 text-gray-400'
                    }`}
                  >
                    They swapped out →
                  </button>
                  {oppAction?.type === 'swap' && (
                    <div className="pl-2">
                      <p className="text-xs text-gray-500 mb-1.5">Which creature did they swap to?</p>
                      <CreaturePicker creatures={creatures}
                        value={pendingOppSwapCreature}
                        exclude={game.myTeam.map(s => s.creature.uuid)}
                        onChange={c => {
                          setPendingOppSwapCreature(c);
                          setOppAction({ type: 'swap', newCreature: c });
                        }}
                        placeholder="Their swap target…"
                      />
                    </div>
                  )}
                </div>
              </div>

              <button onClick={submitTurn} disabled={!canSubmit}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
              >
                Resolve Turn
              </button>
            </div>

            {/* Event log */}
            {game.log.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col gap-1 max-h-40 overflow-y-auto">
                {[...game.log].reverse().map((e, i) => (
                  <p key={i} className="text-xs text-gray-500">{e}</p>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
