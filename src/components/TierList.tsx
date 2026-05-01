'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Tier } from '@/lib/tierlist';
import { RARITY_COLORS, RARITY_LABELS } from '@/lib/labels';

export interface TierEntry {
  uuid: string;
  name: string;
  rarity: string;
  image: string;
  tier: Tier;
  winRate: number;
  wins: number;
  losses: number;
  draws: number;
  poolSize: number;
  beats: string[];
  losesTo: string[];
}

interface Props {
  entries: TierEntry[];
  level: number;
  computedAt: string;
}

const TIER_STYLES: Record<Tier, { text: string; border: string; badge: string; label: string }> = {
  S: { text: 'text-red-300',    border: 'border-red-500/40',    badge: 'bg-red-500/30 text-red-200 border-red-400/50',       label: 'S — Elite' },
  A: { text: 'text-orange-300', border: 'border-orange-500/40', badge: 'bg-orange-500/30 text-orange-200 border-orange-400/50', label: 'A — Strong' },
  B: { text: 'text-yellow-300', border: 'border-yellow-500/40', badge: 'bg-yellow-500/30 text-yellow-200 border-yellow-400/50', label: 'B — Solid' },
  C: { text: 'text-blue-300',   border: 'border-blue-500/40',   badge: 'bg-blue-500/30 text-blue-200 border-blue-400/50',     label: 'C — Fringe' },
  D: { text: 'text-slate-400',  border: 'border-slate-500/40',  badge: 'bg-slate-500/30 text-slate-300 border-slate-400/50',  label: 'D — Weak' },
};

const TIERS: Tier[] = ['S', 'A', 'B', 'C', 'D'];

function shareLink(uuid: string) {
  return `/?share=${uuid}~26~0~0~0~0`;
}

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
  const rarityText   = rarityClass.split(' ').find(c => c.startsWith('text-'))   ?? 'text-gray-300';
  const rarityBorder = rarityClass.split(' ').find(c => c.startsWith('border-')) ?? 'border-gray-500';
  const total = entry.wins + entry.losses + entry.draws;

  return (
    <button
      onClick={() => onClick(entry)}
      className={`w-full text-left rounded-xl border ${rarityBorder} bg-slate-800 hover:bg-slate-750 transition-all overflow-hidden`}
    >
      {/* Dino image */}
      <div className="relative w-full h-36 bg-slate-700/50">
        <Image
          src={entry.image}
          alt={entry.name}
          fill
          className="object-contain p-2"
          unoptimized
        />
        {/* Tier badge overlay */}
        <span className={`absolute top-2 left-2 text-xs font-bold px-1.5 py-0.5 rounded border ${style.badge}`}>
          {entry.tier}
        </span>
        <span className="absolute top-2 right-2 text-xs text-gray-500 bg-slate-900/70 px-1.5 py-0.5 rounded">
          #{rank}
        </span>
      </div>

      {/* Details */}
      <div className="p-3 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0">
            <h3 className="font-bold text-white text-sm leading-tight truncate">{entry.name}</h3>
            <span className={`text-xs ${rarityText}`}>{RARITY_LABELS[entry.rarity] ?? entry.rarity}</span>
          </div>
          <div className="text-right shrink-0">
            <div className="text-lg font-black text-white">{pct(entry.winRate)}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wide">win rate</div>
          </div>
        </div>

        {/* W/L/D bars */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-green-400 w-8 shrink-0">{entry.wins}W</span>
            <StatBar value={entry.wins} max={total} color="bg-green-500" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-red-400 w-8 shrink-0">{entry.losses}L</span>
            <StatBar value={entry.losses} max={total} color="bg-red-500" />
          </div>
          {entry.draws > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-yellow-400 w-8 shrink-0">{entry.draws}D</span>
              <StatBar value={entry.draws} max={total} color="bg-yellow-500" />
            </div>
          )}
        </div>

        <div className="text-[10px] text-gray-600 pt-1 border-t border-slate-700">
          Beats {entry.beats.length} / {entry.poolSize - 1} · tap for details
        </div>
      </div>
    </button>
  );
}

function CreatureLink({ uuid, name }: { uuid: string; name: string }) {
  return (
    <a
      href={shareLink(uuid)}
      className="text-xs bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-slate-500 text-gray-200 rounded-md px-2 py-1 transition-colors"
    >
      {name}
    </a>
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
  const rarityClass = RARITY_COLORS[entry.rarity] ?? 'text-gray-300 border-gray-500';
  const rarityText  = rarityClass.split(' ').find(c => c.startsWith('text-')) ?? 'text-gray-300';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div
        className="bg-slate-800 border border-slate-600 rounded-xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Hero image */}
        <div className="relative w-full h-48 bg-slate-700/50 rounded-t-xl overflow-hidden">
          <Image src={entry.image} alt={entry.name} fill className="object-contain p-4" unoptimized />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-slate-900/70 text-gray-400 hover:text-white text-lg"
          >
            ×
          </button>
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-sm font-bold px-2 py-0.5 rounded border ${style.badge}`}>Tier {entry.tier}</span>
                <span className={`text-sm ${rarityText}`}>{RARITY_LABELS[entry.rarity] ?? entry.rarity}</span>
              </div>
              <h2 className="text-xl font-bold text-white">{entry.name}</h2>
              <a
                href={shareLink(entry.uuid)}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                View in Dinodex →
              </a>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-white">{pct(entry.winRate)}</div>
              <div className="text-xs text-gray-500">win rate</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5 text-center">
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

          <p className="text-xs text-gray-500 mb-5">Tested against {entry.poolSize - 1} creatures</p>

          {entry.beats.length > 0 && (
            <div className="mb-5">
              <h3 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-2">
                Beats ({entry.beats.length})
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {entry.beats.map(uuid => (
                  <CreatureLink key={uuid} uuid={uuid} name={nameMap.get(uuid) ?? uuid} />
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
                  <CreatureLink key={uuid} uuid={uuid} name={nameMap.get(uuid) ?? uuid} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TierList({ entries, level, computedAt }: Props) {
  const [detail, setDetail] = useState<TierEntry | null>(null);
  const [search, setSearch]  = useState('');

  const nameMap = useMemo(() => new Map(entries.map(e => [e.uuid, e.name])), [entries]);

  const filtered = useMemo(() => {
    if (!search) return entries;
    const q = search.toLowerCase();
    return entries.filter(e => e.name.toLowerCase().includes(q));
  }, [entries, search]);

  const byTier = useMemo(() => {
    const map: Record<Tier, TierEntry[]> = { S: [], A: [], B: [], C: [], D: [] };
    for (const e of filtered) map[e.tier].push(e);
    return map;
  }, [filtered]);

  const rankMap = useMemo(() => new Map(entries.map((e, i) => [e.uuid, i + 1])), [entries]);

  const computedDate = new Date(computedAt).toLocaleDateString('en-US', {
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
          <div className="ml-auto flex items-center gap-3">
            <input
              type="text"
              placeholder="Filter…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors w-36"
            />
            <span className="text-xs text-gray-500 hidden sm:block">
              Top 25 · 1v1 · Lv {level} · {computedDate}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-8">
        {TIERS.map(tier => {
          const tierEntries = byTier[tier] ?? [];
          if (tierEntries.length === 0) return null;
          const style = TIER_STYLES[tier];
          return (
            <div key={tier}>
              <div className="flex items-center gap-3 mb-4">
                <span className={`text-2xl font-black w-8 ${style.text}`}>{tier}</span>
                <span className="text-sm text-gray-400">{style.label}</span>
                <div className={`flex-1 h-px border-t ${style.border}`} />
                <span className="text-xs text-gray-600">{tierEntries.length}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {tierEntries.map(e => (
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

        <p className="text-xs text-gray-600 text-center pb-4">
          Full 1v1 round-robin simulation across all {entries[0]?.poolSize ?? '?'} creatures · auto-updated each paleo.gg scrape
        </p>
      </div>
    </div>
  );
}
