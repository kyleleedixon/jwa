'use client';

import { useState, useMemo, useCallback } from 'react';
import { Creature } from '@/types/creature';
import { specialtyGroups, GROUP_SPECIALTIES_BY_GROUP } from '@/lib/labels';
import FilterPanel from './FilterPanel';
import CreatureCard from './CreatureCard';
import CreatureModal from './CreatureModal';
import HelpModal from './HelpModal';

const PAGE_SIZE = 60;

interface Props {
  creatures: Creature[];
  lastModifiedDate: string | null;
}

type Filters = Record<string, Set<string>>;

const EMPTY_FILTERS: Filters = {
  rarity: new Set(),
  class: new Set(),
  hybrid_type: new Set(),
  ability_group: new Set(),
  group_only: new Set(),
};

type SortKey = 'name' | 'health' | 'damage' | 'speed' | 'armor' | 'crit';
type SortDir = 'asc' | 'desc';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'health', label: 'HP' },
  { key: 'damage', label: 'DMG' },
  { key: 'speed', label: 'SPD' },
  { key: 'armor', label: 'ARM' },
  { key: 'crit', label: 'CRIT' },
];

export default function Dashboard({ creatures, lastModifiedDate }: Props) {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selected, setSelected] = useState<Creature | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleToggle = useCallback((category: string, value: string) => {
    setFilters(prev => {
      const next = { ...prev, [category]: new Set(prev[category]) };
      if (next[category].has(value)) {
        next[category].delete(value);
        // clear group_only when ability is unchecked
        if (category === 'ability_group') {
          next.group_only = new Set(prev.group_only);
          next.group_only.delete(value);
        }
      } else {
        next[category].add(value);
      }
      return next;
    });
    setPage(1);
  }, []);

  const handleClear = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  }, []);

  const handleSort = useCallback((key: SortKey) => {
    setSortKey(prev => {
      if (prev === key) {
        setSortDir(d => d === 'asc' ? 'desc' : 'asc');
      } else {
        setSortDir(key === 'name' ? 'asc' : 'desc');
      }
      return key;
    });
    setPage(1);
  }, []);

  const filtered = useMemo(() => {
    const list = creatures.filter(c => {
      if (search) {
        const q = search.toLowerCase();
        if (!c.name.toLowerCase().includes(q)) return false;
      }
      if (filters.rarity.size > 0 && !filters.rarity.has(c.rarity)) return false;
      if (filters.class.size > 0 && !filters.class.has(c.class)) return false;
      if (filters.hybrid_type.size > 0 && !filters.hybrid_type.has(c.hybrid_type)) return false;
      if (filters.ability_group.size > 0) {
        const cGroups = specialtyGroups(c.specialty);
        const match = [...filters.ability_group].some(g => {
          if (!cGroups.includes(g)) return false;
          if (filters.group_only.has(g)) {
            const groupKeys = GROUP_SPECIALTIES_BY_GROUP[g] ?? [];
            return c.specialty.some(s => groupKeys.includes(s));
          }
          return true;
        });
        if (!match) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
      else cmp = (a[sortKey] as number) - (b[sortKey] as number);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [creatures, search, filters, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = page < totalPages;

  const activeFilterCount = Object.values(filters).reduce((n, s) => n + s.size, 0);

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-white">
      {selected && <CreatureModal creature={selected} onClose={() => setSelected(null)} />}
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
      {/* header */}
      <header className="border-b border-slate-700 bg-slate-900/95 sticky top-0 z-10 backdrop-blur">
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors text-gray-400 hover:text-white"
            aria-label="Toggle filters"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <h1 className="font-bold text-lg text-white tracking-tight">
            JWA <span className="text-blue-400">Dinodex</span>
          </h1>
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search creatures…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <button
            onClick={() => setHelpOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors text-gray-300 hover:text-white text-sm font-medium"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            How to use
          </button>
          <div className="flex items-center gap-3 ml-auto">
            {lastModifiedDate && (
              <span className="text-xs text-gray-500 hidden sm:inline">
                Data updated <span className="text-gray-300">{lastModifiedDate}</span>
              </span>
            )}
            <span className="text-sm text-gray-400">
              {filtered.length} <span className="hidden sm:inline">of {creatures.length} </span>creatures
            </span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-screen-2xl mx-auto w-full px-4 py-6 gap-6">
        {/* sidebar */}
        {sidebarOpen && (
          <FilterPanel
            creatures={creatures}
            filters={filters}
            onToggle={handleToggle}
            onClear={handleClear}
          />
        )}

        {/* grid */}
        <main className="flex-1 min-w-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-4 opacity-40">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <p className="text-lg">No creatures match your filters.</p>
              {activeFilterCount > 0 && (
                <button onClick={handleClear} className="mt-2 text-sm text-blue-400 hover:text-blue-300">
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Sort:</span>
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => handleSort(opt.key)}
                    className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                      sortKey === opt.key
                        ? 'bg-blue-600/30 border-blue-500/60 text-blue-300'
                        : 'border-slate-700 text-gray-400 hover:border-slate-500 hover:text-white'
                    }`}
                  >
                    {opt.label}
                    {sortKey === opt.key && (
                      <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {visible.map(c => (
                  <div key={c.uuid} onClick={() => setSelected(c)}>
                    <CreatureCard creature={c} />
                  </div>
                ))}
              </div>

              {hasMore && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={() => setPage(p => p + 1)}
                    className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
                  >
                    Load more ({filtered.length - visible.length} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
