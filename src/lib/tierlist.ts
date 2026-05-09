import { Creature } from '@/types/creature';
import { simulateBattle } from './battle';

export type Tier = 'S' | 'A' | 'B' | 'C' | 'D';

export interface TierEntry {
  creature: Creature;
  winRate: number;
  wins: number;
  losses: number;
  draws: number;
  beats: string[];
  losesTo: string[];
}

export interface TierListResult {
  entries: TierEntry[];
  pool: Creature[];
  durationMs: number;
}

export function computeTierList(
  creatures: Creature[],
  _excluded: string[],
  level: number,
): TierListResult {
  const start = Date.now();
  const pool = creatures;
  const n = pool.length;

  const wins   = new Array<number>(n).fill(0);
  const losses = new Array<number>(n).fill(0);
  const draws  = new Array<number>(n).fill(0);
  const beats:  string[][] = Array.from({ length: n }, () => []);
  const losesTo: string[][] = Array.from({ length: n }, () => []);

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const result = simulateBattle(pool[i], pool[j], { levelA: level, levelB: level });
      if (result.winner === 'A') {
        wins[i]++;
        losses[j]++;
        beats[i].push(pool[j].uuid);
        losesTo[j].push(pool[i].uuid);
      } else if (result.winner === 'B') {
        wins[j]++;
        losses[i]++;
        beats[j].push(pool[i].uuid);
        losesTo[i].push(pool[j].uuid);
      } else {
        draws[i]++;
        draws[j]++;
      }
    }
  }

  const entries: TierEntry[] = pool.map((creature, i) => {
    const total = wins[i] + losses[i] + draws[i];
    return {
      creature,
      winRate: total > 0 ? wins[i] / total : 0,
      wins: wins[i],
      losses: losses[i],
      draws: draws[i],
      beats: beats[i],
      losesTo: losesTo[i],
    };
  });

  entries.sort((a, b) => b.winRate - a.winRate || b.wins - a.wins);

  return { entries, pool, durationMs: Date.now() - start };
}
