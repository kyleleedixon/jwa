import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Creature } from '../src/types/creature';
import { computeTierList } from '../src/lib/tierlist';
import { RARITY_ORDER } from '../src/lib/labels';

const creaturesPath = join(__dirname, '../src/data/creatures.json');
const outPath       = join(__dirname, '../src/data/tierlist.json');

const creatures = JSON.parse(readFileSync(creaturesPath, 'utf8')) as Creature[];

const LEVEL = 26;

// Omegas use a separate point-based progression system — their stats at any fixed
// point allocation are not comparable to level 26 base stats for other rarities.
// They are ranked separately at their cap stats (fully upgraded).
const NON_OMEGA = RARITY_ORDER.filter(r => r !== 'omega');

process.stdout.write(`  Computing tier list (non-omega, ${creatures.filter(c => NON_OMEGA.includes(c.rarity)).length} creatures)…`);
const t = computeTierList(creatures, NON_OMEGA, LEVEL);

const result = {
  level: LEVEL,
  computedAt: new Date().toISOString(),
  durationMs: t.durationMs,
  entries: t.entries.slice(0, 25).map((e, rank) => ({
    uuid:     e.creature.uuid,
    name:     e.creature.name,
    rarity:   e.creature.rarity,
    image:    e.creature.image,
    tier:     rank < 5 ? 'S' : rank < 12 ? 'A' : rank < 19 ? 'B' : 'C',
    winRate:  Math.round(e.winRate * 1000) / 1000,
    wins:     e.wins,
    losses:   e.losses,
    draws:    e.draws,
    poolSize: t.pool.length,
    beats:    e.beats,
    losesTo:  e.losesTo,
  })),
};

process.stdout.write(` done (${t.durationMs}ms)\n`);

writeFileSync(outPath, JSON.stringify(result, null, 2));
console.log(`  Saved tier list to ${outPath}`);
