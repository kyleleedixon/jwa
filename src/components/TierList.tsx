'use client';

import { useState, useMemo, useCallback } from 'react';
import { Creature } from '@/types/creature';
import { computeTierList, TierEntry, Tier } from '@/lib/tierlist';
import { RARITY_ORDER, RARITY_LABELS, RARITY_COLORS } from '@/lib/labels';

interface Props {
  creatures: Creature[];
}

const TIER_STYLES: Record<Tier, { bg: string; text: string; border: string; label: string }> = {
  S: { bg: 'bg-red-500/20',    text: 'text-red-300',    border: 'border-red-500/40',    label: 'S — Dominant' },
  A: { bg: 'bg-orange-500/20', text: 'text-orange-300', border: 'border-orange-500/40', label: 'A — Strong' },
  B: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', border: 'border-yellow-500/40', label: 'B — Solid' },
  C: { bg: 'bg-green-500/20',  text: 'text-green-300',  border: 'border-green-500/40',  label: 'C — Below Average' },
  D: { bg: 'bg-slate-500/20',  text: 'text-slate-400',  border: 'border-slate-500/40',  label: 'D — Weak' },
};

const TIERS: Tier[] = ['S', 'A', 'B', 'C', 'D'];

const DEFAULT_LEVEL = 26;

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

function CreatureChip({
  entry,
  nameMap,
  onClick,
}: {
  entry: TierEntry;
  nameMap: Map<string, string>;
  onClick: (e: TierEntry) => void;
}) {
  const rarityClass = RARITY_COLORS[entry.creature.rarity] ?? 'text-gray-300 border-gray-500';
  const borderClass = rarityClass.split(' ').find(c => c.startsWith('border-')) ?? 'border-gray-500';

  return (
    <button
      onClick={() => onClick(entry)}
      className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg border ${borderClass} bg-slate-800 hover:bg-slate-700 transition-colors text-center min-w-[72px] max-w-[80px]`}
    >
      <span className="text-xs font-semibold text-white leading-tight line-clamp-2">{entry.creature.name}</span>
      <span className="text-[10px] text-gray-400">{pct(entry.winRate)}</span>
    </button>
  );
}

function DetailPanel({ entry, nameMap, onClose }: { entry: TierEntry; nameMap: Map<string, string>; onClose: () => void }) {
  const style = TIER_STYLES[entry.tier];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-600 rounded-xl p-5 max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">{entry.creature.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${style.bg} ${style.text}`}>Tier {entry.tier}</span>
              <span className="text-sm text-gray-400">{pct(entry.winRate)} win rate</span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none ml-4">×</button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5 text-center">
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2">
            <div className="text-lg font-bold text-green-300">{entry.wins}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wide">Wins</div>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2">
            <div className="text-lg font-bold text-yellow-300">{entry.draws}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wide">Draws</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2">
            <div className="text-lg font-bold text-red-300">{entry.losses}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wide">Losses</div>
          </div>
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

export default function TierList({ creatures }: Props) {
  const availableRarities = useMemo(
    () => RARITY_ORDER.filter(r => creatures.some(c => c.rarity === r)),
    [creatures],
  );

  const [selectedRarities, setSelectedRarities] = useState<Set<string>>(
    new Set(['epic', 'legendary', 'unique', 'apex', 'omega'].filter(r => availableRarities.includes(r))),
  );
  const [level, setLevel] = useState(DEFAULT_LEVEL);
  const [computed, setComputed] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof computeTierList> | null>(null);
  const [detail, setDetail] = useState<TierEntry | null>(null);

  const nameMap = useMemo(() => new Map(creatures.map(c => [c.uuid, c.name])), [creatures]);

  const toggleRarity = useCallback((r: string) => {
    setSelectedRarities(prev => {
      const next = new Set(prev);
      if (next.has(r)) next.delete(r);
      else next.add(r);
      return next;
    });
    setComputed(false);
  }, []);

  const run = useCallback(() => {
    setRunning(true);
    // Defer to let React render the loading state first
    setTimeout(() => {
      const res = computeTierList(creatures, [...selectedRarities], level);
      setResult(res);
      setComputed(true);
      setRunning(false);
    }, 20);
  }, [creatures, selectedRarities, level]);

  const byTier = useMemo(() => {
    if (!result) return {} as Record<Tier, TierEntry[]>;
    const map: Record<Tier, TierEntry[]> = { S: [], A: [], B: [], C: [], D: [] };
    for (const e of result.entries) map[e.tier].push(e);
    return map;
  }, [result]);

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
          <span className="text-xs text-gray-500 ml-auto">Sim-based · 1v1</span>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {/* Controls */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Rarities</label>
              <div className="flex flex-wrap gap-1.5">
                {availableRarities.map(r => {
                  const active = selectedRarities.has(r);
                  const colorClass = RARITY_COLORS[r] ?? 'text-gray-300 border-gray-500';
                  const textClass = colorClass.split(' ').find(c => c.startsWith('text-')) ?? 'text-gray-300';
                  const borderClass = colorClass.split(' ').find(c => c.startsWith('border-')) ?? 'border-gray-500';
                  return (
                    <button
                      key={r}
                      onClick={() => toggleRarity(r)}
                      className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                        active
                          ? `${borderClass} ${textClass} bg-slate-700`
                          : 'border-slate-700 text-gray-600 hover:text-gray-400'
                      }`}
                    >
                      {RARITY_LABELS[r] ?? r}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Level</label>
              <select
                value={level}
                onChange={e => { setLevel(Number(e.target.value)); setComputed(false); }}
                className="bg-slate-700 border border-slate-600 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                {[20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30].map(l => (
                  <option key={l} value={l}>Lv {l}</option>
                ))}
              </select>
            </div>

            <button
              onClick={run}
              disabled={running || selectedRarities.size === 0}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-semibold"
            >
              {running ? 'Computing…' : computed ? 'Recompute' : 'Run Tier List'}
            </button>

            {result && !running && (
              <span className="text-xs text-gray-500">
                {result.pool.length} creatures · {result.durationMs}ms
              </span>
            )}
          </div>
        </div>

        {/* Tier rows */}
        {!computed && !running && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-4 opacity-40">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
            <p>Select rarities and click <strong className="text-gray-300">Run Tier List</strong> to simulate all 1v1 matchups.</p>
          </div>
        )}

        {running && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p>Simulating {selectedRarities.size > 0 ? 'all matchups' : ''}…</p>
          </div>
        )}

        {computed && result && !running && (
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
                    <span className="text-xs text-gray-500 ml-auto">{entries.length} creatures</span>
                  </div>
                  <div className="p-3 flex flex-wrap gap-2">
                    {entries.map(e => (
                      <CreatureChip key={e.creature.uuid} entry={e} nameMap={nameMap} onClick={setDetail} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
