import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Creature } from '../src/types/creature';
import { computeTierList } from '../src/lib/tierlist';

const creaturesPath = join(__dirname, '../src/data/creatures.json');
const outPath       = join(__dirname, '../src/data/tierlist.json');

const creatures = JSON.parse(readFileSync(creaturesPath, 'utf8')) as Creature[];

const LEVEL = 26;

// Greedy point allocation: damage → health → speed → critm → crit → armor
const POINT_PRIORITY = ['damage', 'health', 'speed', 'critm', 'crit', 'armor'];

function applyOmegaPoints(creature: Creature, level: number): { creature: Creature; alloc: Record<string, number> } {
  if (!creature.points) return { creature, alloc: {} };
  const { delta, pcap } = creature.points;
  let remaining = level * 7;
  const alloc: Record<string, number> = {};
  for (const stat of POINT_PRIORITY) {
    if (remaining <= 0) break;
    const max = pcap[stat] ?? 0;
    if (max <= 0) continue;
    alloc[stat] = Math.min(max, remaining);
    remaining -= alloc[stat];
  }
  return {
    creature: {
      ...creature,
      health: creature.health + (alloc.health ?? 0) * (delta.health ?? 0),
      damage: creature.damage + (alloc.damage ?? 0) * (delta.damage ?? 0),
      speed:  creature.speed  + (alloc.speed  ?? 0) * (delta.speed  ?? 0),
      armor:  creature.armor  + (alloc.armor  ?? 0) * (delta.armor  ?? 0),
      crit:   creature.crit   + (alloc.crit   ?? 0) * (delta.crit   ?? 0),
      critm:  creature.critm  + (alloc.critm  ?? 0) * (delta.critm  ?? 0),
    },
    alloc,
  };
}

// Pre-bake omega points into base stats so statAtLevel(stat, 26) = stat (multiplier = 1.0)
const omegaAllocs = new Map<string, Record<string, number>>();
const pool = creatures.map(c => {
  if (c.rarity !== 'omega') return c;
  const { creature, alloc } = applyOmegaPoints(c, LEVEL);
  omegaAllocs.set(c.uuid, alloc);
  return creature;
});

process.stdout.write(`  Computing tier list (${pool.length} creatures, omegas auto-allocated)…`);
const t = computeTierList(pool, [], LEVEL);

const top25 = t.entries.slice(0, 25);

// Rank-based tiers for top 25 display
function rankTier(rank: number): string {
  return rank < 5 ? 'S' : rank < 12 ? 'A' : rank < 19 ? 'B' : 'C';
}

// Win-rate threshold tiers for full pool
function winRateTier(winRate: number): string {
  if (winRate >= 0.70) return 'S';
  if (winRate >= 0.55) return 'A';
  if (winRate >= 0.40) return 'B';
  if (winRate >= 0.25) return 'C';
  return 'D';
}

const result = {
  level: LEVEL,
  computedAt: new Date().toISOString(),
  durationMs: t.durationMs,
  // Full details for top 25 (used by tier list page)
  entries: top25.map((e, rank) => {
    const entry: Record<string, unknown> = {
      uuid:     e.creature.uuid,
      name:     e.creature.name,
      rarity:   e.creature.rarity,
      image:    e.creature.image,
      tier:     rankTier(rank),
      winRate:  Math.round(e.winRate * 1000) / 1000,
      wins:     e.wins,
      losses:   e.losses,
      draws:    e.draws,
      poolSize: t.pool.length,
      beats:    e.beats,
      losesTo:  e.losesTo,
    };
    if (e.creature.rarity === 'omega') {
      entry.omegaBuild = {
        alloc: omegaAllocs.get(e.creature.uuid) ?? {},
        stats: {
          health: e.creature.health,
          damage: e.creature.damage,
          speed:  e.creature.speed,
          armor:  e.creature.armor,
          crit:   e.creature.crit,
          critm:  e.creature.critm,
        },
      };
    }
    return entry;
  }),
  // Rank + tier for every creature (used by Dinodex badges)
  allRanks: t.entries.map((e, rank) => ({
    uuid:    e.creature.uuid,
    rank:    rank + 1,
    tier:    rank < 25 ? rankTier(rank) : null,
    winRate: Math.round(e.winRate * 1000) / 1000,
  })),
};

process.stdout.write(` done (${t.durationMs}ms)\n`);

writeFileSync(outPath, JSON.stringify(result, null, 2));
console.log(`  Saved tier list to ${outPath}`);
