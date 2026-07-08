'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

export interface TourStep {
  target?: string;                    // data-tour attribute value
  title: string;
  content: React.ReactNode;
  onEnter?: () => void | Promise<void>;
  waitForTarget?: boolean;            // poll for target after onEnter (e.g. modal-opening steps)
}

interface Props {
  steps: TourStep[];
  onFinish: () => void;
}

function findVisibleTarget(name: string): Element | null {
  const els = document.querySelectorAll(`[data-tour="${name}"]`);
  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return null;
}

export default function Tour({ steps, onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [ready, setReady] = useState(false);
  const stepSeq = useRef(0);

  const step = steps[index];

  const finish = useCallback(() => {
    onFinish();
  }, [onFinish]);

  const next = useCallback(() => {
    if (index >= steps.length - 1) finish();
    else setIndex(i => i + 1);
  }, [index, steps.length, finish]);

  const prev = useCallback(() => {
    if (index > 0) setIndex(i => i - 1);
  }, [index]);

  // Setup for current step: run onEnter, then locate target
  useEffect(() => {
    const seq = ++stepSeq.current;
    setReady(false);
    setRect(null);

    async function setup() {
      if (step.onEnter) await step.onEnter();
      if (seq !== stepSeq.current) return;

      if (!step.target) {
        setReady(true);
        return;
      }

      const maxAttempts = step.waitForTarget ? 40 : 10;
      let attempts = 0;
      const tick = () => {
        if (seq !== stepSeq.current) return;
        const el = findVisibleTarget(step.target!);
        if (el) {
          const r = el.getBoundingClientRect();
          const needsScroll = r.top < 80 || r.bottom > window.innerHeight - 220;
          if (needsScroll) {
            el.scrollIntoView({ block: 'center', behavior: 'smooth' });
            setTimeout(() => {
              if (seq !== stepSeq.current) return;
              const el2 = findVisibleTarget(step.target!);
              if (el2) setRect(el2.getBoundingClientRect());
              setReady(true);
            }, 380);
          } else {
            setRect(r);
            setReady(true);
          }
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(tick, 50);
        } else {
          setReady(true); // give up, show centered tooltip
        }
      };
      tick();
    }
    setup();
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reposition on resize / scroll while a step is active
  useEffect(() => {
    if (!step.target) return;
    const update = () => {
      const el = findVisibleTarget(step.target!);
      if (el) setRect(el.getBoundingClientRect());
    };
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [step.target, index]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { finish(); return; }
      if (e.key === 'ArrowRight' || e.key === 'Enter') next();
      if (e.key === 'ArrowLeft') prev();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [next, prev, finish]);

  const tooltipStyle: React.CSSProperties = (() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    if (isMobile) {
      // Fixed to bottom on mobile so it never covers the spotlighted element
      // unless the target itself sits near the bottom; simple + reliable.
      if (rect && rect.top > window.innerHeight * 0.55) {
        return { top: 16, left: 16, right: 16 };
      }
      return { bottom: 16, left: 16, right: 16 };
    }
    if (!rect) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 360 };
    }
    const w = 360;
    const gap = 12;
    const spaceBelow = window.innerHeight - rect.bottom;
    const below = spaceBelow >= 220;
    const left = Math.max(16, Math.min(window.innerWidth - w - 16, rect.left + rect.width / 2 - w / 2));
    if (below) return { top: rect.bottom + gap, left, width: w };
    return { bottom: window.innerHeight - rect.top + gap, left, width: w };
  })();

  if (!ready) return null;

  return (
    <>
      {rect ? (
        <div
          className="fixed z-[70] pointer-events-none transition-all duration-200"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            borderRadius: 10,
            boxShadow: '0 0 0 100vmax rgba(2,6,23,0.75), inset 0 0 0 2px rgba(96,165,250,0.65)',
          }}
        />
      ) : (
        <div className="fixed inset-0 z-[70] bg-slate-950/75 pointer-events-none" />
      )}

      <div
        className="fixed z-[71] bg-slate-900 border border-slate-600 rounded-xl shadow-2xl p-4"
        style={tooltipStyle}
      >
        <div className="flex items-start justify-between gap-3 mb-1.5">
          <div className="text-white font-semibold text-sm">{step.title}</div>
          <button
            onClick={finish}
            className="text-[11px] text-gray-500 hover:text-white transition-colors shrink-0"
          >
            Skip tour
          </button>
        </div>
        <div className="text-xs text-gray-300 leading-relaxed">{step.content}</div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="text-[11px] text-gray-500 tabular-nums">
            {index + 1} / {steps.length}
          </div>
          <div className="flex gap-2">
            {index > 0 && (
              <button
                onClick={prev}
                className="px-3 py-1 rounded-lg text-xs font-medium text-gray-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={next}
              className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              {index >= steps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
