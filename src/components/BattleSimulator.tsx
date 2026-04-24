'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Creature } from '@/types/creature';
import { simulateBattle, BattleResult, BattleBoosts } from '@/lib/battle';
import Image from 'next/image';

const RARITY_ORDER = ['common','rare','epic','legendary','unique','apex','omega'];
const MIN_LEVEL: Record<string, number> = { common: 1, rare: 6, epic: 11, legendary: 16, unique: 21, apex: 26, omega: 1 };
const RARITY_COLORS: Record<string, string> = {
  common: 'text-gray-300', rare: 'text-blue-400', epic: 'text-purple-400',
  legendary: 'text-yellow-400', unique: 'text-orange-400', apex: 'text-red-400', omega: 'text-pink-400',
};

interface SlotConfig {
  creature: Creature | null;
  level: number;
  boosts: BattleBoosts;
}

function emptySlot(): SlotConfig {
  return { creature: null, level: 26, boosts: { health: 0, damage: 0, speed: 0 } };
}

interface CreaturePickerProps {
  label: string;
  creatures: Creature[];
  config: SlotConfig;
  onChange: (c: SlotConfig) => void;
  side: 'left' | 'right';
}

function CreaturePicker({ label, creatures, config, onChange, side }: CreaturePickerProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return creatures.slice(0, 40);
    const q = query.toLowerCase();
    return creatures.filter(c => c.name.toLowerCase().includes(q)).slice(0, 40);
  }, [creatures, query]);

  const minLv = config.creature ? (MIN_LEVEL[config.creature.rarity] ?? 1) : 1;
  const maxLv = 35;

  function selectCreature(c: Creature) {
    const minL = MIN_LEVEL[c.rarity] ?? 1;
    onChange({ ...config, creature: c, level: Math.max(config.level, minL) });
    setOpen(false);
    setQuery('');
  }

  return (
    <div className={`flex flex-col gap-3 flex-1 min-w-0 ${side === 'right' ? 'items-end' : 'items-start'}`}>
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</div>

      {/* Creature selector */}
      <div ref={ref} className="relative w-full max-w-xs">
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center gap-2 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm hover:border-slate-500 transition-colors text-left"
        >
          {config.creature ? (
            <>
              <img src={config.creature.image} alt="" className="w-7 h-7 rounded object-contain bg-slate-700 shrink-0" />
              <span className="truncate text-white font-medium">{config.creature.name}</span>
              <span className={`ml-auto text-xs shrink-0 ${RARITY_COLORS[config.creature.rarity]}`}>
                {config.creature.rarity.charAt(0).toUpperCase() + config.creature.rarity.slice(1)}
              </span>
            </>
          ) : (
            <span className="text-gray-500">Select a creature…</span>
          )}
        </button>

        {open && (
          <div className="absolute z-30 top-full mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search…"
              className="w-full px-3 py-2 bg-slate-700 text-sm text-white placeholder-gray-500 outline-none border-b border-slate-600"
            />
            <div className="max-h-56 overflow-y-auto">
              {filtered.map(c => (
                <button
                  key={c.uuid}
                  onClick={() => selectCreature(c)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-700 transition-colors text-left"
                >
                  <img src={c.image} alt="" className="w-6 h-6 rounded object-contain bg-slate-700 shrink-0" />
                  <span className="text-sm text-white truncate">{c.name}</span>
                  <span className={`ml-auto text-xs shrink-0 ${RARITY_COLORS[c.rarity]}`}>
                    {c.rarity.charAt(0).toUpperCase() + c.rarity.slice(1)}
                  </span>
                </button>
              ))}
              {filtered.length === 0 && <p className="text-center text-gray-500 text-sm py-4">No results</p>}
            </div>
          </div>
        )}
      </div>

      {config.creature && (
        <>
          {/* Level */}
          <div className="w-full max-w-xs flex items-center gap-3">
            <span className="text-xs text-gray-400 w-12 shrink-0">Lv {config.level}</span>
            <input
              type="range" min={minLv} max={maxLv} value={config.level}
              onChange={e => onChange({ ...config, level: Number(e.target.value) })}
              className="flex-1 accent-blue-500"
            />
          </div>

          {/* Boosts */}
          <div className="w-full max-w-xs flex flex-col gap-1.5">
            {(['health','damage','speed'] as const).map(stat => (
              <div key={stat} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-14 capitalize shrink-0">{stat} {config.boosts[stat]}</span>
                <input
                  type="range" min={0} max={20} value={config.boosts[stat]}
                  onChange={e => onChange({ ...config, boosts: { ...config.boosts, [stat]: Number(e.target.value) } })}
                  className="flex-1 accent-blue-500"
                />
              </div>
            ))}
            <p className="text-[10px] text-gray-600 mt-0.5">
              {config.boosts.health + config.boosts.damage + config.boosts.speed} / {config.level} boosts used
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// ─── HP bar ──────────────────────────────────────────────────────────────────

function HpBar({ current, max, color }: { current: number; max: number; color: string }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  return (
    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-300 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── Result panel ─────────────────────────────────────────────────────────────

function ResultPanel({ result, slotA, slotB }: { result: BattleResult; slotA: SlotConfig; slotB: SlotConfig }) {
  const [expanded, setExpanded] = useState(false);
  const nameA = slotA.creature!.name;
  const nameB = slotB.creature!.name;
  const winnerName = result.winner === 'A' ? nameA : result.winner === 'B' ? nameB : null;
  const pctA = Math.round((result.hpA / result.maxHpA) * 100);
  const pctB = Math.round((result.hpB / result.maxHpB) * 100);

  return (
    <div className="flex flex-col gap-4 mt-2">
      {/* Winner banner */}
      <div className={`rounded-xl px-4 py-3 text-center font-semibold ${
        result.winner === 'draw'
          ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-300'
          : 'bg-blue-500/10 border border-blue-500/30 text-white'
      }`}>
        {result.winner === 'draw' ? 'Draw!' : `${winnerName} wins!`}
        <span className="ml-2 text-sm font-normal text-gray-400">{result.turns} actions</span>
      </div>

      {/* HP remaining */}
      <div className="grid grid-cols-2 gap-4">
        {([['A', nameA, result.hpA, result.maxHpA, pctA, slotA], ['B', nameB, result.hpB, result.maxHpB, pctB, slotB]] as const).map(
          ([id, name, hp, maxHp, pct, slot]) => (
            <div key={id} className={`flex flex-col gap-1.5 p-3 rounded-xl border ${result.winner === id ? 'bg-green-500/5 border-green-500/30' : 'bg-slate-800/50 border-slate-700'}`}>
              <div className="flex items-center gap-2">
                <img src={(slot as SlotConfig).creature!.image} alt="" className="w-7 h-7 rounded object-contain bg-slate-700 shrink-0" />
                <span className="text-sm font-medium text-white truncate">{name}</span>
                {result.winner === id && <span className="ml-auto text-green-400 text-xs font-semibold shrink-0">Winner</span>}
              </div>
              <HpBar current={hp} max={maxHp} color={result.winner === id ? 'bg-green-500' : 'bg-red-500'} />
              <p className="text-xs text-gray-400">{hp.toLocaleString()} / {maxHp.toLocaleString()} HP <span className="text-gray-600">({pct}%)</span></p>
            </div>
          )
        )}
      </div>

      {/* Turn log */}
      <div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points={expanded ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} />
          </svg>
          {expanded ? 'Hide' : 'Show'} turn log ({result.log.length} entries)
        </button>

        {expanded && (
          <div className="mt-2 max-h-80 overflow-y-auto flex flex-col gap-1 pr-1">
            {result.log.map((entry, i) => (
              <div key={i} className={`rounded-lg px-3 py-2 text-xs ${
                entry.actor === 'system' ? 'bg-slate-800/30' :
                entry.actor === 'A' ? 'bg-blue-500/5 border-l-2 border-blue-500/40' : 'bg-red-500/5 border-l-2 border-red-500/40'
              }`}>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-gray-500">T{entry.turn}</span>
                  {entry.actor !== 'system' && (
                    <span className={`font-medium ${entry.actor === 'A' ? 'text-blue-300' : 'text-red-300'}`}>
                      {entry.actor === 'A' ? slotA.creature!.name : slotB.creature!.name}
                    </span>
                  )}
                  <span className="text-gray-400">{entry.moveName}</span>
                </div>
                {entry.events.slice(1).map((ev, j) => (
                  <div key={j} className="text-gray-500 pl-2">{ev}</div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function BattleSimulator({ creatures }: { creatures: Creature[] }) {
  const sorted = useMemo(() =>
    [...creatures].sort((a, b) => {
      const ra = RARITY_ORDER.indexOf(a.rarity);
      const rb = RARITY_ORDER.indexOf(b.rarity);
      return rb !== ra ? rb - ra : a.name.localeCompare(b.name);
    }),
    [creatures]
  );

  const [slotA, setSlotA] = useState<SlotConfig>(emptySlot);
  const [slotB, setSlotB] = useState<SlotConfig>(emptySlot);
  const [result, setResult] = useState<BattleResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function simulate() {
    if (!slotA.creature || !slotB.creature) { setError('Select a creature for both sides.'); return; }
    setError(null);
    try {
      const r = simulateBattle(slotA.creature, slotB.creature, {
        levelA: slotA.level,
        levelB: slotB.level,
        boostsA: slotA.boosts,
        boostsB: slotB.boosts,
      });
      setResult(r);
    } catch (e) {
      setError('Simulation error: ' + String(e));
    }
  }

  // Clear result when config changes
  function updateSlotA(c: SlotConfig) { setSlotA(c); setResult(null); }
  function updateSlotB(c: SlotConfig) { setSlotB(c); setResult(null); }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 px-4 sm:px-6 py-4 flex items-center gap-3">
        <a href="/" className="text-gray-400 hover:text-white transition-colors text-sm">← Dinodex</a>
        <span className="text-gray-700">/</span>
        <h1 className="text-sm font-semibold text-white">Battle Simulator</h1>
        <span className="ml-auto text-xs text-yellow-500/80 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full font-medium">Beta</span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">
        {/* Pickers */}
        <div className="flex gap-6 items-start">
          <CreaturePicker label="Fighter A" creatures={sorted} config={slotA} onChange={updateSlotA} side="left" />
          <div className="text-2xl font-bold text-slate-600 shrink-0 pt-8">vs</div>
          <CreaturePicker label="Fighter B" creatures={sorted} config={slotB} onChange={updateSlotB} side="right" />
        </div>

        {/* Simulate button */}
        <button
          onClick={simulate}
          disabled={!slotA.creature || !slotB.creature}
          className="w-full py-3 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          Simulate Battle
        </button>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        {result && slotA.creature && slotB.creature && (
          <ResultPanel result={result} slotA={slotA} slotB={slotB} />
        )}
      </div>
    </div>
  );
}
