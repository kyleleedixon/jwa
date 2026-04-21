'use client';

import Image from 'next/image';
import { Creature } from '@/types/creature';
import {
  RARITY_COLORS,
  RARITY_BG,
  RARITY_LABELS,
  CLASS_LABELS,
  CLASS_COLORS,
  label,
  RARITY_ORDER,
} from '@/lib/labels';

interface Props {
  creature: Creature;
}

export default function CreatureCard({ creature }: Props) {
  const rarityColor = RARITY_COLORS[creature.rarity] ?? 'text-gray-300 border-gray-500';
  const rarityBg = RARITY_BG[creature.rarity] ?? 'bg-gray-500/20';
  const classColor = CLASS_COLORS[creature.class] ?? 'text-gray-400';

  return (
    <div
      className={`relative flex flex-col rounded-xl border ${rarityColor} bg-slate-800/80 hover:bg-slate-700/80 transition-colors overflow-hidden group cursor-pointer`}
    >
      {/* image */}
      <div className={`relative w-full aspect-square ${rarityBg} flex items-center justify-center p-3`}>
        <Image
          src={creature.image}
          alt={creature.name}
          width={120}
          height={120}
          className="object-contain drop-shadow-lg group-hover:scale-105 transition-transform"
          onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
          unoptimized
        />
      </div>

      {/* info */}
      <div className="flex flex-col gap-1 p-3">
        <p className="font-semibold text-white text-sm leading-tight line-clamp-2">{creature.name}</p>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded border ${rarityColor} ${rarityBg}`}>
            {label(RARITY_LABELS, creature.rarity)}
          </span>
          <span className={`text-xs font-medium ${classColor}`}>
            {label(CLASS_LABELS, creature.class)}
          </span>
        </div>

        {/* stats row */}
        <div className="grid grid-cols-3 gap-x-2 gap-y-0.5 mt-1 text-xs text-gray-400">
          <StatCell label="HP" value={creature.health} />
          <StatCell label="DMG" value={creature.damage} />
          <StatCell label="SPD" value={creature.speed} />
          <StatCell label="ARM" value={`${creature.armor}%`} />
          <StatCell label="CRIT" value={`${creature.crit}%`} />
        </div>
      </div>

      {/* rarity glow on top edge */}
      <div
        className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-xl ${rarityGlow(creature.rarity)}`}
      />
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col">
      <span className="text-gray-500 text-[10px] uppercase tracking-wide">{label}</span>
      <span className="text-gray-200 font-mono">{value}</span>
    </div>
  );
}

function rarityGlow(rarity: string): string {
  const map: Record<string, string> = {
    common: 'bg-gray-400',
    rare: 'bg-blue-400',
    epic: 'bg-yellow-400',
    legendary: 'bg-red-400',
    unique: 'bg-green-400',
    apex: 'bg-gray-900',
    omega: 'bg-gray-400',
  };
  return map[rarity] ?? 'bg-gray-400';
}
