'use client';

import { useState, useMemo } from 'react';
import { Tier } from '@/lib/tierlist';
import { RARITY_COLORS, RARITY_LABELS } from '@/lib/labels';

export interface TierEntry {
  uuid: string;
  name: string;
  rarity: string;
  tier: Tier;
  winRate: number;
  wins: number;
  losses: number;
  draws: number;
  poolSize: number;
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

const TIER_STYLES: Record<Tier, { bg: string; text: string; border: string; badge: string; label: string }> = {
  S: { bg: 'bg-red-500/10',    text: 'text-red-300',    border: 'border-red-500/40',    badge: 'bg-red-500/30 text-red-200 border-red-400/50',    label: 'S — Elite' },
  A: { bg: 'bg-orange-500/10', text: 'text-orange-300', border: 'border-orange-500/40', badge: 'bg-orange-500/30 text-orange-200 border-orange-400/50', label: 'A — Strong' },
  B: { bg: 'bg-yellow-500/10', text: 'text-yellow-300', border: 'border-yellow-500/40', badge: 'bg-yellow-500/30 text-yellow-200 border-yellow-400/50', label: 'B — Solid' },
  C: { bg: 'bg-blue-500/10',   text: 'text-blue-300',   border: 'border-blue-500/40',   badge: 'bg-blue-500/30 text-blue-200 border-blue-400/50',   label: 'C — Fringe' },
  D: { bg: 'bg-slate-500/10',  text: 'text-slate-400',  border: 'border-slate-500/40',  badge: 'bg-slate-500/30 text-slate-300 border-slate-400/50', label: 'D — Weak' },
};

const TIERS: Tier[] = ['S', 'A', 'B', 'C', 'D'];

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

function StatBar({ value, max, color }: { value: number; max: number; color: string }) {
  const w = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full`} style={{ width: `${w}%` }} />
    </div>
  );
}

function CreatureCard({ entry, rank, onClick }: { entry: TierEntry; rank: number; onClick: (e: TierEntry) => void }) {
  const style = TIER_STYLES[entry.tier];
  const rarityClass = RARITY_COLORS[entry.rarity] ?? 'text-gray-300 border-gray-500';
  const rarityText  = rarityClass.split(' ').find(c => c.startsWith('text-'))   ?? 'text-gray-300';
  const rarityBorder= rarityClass.split(' ').find(c => c.startsWith('border-')) ?? 'border-gray-500';
  const total = entry.wins + entry.losses + entry.draws;

  return (
    <button
      onClick={() => onClick(entry)}
      className={`w-full text-left rounded-xl border ${rarityBorder} bg-slate-800 hover:bg-slate-750 hover:border-opacity-80 transition-all p-4 flex flex-col gap-3`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${style.badge}`}>{entry.tier}</span>
            <span className="text-xs text-gray-500">#{rank}</span>
          </div>
          <h3 className="font-bold text-white text-sm leading-tight">{entry.name}</h3>
          <span className={`text-xs ${rarityText}`}>{RARITY_LABELS[entry.rarity] ?? entry.rarity}</span>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xl font-black text-white">{pct(entry.winRate)}</div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wide">win rate</div>
        </div>
      </div>

      {/* W/L/D bars */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-green-400 w-8 shrink-0 font-medium">{entry.wins}W</span>
          <StatBar value={entry.wins} max={total} color="bg-green-500" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-red-400 w-8 shrink-0 font-medium">{entry.losses}L</span>
          <StatBar value={entry.losses} max={total} color="bg-red-500" />
        </div>
        {entry.draws > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-yellow-400 w-8 shrink-0 font-medium">{entry.draws}D</span>
            <StatBar value={entry.draws} max={total} color="bg-yellow-500" />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-slate-700">
        <span>Beats {entry.beats.length} / {entry.poolSize - 1}</span>
        <span className="text-gray-600">tap for details →</span>
      </div>
    </button>
  );
}

function DetailPanel({ entry, nameMap, onClose }: { entry: TierEntry; nameMap: Map<string, string>; onClose: () => void }) {
  const style = TIER_STYLES[entry.tier];
  const rarityClass = RARITY_COLORS[entry.rarity] ?? 'text-gray-300 border-gray-500';
  const rarityText  = rarityClass.split(' ').find(c => c.startsWith('text-')) ?? 'text-gray-300';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-600 rounded-xl p-5 max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-sm font-bold px-2 py-0.5 rounded border ${style.badge}`}>Tier {entry.tier}</span>
              <span className={`text-sm ${rarityText}`}>{RARITY_LABELS[entry.rarity] ?? entry.rarity}</span>
            </div>
            <h2 className="text-xl font-bold text-white">{entry.name}</h2>
            <p className="text-2xl font-black text-white mt-1">{pct(entry.winRate)} <span className="text-sm font-normal text-gray-400">win rate</span></p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl leading-none ml-4 shrink-0">×</button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6 text-center">
          {[
            { label: 'Wins',   val: entry.wins,   bg: 'bg-green-500/10',  border: 'border-green-500/30',  text: 'text-green-300' },
            { label: 'Losses', val: entry.losses, bg: 'bg-red-500/10',    border: 'border-red-500/30',    text: 'text-red-300' },
            { label: 'Draws',  val: entry.draws,  bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-300' },
          ].map(({ label, val, bg, border, text }) => (
            <div key={label} className={`${bg} border ${border} rounded-lg py-3`}>
              <div className={`text-2xl font-bold ${text}`}>{val}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        <div className="text-xs text-gray-500 mb-5">
          Tested against {entry.poolSize - 1} creatures in pool
        </div>

        {entry.beats.length > 0 && (
          <div className="mb-5">
            <h3 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-2">
              Beats ({entry.beats.length})
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {entry.beats.map(uuid => (
                <span key={uuid} className="text-xs bg-green-500/10 border border-green-500/30 text-green-300 rounded-md px-2 py-1">
                  {nameMap.get(uuid) ?? uuid}
                </span>
              ))}
            </div>
          </div>
        )}

        {entry.losesTo.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">
              Loses to ({entry.losesTo.length})
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {entry.losesTo.map(uuid => (
                <span key={uuid} className="text-xs bg-red-500/10 border border-red-500/30 text-red-300 rounded-md px-2 py-1">
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

  // Global rank (1-based) across all entries before filtering
  const rankMap = useMemo(() => {
    const map = new Map<string, number>();
    group.entries.forEach((e, i) => map.set(e.uuid, i + 1));
    return map;
  }, [group]);

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
            Top 25 · 1v1 sim · Lv {group.level} · Updated {computedAt}
          </span>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {/* Group tabs + search */}
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

        {/* Tier sections */}
        <div className="space-y-6">
          {TIERS.map(tier => {
            const entries = byTier[tier] ?? [];
            if (entries.length === 0) return null;
            const style = TIER_STYLES[tier];
            return (
              <div key={tier}>
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-2xl font-black w-8 ${style.text}`}>{tier}</span>
                  <span className="text-sm text-gray-400">{style.label}</span>
                  <div className={`flex-1 h-px ${style.border} border-t`} />
                  <span className="text-xs text-gray-600">{entries.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {entries.map(e => (
                    <CreatureCard
                      key={e.uuid}
                      entry={e}
                      rank={rankMap.get(e.uuid) ?? 0}
                      onClick={setDetail}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-gray-600 mt-8 text-center">
          Rankings based on full 1v1 round-robin simulation against all creatures in rarity pool · auto-updated each paleo.gg scrape
        </p>
      </div>
    </div>
  );
}
