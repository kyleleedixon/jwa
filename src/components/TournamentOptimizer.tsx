'use client';

import { useState, useMemo, useTransition } from 'react';
import { Creature } from '@/types/creature';
import { runTournamentOptimizer, TournamentResult, TournamentRules } from '@/lib/tournament';

const ALL_RARITIES = ['common', 'rare', 'epic', 'legendary', 'unique', 'apex', 'omega'];
const RARITY_COLORS: Record<string, string> = {
  common: 'text-gray-300', rare: 'text-blue-400', epic: 'text-purple-400',
  legendary: 'text-yellow-400', unique: 'text-orange-400', apex: 'text-red-400', omega: 'text-pink-400',
};
const RARITY_BG: Record<string, string> = {
  common: 'bg-gray-500/20 border-gray-500/40', rare: 'bg-blue-500/20 border-blue-500/40',
  epic: 'bg-purple-500/20 border-purple-500/40', legendary: 'bg-yellow-500/20 border-yellow-500/40',
  unique: 'bg-orange-500/20 border-orange-500/40', apex: 'bg-red-500/20 border-red-500/40',
  omega: 'bg-pink-500/20 border-pink-500/40',
};

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

function WinBar({ wins, losses, draws }: { wins: number; losses: number; draws: number }) {
  const total = wins + losses + draws || 1;
  return (
    <div className="flex h-1.5 rounded-full overflow-hidden w-full gap-px">
      <div className="bg-green-500 rounded-l-full" style={{ width: `${wins / total * 100}%` }} />
      <div className="bg-yellow-500" style={{ width: `${draws / total * 100}%` }} />
      <div className="bg-red-500 rounded-r-full flex-1" />
    </div>
  );
}

function TeamCard({ creature, rank, scores }: {
  creature: Creature;
  rank: number;
  scores: TournamentResult['scores'];
}) {
  const sc = scores.find(s => s.creature.uuid === creature.uuid)!;
  const total = sc.wins + sc.losses + sc.draws;
  return (
    <div className={`flex flex-col gap-2 p-3 rounded-xl border ${RARITY_BG[creature.rarity]} bg-opacity-50`}>
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-gray-500 w-4 shrink-0">#{rank}</span>
        <img src={creature.image} alt="" className="w-9 h-9 object-contain rounded bg-black/20 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{creature.name}</p>
          <p className={`text-xs ${RARITY_COLORS[creature.rarity]}`}>{cap(creature.rarity)}</p>
        </div>
        <div className="ml-auto text-right shrink-0">
          <p className="text-sm font-bold text-white">{Math.round(sc.winRate * 100)}%</p>
          <p className="text-xs text-gray-500">{sc.wins}W {sc.losses}L</p>
        </div>
      </div>
      <WinBar wins={sc.wins} losses={sc.losses} draws={sc.draws} />
    </div>
  );
}

export default function TournamentOptimizer({ creatures }: { creatures: Creature[] }) {
  const defaultRules: TournamentRules = {
    rarities: ['legendary', 'unique'],
    level: 35,
    boosts: false,
  };

  const [rules, setRules] = useState<TournamentRules>(defaultRules);
  const [result, setResult] = useState<TournamentResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const [filterQuery, setFilterQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  const poolSize = useMemo(
    () => creatures.filter(c => rules.rarities.includes(c.rarity)).length,
    [creatures, rules.rarities]
  );

  function toggleRarity(r: string) {
    setRules(prev => ({
      ...prev,
      rarities: prev.rarities.includes(r)
        ? prev.rarities.filter(x => x !== r)
        : [...prev.rarities, r],
    }));
    setResult(null);
  }

  function runOptimizer() {
    startTransition(() => {
      const r = runTournamentOptimizer(creatures, rules);
      setResult(r);
    });
  }

  const filteredScores = useMemo(() => {
    if (!result) return [];
    const q = filterQuery.toLowerCase().trim();
    const scores = q
      ? result.scores.filter(s => s.creature.name.toLowerCase().includes(q))
      : result.scores;
    return showAll ? scores : scores.slice(0, 30);
  }, [result, filterQuery, showAll]);

  const teamUuids = useMemo(() => new Set(result?.team.map(c => c.uuid) ?? []), [result]);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 px-4 sm:px-6 py-4 flex items-center gap-3">
        <a href="/" className="text-gray-400 hover:text-white transition-colors text-sm">← Dinodex</a>
        <span className="text-gray-700">/</span>
        <h1 className="text-sm font-semibold text-white">Tournament Optimizer</h1>
        <span className="ml-auto text-xs text-yellow-500/80 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full font-medium">Beta</span>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">

        {/* Rules */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 flex flex-col gap-5">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Tournament Rules</h2>

          {/* Rarities */}
          <div>
            <p className="text-xs text-gray-500 mb-2">Allowed rarities</p>
            <div className="flex flex-wrap gap-2">
              {ALL_RARITIES.map(r => {
                const active = rules.rarities.includes(r);
                return (
                  <button
                    key={r}
                    onClick={() => toggleRarity(r)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                      active
                        ? `${RARITY_BG[r]} ${RARITY_COLORS[r]}`
                        : 'bg-slate-700/50 border-slate-600 text-gray-500 hover:border-slate-500'
                    }`}
                  >
                    {cap(r)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Level */}
          <div>
            <p className="text-xs text-gray-500 mb-2">Level <span className="text-white font-semibold">{rules.level}</span></p>
            <input
              type="range" min={1} max={35} value={rules.level}
              onChange={e => { setRules(r => ({ ...r, level: Number(e.target.value) })); setResult(null); }}
              className="w-full max-w-xs accent-blue-500"
            />
          </div>

          {/* Boosts */}
          <div className="flex items-center gap-3">
            <p className="text-xs text-gray-500">Stat boosts</p>
            <button
              onClick={() => { setRules(r => ({ ...r, boosts: !r.boosts })); setResult(null); }}
              className={`relative w-10 h-5 rounded-full transition-colors ${rules.boosts ? 'bg-blue-500' : 'bg-slate-600'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${rules.boosts ? 'translate-x-5' : ''}`} />
            </button>
            <span className="text-xs text-gray-400">{rules.boosts ? 'Enabled (not yet supported — disabled in sim)' : 'Disabled'}</span>
          </div>

          {/* Pool summary + run */}
          <div className="flex items-center gap-4 pt-1">
            <p className="text-xs text-gray-500">
              {poolSize} creatures in pool
              {poolSize > 0 && <> · {Math.floor(poolSize * (poolSize - 1) / 2).toLocaleString()} matchups</>}
            </p>
            <button
              onClick={runOptimizer}
              disabled={isPending || rules.rarities.length === 0 || poolSize < 2}
              className="ml-auto px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? 'Running…' : 'Run Optimizer'}
            </button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Recommended Team</h2>
              <span className="text-xs text-gray-600 ml-auto">{result.durationMs}ms</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {result.team.map((c, i) => (
                <TeamCard key={c.uuid} creature={c} rank={i + 1} scores={result.scores} />
              ))}
            </div>

            {/* Coverage stat */}
            {(() => {
              const covered = new Set<string>();
              result.team.forEach(c => {
                const sc = result.scores.find(s => s.creature.uuid === c.uuid)!;
                sc.beats.forEach(u => covered.add(u));
              });
              const pct = Math.round(covered.size / (result.pool.length - 1) * 100);
              return (
                <p className="text-xs text-gray-500 -mt-2">
                  This team covers <span className="text-white font-semibold">{covered.size}</span> of{' '}
                  <span className="text-white font-semibold">{result.pool.length - 1}</span> opponents ({pct}%)
                </p>
              );
            })()}

            {/* Full rankings */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">All Creatures Ranked</h2>
                <input
                  value={filterQuery}
                  onChange={e => setFilterQuery(e.target.value)}
                  placeholder="Filter…"
                  className="ml-auto px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-gray-600 outline-none focus:border-slate-500 w-36"
                />
              </div>

              <div className="bg-slate-800/40 border border-slate-700 rounded-xl overflow-hidden">
                <div className="grid grid-cols-[2rem_1fr_5rem_4rem_4rem_4rem] items-center gap-2 px-3 py-2 border-b border-slate-700 text-xs text-gray-500 font-medium">
                  <span>#</span>
                  <span>Creature</span>
                  <span className="text-right">Win%</span>
                  <span className="text-right">W</span>
                  <span className="text-right">L</span>
                  <span className="text-right">D</span>
                </div>
                {filteredScores.map((sc, i) => {
                  const isTeam = teamUuids.has(sc.creature.uuid);
                  const rank = result.scores.indexOf(sc) + 1;
                  return (
                    <div
                      key={sc.creature.uuid}
                      className={`grid grid-cols-[2rem_1fr_5rem_4rem_4rem_4rem] items-center gap-2 px-3 py-2 border-b border-slate-700/50 last:border-0 text-sm transition-colors ${
                        isTeam ? 'bg-blue-500/5' : 'hover:bg-slate-700/30'
                      }`}
                    >
                      <span className="text-xs text-gray-600">{rank}</span>
                      <div className="flex items-center gap-2 min-w-0">
                        <img src={sc.creature.image} alt="" className="w-7 h-7 object-contain rounded bg-black/20 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-white truncate font-medium">{sc.creature.name}</p>
                          <p className={`text-xs ${RARITY_COLORS[sc.creature.rarity]}`}>{cap(sc.creature.rarity)}</p>
                        </div>
                        {isTeam && (
                          <span className="ml-1 shrink-0 text-xs bg-blue-500/20 border border-blue-500/40 text-blue-300 px-1.5 py-0.5 rounded-full font-medium">Team</span>
                        )}
                      </div>
                      <span className="text-right font-semibold text-white">{Math.round(sc.winRate * 100)}%</span>
                      <span className="text-right text-green-400">{sc.wins}</span>
                      <span className="text-right text-red-400">{sc.losses}</span>
                      <span className="text-right text-yellow-400">{sc.draws}</span>
                    </div>
                  );
                })}
              </div>

              {!showAll && result.scores.length > 30 && !filterQuery && (
                <button
                  onClick={() => setShowAll(true)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors text-center py-1"
                >
                  Show all {result.scores.length} creatures
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
