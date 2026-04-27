import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Creature } from '../src/types/creature';
import { computeTierList } from '../src/lib/tierlist';
import { RARITY_ORDER } from '../src/lib/labels';

const creaturesPath = join(__dirname, '../src/data/creatures.json');
const outPath       = join(__dirname, '../src/data/tierlist.json');

const creatures = JSON.parse(readFileSync(creaturesPath, 'utf8')) as Creature[];

// Build one tier list per rarity group that makes sense for tournaments
const RARITY_GROUPS: { key: string; label: string; rarities: string[] }[] = [
  { key: 'all',             label: 'All Rarities',              rarities: RARITY_ORDER },
  { key: 'epic_and_up',     label: 'Epic+',                     rarities: ['epic','legendary','unique','apex','omega'] },
  { key: 'legendary_and_up',label: 'Legendary+',                rarities: ['legendary','unique','apex','omega'] },
  { key: 'unique_and_up',   label: 'Unique / Apex / Omega',     rarities: ['unique','apex','omega'] },
  { key: 'common_rare_epic',label: 'Common / Rare / Epic',      rarities: ['common','rare','epic'] },
];

const LEVEL = 26;
const results: Record<string, unknown> = {};

for (const group of RARITY_GROUPS) {
  // Skip groups with fewer than 3 creatures in the data
  const pool = creatures.filter(c => group.rarities.includes(c.rarity));
  if (pool.length < 3) continue;

  process.stdout.write(`  Computing "${group.label}" (${pool.length} creatures)…`);
  const t = computeTierList(creatures, group.rarities, LEVEL);

  results[group.key] = {
    label: group.label,
    rarities: group.rarities,
    level: LEVEL,
    computedAt: new Date().toISOString(),
    durationMs: t.durationMs,
    entries: t.entries.slice(0, 25).map((e, rank) => ({
      uuid:    e.creature.uuid,
      name:    e.creature.name,
      rarity:  e.creature.rarity,
      tier:    rank < 5 ? 'S' : rank < 12 ? 'A' : rank < 19 ? 'B' : 'C',
      winRate: Math.round(e.winRate * 1000) / 1000,
      wins:    e.wins,
      losses:  e.losses,
      draws:   e.draws,
      poolSize: t.pool.length,
      beats:   e.beats,
      losesTo: e.losesTo,
    })),
  };

  process.stdout.write(` done (${t.durationMs}ms)\n`);
}

writeFileSync(outPath, JSON.stringify(results, null, 2));
console.log(`  Saved tier list to ${outPath}`);
