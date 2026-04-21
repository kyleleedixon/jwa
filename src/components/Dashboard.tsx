'use client';

import { useState, useMemo, useCallback } from 'react';
import { Creature } from '@/types/creature';
import { specialtyGroups } from '@/lib/labels';
import FilterPanel from './FilterPanel';
import CreatureCard from './CreatureCard';
import CreatureModal from './CreatureModal';

const PAGE_SIZE = 60;

interface Props {
  creatures: Creature[];
}

type Filters = Record<string, Set<string>>;

const EMPTY_FILTERS: Filters = {
  rarity: new Set(),
  class: new Set(),
  hybrid_type: new Set(),
  ability_group: new Set(),
};

export default function Dashboard({ creatures }: Props) {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selected, setSelected] = useState<Creature | null>(null);

  const handleToggle = useCallback((category: string, value: string) => {
    setFilters(prev => {
      const next = { ...prev, [category]: new Set(prev[category]) };
      if (next[category].has(value)) next[category].delete(value);
      else next[category].add(value);
      return next;
    });
    setPage(1);
  }, []);

  const handleClear = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  }, []);

  const filtered = useMemo(() => {
    return creatures.filter(c => {
      if (search) {
        const q = search.toLowerCase();
        if (!c.name.toLowerCase().includes(q)) return false;
      }
      if (filters.rarity.size > 0 && !filters.rarity.has(c.rarity)) return false;
      if (filters.class.size > 0 && !filters.class.has(c.class)) return false;
      if (filters.hybrid_type.size > 0 && !filters.hybrid_type.has(c.hybrid_type)) return false;
      if (filters.ability_group.size > 0 && !specialtyGroups(c.specialty).some(g => filters.ability_group.has(g))) return false;
      return true;
    });
  }, [creatures, search, filters]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = page < totalPages;

  const activeFilterCount = Object.values(filters).reduce((n, s) => n + s.size, 0);

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-white">
      {selected && <CreatureModal creature={selected} onClose={() => setSelected(null)} />}
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
          <span className="text-sm text-gray-400 ml-auto">
            {filtered.length} <span className="hidden sm:inline">of {creatures.length} </span>creatures
          </span>
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
