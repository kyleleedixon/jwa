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
    red:    'bg-red-500/20 text-red-300',
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
            <p className="text-xs text-gray-500 mt-0.5">All creatures from Jurassic World Alive. Data syncs automatically when paleo.gg publishes an update.</p>
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
              Type any part of a creature&rsquo;s name to instantly filter the grid.
            </Item>
            <Item label="Filter sidebar">
              Click the <Badge>Filters</Badge> button in the header to show or hide the filter panel. A blue number badge shows how many filters are active. On desktop the panel is open by default; on mobile it slides in as a drawer.
            </Item>
            <Item label="Sorting">
              Use the sort bar above the grid to sort by <Badge>Name</Badge> <Badge>HP</Badge> <Badge>DMG</Badge> <Badge>SPD</Badge> <Badge>ARM</Badge> <Badge>CRIT</Badge> or <Badge>CRIT DMG</Badge>. Clicking a stat defaults to highest-first; clicking again reverses.
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
              Next to each ability filter is a <Badge color="blue">Group</Badge> toggle. Turning it on narrows results to creatures that have the group-targeting version of that ability.
            </Item>
          </Section>

          <Section title="Creature Cards">
            <Item label="Stats preview">
              Each card shows HP, DMG, SPD, ARM, CRIT, and CRIT DMG at level 26 — the standard comparison level used by the JWA community.
            </Item>
            <Item label="Class icon">
              The small icon next to the rarity badge shows the creature&rsquo;s class (Fierce, Cunning, Resilient, etc.).
            </Item>
            <Item label="Open detail">
              Tap or click any card to open the full detail modal.
            </Item>
          </Section>

          <Section title="Creature Detail Modal">
            <Item label="Header">
              Shows rarity, class icon, hybrid type, full description, and the game version when this creature&rsquo;s stats were last updated.
            </Item>
            <Item label="Bio info">
              Directly below the header: <strong className="text-white">Made From</strong> and <strong className="text-white">Used In</strong> show ingredient and hybrid relationships side by side. <strong className="text-white">Resistances</strong> are color-coded — <span className="text-green-300 text-xs font-medium">green</span> = 100% immune, <span className="text-lime-300 text-xs font-medium">lime</span> = 67–99%, <span className="text-yellow-300 text-xs font-medium">yellow</span> = 34–66%, <span className="text-red-300 text-xs font-medium">red</span> = 1–33%. <strong className="text-white">Spawn</strong> shows where DNA can be found.
            </Item>
            <Item label="Level slider">
              Drag to any level between the creature&rsquo;s minimum (set by rarity) and 35. Health and Damage scale with level using the game&rsquo;s own formula. Speed, Armor, and Crit are unaffected by level.
            </Item>
            <Item label="Evolution cost">
              Below the stats, see the coins and DNA needed to level up. Use the <Badge>From Lv</Badge> dropdown in the section header to set a starting level — useful if your creature is already partially levelled. For hybrids, ingredient DNA shows three columns — <span className="text-green-400 text-xs font-medium">Best (50 DNA/fuse)</span>, <span className="text-blue-300 text-xs font-medium">Avg (22)</span>, and <span className="text-red-400 text-xs font-medium">Worst (10)</span>. Omega creatures show their own coin and DNA cost tables.
            </Item>
            <Item label="Boosts">
              Every creature gets <strong className="text-white">1 boost per level</strong>. Distribute them across Health, Damage, and Speed using the − / + buttons. Each stat shows its in-game icon. Health and Damage boosts are multiplicative (+2.5% each). Speed boosts add +2 each. Max 20 boosts per stat. Enhancements can raise the total boost cap.
            </Item>
            <Item label="Enhancements">
              Unique and Apex creatures have up to 5 purchasable enhancements shown as <Badge color="violet">E1</Badge>–<Badge color="violet">E5</Badge>. Click a step to activate all enhancements up to that tier; click the active step again to deactivate it. HP/DMG enhancements are multiplicative and apply after boosts. The final tier usually unlocks a new reactive move.
            </Item>
            <Item label="Ingredients & hybrids">
              <strong className="text-white">Made From</strong> and <strong className="text-white">Used In</strong> chips are clickable — tap one to jump directly to that creature.
            </Item>
            <Item label="Spawn locations">
              Shows where a creature&rsquo;s DNA can be found in the wild (e.g. Local Area 2, Sanctuary, Event Only).
            </Item>
            <Item label="Moves">
              Active moves appear under <strong className="text-white">Moves</strong>; counters, swap-ins, on-escape, and reactive abilities under <strong className="text-white">Special Abilities</strong>. Each shows type, cooldown, priority, and all effects. Moves with priority show a priority indicator on their icon. Attack multipliers show the calculated damage total. Heal effects show both the percentage and HP amount.
            </Item>
            <Item label="Crit damage">
              The stats grid shows both Crit Rate and Crit DMG multiplier. For Omega creatures both scale with point allocation.
            </Item>
          </Section>

          <Section title="Shareable Builds">
            <Item label="Share button">
              Inside any creature modal, click the <Badge color="blue">Share</Badge> button in the top-right corner. This copies a link to your clipboard that encodes the creature&rsquo;s current level, boosts, enhancement tier, and Omega point allocation.
            </Item>
            <Item label="Opening a share link">
              When someone opens a share link, the correct creature modal opens automatically with all settings restored exactly as you configured them — level, boosts, enhancements, and Omega points are all pre-filled.
            </Item>
            <Item label="Use cases">
              Share a maxed boost spread with your alliance, compare two different Omega point builds, or link a specific creature during a team discussion. The recipient sees exactly what you see.
            </Item>
            <Item label="Sharing tip">
              Set up the build first, then click <Badge color="blue">Share</Badge>. The link is always a snapshot of the current state — changing anything after copying means re-sharing.
            </Item>
          </Section>

          <Section title="Omega Creatures">
            <Item label="What are Omegas?">
              Omegas use a point-based stat customisation system. They still have a level slider, evolution costs, boosts, and a full move breakdown.
            </Item>
            <Item label="Points">
              Every level-up grants <Badge color="green">7 points</Badge> to spend freely. The <strong className="text-white">Points</strong> panel shows each allocatable stat with a progress bar and <Badge>−10</Badge> <Badge>−</Badge> <Badge>+</Badge> <Badge>+10</Badge> buttons for fast allocation. Use <Badge color="blue">Preset</Badge> to evenly distribute all available points, or <Badge>Reset</Badge> to clear them.
            </Item>
            <Item label="Stat caps">
              Each stat has a point cap and an absolute value cap. The bar turns <span className="text-green-400">green</span> when a stat is maxed.
            </Item>
            <Item label="Move unlocks">
              Some Omega moves are locked until a certain level. They appear dimmed with an <Badge>Unlocks Lv X</Badge> badge.
            </Item>
          </Section>

          <Section title="Data & Updates">
            <Item label="Source">
              All creature data is scraped from <a href="https://www.paleo.gg/games/jurassic-world-alive/dinodex" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">paleo.gg/games/jurassic-world-alive/dinodex</a>. The <strong className="text-white">Dino data</strong> date in the footer shows when that data was last pulled.
            </Item>
            <Item label="Auto-sync">
              A daily job checks whether paleo.gg has published a new data version. If the last-modified date has changed, the full scrape runs automatically and the site redeploys — no manual action needed.
            </Item>
            <Item label="App version">
              The <strong className="text-white">v1.1.2</strong> label in the footer tracks the Dinodex app itself — separate from the dino data date. Both are shown so you can tell the difference between a data update and a feature update.
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
