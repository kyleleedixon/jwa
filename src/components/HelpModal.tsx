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
    slate:  'bg-slate-700 text-gray-300',
    blue:   'bg-blue-600/30 text-blue-300',
    green:  'bg-green-500/20 text-green-300',
    yellow: 'bg-yellow-500/20 text-yellow-300',
    violet: 'bg-violet-600/20 text-violet-300',
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto bg-slate-900 rounded-t-2xl sm:rounded-2xl border-0 sm:border border-slate-700 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 sticky top-0 bg-slate-900 z-10">
          <div>
            <h1 className="text-lg font-bold text-white">How to use the Dinodex</h1>
            <p className="text-xs text-gray-500 mt-0.5">All 498 creatures from Jurassic World Alive. Data auto-syncs daily from paleo.gg.</p>
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
              Type any part of a creature&rsquo;s name to instantly filter the grid. The count top-right updates as you type.
            </Item>
            <Item label="Filter sidebar">
              Click the <Badge>Filters</Badge> button in the header to show or hide the filter panel. A blue number badge shows how many filters are active. On desktop the panel is open by default; on mobile it slides in as a drawer.
            </Item>
            <Item label="Sorting">
              Use the sort bar above the grid to sort by <Badge>Name</Badge> <Badge>HP</Badge> <Badge>DMG</Badge> <Badge>SPD</Badge> <Badge>ARM</Badge> or <Badge>CRIT</Badge>. Clicking a stat defaults to highest-first; clicking again reverses. The active sort shows an arrow.
            </Item>
            <Item label="Load more">
              The grid shows 60 creatures at a time. Scroll to the bottom and click <Badge>Load more</Badge> to see the next batch.
            </Item>
          </Section>

          <Section title="Filters">
            <Item label="Rarity / Class">
              Check one or more options to show only matching creatures. Multiple selections within a section are OR — checking Epic and Legendary shows both.
            </Item>
            <Item label="Hybrid Type">
              Filter by how a creature is obtained: Non-Hybrid, Standard Hybrid, Super Hybrid, Mega Hybrid, or Giga Hybrid.
            </Item>
            <Item label="Resistances">
              Filter by status effect resistance — only creatures with at least partial resistance to the selected effect are shown.
            </Item>
            <Item label="Abilities">
              Each entry is a category of what a creature can do (e.g. Healing, Stunning, Evasion). Multiple selections are OR.
            </Item>
            <Item label="Group toggle">
              Next to each ability filter is a <Badge color="blue">Group</Badge> toggle. Turning it on narrows results to creatures that have the group-targeting version of that ability. Each toggle is independent.
            </Item>
          </Section>

          <Section title="Creature Cards">
            <Item label="Stats preview">
              Each card shows HP, DMG, SPD, ARM, and CRIT at level 26 — the standard comparison level used by the JWA community.
            </Item>
            <Item label="Open detail">
              Tap or click any card to open the full detail modal.
            </Item>
          </Section>

          <Section title="Creature Detail Modal">
            <Item label="Header">
              Shows rarity, class, hybrid type, full description, and the game version when this creature&rsquo;s stats were last updated (e.g. <Badge>Updated v3.1</Badge>).
            </Item>
            <Item label="Level slider">
              Drag to any level between the creature&rsquo;s minimum (set by rarity) and 35. Health and Damage scale with level using the game&rsquo;s own formula. Speed, Armor, and Crit are unaffected by level.
            </Item>
            <Item label="Evolution cost">
              Below the stats, see the coins and ingredient DNA needed to reach the selected level from the creature&rsquo;s starting level. Hybrid ingredient DNA shows three columns — <span className="text-green-400 text-xs font-medium">Best (50 DNA/fuse)</span>, <span className="text-blue-300 text-xs font-medium">Avg (22)</span>, and <span className="text-red-400 text-xs font-medium">Worst (10)</span>.
            </Item>
            <Item label="Boosts">
              Every creature gets <strong className="text-white">1 boost per level</strong>. Distribute them across Health, Damage, and Speed. Health and Damage boosts are multiplicative (+2.5% each). Speed boosts add +2 each. Max 20 boosts per stat. Enhancements can raise the total boost cap.
            </Item>
            <Item label="Enhancements">
              Unique and Apex creatures have up to 5 purchasable enhancements shown as <Badge color="violet">E1</Badge>–<Badge color="violet">E5</Badge>. Click a step to activate all enhancements up to that tier; click the active step again to deactivate it. HP/DMG enhancements are multiplicative and apply after boosts. The final tier usually unlocks a new reactive move, shown as <Badge color="violet">Enhancement locked</Badge> until activated.
            </Item>
            <Item label="Ingredients & hybrids">
              <strong className="text-white">Made From</strong> shows which creatures this one is fused from. <strong className="text-white">Used In</strong> shows which hybrids use this creature. All chips are clickable — tap one to jump directly to that creature.
            </Item>
            <Item label="Spawn locations">
              Shows where a creature&rsquo;s DNA can be found in the wild (e.g. Local Area 2, Sanctuary, Event Only).
            </Item>
            <Item label="Resistances">
              Non-zero resistances are shown as badges. <span className="text-green-300 text-xs font-medium">Green</span> = 100% immune; grey = partial resistance with percentage.
            </Item>
            <Item label="Moves">
              Active moves appear under <strong className="text-white">Moves</strong>; counters, swap-ins, on-escape, and reactive abilities under <strong className="text-white">Special Abilities</strong>. Each shows type, cooldown, priority, and all effects with targets and durations. Attack multipliers show the calculated damage total. Heal effects show both the percentage and the HP amount. Devour shows HP per turn based on current damage.
            </Item>
            <Item label="Crit damage">
              The stats grid shows both Crit Rate and Crit DMG multiplier. For Omega creatures both scale with point allocation.
            </Item>
          </Section>

          <Section title="Omega Creatures">
            <Item label="What are Omegas?">
              Omegas use a point-based stat customisation system instead of the standard level-scaling formula. They still have a level slider, boosts, and a full move breakdown.
            </Item>
            <Item label="Points">
              Every level-up grants <Badge color="green">7 points</Badge> to spend freely. The <strong className="text-white">Points</strong> panel shows each allocatable stat with a progress bar and <Badge>−</Badge> / <Badge>+</Badge> buttons. The header shows allocated vs. available points.
            </Item>
            <Item label="Stat caps">
              Each stat has a point cap and an absolute value cap. The bar turns <span className="text-green-400">green</span> when a stat is maxed. Only stats with a non-zero point delta are shown.
            </Item>
            <Item label="Move unlocks">
              Some Omega moves are locked until a certain level. They appear dimmed with an <Badge>Unlocks Lv X</Badge> badge. Slide the level up to unlock them.
            </Item>
          </Section>

          <Section title="Data & Updates">
            <Item label="Source">
              All data is scraped from <span className="text-blue-400">paleo.gg/games/jurassic-world-alive/dinodex</span>. The last scrape date appears in the top-right of the header.
            </Item>
            <Item label="Auto-sync">
              A daily job checks whether paleo.gg has published a new data version. If the last-modified date has changed, the full scrape runs automatically and the site redeploys — no manual action needed.
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
