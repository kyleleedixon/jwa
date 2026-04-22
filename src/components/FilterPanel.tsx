'use client';

import { Creature } from '@/types/creature';
import {
  RARITY_LABELS,
  RARITY_ORDER,
  CLASS_LABELS,
  HYBRID_TYPE_LABELS,
  HYBRID_TYPE_ORDER,
  ABILITY_GROUP_ORDER,
  GROUP_SPECIALTIES_BY_GROUP,
  RESISTANCE_KEYS,
  RESISTANCE_LABELS,
  label,
  specialtyGroups,
} from '@/lib/labels';

interface Props {
  creatures: Creature[];
  filters: Record<string, Set<string>>;
  onToggle: (category: string, value: string) => void;
  onClear: () => void;
  onClose: () => void;
}

export default function FilterPanel({ creatures, filters, onToggle, onClear, onClose }: Props) {
  const allClasses = Array.from(new Set(creatures.map(c => c.class))).sort((a, b) =>
    label(CLASS_LABELS, a).localeCompare(label(CLASS_LABELS, b))
  );
  const availableGroups = ABILITY_GROUP_ORDER.filter(g =>
    creatures.some(c => specialtyGroups(c.specialty).includes(g))
  );
  const allHybridTypes = HYBRID_TYPE_ORDER.filter(h =>
    creatures.some(c => c.hybrid_type === h)
  );
  const availableResistances = RESISTANCE_KEYS.filter(key => {
    const idx = RESISTANCE_KEYS.indexOf(key);
    return creatures.some(c => (c.resistance?.[idx] ?? 0) > 0);
  });
  const activeCount = Object.values(filters).reduce((n, s) => n + s.size, 0);

  return (
    <aside className="w-72 shrink-0 flex flex-col overflow-y-auto">
      {/* panel header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold text-sm uppercase tracking-wider">Filters</h2>
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <button onClick={onClear} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
              Clear all ({activeCount})
            </button>
          )}
          <button onClick={onClose} className="md:hidden text-gray-400 hover:text-white transition-colors" aria-label="Close filters">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-col divide-y divide-slate-700/50">
        <FilterSection
          title="Rarity"
          activeCount={filters.rarity.size}
          options={RARITY_ORDER.filter(r => creatures.some(c => c.rarity === r))}
          selected={filters.rarity}
          getLabel={v => label(RARITY_LABELS, v)}
          onToggle={v => onToggle('rarity', v)}
        />

        <FilterSection
          title="Class"
          activeCount={filters.class.size}
          options={allClasses}
          selected={filters.class}
          getLabel={v => label(CLASS_LABELS, v)}
          onToggle={v => onToggle('class', v)}
        />

        <FilterSection
          title="Hybrid Type"
          activeCount={filters.hybrid_type.size}
          options={allHybridTypes}
          selected={filters.hybrid_type}
          getLabel={v => label(HYBRID_TYPE_LABELS, v)}
          onToggle={v => onToggle('hybrid_type', v)}
        />

        <FilterSection
          title="Resistances"
          activeCount={filters.resistance.size}
          options={availableResistances}
          selected={filters.resistance}
          getLabel={v => RESISTANCE_LABELS[v as typeof RESISTANCE_KEYS[number]] ?? v}
          onToggle={v => onToggle('resistance', v)}
        />

        {/* Abilities — separate because of the Group toggle */}
        <div className="py-4">
          <SectionHeader title="Abilities" activeCount={filters.ability_group.size} />
          <div className="flex flex-col gap-0.5 mt-2">
            {availableGroups.map(group => {
              const checked = filters.ability_group.has(group);
              const hasGroupVariant = (GROUP_SPECIALTIES_BY_GROUP[group] ?? []).some(s =>
                creatures.some(c => c.specialty.includes(s))
              );
              const groupOnly = filters.group_only.has(group);
              return (
                <div
                  key={group}
                  className={`flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors ${checked ? 'bg-blue-600/10' : 'hover:bg-slate-800/50'}`}
                >
                  <input
                    id={`ability-${group}`}
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle('ability_group', group)}
                    className="w-3.5 h-3.5 rounded accent-blue-500 cursor-pointer shrink-0"
                  />
                  <label
                    htmlFor={`ability-${group}`}
                    className={`text-xs cursor-pointer flex-1 min-w-0 truncate transition-colors ${checked ? 'text-white' : 'text-gray-400'}`}
                  >
                    {group}
                  </label>
                  {hasGroupVariant && (
                    <button
                      onClick={() => {
                        if (!checked) onToggle('ability_group', group);
                        onToggle('group_only', group);
                      }}
                      title="Group effects only"
                      className="shrink-0 flex items-center gap-1 ml-auto"
                    >
                      <span className={`text-[10px] transition-colors ${groupOnly ? 'text-blue-300' : 'text-gray-500'}`}>
                        Group
                      </span>
                      <span className={`relative inline-flex h-4 w-7 rounded-full border transition-colors duration-200 ${
                        groupOnly ? 'bg-blue-500 border-blue-400' : 'bg-slate-700 border-slate-600'
                      }`}>
                        <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform duration-200 ${
                          groupOnly ? 'translate-x-3.5' : 'translate-x-0.5'
                        }`} />
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}

function SectionHeader({ title, activeCount }: { title: string; activeCount: number }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</h3>
      {activeCount > 0 && (
        <span className="text-[10px] font-semibold bg-blue-600/30 text-blue-300 px-1.5 py-0.5 rounded-full">
          {activeCount}
        </span>
      )}
    </div>
  );
}

interface SectionProps {
  title: string;
  activeCount: number;
  options: string[];
  selected: Set<string>;
  getLabel: (v: string) => string;
  onToggle: (v: string) => void;
}

function FilterSection({ title, activeCount, options, selected, getLabel, onToggle }: SectionProps) {
  if (options.length === 0) return null;
  return (
    <div className="py-4">
      <SectionHeader title={title} activeCount={activeCount} />
      <div className="flex flex-col gap-0.5 mt-2">
        {options.map(opt => (
          <label
            key={opt}
            className={`flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer transition-colors ${
              selected.has(opt) ? 'bg-blue-600/10' : 'hover:bg-slate-800/50'
            }`}
          >
            <input
              type="checkbox"
              checked={selected.has(opt)}
              onChange={() => onToggle(opt)}
              className="w-3.5 h-3.5 rounded accent-blue-500 cursor-pointer shrink-0"
            />
            <span className={`text-xs transition-colors ${selected.has(opt) ? 'text-white' : 'text-gray-400'}`}>
              {getLabel(opt)}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
