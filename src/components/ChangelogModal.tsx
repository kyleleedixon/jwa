'use client';

import { useEffect } from 'react';
import { RARITY_COLORS, RARITY_BG, RARITY_LABELS, label } from '@/lib/labels';

interface StatChange { [key: string]: [number, number] }

interface ChangeEntry {
  type: 'new' | 'updated' | 'removed';
  uuid: string;
  name: string;
  rarity?: string;
  stats?: StatChange;
  version?: [string, string];
}

interface ChangelogEntry {
  date: string;
  version: string;
  changes: ChangeEntry[];
}

interface Props {
  entries: ChangelogEntry[];
  onClose: () => void;
}

const STAT_LABELS: Record<string, string> = {
  health: 'HP', damage: 'DMG', speed: 'SPD', armor: 'ARM', crit: 'CRIT', critm: 'CRIT DMG',
};

export default function ChangelogModal({ entries, onClose }: Props) {
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 sticky top-0 bg-slate-900 z-10">
          <div>
            <h1 className="text-lg font-bold text-white">What&rsquo;s New</h1>
            <p className="text-xs text-gray-500 mt-0.5">Changes detected on each daily data sync from paleo.gg.</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {entries.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500 text-sm">
            No changes recorded yet. Changes will appear here after the next data sync.
          </div>
        ) : (
          <div className="px-6 py-5 flex flex-col gap-6">
            {entries.map((entry, i) => {
              const newCreatures  = entry.changes.filter(c => c.type === 'new');
              const updated       = entry.changes.filter(c => c.type === 'updated');
              const removed       = entry.changes.filter(c => c.type === 'removed');
              return (
                <div key={i} className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-white">{entry.date}</span>
                    {entry.version && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded border border-slate-600 bg-slate-700/60 text-gray-300">
                        {entry.version}
                      </span>
                    )}
                  </div>

                  {newCreatures.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">New</span>
                      <div className="flex flex-wrap gap-1.5">
                        {newCreatures.map(c => {
                          const rc = c.rarity ? RARITY_COLORS[c.rarity] ?? 'text-gray-300 border-gray-500' : 'text-gray-300 border-gray-500';
                          const rb = c.rarity ? RARITY_BG[c.rarity] ?? 'bg-gray-500/10' : 'bg-gray-500/10';
                          return (
                            <span key={c.uuid} className={`text-xs font-medium px-2 py-0.5 rounded border ${rc} ${rb}`}>
                              {c.name}
                              {c.rarity && <span className="ml-1 opacity-60">{label(RARITY_LABELS, c.rarity)}</span>}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {updated.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Updated</span>
                      {updated.map(c => (
                        <div key={c.uuid} className="flex flex-col gap-1 bg-slate-800/60 rounded-lg px-3 py-2">
                          <span className="text-sm font-medium text-white">{c.name}</span>
                          <div className="flex flex-wrap gap-2">
                            {c.version && (
                              <span className="text-xs text-gray-400">
                                Version <span className="text-gray-300">{c.version[0]}</span> → <span className="text-blue-300">{c.version[1]}</span>
                              </span>
                            )}
                            {c.stats && Object.entries(c.stats).map(([k, [from, to]]) => (
                              <span key={k} className="text-xs text-gray-400">
                                {STAT_LABELS[k] ?? k}{' '}
                                <span className="text-gray-300 tabular-nums">{from}</span>
                                {' → '}
                                <span className={`tabular-nums font-medium ${to > from ? 'text-green-400' : 'text-red-400'}`}>{to}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {removed.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Removed</span>
                      <div className="flex flex-wrap gap-1.5">
                        {removed.map(c => (
                          <span key={c.uuid} className="text-xs font-medium px-2 py-0.5 rounded border border-red-500/30 bg-red-500/10 text-red-300">
                            {c.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {i < entries.length - 1 && <div className="border-b border-slate-700/60 mt-1" />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
