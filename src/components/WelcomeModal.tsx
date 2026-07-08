'use client';

import { useEffect } from 'react';

interface Props {
  onDismiss: () => void;
  onStartTour: () => void;
}

function Row({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="text-white font-semibold text-sm">{title}</div>
      <div className="text-gray-400 text-xs leading-relaxed">{children}</div>
    </div>
  );
}

export default function WelcomeModal({ onDismiss, onStartTour }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onDismiss(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onDismiss]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm"
      onClick={onDismiss}
    >
      <div
        className="relative w-full max-w-lg max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto bg-slate-900 rounded-t-2xl sm:rounded-2xl border-0 sm:border border-slate-700 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Welcome to the JWA Dinodex</h2>
          <p className="text-sm text-gray-400 mt-1">
            Every creature from Jurassic World Alive. Data syncs daily from paleo.gg.
          </p>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <Row title="Browse the full dex">
            Search, filter by rarity / class / hybrid type / resistance / ability, and sort by tier rank or any stat.
          </Row>
          <Row title="Tap any card for details">
            Stats at any level, evolution cost from any starting level, max-level calculator, boost planner, enhancements, and shareable build links.
          </Row>
          <Row title="Tier List">
            All 500+ creatures ranked by a full 1v1 round-robin simulation. Top 25 get S / A / B / C tiers.
          </Row>
          <Row title="Battle Simulator">
            Head-to-head fight between any two creatures with boosts, enhancements, swap-in, and a turn-by-turn log.
          </Row>
          <Row title="Auto-updates">
            When paleo.gg publishes new data, the site re-scrapes and the tier list recomputes automatically.
          </Row>
        </div>

        <div className="px-6 py-4 border-t border-slate-700 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <button
            onClick={onDismiss}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Got it
          </button>
          <button
            onClick={onStartTour}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            Take the tour
          </button>
        </div>
      </div>
    </div>
  );
}
