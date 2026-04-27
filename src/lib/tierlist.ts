import { Creature } from '@/types/creature';
import { simulateBattle, BattleConfig } from './battle';

export type Tier = 'S' | 'A' | 'B' | 'C' | 'D';

export interface TierEntry {
  creature: Creature;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  tier: Tier;
  beats: string[];   // uuids
  losesTo: string[]; // uuids
}

export interface TierListResult {
  entries: TierEntry[];
  pool: Creature[];
  durationMs: number;
}

// Win-rate thresholds — tuned for JWA 1v1 meta diversity
const TIER_THRESHOLDS: [Tier, number][] = [
  ['S', 0.70],
  ['A', 0.55],
  ['B', 0.40],
  ['C', 0.25],
  ['D', 0],
];

function assignTier(winRate: number): Tier {
  for (const [tier, min] of TIER_THRESHOLDS) {
    if (winRate >= min) return tier;
  }
  return 'D';
}

const OMEGA_STATS = ['health', 'damage', 'speed', 'armor', 'crit', 'critm'] as const;
type OmegaStat = typeof OMEGA_STATS[number];

// Return a shallow-cloned creature with omega points distributed evenly across stats
function withEvenOmegaPoints(c: Creature): Creature {
  if (!c.points) return c;
  const { delta, pcap } = c.points;
  const active = OMEGA_STATS.filter(s => (pcap[s] ?? 0) > 0);
  const totalPcap = active.reduce((sum, s) => sum + (pcap[s] ?? 0), 0);
  const evenShare = Math.floor(totalPcap / active.length);
  const overrides: Partial<Record<OmegaStat, number>> = {};
  for (const s of active) {
    const pts = Math.min(evenShare, pcap[s] ?? 0);
    overrides[s] = (c[s] as number) + pts * (delta[s] ?? 0);
  }
  return { ...c, ...overrides };
}

export function computeTierList(
  allCreatures: Creature[],
  rarities: string[],
  level: number,
): TierListResult {
  const t0 = performance.now();
  const config: BattleConfig = { levelA: level, levelB: level };
  const raw = rarities.length > 0
    ? allCreatures.filter(c => rarities.includes(c.rarity))
    : allCreatures;
  // Omega creatures use even point distribution so their stats are comparable to other rarities
  const pool = raw.map(c => c.rarity === 'omega' ? withEvenOmegaPoints(c) : c);

  const beats   = new Map<string, Set<string>>();
  const losesTo = new Map<string, Set<string>>();
  const drawsM  = new Map<string, Set<string>>();

  for (const c of pool) {
    beats.set(c.uuid, new Set());
    losesTo.set(c.uuid, new Set());
    drawsM.set(c.uuid, new Set());
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
        drawsM.get(a.uuid)!.add(b.uuid);
        drawsM.get(b.uuid)!.add(a.uuid);
      }
    }
  }

  const entries: TierEntry[] = pool.map(c => {
    const w = beats.get(c.uuid)!.size;
    const l = losesTo.get(c.uuid)!.size;
    const d = drawsM.get(c.uuid)!.size;
    const total = w + l + d;
    const winRate = total > 0 ? w / total : 0;
    return {
      creature: c,
      wins: w, losses: l, draws: d,
      winRate,
      tier: assignTier(winRate),
      beats: [...beats.get(c.uuid)!],
      losesTo: [...losesTo.get(c.uuid)!],
    };
  });

  entries.sort((a, b) => b.winRate - a.winRate || b.wins - a.wins);

  return { entries, pool, durationMs: Math.round(performance.now() - t0) };
}
