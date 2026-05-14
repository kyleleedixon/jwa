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

const SETUP_DEBUFFS = new Set(['damage_decrease', 'crit_decrease', 'heal_decrease', 'vulner', 'resistance_decrease_all']);

// Utility bonus rewards team-value traits that 1v1 simulation can't capture:
// swap-in pressure, escape enablement, persistent counters, priority moves,
// setup debuffs that weaken opponents for teammates, and group/AOE abilities.
function utilityBonus(creature: Creature): number {
  const moveTypes = new Set(creature.moves.map(m => m.type));
  const hasPriority = creature.moves.some(m => m.type === 'regular' && m.priority > 0);

  let bonus = 0;
  if (moveTypes.has('swap_in'))   bonus += 0.040;
  if (moveTypes.has('on_escape')) bonus += 0.030;
  if (moveTypes.has('counter'))   bonus += 0.020;
  if (hasPriority)                bonus += 0.020;
  bonus += (Math.min(creature.specialty.length, 20) / 20) * 0.030;

  for (const s of creature.specialty) {
    if (SETUP_DEBUFFS.has(s)) bonus += 0.015;
    if (s === 'cheat_death')  bonus += 0.025;
  }
  const groupCount = creature.specialty.filter(s => s.startsWith('group_') || s === 'target_all_opponents' || s === 'target_team').length;
  bonus += Math.min(groupCount * 0.015, 0.050);

  return Math.min(bonus, 0.20);
}

// Diminishing returns above 0.85 win rate so high-utility mid-tier creatures
// can climb without displacing genuinely dominant ones.
function adjustedScore(winRate: number, bonus: number): number {
  const base = winRate <= 0.85 ? winRate : 0.85 + (winRate - 0.85) * 0.3;
  return base + bonus;
}

process.stdout.write(`  Computing tier list (${pool.length} creatures, omegas auto-allocated)…`);
const t = computeTierList(pool, [], LEVEL);

// Re-sort entries by adjusted score so ranks and tiers reflect utility value.
t.entries.forEach(e => { (e as { utilityBonus?: number }).utilityBonus = utilityBonus(e.creature); });
t.entries.sort((a, b) => {
  const aScore = adjustedScore(a.winRate, (a as { utilityBonus?: number }).utilityBonus ?? 0);
  const bScore = adjustedScore(b.winRate, (b as { utilityBonus?: number }).utilityBonus ?? 0);
  return bScore - aScore || b.wins - a.wins;
});

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
      tier:         rankTier(rank),
      winRate:      Math.round(e.winRate * 1000) / 1000,
      utilityBonus: Math.round(((e as { utilityBonus?: number }).utilityBonus ?? 0) * 1000) / 1000,
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
    uuid:         e.creature.uuid,
    rank:         rank + 1,
    tier:         rank < 25 ? rankTier(rank) : null,
    winRate:      Math.round(e.winRate * 1000) / 1000,
    utilityBonus: Math.round(((e as { utilityBonus?: number }).utilityBonus ?? 0) * 1000) / 1000,
  })),
};

process.stdout.write(` done (${t.durationMs}ms)\n`);

writeFileSync(outPath, JSON.stringify(result, null, 2));
console.log(`  Saved tier list to ${outPath}`);
