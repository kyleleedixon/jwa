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
    orange: 'bg-orange-500/20 text-orange-300',
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
              Use the sort bar above the grid to sort by <Badge>Name</Badge> <Badge>Tier Rank</Badge> <Badge>HP</Badge> <Badge>DMG</Badge> <Badge>SPD</Badge> <Badge>ARM</Badge> <Badge>CRIT</Badge> or <Badge>CRIT DMG</Badge>. Clicking a stat defaults to highest-first; clicking again reverses. Tier Rank sorts by simulation rank — #1 at the top — with unranked creatures at the end.
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
            <Item label="Tier rank badge">
              Every card shows a small badge in the top-left corner. The top 25 creatures carry a coloured tier — <Badge color="red">S</Badge> <Badge color="orange">A</Badge> <Badge color="yellow">B</Badge> <Badge color="blue">C</Badge> — assigned by rank. All other creatures show a neutral <Badge>#rank</Badge> badge indicating their position in the full simulation ranking.
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
              Shows rarity, class icon, hybrid type, full description, and the game version when this creature&rsquo;s stats were last updated. The tier badge next to the name shows the creature&rsquo;s simulation rank and win rate.
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
            <Item label="Max level calc">
              Below the evolution cost, enter the coins and DNA you have on hand to see the highest level you can reach from the current <Badge>From Lv</Badge>. For hybrids, enter each ingredient&rsquo;s DNA separately — fuse costs are calculated automatically. Results show <span className="text-green-400 text-xs font-medium">Best</span>, <span className="text-blue-300 text-xs font-medium">Avg</span>, and <span className="text-red-400 text-xs font-medium">Worst</span> columns matching the fuse rate assumptions above.
            </Item>
            <Item label="Boosts">
              Every creature gets <strong className="text-white">1 boost per level</strong>. Distribute them across Health, Damage, and Speed using the − / + buttons. Health and Damage boosts are multiplicative (+2.5% each). Speed boosts add +2 each. Max 20 boosts per stat. Enhancements can raise the total boost cap.
            </Item>
            <Item label="Enhancements">
              Unique and Apex creatures have up to 5 purchasable enhancements shown as <Badge color="violet">E1</Badge>–<Badge color="violet">E5</Badge>. Enhancements are only available at <strong className="text-white">level 30 or above</strong>. Click a step to activate all enhancements up to that tier; click the active step again to deactivate it. HP/DMG enhancements are multiplicative and apply after boosts. The final tier usually unlocks a new reactive move.
            </Item>
            <Item label="Ingredients & hybrids">
              <strong className="text-white">Made From</strong> and <strong className="text-white">Used In</strong> chips are clickable — tap one to jump directly to that creature.
            </Item>
            <Item label="Moves">
              Active moves appear under <strong className="text-white">Moves</strong>; counters, swap-ins, on-escape, and reactive abilities under <strong className="text-white">Special Abilities</strong>. Each shows type, cooldown, priority, and all effects.
            </Item>
          </Section>

          <Section title="Tier List">
            <Item label="Overview">
              The <a href="/tier-list" className="text-blue-400 hover:underline">Tier List</a> ranks every creature by running a full round-robin 1v1 simulation at level 26 — each creature fights every other creature and the results are tallied into a win rate.
            </Item>
            <Item label="Tiers">
              The top 25 creatures are assigned a tier by rank: <Badge color="red">S</Badge> ranks 1–4 · <Badge color="orange">A</Badge> 5–11 · <Badge color="yellow">B</Badge> 12–18 · <Badge color="blue">C</Badge> 19–24. Ranks 25 and below are listed without a tier.
            </Item>
            <Item label="Omegas">
              Omega creatures are included with points auto-allocated using a greedy priority order (Damage → Health → Speed → Crit DMG → Crit → Armor) to represent a reasonable optimised build. The exact build used is shown in the detail panel when you tap an Omega card.
            </Item>
            <Item label="Auto-refresh">
              The tier list recomputes automatically after every daily data scrape, so rankings stay current whenever paleo.gg publishes new stats.
            </Item>
            <Item label="Detail view">
              Tap any card on the tier list to see which creatures it beats, which it loses to, and its full win/loss/draw record. Omega cards additionally show an <Badge color="violet">Omega Build</Badge> section with the point allocation and final simulated stats.
            </Item>
          </Section>

          <Section title="Battle Simulator">
            <Item label="Overview">
              The <a href="/battle" className="text-blue-400 hover:underline">Battle Simulator</a> runs a turn-by-turn 1v1 fight between any two creatures. Set up both sides and hit <Badge color="blue">Simulate</Badge> to see who wins and why.
            </Item>
            <Item label="Level & boosts">
              Each slot has a level slider and — for non-Omega creatures — boost sliders for Health, Damage, and Speed. The total boost budget is <strong className="text-white">1 per level</strong>; activating <Badge color="violet">boost_max</Badge> enhancements raises the cap.
            </Item>
            <Item label="Omega points">
              When an Omega is selected its point sliders replace boost sliders. Use the <Badge>−10</Badge> <Badge>−</Badge> <Badge>+</Badge> <Badge>+10</Badge> buttons to allocate the <Badge color="green">level × 7</Badge> point budget across available stats. The bar turns green when a stat is capped.
            </Item>
            <Item label="Enhancements">
              Creatures with enhancements show toggle buttons when set to level 30 or above. Activate steps one at a time — each step applies its stat bonus to the simulation.
            </Item>
            <Item label="Battle log">
              After simulating, click <Badge>Show battle log</Badge> below the result to step through every turn — moves chosen, damage dealt, effects applied, and HP remaining.
            </Item>
            <Item label="Move accuracy">
              The sim picks the best available move each turn based on estimated damage output. It does not model player decision-making, swap strategies, or reactive move triggers — treat results as a rough power comparison, not a guaranteed outcome.
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
          </Section>

          <Section title="Data & Updates">
            <Item label="Source">
              All creature data is scraped from <a href="https://www.paleo.gg/games/jurassic-world-alive/dinodex" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">paleo.gg/games/jurassic-world-alive/dinodex</a>. The <strong className="text-white">Dino data</strong> date in the footer shows when that data was last pulled.
            </Item>
            <Item label="Auto-sync">
              A daily job checks whether paleo.gg has published a new data version. If the last-modified date has changed, the full scrape runs automatically, the tier list recomputes, and the site redeploys — no manual action needed.
            </Item>
            <Item label="App version">
              The version label in the footer tracks the Dinodex app itself — separate from the dino data date. Both are shown so you can tell the difference between a data update and a feature update.
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
