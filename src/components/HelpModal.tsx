'use client';

import { useEffect } from 'react';

interface Props {
  onClose: () => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3 pb-1 border-b border-slate-700">
        {title}
      </h2>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="text-blue-400 font-medium text-sm shrink-0 w-32">{label}</span>
      <span className="text-gray-300 text-sm leading-relaxed">{children}</span>
    </div>
  );
}

function Badge({ children, color = 'slate' }: { children: React.ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    slate: 'bg-slate-700 text-gray-300',
    blue:  'bg-blue-600/30 text-blue-300',
    green: 'bg-green-500/20 text-green-300',
    yellow:'bg-yellow-500/20 text-yellow-300',
  };
  return (
    <span className={`inline-block text-[11px] font-medium px-1.5 py-0.5 rounded ${colors[color]}`}>
      {children}
    </span>
  );
}

export default function HelpModal({ onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

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
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 sticky top-0 bg-slate-900 z-10">
          <div>
            <h1 className="text-lg font-bold text-white">How to use the Dinodex</h1>
            <p className="text-xs text-gray-500 mt-0.5">All 498 creatures from Jurassic World Alive, v3.x data.</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-7">

          <Section title="Browsing & Search">
            <Item label="Search bar">
              Type any part of a creature&rsquo;s name to instantly filter the grid. The count in the top-right updates as you type.
            </Item>
            <Item label="Filter sidebar">
              Click the <Badge>☰</Badge> icon in the header to show or hide the filter panel. Active filter counts appear in blue next to each section heading.
            </Item>
            <Item label="Sorting">
              Use the sort bar above the grid to sort by <Badge>Name</Badge> <Badge>HP</Badge> <Badge>DMG</Badge> <Badge>SPD</Badge> <Badge>ARM</Badge> or <Badge>CRIT</Badge>. Clicking a stat defaults to highest-first; clicking it again flips direction. The active sort shows an arrow.
            </Item>
            <Item label="Load more">
              The grid shows 60 creatures at a time. Scroll to the bottom and click <Badge>Load more</Badge> to see the next batch.
            </Item>
          </Section>

          <Section title="Filters">
            <Item label="Rarity / Class">
              Check one or more options to show only creatures that match. Multiple selections within the same filter are treated as OR — checking Epic and Legendary shows both.
            </Item>
            <Item label="Hybrid Type">
              Filter by how a creature is obtained: Non-Hybrid, Standard Hybrid, Super Hybrid, Mega Hybrid, or Giga Hybrid.
            </Item>
            <Item label="Abilities">
              Each entry represents a category of what a creature can do (e.g. Healing, Stunning, Devour). Checking multiple abilities is OR — a creature only needs to match one. Click <Badge color="blue">Clear all</Badge> to reset.
            </Item>
            <Item label="Group toggle">
              After selecting an ability, a <Badge color="blue">Group</Badge> toggle appears next to it. Turning it on narrows results to creatures that specifically have the group-targeting version of that ability (e.g. group heals rather than single-target heals). Each ability has its toggle independently.
            </Item>
          </Section>

          <Section title="Creature Cards">
            <Item label="Stats preview">
              Each card shows HP, DMG, SPD, ARM, and CRIT at level 26 — the standard comparison level used across the JWA community.
            </Item>
            <Item label="Open detail">
              Click any card to open the full detail modal.
            </Item>
          </Section>

          <Section title="Creature Detail Modal">
            <Item label="Header badges">
              Shows rarity, class, hybrid type, and the game version when this creature&rsquo;s stats were last updated (e.g. <Badge>Updated v3.1</Badge>).
            </Item>
            <Item label="Level slider">
              Drag to any level between the creature&rsquo;s minimum (determined by rarity) and 35. <strong className="text-white">Health and Damage scale with level</strong> using the exact formula from the game. Speed, Armor, and Crit are unaffected by level.
            </Item>
            <Item label="Moves">
              Regular active moves are listed under <strong className="text-white">Moves</strong>; counters, swap-ins, on-escape, and reactive abilities are listed under <strong className="text-white">Special Abilities</strong>. Each move shows its type, cooldown, priority, damage multiplier, and all secondary effects with targets and durations.
            </Item>
            <Item label="Damage totals">
              Any move with an attack multiplier shows the actual damage value at your current level, e.g. <Badge color="yellow">1.5x DMG = 2325</Badge>. This updates live as you move the level slider.
            </Item>
            <Item label="Move icons">
              Where available, a small icon is shown to the left of each move name. Not all moves have icons in the source data.
            </Item>
          </Section>

          <Section title="Omega Creatures">
            <Item label="What are Omegas?">
              Omegas are a special rarity that replace the standard level-scaling formula with a point-based stat customisation system. Level 35 is still the cap.
            </Item>
            <Item label="Points">
              Every level-up grants <Badge color="green">7 points</Badge> to spend freely. The <strong className="text-white">Points</strong> panel below the stats shows each allocatable stat with a progress bar, <Badge>−</Badge> and <Badge>+</Badge> buttons, and a <em>pts / cap</em> readout. The header shows how many points are allocated vs. available.
            </Item>
            <Item label="Stat caps">
              Each stat has two limits: a <strong className="text-white">point cap</strong> (max points that stat can absorb) and an <strong className="text-white">absolute cap</strong> (the maximum value that stat can ever reach). The progress bar turns <span className="text-green-400">green</span> when a stat hits its effective ceiling. Not all stats can receive points — only stats with a positive point-to-stat conversion are shown.
            </Item>
            <Item label="Move unlock levels">
              Some Omega moves are locked until a certain level. Locked moves are shown at reduced opacity with an <Badge>Unlocks Lv X</Badge> badge. Slide the level up to unlock them.
            </Item>
          </Section>

          <Section title="Data & Updates">
            <Item label="Source">
              All data is scraped from <span className="text-blue-400">paleo.gg/games/jurassic-world-alive/dinodex</span>. The last scrape date is shown in the top-right of the dashboard header.
            </Item>
            <Item label="Stats baseline">
              All stats are stored at level 26 (the game&rsquo;s standard comparison level). The level slider scales from this baseline using the game&rsquo;s own multiplier table.
            </Item>
          </Section>

        </div>
      </div>
    </div>
  );
}
