'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { Creature, Move } from '@/types/creature';
import { RARITY_LABELS, CLASS_LABELS, HYBRID_TYPE_LABELS, RARITY_COLORS, RARITY_BG, CLASS_COLORS, label } from '@/lib/labels';

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

export default function CreatureModal({ creature, onClose }: Props) {
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

  const regularMoves = creature.moves.filter(m => m.type === 'regular');
  const specialMoves = creature.moves.filter(m => m.type !== 'regular');

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

        {/* stats */}
        <div className="grid grid-cols-5 gap-2 px-5 py-4 border-b border-slate-700/60">
          {[
            { label: 'Health', value: creature.health },
            { label: 'Damage', value: creature.damage },
            { label: 'Speed', value: creature.speed },
            { label: 'Armor', value: `${creature.armor}%` },
            { label: 'Crit', value: `${creature.crit}%` },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center bg-slate-800/60 rounded-lg py-2">
              <span className="text-[10px] uppercase tracking-wider text-gray-500">{s.label}</span>
              <span className="text-white font-semibold font-mono">{s.value}</span>
            </div>
          ))}
        </div>

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
                    {regularMoves.map(m => <MoveRow key={m.uuid} move={m} />)}
                  </div>
                </div>
              )}
              {specialMoves.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Special Abilities</h3>
                  <div className="flex flex-col gap-2">
                    {specialMoves.map(m => <MoveRow key={m.uuid} move={m} />)}
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

function MoveRow({ move }: { move: Move }) {
  const typeColor = MOVE_TYPE_COLORS[move.type] ?? 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  const attackEffect = move.effects.find(e => e.action === 'attack');

  return (
    <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40">
      <div className="flex items-start gap-2">
        {move.icon && (
          <img src={move.icon} alt="" width={28} height={28} className="rounded shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white text-sm">{move.name}</span>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${typeColor}`}>
              {MOVE_TYPE_LABELS[move.type] ?? move.type}
            </span>
            {move.priority > 0 && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border bg-yellow-500/20 text-yellow-300 border-yellow-500/30">Priority</span>
            )}
            {attackEffect && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border bg-red-500/20 text-red-300 border-red-500/30">
                {attackEffect.multiplier}x DMG
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
