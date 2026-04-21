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
  label,
  specialtyGroups,
} from '@/lib/labels';

interface Props {
  creatures: Creature[];
  filters: Record<string, Set<string>>;
  onToggle: (category: string, value: string) => void;
  onClear: () => void;
}

export default function FilterPanel({ creatures, filters, onToggle, onClear }: Props) {
  const allClasses = Array.from(new Set(creatures.map(c => c.class))).sort((a, b) =>
    label(CLASS_LABELS, a).localeCompare(label(CLASS_LABELS, b))
  );

  const availableGroups = ABILITY_GROUP_ORDER.filter(g =>
    creatures.some(c => specialtyGroups(c.specialty).includes(g))
  );

  const allHybridTypes = HYBRID_TYPE_ORDER.filter(h =>
    creatures.some(c => c.hybrid_type === h)
  );

  const activeCount = Object.values(filters).reduce((n, s) => n + s.size, 0);

  return (
    <aside className="w-64 shrink-0 flex flex-col gap-4 overflow-y-auto pr-2">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold text-sm uppercase tracking-wider">Filters</h2>
        {activeCount > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Clear all ({activeCount})
          </button>
        )}
      </div>

      <FilterSection
        title="Rarity"
        options={RARITY_ORDER.filter(r => creatures.some(c => c.rarity === r))}
        selected={filters.rarity}
        getLabel={v => label(RARITY_LABELS, v)}
        onToggle={v => onToggle('rarity', v)}
      />

      <FilterSection
        title="Class"
        options={allClasses}
        selected={filters.class}
        getLabel={v => label(CLASS_LABELS, v)}
        onToggle={v => onToggle('class', v)}
      />

      <FilterSection
        title="Hybrid Type"
        options={allHybridTypes}
        selected={filters.hybrid_type}
        getLabel={v => label(HYBRID_TYPE_LABELS, v)}
        onToggle={v => onToggle('hybrid_type', v)}
      />

      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Abilities
          {filters.ability_group.size > 0 && (
            <span className="ml-1.5 text-blue-400">({filters.ability_group.size})</span>
          )}
        </h3>
        <div className="flex flex-col gap-1.5">
          {availableGroups.map(group => {
            const checked = filters.ability_group.has(group);
            const hasGroupVariant = (GROUP_SPECIALTIES_BY_GROUP[group] ?? []).some(s =>
              creatures.some(c => c.specialty.includes(s))
            );
            const groupOnly = filters.group_only.has(group);
            return (
              <div key={group} className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer group flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle('ability_group', group)}
                    className="w-3.5 h-3.5 rounded accent-blue-500 cursor-pointer shrink-0"
                  />
                  <span className={`text-xs transition-colors truncate ${checked ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                    {group}
                  </span>
                </label>
                {checked && hasGroupVariant && (
                  <button
                    onClick={() => onToggle('group_only', group)}
                    title="Group effects only"
                    className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                      groupOnly
                        ? 'bg-blue-600/40 border-blue-400/60 text-blue-200'
                        : 'border-slate-600 text-gray-500 hover:border-slate-400 hover:text-gray-300'
                    }`}
                  >
                    Group
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

interface SectionProps {
  title: string;
  options: string[];
  selected: Set<string>;
  getLabel: (v: string) => string;
  onToggle: (v: string) => void;
}

function FilterSection({ title, options, selected, getLabel, onToggle }: SectionProps) {
  if (options.length === 0) return null;
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        {title}
        {selected.size > 0 && (
          <span className="ml-1.5 text-blue-400">({selected.size})</span>
        )}
      </h3>
      <div className="flex flex-col gap-1.5">
        {options.map(opt => (
          <label key={opt} className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={selected.has(opt)}
              onChange={() => onToggle(opt)}
              className="w-3.5 h-3.5 rounded accent-blue-500 cursor-pointer"
            />
            <span className={`text-xs transition-colors ${selected.has(opt) ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
              {getLabel(opt)}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
