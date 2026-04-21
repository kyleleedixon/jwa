'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Creature, Move } from '@/types/creature';
import { RARITY_LABELS, CLASS_LABELS, HYBRID_TYPE_LABELS, RARITY_COLORS, RARITY_BG, CLASS_COLORS, label } from '@/lib/labels';

// Multiplier table from paleo.gg source: index = level - 1, value / 1e9 = multiplier
// Level 26 (index 25) = 1e9 = 1.0x, which is the reference level for all scraped stats
const LEVEL_MULT = [0x1199eba6,0x127bc022,0x1368430d,0x145f7443,0x15646119,0x16770992,0x1795e71c,0x18c406d8,0x1a0168ea,0x1b4e0d2d,0x1cab7a30,0x1e1b36cf,0x1f9bbc53,0x21301803,0x22d9d0b8,0x24975eb3,0x266bd0b6,0x28572603,0x2a5c6bdc,0x2c7a1bdb,0x2eb342d0,0x310967be,0x337c8aa4,0x360fb8a1,0x38c4786a,1e9,105e7,11025e5,0x44ff9315,0x48730efe,127e7,132e7,137e7,1425e6,15e8];
const MIN_LEVEL: Record<string, number> = { common: 1, rare: 6, epic: 11, legendary: 16, unique: 21, apex: 26, omega: 1 };
const MAX_LEVEL = 35;

function statAtLevel(base: number, level: number): number {
  return Math.floor(base * LEVEL_MULT[level - 1] / 1e9);
}

interface Props {
  creature: Creature;
  onClose: () => void;
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

function fmt(val: string, map: Record<string, string>) {
  return map[val] ?? val.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const POINTS_PER_LEVEL = 7;
const STAT_KEYS = ['health', 'damage', 'speed', 'armor', 'crit', 'critm'] as const;
const STAT_LABELS: Record<string, string> = { health: 'Health', damage: 'Damage', speed: 'Speed', armor: 'Armor', crit: 'Crit', critm: 'Crit Mult' };

export default function CreatureModal({ creature, onClose }: Props) {
  const isOmega = creature.rarity === 'omega';
  const minLevel = MIN_LEVEL[creature.rarity] ?? 1;
  const maxLevel = MAX_LEVEL;
  const defaultLevel = isOmega ? 1 : 26;

  const [level, setLevel] = useState(defaultLevel);
  const [omegaAlloc, setOmegaAlloc] = useState<Record<string, number>>({});

  // Reset when creature changes
  useEffect(() => {
    setLevel(defaultLevel);
    setOmegaAlloc({});
  }, [creature.uuid]); // eslint-disable-line react-hooks/exhaustive-deps

  // When level drops, trim allocations that exceed new budget
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

  // Stat calculations
  let displayHealth: number, displayDamage: number, displaySpeed: number,
      displayArmor: number | string, displayCrit: number | string;

  if (isOmega && creature.points) {
    const { delta, cap } = creature.points;
    const alloc = omegaAlloc;
    displayHealth = Math.min(creature.health + (alloc.health ?? 0) * delta.health, cap.health);
    displayDamage = Math.min(creature.damage + (alloc.damage ?? 0) * delta.damage, cap.damage);
    displaySpeed  = Math.min(creature.speed  + (alloc.speed  ?? 0) * delta.speed,  cap.speed);
    displayArmor  = `${Math.min(creature.armor + (alloc.armor ?? 0) * delta.armor, cap.armor)}%`;
    displayCrit   = `${Math.min(creature.crit  + (alloc.crit  ?? 0) * delta.crit,  cap.crit)}%`;
  } else {
    displayHealth = statAtLevel(creature.health, level);
    displayDamage = statAtLevel(creature.damage, level);
    displaySpeed  = creature.speed;
    displayArmor  = `${creature.armor}%`;
    displayCrit   = `${creature.crit}%`;
  }

  const availablePoints = isOmega ? (level - 1) * POINTS_PER_LEVEL : 0;
  const allocatedPoints = Object.values(omegaAlloc).reduce((a, b) => a + b, 0);
  const remainingPoints = availablePoints - allocatedPoints;

  const regularMoves = creature.moves.filter(m => m.type === 'regular');
  const specialMoves = creature.moves.filter(m => m.type !== 'regular');

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
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* header */}
        <div className={`flex gap-4 p-5 ${rarityBg} border-b border-slate-700`}>
          <div className="w-20 h-20 shrink-0 flex items-center justify-center rounded-xl bg-slate-800/60">
            <Image src={creature.image} alt={creature.name} width={72} height={72} className="object-contain" unoptimized />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white">{creature.name}</h2>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className={`text-xs font-medium px-2 py-0.5 rounded border ${rarityColor} ${rarityBg}`}>
                {label(RARITY_LABELS, creature.rarity)}
              </span>
              <span className={`text-xs font-medium ${classColor}`}>{label(CLASS_LABELS, creature.class)}</span>
              <span className="text-xs text-gray-500">{label(HYBRID_TYPE_LABELS, creature.hybrid_type)}</span>
              {creature.version && (
                <span className="text-xs font-medium px-2 py-0.5 rounded border border-slate-600 bg-slate-700/60 text-gray-300">
                  Updated {creature.version}
                </span>
              )}
            </div>
            {creature.description && (
              <p className="text-xs text-gray-400 mt-2 leading-relaxed line-clamp-2">{creature.description}</p>
            )}
          </div>
          <button onClick={onClose} className="shrink-0 text-gray-500 hover:text-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

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
        <div className="grid grid-cols-5 gap-2 px-5 py-3 border-b border-slate-700/60">
          {[
            { label: 'Health', value: displayHealth },
            { label: 'Damage', value: displayDamage },
            { label: 'Speed',  value: displaySpeed },
            { label: 'Armor',  value: displayArmor },
            { label: 'Crit',   value: displayCrit },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center bg-slate-800/60 rounded-lg py-2">
              <span className="text-[10px] uppercase tracking-wider text-gray-500">{s.label}</span>
              <span className="text-white font-semibold font-mono">{s.value}</span>
            </div>
          ))}
        </div>

        {/* omega points allocator */}
        {isOmega && creature.points && (
          <div className="px-5 py-4 border-b border-slate-700/60">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Points</h3>
              <span className={`text-xs font-mono font-semibold ${remainingPoints === 0 ? 'text-green-400' : remainingPoints > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                {allocatedPoints} / {availablePoints} allocated
                {remainingPoints > 0 && <span className="text-gray-500"> · {remainingPoints} remaining</span>}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {STAT_KEYS.filter(k => (creature.points!.delta[k] ?? 0) > 0).map(k => {
                const alloc = omegaAlloc[k] ?? 0;
                const pcap = creature.points!.pcap[k] ?? 0;
                const delta = creature.points!.delta[k] ?? 0;
                const cap = creature.points!.cap[k] ?? 0;
                const base = (creature as unknown as Record<string, number>)[k] ?? 0;
                const bonus = alloc * delta;
                const effectiveCap = Math.min(pcap, Math.floor((cap - base) / delta));
                const pct = pcap > 0 ? (alloc / pcap) * 100 : 0;
                return (
                  <div key={k} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-16 shrink-0">{STAT_LABELS[k]}</span>
                    <button
                      onClick={() => changeAlloc(k, -1)}
                      disabled={alloc === 0}
                      className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-bold shrink-0 flex items-center justify-center"
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
                      className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-bold shrink-0 flex items-center justify-center"
                    >+</button>
                    <span className="text-xs font-mono text-gray-300 w-16 text-right shrink-0">
                      {alloc}/{effectiveCap} pts
                    </span>
                    <span className={`text-xs font-mono w-16 text-right shrink-0 ${bonus > 0 ? 'text-green-400' : 'text-gray-600'}`}>
                      {bonus > 0 ? `+${bonus}` : '—'}
                    </span>
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
                      <MoveRow key={m.uuid} move={m} baseDamage={displayDamage as number}
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
                      <MoveRow key={m.uuid} move={m} baseDamage={displayDamage as number}
                        unlockLevel={creature.move_unlock_lv?.[m.uuid]}
                        currentLevel={level} />
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

function MoveRow({ move, baseDamage, unlockLevel, currentLevel }: {
  move: Move; baseDamage: number; unlockLevel?: number; currentLevel?: number;
}) {
  const locked = unlockLevel != null && currentLevel != null && currentLevel < unlockLevel;
  const typeColor = MOVE_TYPE_COLORS[move.type] ?? 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  const attackEffect = move.effects.find(e => e.action === 'attack');
  const totalDamage = attackEffect?.multiplier != null ? Math.round(baseDamage * attackEffect.multiplier) : null;

  return (
    <div className={`bg-slate-800/60 rounded-xl p-3 border border-slate-700/40 transition-opacity ${locked ? 'opacity-40' : ''}`}>
      <div className="flex items-start gap-2">
        {move.icon && (
          <div className="w-9 h-9 shrink-0 rounded-lg bg-slate-700/60 flex items-center justify-center overflow-hidden">
            <Image src={move.icon} alt="" width={32} height={32} className="object-contain" unoptimized />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white text-sm">{move.name.startsWith('ra__') ? 'Enhancement' : move.name}</span>
                    {locked && (
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
            {move.cooldown > 0 && <span>CD {move.cooldown}</span>}
            {move.delay === 0 && move.cooldown === 0 && <span className="text-green-600">No cooldown</span>}
          </div>

          <div className="flex flex-wrap gap-1.5 mt-2">
            {move.effects.filter(e => e.action !== 'attack').map((e, i) => (
              <span key={i} className="text-[11px] bg-slate-700/60 text-gray-300 px-2 py-0.5 rounded">
                {fmt(e.action, ACTION_LABELS)}
                {e.target && e.target !== 'self' && (
                  <span className="text-gray-500"> → {fmt(e.target, TARGET_LABELS)}</span>
                )}
                {e.multiplier != null && e.action !== 'attack' && (
                  <span className="text-gray-400"> {(e.multiplier * 100).toFixed(0)}%</span>
                )}
                {e.duration && (
                  <span className="text-gray-500"> {e.duration[0]}t</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
