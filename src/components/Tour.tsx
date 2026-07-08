'use client';

import { useEffect, useState, useCallback, useRef, useLayoutEffect, useMemo } from 'react';

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
  const [measured, setMeasured] = useState<{ w: number; h: number } | null>(null);
  const stepSeq = useRef(0);
  const tooltipRef = useRef<HTMLDivElement>(null);

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
    setMeasured(null);

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

  const tooltipStyle: React.CSSProperties = useMemo(() => {
    if (typeof window === 'undefined') return {};
    const vpW = window.innerWidth;
    const vpH = window.innerHeight;
    const margin = 16;
    const gap = 12;
    const isMobile = vpW < 640;

    // Desired width for this viewport; use measured width if available for clamping
    const desiredW = isMobile ? Math.min(vpW - margin * 2, 400) : Math.min(360, vpW - margin * 2);
    const w = measured?.w ?? desiredW;
    const h = measured?.h ?? 220;

    let top: number;
    let left: number;

    if (!rect) {
      // No target — center in viewport
      top = Math.max(margin, (vpH - h) / 2);
      left = Math.max(margin, (vpW - w) / 2);
    } else {
      // Prefer placing below the target; fall back to above; fall back to overlap-clamped
      const spaceBelow = vpH - rect.bottom - gap - margin;
      const spaceAbove = rect.top - gap - margin;
      if (spaceBelow >= h) {
        top = rect.bottom + gap;
      } else if (spaceAbove >= h) {
        top = rect.top - h - gap;
      } else {
        top = rect.top + rect.height / 2 - h / 2;
      }
      left = rect.left + rect.width / 2 - w / 2;
    }

    // Clamp into viewport
    left = Math.max(margin, Math.min(vpW - w - margin, left));
    top = Math.max(margin, Math.min(vpH - h - margin, top));

    return {
      top,
      left,
      width: desiredW,
      maxHeight: `calc(100dvh - ${margin * 2}px)`,
      overflowY: 'auto',
      // Hide until measured to avoid a one-frame flash at fallback dimensions
      opacity: measured ? 1 : 0,
      transition: 'opacity 120ms ease-out',
    };
  }, [rect, measured]);

  // Measure the actual rendered tooltip so positioning uses real dimensions
  useLayoutEffect(() => {
    if (!ready) return;
    const el = tooltipRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setMeasured({ w: r.width, h: r.height });
  }, [ready, index, rect]);

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
        ref={tooltipRef}
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
