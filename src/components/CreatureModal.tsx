'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Creature, Enhancement, Move } from '@/types/creature';
import { RARITY_LABELS, CLASS_LABELS, HYBRID_TYPE_LABELS, RARITY_COLORS, RARITY_BG, CLASS_COLORS, label } from '@/lib/labels';

// Multiplier table from paleo.gg source: index = level - 1, value / 1e9 = multiplier
// Level 26 (index 25) = 1e9 = 1.0x, which is the reference level for all scraped stats
const LEVEL_MULT = [0x1199eba6,0x127bc022,0x1368430d,0x145f7443,0x15646119,0x16770992,0x1795e71c,0x18c406d8,0x1a0168ea,0x1b4e0d2d,0x1cab7a30,0x1e1b36cf,0x1f9bbc53,0x21301803,0x22d9d0b8,0x24975eb3,0x266bd0b6,0x28572603,0x2a5c6bdc,0x2c7a1bdb,0x2eb342d0,0x310967be,0x337c8aa4,0x360fb8a1,0x38c4786a,1e9,105e7,11025e5,0x44ff9315,0x48730efe,127e7,132e7,137e7,1425e6,15e8];
const MIN_LEVEL: Record<string, number> = { common: 1, rare: 6, epic: 11, legendary: 16, unique: 21, apex: 26, omega: 1 };
const MAX_LEVEL = 35;

function statAtLevel(base: number, level: number): number {
  return Math.floor(base * LEVEL_MULT[level - 1] / 1e9);
}

import { RESISTANCE_KEYS, RESISTANCE_LABELS, SPAWN_LABELS, label as labelFn } from '@/lib/labels';
import { evolutionCost, maxLevelWithResources, RARITY_LEVEL_RANGE } from '@/lib/evolution';
import { readShareFromURL, writeShareToURL } from '@/lib/share';

interface Props {
  creature: Creature;
  creatures: Creature[];
  onClose: () => void;
  onNavigate: (c: Creature) => void;
}

const MOVE_TYPE_LABELS: Record<string, string> = {
  regular: 'Active',
  counter: 'Counter',
  swap_in: 'Swap-In',
  on_escape: 'On Escape',
  reactive: 'Reactive',
};

const MOVE_TYPE_COLORS: Record<string, string> = {
  regular: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  counter: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  swap_in: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  on_escape: 'bg-red-500/20 text-red-300 border-red-500/30',
  reactive: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
};

const ACTION_LABELS: Record<string, string> = {
  attack: 'Attack',
  bypass_armor: 'Bypass Armor',
  bypass_dodge: 'Bypass Dodge',
  bypass_alert: 'Bypass Alert',
  bypass_absorb: 'Bypass Absorb',
  remove_shield: 'Remove Shield',
  remove_taunt: 'Remove Taunt',
  remove_vulner: 'Cleanse Vulnerability',
  remove_dot: 'Cleanse DoT',
  remove_stun: 'Cleanse Stun',
  damage_increase: 'Damage Boost',
  damage_decrease: 'Distraction',
  speed_increase: 'Speed Boost',
  speed_decrease: 'Speed Decrease',
  crit_increase: 'Crit Boost',
  crit_decrease: 'Crit Decrease',
  armor_increase: 'Armor Boost',
  armor_decrease: 'Armor Decrease',
  shield: 'Shield',
  dodge: 'Dodge',
  cloak: 'Cloak',
  stun: 'Stun',
  heal: 'Heal',
  heal_pct: 'Heal %',
  rend: 'Rend',
  dot: 'Damage Over Time',
  vulnerability: 'Vulnerability',
  taunt: 'Taunt',
  swap_prevent: 'Swap Prevention',
  revenge: 'Revenge',
  group_attack: 'Group Attack',
};

const TARGET_LABELS: Record<string, string> = {
  self: 'Self',
  lowest_hp: 'Lowest HP',
  highest_hp: 'Highest HP',
  highest_dmg: 'Highest DMG',
  all_opponents: 'All Opponents',
  all_allies: 'All Allies',
  team: 'Team',
  random: 'Random',
};

function resistanceColor(val: number): string {
  if (val >= 100) return 'bg-green-500/25 text-green-300 border-green-400/50';
  if (val >= 67)  return 'bg-lime-500/25 text-lime-300 border-lime-400/50';
  if (val >= 34)  return 'bg-yellow-500/25 text-yellow-300 border-yellow-400/50';
  return 'bg-red-500/25 text-red-300 border-red-400/50';
}

function fmt(val: string, map: Record<string, string>) {
  return map[val] ?? val.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function enhLabel(enh: Enhancement): string {
  const { type, value } = enh.rwd;
  if (type === 'health') return `+${value} HP`;
  if (type === 'damage') return `+${value} DMG`;
  if (type === 'speed') return `+${value} SPD`;
  if (type === 'boost_max') return `+${value} Boost`;
  if (type === 'moves_reactive') return 'New Move';
  return type;
}

function enhTitle(enh: Enhancement): string {
  const parts = enh.req.map(([res, amt]) => `${amt.toLocaleString()} ${res.replace(/_/g, ' ')}`);
  return parts.join(', ');
}

const POINTS_PER_LEVEL = 7;
const STAT_KEYS = ['health', 'damage', 'speed', 'armor', 'crit', 'critm'] as const;
const STAT_LABELS: Record<string, string> = { health: 'Health', damage: 'Damage', speed: 'Speed', armor: 'Armor', crit: 'Crit', critm: 'Crit Mult' };

const MAX_BOOSTS = 35;
const MAX_BOOSTS_PER_STAT = 20;
type BoostStat = 'health' | 'damage' | 'speed';
const BOOST_STATS: { key: BoostStat; label: string }[] = [
  { key: 'health', label: 'Health' },
  { key: 'damage', label: 'Damage' },
  { key: 'speed',  label: 'Speed'  },
];

export default function CreatureModal({ creature, creatures, onClose, onNavigate }: Props) {
  const creatureByUuid = useMemo(() => new Map(creatures.map(c => [c.uuid, c])), [creatures]);

  const isOmega = creature.rarity === 'omega';
  const minLevel = MIN_LEVEL[creature.rarity] ?? 1;
  const maxLevel = MAX_LEVEL;
  const defaultLevel = isOmega ? 1 : 26;

  const [level, setLevel] = useState(defaultLevel);
  const [fromLevel, setFromLevel] = useState(minLevel);
  const [omegaAlloc, setOmegaAlloc] = useState<Record<string, number>>({});
  const [boosts, setBoosts] = useState<Record<BoostStat, number>>({ health: 0, damage: 0, speed: 0 });
  const [enhancementLevel, setEnhancementLevel] = useState(0);
  const [copied, setCopied] = useState(false);
  const [calcCoins, setCalcCoins] = useState('');
  const [calcDna, setCalcDna] = useState('');
  const [calcIngDna, setCalcIngDna] = useState<string[]>(() => creature.ingredients.map(() => ''));

  // Reset when creature changes, restoring share state if URL matches
  useEffect(() => {
    const share = readShareFromURL();
    if (share && share.c === creature.uuid) {
      setLevel(Math.max(minLevel, Math.min(maxLevel, share.lv)));
      setBoosts({ health: share.b[0] ?? 0, damage: share.b[1] ?? 0, speed: share.b[2] ?? 0 });
      setEnhancementLevel(share.enh ?? 0);
      setOmegaAlloc(share.p ?? {});
    } else {
      setLevel(defaultLevel);
      setOmegaAlloc({});
      setBoosts({ health: 0, damage: 0, speed: 0 });
      setEnhancementLevel(0);
    }
    setFromLevel(minLevel);
    setCalcCoins('');
    setCalcDna('');
    setCalcIngDna(creature.ingredients.map(() => ''));
  }, [creature.uuid]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleShare = useCallback(() => {
    writeShareToURL({ c: creature.uuid, lv: level, b: [boosts.health, boosts.damage, boosts.speed], enh: enhancementLevel, p: omegaAlloc });
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [creature.uuid, level, boosts, enhancementLevel, omegaAlloc]);

  // When level drops, trim boosts that exceed new budget
  useEffect(() => {
    const budget = level;
    const total = boosts.health + boosts.damage + boosts.speed;
    if (total <= budget) return;
    let excess = total - budget;
    const next = { ...boosts };
    for (const k of (['speed', 'damage', 'health'] as BoostStat[])) {
      if (excess <= 0) break;
      const cut = Math.min(next[k], excess);
      next[k] -= cut;
      excess -= cut;
    }
    setBoosts(next);
  }, [level]); // eslint-disable-line react-hooks/exhaustive-deps

  // When level drops, trim omega allocations that exceed new budget
  useEffect(() => {
    if (!isOmega || !creature.points) return;
    const budget = (level - 1) * POINTS_PER_LEVEL;
    const total = Object.values(omegaAlloc).reduce((a, b) => a + b, 0);
    if (total <= budget) return;
    // trim proportionally by zeroing from the end
    let excess = total - budget;
    const next = { ...omegaAlloc };
    for (const k of [...STAT_KEYS].reverse()) {
      if (excess <= 0) break;
      const cut = Math.min(next[k] ?? 0, excess);
      next[k] = (next[k] ?? 0) - cut;
      excess -= cut;
    }
    setOmegaAlloc(next);
  }, [level]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const rarityColor = RARITY_COLORS[creature.rarity] ?? 'text-gray-300 border-gray-500';
  const rarityBg = RARITY_BG[creature.rarity] ?? 'bg-gray-500/20';
  const classColor = CLASS_COLORS[creature.class] ?? 'text-gray-400';

  // Enhancement metadata (boost_max and reactive unlock don't affect stat display)
  const activeEnhancements = (creature.enhancements ?? []).slice(0, enhancementLevel);
  const enhBoostMax = activeEnhancements.filter(e => e.rwd.type === 'boost_max').reduce((s, e) => s + (e.rwd.value as number), 0);
  const unlockedReactiveUuid = activeEnhancements.find(e => e.rwd.type === 'moves_reactive')?.rwd.value as string | undefined;

  const availableBoosts = level + enhBoostMax;
  const totalBoosts = boosts.health + boosts.damage + boosts.speed;
  const remainingBoosts = availableBoosts - totalBoosts;

  // Stat calculations — correct order: level → boosts (multiplicative) → enhancements (multiplicative)
  let displayHealth: number, displayDamage: number, displaySpeed: number,
      displayArmor: string, displayCrit: string, displayCritm: string;

  if (isOmega && creature.points) {
    const { delta, cap } = creature.points;
    const alloc = omegaAlloc;
    displayHealth = Math.min(creature.health + (alloc.health ?? 0) * delta.health, cap.health);
    displayDamage = Math.min(creature.damage + (alloc.damage ?? 0) * delta.damage, cap.damage);
    displaySpeed  = Math.min(creature.speed  + (alloc.speed  ?? 0) * delta.speed,  cap.speed);
    displayArmor  = `${Math.min(creature.armor + (alloc.armor ?? 0) * delta.armor, cap.armor)}%`;
    displayCrit   = `${Math.min(creature.crit  + (alloc.crit  ?? 0) * delta.crit,  cap.crit)}%`;
    displayCritm  = `${Math.min(creature.critm + (alloc.critm ?? 0) * (delta.critm ?? 0), cap.critm ?? creature.critm)}%`;
  } else {
    displayHealth = statAtLevel(creature.health, level);
    displayDamage = statAtLevel(creature.damage, level);
    displaySpeed  = creature.speed;
    displayArmor  = `${creature.armor}%`;
    displayCrit   = `${creature.crit}%`;
    displayCritm  = `${creature.critm}%`;
  }

  // Step 2: boosts — multiplicative for health/damage, additive for speed
  displayHealth = (displayHealth as number) * (1 + 0.025 * boosts.health);
  displayDamage = (displayDamage as number) * (1 + 0.025 * boosts.damage);
  displaySpeed  = (displaySpeed  as number) + boosts.speed * 2;

  // Step 3: enhancements — multiplicative (value=110 means ×1.1), speed is additive
  for (const enh of activeEnhancements) {
    if (enh.rwd.type === 'health') displayHealth = (displayHealth as number) * (enh.rwd.value as number) / 100;
    else if (enh.rwd.type === 'damage') displayDamage = (displayDamage as number) * (enh.rwd.value as number) / 100;
    else if (enh.rwd.type === 'speed') displaySpeed = (displaySpeed as number) + (enh.rwd.value as number);
  }

  displayHealth = Math.floor(displayHealth as number);
  displayDamage = Math.floor(displayDamage as number);
  displaySpeed  = Math.floor(displaySpeed  as number);

  const availablePoints = isOmega ? (level - 1) * POINTS_PER_LEVEL : 0;
  const allocatedPoints = Object.values(omegaAlloc).reduce((a, b) => a + b, 0);
  const remainingPoints = availablePoints - allocatedPoints;

  const regularMoves = creature.moves.filter(m => m.type === 'regular');
  const specialMoves = creature.moves.filter(m => m.type !== 'regular');
  const enhanceMoveUuid = creature.enhancements?.find(e => e.rwd.type === 'moves_reactive')?.rwd.value as string | undefined;

  function changeBoost(stat: BoostStat, delta: number) {
    setBoosts(prev => {
      const cur = prev[stat];
      const used = prev.health + prev.damage + prev.speed;
      const next = delta > 0
        ? Math.min(cur + delta, MAX_BOOSTS_PER_STAT, cur + (availableBoosts - used))
        : Math.max(0, cur + delta);
      return { ...prev, [stat]: next };
    });
  }

  const ingRarities = creature.ingredients.map(uuid => creatureByUuid.get(uuid)?.rarity ?? '').filter(Boolean);
  const allIngRarities = creature.ingredients.map(uuid => creatureByUuid.get(uuid)?.rarity ?? '');
  const isHybrid = creature.ingredients.length > 0;

  const evoFrom = Math.min(fromLevel, level - 1);

  const calcResults = useMemo(() => {
    const coins  = parseInt(calcCoins, 10);
    const ownDna = parseInt(calcDna,   10);
    const ingArr = calcIngDna.map(s => parseInt(s, 10) || 0);
    if (!calcCoins && !calcDna && calcIngDna.every(s => !s)) return null;
    const safeCoins  = isNaN(coins)  ? 0 : coins;
    const safeOwnDna = isNaN(ownDna) ? 0 : ownDna;
    if (!isHybrid) {
      const r = maxLevelWithResources(creature.rarity, fromLevel, safeCoins, safeOwnDna, [], []);
      return { best: r, avg: r, worst: r };
    }
    return {
      best:  maxLevelWithResources(creature.rarity, fromLevel, safeCoins, 0, allIngRarities, ingArr, 50),
      avg:   maxLevelWithResources(creature.rarity, fromLevel, safeCoins, 0, allIngRarities, ingArr, 22),
      worst: maxLevelWithResources(creature.rarity, fromLevel, safeCoins, 0, allIngRarities, ingArr, 10),
    };
  }, [calcCoins, calcDna, calcIngDna, creature.rarity, fromLevel, isHybrid]); // eslint-disable-line react-hooks/exhaustive-deps
  const evoCostAvg   = evolutionCost(creature.rarity, evoFrom, level, ingRarities, 22);
  const evoCostBest  = evolutionCost(creature.rarity, evoFrom, level, ingRarities, 50);
  const evoCostWorst = evolutionCost(creature.rarity, evoFrom, level, ingRarities, 10);

  function changeAlloc(stat: string, delta: number) {
    setOmegaAlloc(prev => {
      const pcap = creature.points!.pcap[stat] ?? 0;
      const cur = prev[stat] ?? 0;
      const next = Math.max(0, Math.min(cur + delta, pcap, cur + remainingPoints + (delta < 0 ? 0 : remainingPoints)));
      // clamp to remaining budget
      const actualNext = delta > 0 ? Math.min(cur + delta, pcap, cur + remainingPoints) : Math.max(0, cur + delta);
      return { ...prev, [stat]: actualNext };
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto bg-slate-900 sm:rounded-2xl border-0 sm:border border-slate-700 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* header */}
        <div className={`flex gap-4 p-5 ${rarityBg} border-b border-slate-700`}>
          <div className="w-20 h-20 shrink-0 flex items-center justify-center rounded-xl bg-slate-800/60">
            <Image src={creature.image} alt={creature.name} width={72} height={72} className="object-contain" unoptimized />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white leading-tight">{creature.name}</h2>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className={`text-xs font-medium px-2 py-0.5 rounded border ${rarityColor} ${rarityBg}`}>
                {label(RARITY_LABELS, creature.rarity)}
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://cdn.paleo.gg/games/jwa/images/class/${creature.class}.png`} alt={label(CLASS_LABELS, creature.class)} title={label(CLASS_LABELS, creature.class)} className="w-5 h-5 object-contain" />
              <span className="text-xs text-gray-500">{label(HYBRID_TYPE_LABELS, creature.hybrid_type)}</span>
              {creature.version && (
                <span className="text-xs font-medium px-2 py-0.5 rounded border border-slate-600 bg-slate-700/60 text-gray-300">
                  Updated {creature.version}
                </span>
              )}
            </div>
            {creature.description && (
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">{creature.description}</p>
            )}
          </div>
          <div className="flex items-start gap-2 shrink-0">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors text-gray-300 hover:text-white text-xs font-medium"
              title="Copy shareable link"
            >
              {copied ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                  <span>Share</span>
                </>
              )}
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors pt-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* bio info — ingredients, hybrids, resistances, spawn */}
        {(creature.ingredients.length > 0 || creature.hybrids.length > 0 || creature.resistance?.some(v => v > 0) || creature.dna_source.length > 0) && (
          <div className="px-5 py-3 border-b border-slate-700/60">
            <div className="grid gap-y-3" style={{ gridTemplateColumns: '5.5rem 1fr' }}>

              {creature.ingredients.length > 0 && (
                <>
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider pt-1">Made From</span>
                  <div className="flex items-start gap-4 flex-wrap">
                    <div className="flex flex-wrap gap-1.5">
                      {creature.ingredients.map(uuid => {
                        const c = creatureByUuid.get(uuid);
                        if (!c) return <span key={uuid} className="text-xs text-gray-500">{uuid.replace(/_/g, ' ')}</span>;
                        return (
                          <button key={uuid} onClick={() => onNavigate(c)} className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 transition-colors">
                            <div className="relative w-5 h-5 shrink-0">
                              <Image src={c.image} alt={c.name} fill className="object-contain" unoptimized />
                            </div>
                            <span className="text-xs text-gray-300">{c.name}</span>
                          </button>
                        );
                      })}
                    </div>
                    {creature.hybrids.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider shrink-0 pt-1">Used In</span>
                        <div className="flex flex-wrap gap-1.5">
                          {creature.hybrids.map(uuid => {
                            const c = creatureByUuid.get(uuid);
                            if (!c) return <span key={uuid} className="text-xs text-gray-500">{uuid.replace(/_/g, ' ')}</span>;
                            return (
                              <button key={uuid} onClick={() => onNavigate(c)} className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 transition-colors">
                                <div className="relative w-5 h-5 shrink-0">
                                  <Image src={c.image} alt={c.name} fill className="object-contain" unoptimized />
                                </div>
                                <span className="text-xs text-gray-300">{c.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {creature.ingredients.length === 0 && creature.hybrids.length > 0 && (
                <>
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider pt-1">Used In</span>
                  <div className="flex flex-wrap gap-1.5">
                    {creature.hybrids.map(uuid => {
                      const c = creatureByUuid.get(uuid);
                      if (!c) return <span key={uuid} className="text-xs text-gray-500">{uuid.replace(/_/g, ' ')}</span>;
                      return (
                        <button key={uuid} onClick={() => onNavigate(c)} className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 transition-colors">
                          <div className="relative w-5 h-5 shrink-0">
                            <Image src={c.image} alt={c.name} fill className="object-contain" unoptimized />
                          </div>
                          <span className="text-xs text-gray-300">{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {creature.resistance?.some(v => v > 0) && (
                <>
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider pt-0.5">Resistances</span>
                  <div className="flex flex-wrap gap-1">
                    {RESISTANCE_KEYS.map((key, idx) => {
                      const val = creature.resistance[idx] ?? 0;
                      if (val === 0) return null;
                      return (
                        <span key={key} className={`text-xs font-medium px-2 py-0.5 rounded border ${resistanceColor(val)}`}>
                          {RESISTANCE_LABELS[key]} {val}%
                        </span>
                      );
                    })}
                  </div>
                </>
              )}

              {creature.dna_source.length > 0 && (
                <>
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider pt-0.5">Spawn</span>
                  <div className="flex flex-wrap gap-1">
                    {creature.dna_source.map(loc => (
                      <span key={loc} className="text-xs font-medium px-2 py-0.5 rounded border bg-slate-700/60 text-gray-300 border-slate-600">
                        {labelFn(SPAWN_LABELS, loc)}
                      </span>
                    ))}
                  </div>
                </>
              )}

            </div>
          </div>
        )}

        {/* level slider */}
        <div className="flex items-center gap-3 px-5 pt-4 pb-2">
          <span className="text-xs text-gray-500 shrink-0">Level</span>
          <input
            type="range"
            min={minLevel}
            max={maxLevel}
            value={level}
            onChange={e => setLevel(Number(e.target.value))}
            className="flex-1 accent-blue-500 cursor-pointer"
          />
          <span className="text-sm font-bold text-white w-10 text-right shrink-0">{level} / {maxLevel}</span>
        </div>

        {/* stats */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 px-5 py-3 border-b border-slate-700/60">
          {[
            { label: 'Health',   value: displayHealth },
            { label: 'Damage',   value: displayDamage },
            { label: 'Speed',    value: displaySpeed },
            { label: 'Armor',    value: displayArmor },
            { label: 'Crit',     value: displayCrit },
            { label: 'Crit DMG', value: displayCritm },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center bg-slate-800/60 rounded-lg py-2">
              <span className="text-[10px] uppercase tracking-wider text-gray-500">{s.label}</span>
              <span className="text-white font-semibold tabular-nums text-sm">{s.value}</span>
            </div>
          ))}
        </div>

        {/* evolution cost */}
        {level > minLevel && (
          <div className="px-5 py-4 border-b border-slate-700/60">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Evolution Cost <span className="text-gray-600 normal-case font-normal">(Lv {evoFrom} → {level})</span>
              </h3>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-500">From</span>
                <select
                  value={evoFrom}
                  onChange={e => setFromLevel(Number(e.target.value))}
                  className="text-xs bg-slate-700 border border-slate-600 rounded px-1.5 py-0.5 text-gray-300 outline-none focus:border-blue-500"
                >
                  {Array.from({ length: level - minLevel }, (_, i) => minLevel + i).map(lv => (
                    <option key={lv} value={lv}>Lv {lv}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-2 text-xs">
              {/* coins row */}
              <div className="flex items-center gap-2">
                <span className="text-gray-400 w-28 shrink-0">Coins</span>
                <span className="text-yellow-300 font-semibold tabular-nums">{evoCostAvg.coins.toLocaleString()}</span>
              </div>
              {/* DNA rows */}
              {evoCostAvg.ingredients.length === 0 ? (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 w-28 shrink-0">DNA</span>
                  <span className="text-blue-300 font-semibold tabular-nums">{evoCostAvg.dna.toLocaleString()}</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-wider pb-1">
                    <span className="w-28 shrink-0">Ingredient DNA</span>
                    <span className="w-20 text-right">Best (50)</span>
                    <span className="w-20 text-right">Avg (22)</span>
                    <span className="w-20 text-right">Worst (10)</span>
                  </div>
                  {creature.ingredients.map((uuid, i) => {
                    const ing = creatureByUuid.get(uuid);
                    const worst = evoCostWorst!.ingredients[i]?.dna ?? 0;
                    const avg   = evoCostAvg!.ingredients[i]?.dna ?? 0;
                    const best  = evoCostBest!.ingredients[i]?.dna ?? 0;
                    return (
                      <div key={uuid} className="flex items-center gap-2">
                        <span className="text-gray-400 w-28 shrink-0">{ing?.name ?? uuid}</span>
                        <span className="text-green-400 tabular-nums w-20 text-right">{best.toLocaleString()}</span>
                        <span className="text-blue-300 font-semibold tabular-nums w-20 text-right">{avg.toLocaleString()}</span>
                        <span className="text-red-400 tabular-nums w-20 text-right">{worst.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        )}

        {/* max level calculator */}
        <div className="px-5 py-4 border-b border-slate-700/60">
          <div className="flex items-baseline gap-2 mb-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Max Level Calculator</h3>
            <span className="text-[10px] text-gray-500">
              starting from <span className="text-blue-400 font-semibold">Lv {fromLevel}</span> — matches the <span className="text-gray-300">From</span> dropdown above
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <div className={`grid gap-2 ${isHybrid ? 'grid-cols-1' : 'grid-cols-2'}`}>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Coins</label>
                <input
                  type="text" inputMode="numeric"
                  value={calcCoins}
                  onChange={e => setCalcCoins(e.target.value.replace(/\D/g, ''))}
                  placeholder="0"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-yellow-200 placeholder-gray-600 focus:outline-none focus:border-yellow-500 transition-colors"
                />
              </div>
              {!isHybrid && (
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">DNA</label>
                  <input
                    type="text" inputMode="numeric"
                    value={calcDna}
                    onChange={e => setCalcDna(e.target.value.replace(/\D/g, ''))}
                    placeholder="0"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-blue-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              )}
            </div>
            {isHybrid && (
              <div className="grid grid-cols-2 gap-2">
                {creature.ingredients.map((uuid, i) => {
                  const ing = creatureByUuid.get(uuid);
                  return (
                    <div key={uuid}>
                      <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1 truncate">
                        {ing?.name ?? uuid} DNA
                      </label>
                      <input
                        type="text" inputMode="numeric"
                        value={calcIngDna[i] ?? ''}
                        onChange={e => setCalcIngDna(prev => {
                          const next = [...prev];
                          next[i] = e.target.value.replace(/\D/g, '');
                          return next;
                        })}
                        placeholder="0"
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-blue-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  );
                })}
              </div>
            )}
            {calcResults && (
              calcResults.avg.maxLevel > fromLevel ? (
                <div className="mt-1 flex flex-col gap-1 text-xs">
                  {isHybrid && (
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-wider pb-1">
                      <span className="flex-1">Max level from Lv {fromLevel}</span>
                      <span className="w-20 text-right text-green-400">Best (50)</span>
                      <span className="w-20 text-right text-blue-300">Avg (22)</span>
                      <span className="w-20 text-right text-red-400">Worst (10)</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-gray-400">Level</span>
                    {isHybrid ? (
                      <>
                        <span className="w-20 text-right text-green-400 font-semibold tabular-nums">{calcResults.best.maxLevel}</span>
                        <span className="w-20 text-right text-blue-300 font-semibold tabular-nums">{calcResults.avg.maxLevel}</span>
                        <span className="w-20 text-right text-red-400 font-semibold tabular-nums">{calcResults.worst.maxLevel}</span>
                      </>
                    ) : (
                      <span className="text-green-300 font-semibold tabular-nums">
                        {calcResults.avg.maxLevel}
                        <span className="text-xs font-normal text-gray-500 ml-1">(+{calcResults.avg.maxLevel - fromLevel} from Lv {fromLevel})</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-gray-400">Coins left</span>
                    {isHybrid ? (
                      <>
                        <span className="w-20 text-right text-yellow-300 tabular-nums">{calcResults.best.remainingCoins.toLocaleString()}</span>
                        <span className="w-20 text-right text-yellow-300 tabular-nums">{calcResults.avg.remainingCoins.toLocaleString()}</span>
                        <span className="w-20 text-right text-yellow-300 tabular-nums">{calcResults.worst.remainingCoins.toLocaleString()}</span>
                      </>
                    ) : (
                      <span className="text-yellow-300 tabular-nums">{calcResults.avg.remainingCoins.toLocaleString()}</span>
                    )}
                  </div>
                  {!isHybrid && (
                    <div className="flex items-center gap-2">
                      <span className="flex-1 text-gray-400">DNA left</span>
                      <span className="text-blue-300 tabular-nums">{calcResults.avg.remainingDna.toLocaleString()}</span>
                    </div>
                  )}
                  {isHybrid && creature.ingredients.map((uuid, i) => {
                    const ing = creatureByUuid.get(uuid);
                    return (
                      <div key={uuid} className="flex items-center gap-2">
                        <span className="flex-1 text-gray-400 truncate">{ing?.name ?? uuid} left</span>
                        <span className="w-20 text-right text-blue-300 tabular-nums">{(calcResults.best.remainingIngDna[i] ?? 0).toLocaleString()}</span>
                        <span className="w-20 text-right text-blue-300 tabular-nums">{(calcResults.avg.remainingIngDna[i] ?? 0).toLocaleString()}</span>
                        <span className="w-20 text-right text-blue-300 tabular-nums">{(calcResults.worst.remainingIngDna[i] ?? 0).toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-1 rounded-lg p-3 bg-slate-800/60 border border-slate-700 text-xs text-gray-400">
                  Not enough resources to level up from {fromLevel}.
                </div>
              )
            )}
          </div>
        </div>

        {/* boosts allocator */}
        <div className="px-5 py-4 border-b border-slate-700/60">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Boosts</h3>
            <span className={`text-xs font-mono font-semibold ${remainingBoosts === 0 ? 'text-green-400' : 'text-blue-400'}`}>
              {totalBoosts} / {availableBoosts} used
              {remainingBoosts > 0 && <span className="text-gray-500 font-normal"> · {remainingBoosts} left</span>}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {BOOST_STATS.map(({ key, label: bLabel }) => {
              const cur = boosts[key];
              const pct = (cur / MAX_BOOSTS_PER_STAT) * 100;
              const atStatCap = cur >= MAX_BOOSTS_PER_STAT;
              return (
                <div key={key} className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 w-20 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`https://cdn.paleo.gg/games/jwa/images/stat/${key}.png`} alt="" className="w-4 h-4 object-contain shrink-0" />
                    <span className="text-xs text-gray-400">{bLabel}</span>
                  </div>
                  <button
                    onClick={() => changeBoost(key, -1)}
                    disabled={cur === 0}
                    className="w-7 h-7 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold shrink-0 flex items-center justify-center"
                  >−</button>
                  <div className="flex-1 min-w-0">
                    <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${atStatCap ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <button
                    onClick={() => changeBoost(key, 1)}
                    disabled={remainingBoosts === 0 || atStatCap}
                    className="w-7 h-7 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold shrink-0 flex items-center justify-center"
                  >+</button>
                  <span className="text-xs font-mono text-gray-400 w-20 text-right shrink-0">
                    {cur} / {MAX_BOOSTS_PER_STAT}
                    {cur > 0 && (
                      <span className="ml-1 text-amber-400">
                        {key === 'speed' ? `+${cur * 2}` : `+${(cur * 2.5).toFixed(0)}%`}
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* enhancements */}
        {creature.enhancements && creature.enhancements.length > 0 && (
          <div className="px-5 py-4 border-b border-slate-700/60">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Enhancements</h3>
              <span className={`text-xs font-semibold ${enhancementLevel === creature.enhancements.length ? 'text-green-400' : 'text-blue-400'}`}>
                {enhancementLevel} / {creature.enhancements.length}
              </span>
            </div>
            <div className="flex gap-2">
              {creature.enhancements.map((enh, i) => {
                const active = i < enhancementLevel;
                const label = enhLabel(enh);
                return (
                  <button
                    key={i}
                    onClick={() => setEnhancementLevel(enhancementLevel === i + 1 ? i : i + 1)}
                    className={`flex-1 flex flex-col items-center gap-1 rounded-lg border py-2 px-1 transition-colors ${
                      active
                        ? 'bg-violet-600/20 border-violet-500/50 text-violet-300'
                        : 'bg-slate-800/60 border-slate-700 text-gray-500 hover:border-slate-500 hover:text-gray-300'
                    }`}
                    title={enhTitle(enh)}
                  >
                    <span className="text-[10px] text-gray-500 font-medium">E{i + 1}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* omega points allocator */}
        {isOmega && creature.points && (
          <div className="px-5 py-4 border-b border-slate-700/60">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Points</h3>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono font-semibold ${remainingPoints === 0 ? 'text-green-400' : remainingPoints > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {allocatedPoints} / {availablePoints}
                  {remainingPoints > 0 && <span className="text-gray-500 font-normal"> · {remainingPoints} left</span>}
                </span>
                <button
                  onClick={() => {
                    const eligible = STAT_KEYS.filter(k => {
                      const d = creature.points!.delta[k] ?? 0;
                      const p = creature.points!.pcap[k] ?? 0;
                      const base = (creature as unknown as Record<string, number>)[k] ?? 0;
                      const cap = creature.points!.cap[k] ?? 0;
                      return d > 0 && p > 0 && Math.min(p, Math.floor((cap - base) / d)) > 0;
                    });
                    if (eligible.length === 0) return;
                    const next: Record<string, number> = {};
                    let remaining = availablePoints;
                    // distribute evenly, respecting effective caps
                    const caps = Object.fromEntries(eligible.map(k => {
                      const d = creature.points!.delta[k] ?? 1;
                      const p = creature.points!.pcap[k] ?? 0;
                      const base = (creature as unknown as Record<string, number>)[k] ?? 0;
                      const cap = creature.points!.cap[k] ?? 0;
                      return [k, Math.min(p, Math.floor((cap - base) / d))];
                    }));
                    let keys = [...eligible];
                    while (remaining > 0 && keys.length > 0) {
                      const share = Math.floor(remaining / keys.length);
                      const leftover = remaining % keys.length;
                      keys.forEach((k, i) => {
                        const add = Math.min((share + (i < leftover ? 1 : 0)), caps[k] - (next[k] ?? 0));
                        next[k] = (next[k] ?? 0) + add;
                        remaining -= add;
                      });
                      keys = keys.filter(k => (next[k] ?? 0) < caps[k]);
                    }
                    setOmegaAlloc(next);
                  }}
                  className="text-[10px] font-medium px-2 py-0.5 rounded bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 transition-colors"
                >Preset</button>
                <button
                  onClick={() => setOmegaAlloc({})}
                  className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-700 text-gray-400 hover:bg-slate-600 hover:text-white transition-colors"
                >Reset</button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {STAT_KEYS.filter(k => {
                const d = creature.points!.delta[k] ?? 0;
                if (d <= 0) return false;
                const p = creature.points!.pcap[k] ?? 0;
                if (p <= 0) return false;
                const base = (creature as unknown as Record<string, number>)[k] ?? 0;
                const cap = creature.points!.cap[k] ?? 0;
                return Math.min(p, Math.floor((cap - base) / d)) > 0;
              }).map(k => {
                const alloc = omegaAlloc[k] ?? 0;
                const pcap = creature.points!.pcap[k] ?? 0;
                const delta = creature.points!.delta[k] ?? 0;
                const cap = creature.points!.cap[k] ?? 0;
                const base = (creature as unknown as Record<string, number>)[k] ?? 0;
                const bonus = alloc * delta;
                const effectiveCap = Math.min(pcap, Math.floor((cap - base) / delta));
                const pct = effectiveCap > 0 ? (alloc / effectiveCap) * 100 : 0;
                return (
                  <div key={k} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 w-20 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`https://cdn.paleo.gg/games/jwa/images/stat/${k}.png`} alt="" className="w-4 h-4 object-contain shrink-0" />
                        <span className="text-xs text-gray-400">{STAT_LABELS[k]}</span>
                      </div>
                      <button
                        onClick={() => changeAlloc(k, -10)}
                        disabled={alloc === 0}
                        className="w-8 h-7 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-white text-[10px] font-bold shrink-0 flex items-center justify-center"
                      >−10</button>
                      <button
                        onClick={() => changeAlloc(k, -1)}
                        disabled={alloc === 0}
                        className="w-7 h-7 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold shrink-0 flex items-center justify-center"
                      >−</button>
                      <div className="flex-1 min-w-0">
                        <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${alloc >= effectiveCap ? 'bg-green-500' : 'bg-blue-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => changeAlloc(k, 1)}
                        disabled={alloc >= effectiveCap || remainingPoints === 0}
                        className="w-7 h-7 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold shrink-0 flex items-center justify-center"
                      >+</button>
                      <button
                        onClick={() => changeAlloc(k, 10)}
                        disabled={alloc >= effectiveCap || remainingPoints === 0}
                        className="w-8 h-7 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-white text-[10px] font-bold shrink-0 flex items-center justify-center"
                      >+10</button>
                      <span className="text-xs font-mono text-gray-400 w-20 text-right shrink-0">
                        {alloc}/{effectiveCap}
                        <span className={`ml-1 ${bonus > 0 ? 'text-green-400' : 'text-gray-600'}`}>
                          {bonus > 0 ? `+${bonus}` : ''}
                        </span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* moves */}
        <div className="p-5 flex flex-col gap-3">
          {creature.moves.length === 0 ? (
            <p className="text-gray-500 text-sm">No move data available.</p>
          ) : (
            <>
              {regularMoves.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Moves</h3>
                  <div className="flex flex-col gap-2">
                    {regularMoves.map(m => (
                      <MoveRow key={m.uuid} move={m} baseDamage={displayDamage as number} baseHealth={displayHealth as number}
                        unlockLevel={creature.move_unlock_lv?.[m.uuid]}
                        currentLevel={level} />
                    ))}
                  </div>
                </div>
              )}
              {specialMoves.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Special Abilities</h3>
                  <div className="flex flex-col gap-2">
                    {specialMoves.map(m => (
                      <MoveRow key={m.uuid} move={m} baseDamage={displayDamage as number} baseHealth={displayHealth as number}
                        unlockLevel={creature.move_unlock_lv?.[m.uuid]}
                        currentLevel={level}
                        enhanceLocked={enhanceMoveUuid === m.uuid && !unlockedReactiveUuid} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MoveRow({ move, baseDamage, baseHealth, unlockLevel, currentLevel, enhanceLocked }: {
  move: Move; baseDamage: number; baseHealth: number; unlockLevel?: number; currentLevel?: number; enhanceLocked?: boolean;
}) {
  const [iconFailed, setIconFailed] = useState(false);
  const locked = (unlockLevel != null && currentLevel != null && currentLevel < unlockLevel) || enhanceLocked;
  const typeColor = MOVE_TYPE_COLORS[move.type] ?? 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  const attackEffect = move.effects.find(e => e.action === 'attack');
  const totalDamage = attackEffect?.multiplier != null ? Math.round(baseDamage * attackEffect.multiplier) : null;

  return (
    <div className={`bg-slate-800/60 rounded-xl p-3 border border-slate-700/40 transition-opacity ${locked ? 'opacity-40' : ''}`}>
      <div className="flex items-start gap-2">
        {move.icon && !iconFailed && (
          <div className="relative w-9 h-9 shrink-0 rounded-lg bg-slate-700/60 flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={move.icon} alt="" width={32} height={32} className="object-contain" onError={() => setIconFailed(true)} />
            {move.priority > 0 && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="https://cdn.paleo.gg/games/jwa/images/move/indicator/priority.png" alt="Priority" className="absolute top-0 right-0 w-3.5 h-3.5 object-contain" />
            )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white text-sm">{move.name.startsWith('ra__') ? 'Enhancement' : move.name}</span>
                    {enhanceLocked && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border bg-violet-600/20 text-violet-400 border-violet-500/40">
                        Enhancement locked
                      </span>
                    )}
                    {locked && !enhanceLocked && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border bg-slate-600/40 text-gray-400 border-slate-500/40">
                        Unlocks Lv {unlockLevel}
                      </span>
                    )}
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${typeColor}`}>
              {MOVE_TYPE_LABELS[move.type] ?? move.type}
            </span>
            {move.priority > 0 && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border bg-yellow-500/20 text-yellow-300 border-yellow-500/30">Priority</span>
            )}
            {attackEffect && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border bg-red-500/20 text-red-300 border-red-500/30">
                {attackEffect.multiplier}x DMG{totalDamage != null && ` = ${totalDamage}`}
              </span>
            )}
          </div>

          <div className="flex gap-3 mt-1 text-xs text-gray-500">
            {move.delay > 0 && <span>Delay {move.delay}</span>}
            {move.cooldown > 0 && <span>Cooldown {move.cooldown}</span>}
            {move.delay === 0 && move.cooldown === 0 && <span className="text-green-600">No cooldown</span>}
          </div>

          <div className="flex flex-wrap gap-1.5 mt-2">
            {move.effects.filter(e => e.action !== 'attack').map((e, i) => {
              const isHeal = e.action === 'heal' || e.action === 'heal_pct';
              const isDevour = e.action === 'hot_contextual';
              const healAmt = isHeal && e.multiplier != null
                ? Math.round(baseHealth * e.multiplier)
                : isDevour && e.multiplier != null
                  ? Math.round((totalDamage ?? baseDamage) * e.multiplier)
                  : null;
              return (
                <span key={i} className="text-[11px] bg-slate-700/60 text-gray-300 px-2 py-0.5 rounded">
                  {fmt(e.action, ACTION_LABELS)}
                  {e.target && e.target !== 'self' && (
                    <span className="text-gray-500"> → {fmt(e.target, TARGET_LABELS)}</span>
                  )}
                  {e.multiplier != null && (
                    <span className="text-gray-400"> {(e.multiplier * 100).toFixed(0)}%</span>
                  )}
                  {healAmt != null && (
                    <span className="text-green-400"> (+{healAmt} HP{isDevour && e.duration ? '/turn' : ''})</span>
                  )}
                  {e.duration && (
                    <span className="text-gray-500"> {e.duration[0]}t</span>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
