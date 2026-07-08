'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import Image from 'next/image';
import { Creature } from '@/types/creature';
import { specialtyGroups, GROUP_SPECIALTIES_BY_GROUP, RESISTANCE_KEYS } from '@/lib/labels';
import FilterPanel from './FilterPanel';
import CreatureCard from './CreatureCard';
import CreatureModal from './CreatureModal';
import HelpModal from './HelpModal';
import ChangelogModal from './ChangelogModal';
import WelcomeModal from './WelcomeModal';
import Tour, { type TourStep } from './Tour';
import { decodeShare, clearShareFromURL } from '@/lib/share';
import { hasSeenOnboarding, markOnboardingSeen } from '@/lib/onboarding';

const PAGE_SIZE = 60;

interface Props {
  creatures: Creature[];
  lastModifiedDate: string | null;
  version: string;
  changelog: { date: string; version: string; changes: unknown[] }[];
  user: { name: string | null; image: string | null };
  tierRanks: Record<string, { rank: number; tier: 'S' | 'A' | 'B' | 'C' | 'D' | null; winRate: number }>;
}

type Filters = Record<string, Set<string>>;

const EMPTY_FILTERS: Filters = {
  rarity: new Set(),
  class: new Set(),
  hybrid_type: new Set(),
  ability_group: new Set(),
  group_only: new Set(),
  resistance: new Set(),
};

type SortKey = 'name' | 'health' | 'damage' | 'speed' | 'armor' | 'crit' | 'critm' | 'rank';
type SortDir = 'asc' | 'desc';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'rank', label: 'Tier Rank' },
  { key: 'health', label: 'HP' },
  { key: 'damage', label: 'DMG' },
  { key: 'speed', label: 'SPD' },
  { key: 'armor', label: 'ARM' },
  { key: 'crit', label: 'CRIT' },
  { key: 'critm', label: 'CRIT DMG' },
];

export default function Dashboard({ creatures, lastModifiedDate, version, changelog, user, tierRanks }: Props) {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selected, setSelected] = useState<Creature | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  useEffect(() => {
    if (window.innerWidth >= 768) setSidebarOpen(true);
  }, []);

  // Open creature from share URL on mount, or trigger onboarding
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareParam = params.get('share');
    if (shareParam) {
      const state = decodeShare(shareParam);
      const creature = state ? creatures.find(c => c.uuid === state.c) : null;
      if (creature) {
        setSelected(creature);
        return;
      }
    }

    if (params.get('tour') === '1') {
      setTourOpen(true);
    } else if (params.get('welcome') === '1' || !hasSeenOnboarding()) {
      setWelcomeOpen(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const dismissWelcome = useCallback(() => {
    markOnboardingSeen();
    setWelcomeOpen(false);
  }, []);

  const startTour = useCallback(() => {
    markOnboardingSeen();
    setWelcomeOpen(false);
    setHelpOpen(false);
    setSelected(null);
    clearShareFromURL();
    setTourOpen(true);
  }, []);

  // Sample creature the tour opens — prefer a well-known legendary hybrid so
  // ingredient DNA columns are visible, fall back to any hybrid, then anything.
  const tourCreature = useMemo(() => {
    return creatures.find(c => c.uuid === 'indoraptor')
      ?? creatures.find(c => c.ingredients && c.ingredients.length > 0)
      ?? creatures[0];
  }, [creatures]);

  const tourSteps: TourStep[] = useMemo(() => [
    {
      target: 'search',
      title: 'Search',
      content: "Type any part of a creature's name to filter the grid instantly.",
    },
    {
      target: 'filters-button',
      title: 'Filters',
      content: 'Narrow the grid by rarity, class, hybrid type, resistance, or ability. Multiple selections within a group are OR — a blue badge shows how many filters are active.',
    },
    {
      target: 'sort-bar',
      title: 'Sort',
      content: 'Sort by Name, any stat, or Tier Rank (highest-ranked at the top of the grid). Click a chip again to reverse the direction.',
    },
    {
      target: 'card',
      title: 'Creature cards',
      content: 'Every card shows stats at level 26 plus a tier rank badge. Tap any card to open the full detail modal — that\u2019s where evolution costs, boosts, and share links live.',
    },
    {
      target: 'level-slider',
      title: 'Level slider',
      content: 'Drag to any level from the rarity minimum up to 35. Health and Damage scale with level; Speed, Armor, and Crit don\u2019t.',
      onEnter: () => { if (tourCreature) setSelected(tourCreature); },
      waitForTarget: true,
    },
    {
      target: 'from-lv',
      title: 'From Lv dropdown',
      content: 'Set your creature\u2019s current level here. All costs below become cumulative from this level — so a partially-levelled creature shows only what\u2019s left to reach the target.',
    },
    {
      target: 'evo-cost',
      title: 'Evolution cost',
      content: 'Coins and DNA needed to reach the target. Hybrids show ingredient DNA in Best / Avg / Worst columns based on your fuse luck (50 / 22 / 10 DNA per fuse).',
    },
    {
      target: 'max-level',
      title: 'Max level calculator',
      content: 'Type in the coins and DNA you actually have, and it shows the highest level you can reach right now — including all fuse costs for hybrids.',
    },
    {
      target: 'boosts',
      title: 'Boosts',
      content: 'One boost per level. Distribute across HP / DMG / SPD with the − and + buttons — the stats above update live.',
    },
    {
      target: 'share-button',
      title: 'Share',
      content: 'Copy a link that encodes this exact build (creature + level + boosts + enhancements + Omega points). Whoever opens the link sees exactly what you see.',
    },
    {
      target: 'nav-tier',
      title: 'Tier List',
      content: 'A full round-robin 1v1 simulation of every creature at level 26. Top 25 get S / A / B / C tiers; the rest show a numeric rank.',
      onEnter: () => { setSelected(null); clearShareFromURL(); },
    },
    {
      target: 'nav-battle',
      title: 'Battle Simulator',
      content: 'Pit any two creatures head-to-head with full boosts, enhancements, swap-in scenarios, and a turn-by-turn battle log.',
    },
    {
      target: 'help-button',
      title: 'How to use',
      content: 'Everything else — evolution cost math, tier list scoring, move accuracy details — is documented in the Help modal. You can re-launch this tour from there any time.',
    },
  ], [tourCreature]);

  const handleModalClose = useCallback(() => {
    setSelected(null);
    clearShareFromURL();
  }, []);

  const handleToggle = useCallback((category: string, value: string) => {
    setFilters(prev => {
      const next = { ...prev, [category]: new Set(prev[category]) };
      if (next[category].has(value)) {
        next[category].delete(value);
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
        setSortDir(key === 'name' || key === 'rank' ? 'asc' : 'desc');
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
      if (filters.resistance.size > 0) {
        const match = [...filters.resistance].some(key => {
          const idx = RESISTANCE_KEYS.indexOf(key as typeof RESISTANCE_KEYS[number]);
          return idx >= 0 && (c.resistance?.[idx] ?? 0) > 0;
        });
        if (!match) return false;
      }
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
      else if (sortKey === 'rank') {
        const ra = tierRanks[a.uuid]?.rank ?? Infinity;
        const rb = tierRanks[b.uuid]?.rank ?? Infinity;
        cmp = ra - rb;
      } else cmp = (a[sortKey] as number) - (b[sortKey] as number);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [creatures, search, filters, sortKey, sortDir, tierRanks]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = page < totalPages;

  const activeFilterCount = Object.values(filters).reduce((n, s) => n + s.size, 0);

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-white">
      {selected && (
        <CreatureModal
          creature={selected}
          creatures={creatures}
          onClose={handleModalClose}
          onNavigate={setSelected}
          tierRank={tierRanks[selected.uuid]}
        />
      )}
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} onStartTour={startTour} />}
      {welcomeOpen && <WelcomeModal onDismiss={dismissWelcome} onStartTour={startTour} />}
      {tourOpen && <Tour steps={tourSteps} onFinish={() => setTourOpen(false)} />}
      {changelogOpen && (
        <ChangelogModal
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          entries={changelog as any}
          onClose={() => setChangelogOpen(false)}
        />
      )}

      {/* mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* header */}
      <header className="border-b border-slate-700 bg-slate-900/95 sticky top-0 z-10 backdrop-blur">
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 flex flex-col gap-2">
          {/* top row: filters + title + nav + actions + user */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              data-tour="filters-button"
              onClick={() => setSidebarOpen(o => !o)}
              className={`flex items-center gap-1.5 shrink-0 rounded-lg transition-colors px-2 py-1.5 text-sm font-medium ${sidebarOpen ? 'bg-blue-600/20 text-blue-300' : 'bg-slate-700 hover:bg-slate-600 text-gray-300 hover:text-white'}`}
              aria-label="Toggle filters"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
              <span className="md:hidden">Filters</span>
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] font-bold leading-none">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <h1 className="font-bold text-base sm:text-lg text-white tracking-tight shrink-0">
              JWA <span className="text-blue-400">Dinodex</span>
            </h1>
            <nav className="hidden sm:flex items-center gap-1 shrink-0">
              <a data-tour="nav-tier" href="/tier-list" className="px-2.5 py-1.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-slate-700 transition-colors">Tier List</a>
              <a data-tour="nav-battle" href="/battle" className="px-2.5 py-1.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-slate-700 transition-colors">Battle Sim</a>
            </nav>
            {/* search: hidden on mobile (shown in second row), visible sm+ */}
            <div className="hidden sm:block flex-1 min-w-0">
              <input
                data-tour="search"
                type="text"
                placeholder="Search…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0">
              {changelog.length > 0 && (
                <button
                  onClick={() => setChangelogOpen(true)}
                  className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors text-gray-300 hover:text-white text-sm font-medium"
                  aria-label="What's new"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  <span className="hidden md:inline">What&rsquo;s new</span>
                </button>
              )}
              <button
                data-tour="help-button"
                onClick={() => setHelpOpen(true)}
                className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors text-gray-300 hover:text-white text-sm font-medium"
                aria-label="How to use"
              >
                <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px] font-bold leading-none shrink-0">?</span>
                <span className="hidden md:inline">How to use</span>
              </button>
              <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
                {user.image && (
                  <Image src={user.image} alt={user.name ?? 'User'} width={28} height={28} className="rounded-full shrink-0" unoptimized />
                )}
                {user.name && (
                  <span className="text-sm text-gray-300 hidden md:inline max-w-[120px] truncate">{user.name}</span>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="text-xs text-gray-500 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-400/10 whitespace-nowrap"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
          {/* search + nav: second row on mobile only */}
          <div className="sm:hidden flex items-center gap-2">
            <input
              data-tour="search"
              type="text"
              placeholder="Search…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="flex-1 min-w-0 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <a data-tour="nav-tier" href="/tier-list" className="shrink-0 px-2.5 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white bg-slate-700 hover:bg-slate-600 transition-colors whitespace-nowrap">Tier List</a>
            <a data-tour="nav-battle" href="/battle" className="shrink-0 px-2.5 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white bg-slate-700 hover:bg-slate-600 transition-colors whitespace-nowrap">Battle</a>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-screen-2xl mx-auto w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6 gap-4 lg:gap-6">
        {sidebarOpen && (
          <div className="fixed top-0 left-0 h-full z-30 md:relative md:z-auto md:top-auto md:h-auto">
            <div className="h-full md:h-auto bg-slate-900 md:bg-transparent border-r border-slate-700 md:border-0 p-4 md:p-0 pt-16 md:pt-0 overflow-y-auto w-72">
              <FilterPanel
                creatures={creatures}
                filters={filters}
                onToggle={handleToggle}
                onClear={handleClear}
                onClose={() => setSidebarOpen(false)}
              />
            </div>
          </div>
        )}

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
              <div data-tour="sort-bar" className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-xs text-gray-500 uppercase tracking-wider shrink-0">Sort:</span>
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => handleSort(opt.key)}
                    className={`text-xs px-2.5 py-1 rounded-md border transition-colors shrink-0 ${
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-3">
                {visible.map((c, i) => (
                  <div key={c.uuid} onClick={() => setSelected(c)} {...(i === 0 ? { 'data-tour': 'card' } : {})}>
                    <CreatureCard creature={c} tierRank={tierRanks[c.uuid]} />
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

      <footer className="border-t border-slate-800 px-4 py-2.5">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-4 text-xs text-gray-600">
          <span>v{version}</span>
          <div className="flex items-center gap-4">
            {lastModifiedDate && (
              <span>Paleo.gg data: <span className="text-gray-500">{lastModifiedDate}</span></span>
            )}
            <span><span className="text-gray-500">{filtered.length}</span> / {creatures.length} creatures</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
