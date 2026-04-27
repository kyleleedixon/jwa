'use client';

import { useState, useMemo } from 'react';
import { Tier } from '@/lib/tierlist';
import { RARITY_COLORS } from '@/lib/labels';

export interface TierEntry {
  uuid: string;
  name: string;
  rarity: string;
  tier: Tier;
  winRate: number;
  wins: number;
  losses: number;
  draws: number;
  beats: string[];
  losesTo: string[];
}

export interface TierGroup {
  label: string;
  rarities: string[];
  level: number;
  computedAt: string;
  durationMs: number;
  entries: TierEntry[];
}

interface Props {
  groups: Record<string, TierGroup>;
}

const TIER_STYLES: Record<Tier, { bg: string; text: string; border: string; label: string }> = {
  S: { bg: 'bg-red-500/20',    text: 'text-red-300',    border: 'border-red-500/40',    label: 'S — Dominant' },
  A: { bg: 'bg-orange-500/20', text: 'text-orange-300', border: 'border-orange-500/40', label: 'A — Strong' },
  B: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', border: 'border-yellow-500/40', label: 'B — Solid' },
  C: { bg: 'bg-green-500/20',  text: 'text-green-300',  border: 'border-green-500/40',  label: 'C — Below Average' },
  D: { bg: 'bg-slate-500/20',  text: 'text-slate-400',  border: 'border-slate-500/40',  label: 'D — Weak' },
};

const TIERS: Tier[] = ['S', 'A', 'B', 'C', 'D'];

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

function CreatureChip({ entry, onClick }: { entry: TierEntry; onClick: (e: TierEntry) => void }) {
  const rarityClass = RARITY_COLORS[entry.rarity] ?? 'text-gray-300 border-gray-500';
  const borderClass = rarityClass.split(' ').find(c => c.startsWith('border-')) ?? 'border-gray-500';

  return (
    <button
      onClick={() => onClick(entry)}
      className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg border ${borderClass} bg-slate-800 hover:bg-slate-700 transition-colors text-center min-w-[72px] max-w-[80px]`}
    >
      <span className="text-xs font-semibold text-white leading-tight line-clamp-2">{entry.name}</span>
      <span className="text-[10px] text-gray-400">{pct(entry.winRate)}</span>
    </button>
  );
}

function DetailPanel({
  entry,
  nameMap,
  onClose,
}: {
  entry: TierEntry;
  nameMap: Map<string, string>;
  onClose: () => void;
}) {
  const style = TIER_STYLES[entry.tier];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-600 rounded-xl p-5 max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">{entry.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${style.bg} ${style.text}`}>Tier {entry.tier}</span>
              <span className="text-sm text-gray-400">{pct(entry.winRate)} win rate</span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none ml-4">×</button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5 text-center">
          {[
            { label: 'Wins',   val: entry.wins,   cls: 'green' },
            { label: 'Draws',  val: entry.draws,  cls: 'yellow' },
            { label: 'Losses', val: entry.losses, cls: 'red' },
          ].map(({ label, val, cls }) => (
            <div key={label} className={`bg-${cls}-500/10 border border-${cls}-500/30 rounded-lg p-2`}>
              <div className={`text-lg font-bold text-${cls}-300`}>{val}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</div>
            </div>
          ))}
        </div>

        {entry.beats.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-2">Beats ({entry.beats.length})</h3>
            <div className="flex flex-wrap gap-1">
              {entry.beats.map(uuid => (
                <span key={uuid} className="text-xs bg-green-500/10 border border-green-500/30 text-green-300 rounded px-1.5 py-0.5">
                  {nameMap.get(uuid) ?? uuid}
                </span>
              ))}
            </div>
          </div>
        )}

        {entry.losesTo.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">Loses to ({entry.losesTo.length})</h3>
            <div className="flex flex-wrap gap-1">
              {entry.losesTo.map(uuid => (
                <span key={uuid} className="text-xs bg-red-500/10 border border-red-500/30 text-red-300 rounded px-1.5 py-0.5">
                  {nameMap.get(uuid) ?? uuid}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TierList({ groups }: Props) {
  const groupKeys = Object.keys(groups);
  const [activeKey, setActiveKey] = useState(groupKeys[1] ?? groupKeys[0]);
  const [detail, setDetail] = useState<TierEntry | null>(null);
  const [search, setSearch] = useState('');

  const group = groups[activeKey];

  const nameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const g of Object.values(groups)) {
      for (const e of g.entries) map.set(e.uuid, e.name);
    }
    return map;
  }, [groups]);

  const filtered = useMemo(() => {
    if (!search) return group.entries;
    const q = search.toLowerCase();
    return group.entries.filter(e => e.name.toLowerCase().includes(q));
  }, [group, search]);

  const byTier = useMemo(() => {
    const map: Record<Tier, TierEntry[]> = { S: [], A: [], B: [], C: [], D: [] };
    for (const e of filtered) map[e.tier].push(e);
    return map;
  }, [filtered]);

  const computedAt = new Date(group.computedAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {detail && (
        <DetailPanel entry={detail} nameMap={nameMap} onClose={() => setDetail(null)} />
      )}

      <header className="border-b border-slate-700 bg-slate-900/95 sticky top-0 z-10 backdrop-blur">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center gap-3">
          <a href="/" className="text-gray-400 hover:text-white transition-colors text-sm">← Dinodex</a>
          <h1 className="font-bold text-lg text-white tracking-tight">
            JWA <span className="text-blue-400">Tier List</span>
          </h1>
          <span className="text-xs text-gray-500 ml-auto hidden sm:block">
            Sim-based · 1v1 · Lv {group.level} · Updated {computedAt}
          </span>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex flex-wrap gap-1.5">
            {groupKeys.map(key => (
              <button
                key={key}
                onClick={() => { setActiveKey(key); setSearch(''); }}
                className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                  activeKey === key
                    ? 'border-blue-500 bg-blue-600/20 text-blue-300'
                    : 'border-slate-700 text-gray-400 hover:border-slate-500 hover:text-white'
                }`}
              >
                {groups[key].label}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Filter…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="ml-auto bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors w-40"
          />
        </div>

        {/* Tier rows */}
        <div className="space-y-3">
          {TIERS.map(tier => {
            const entries = byTier[tier] ?? [];
            if (entries.length === 0) return null;
            const style = TIER_STYLES[tier];
            return (
              <div key={tier} className={`rounded-xl border ${style.border} overflow-hidden`}>
                <div className={`px-4 py-2 ${style.bg} flex items-center gap-3`}>
                  <span className={`text-xl font-black w-6 text-center ${style.text}`}>{tier}</span>
                  <span className="text-xs text-gray-400">{style.label}</span>
                  <span className="text-xs text-gray-500 ml-auto">{entries.length}</span>
                </div>
                <div className="p-3 flex flex-wrap gap-2">
                  {entries.map(e => (
                    <CreatureChip key={e.uuid} entry={e} onClick={setDetail} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-gray-600 mt-6 text-center">
          Rankings computed from full 1v1 round-robin simulation · auto-updated each paleo.gg scrape
        </p>
      </div>
    </div>
  );
}
