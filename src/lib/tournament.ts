import { Creature } from '@/types/creature';
import { simulateBattle, BattleConfig } from './battle';

export interface TournamentRules {
  rarities: string[];
  level: number;
  boosts: boolean;
}

export interface CreatureScore {
  creature: Creature;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  beats: string[];    // uuids this creature beats
  losesTo: string[];  // uuids that beat this creature
}

export interface TournamentResult {
  scores: CreatureScore[];
  team: Creature[];   // optimal 8
  pool: Creature[];
  durationMs: number;
}

export function runTournamentOptimizer(
  allCreatures: Creature[],
  rules: TournamentRules,
): TournamentResult {
  const t0 = performance.now();
  const config: BattleConfig = { levelA: rules.level, levelB: rules.level };

  const pool = allCreatures.filter(c => rules.rarities.includes(c.rarity));

  const beats  = new Map<string, Set<string>>();
  const losesTo = new Map<string, Set<string>>();
  const draws  = new Map<string, Set<string>>();
  for (const c of pool) {
    beats.set(c.uuid, new Set());
    losesTo.set(c.uuid, new Set());
    draws.set(c.uuid, new Set());
  }

  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      const a = pool[i], b = pool[j];
      const r = simulateBattle(a, b, config);
      if (r.winner === 'A') {
        beats.get(a.uuid)!.add(b.uuid);
        losesTo.get(b.uuid)!.add(a.uuid);
      } else if (r.winner === 'B') {
        beats.get(b.uuid)!.add(a.uuid);
        losesTo.get(a.uuid)!.add(b.uuid);
      } else {
        draws.get(a.uuid)!.add(b.uuid);
        draws.get(b.uuid)!.add(a.uuid);
      }
    }
  }

  const scores: CreatureScore[] = pool.map(c => {
    const w = beats.get(c.uuid)!.size;
    const l = losesTo.get(c.uuid)!.size;
    const d = draws.get(c.uuid)!.size;
    const total = w + l + d;
    return {
      creature: c,
      wins: w,
      losses: l,
      draws: d,
      winRate: total > 0 ? w / total : 0,
      beats: [...beats.get(c.uuid)!],
      losesTo: [...losesTo.get(c.uuid)!],
    };
  });

  scores.sort((a, b) => b.winRate - a.winRate || b.wins - a.wins);

  // Greedy coverage: each pick maximises new matchups covered
  const team: Creature[] = [];
  const teamBeats = new Set<string>();
  const picked = new Set<string>();

  while (team.length < 8 && team.length < pool.length) {
    let bestSlotScore = -1;
    let bestIdx = -1;

    for (let i = 0; i < scores.length; i++) {
      const s = scores[i];
      if (picked.has(s.creature.uuid)) continue;
      const newCoverage = s.beats.filter(u => !teamBeats.has(u)).length;
      const slotScore = newCoverage * 1000 + Math.round(s.winRate * 999);
      if (slotScore > bestSlotScore) { bestSlotScore = slotScore; bestIdx = i; }
    }

    if (bestIdx < 0) break;
    const chosen = scores[bestIdx];
    team.push(chosen.creature);
    picked.add(chosen.creature.uuid);
    chosen.beats.forEach(u => teamBeats.add(u));
  }

  return { scores, team, pool, durationMs: Math.round(performance.now() - t0) };
}
