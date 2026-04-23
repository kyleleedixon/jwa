export interface ShareState {
  c: string;
  lv: number;
  b: [number, number, number]; // [health, damage, speed] boosts
  enh: number;
  p: Record<string, number>;   // omega alloc (zero values omitted)
}

// Fixed order for omega stat encoding/decoding
const OMEGA_STATS = ['health', 'damage', 'speed', 'armor', 'crit', 'critm'] as const;

export function encodeShare(state: ShareState): string {
  const parts: (string | number)[] = [state.c, state.lv, state.b[0], state.b[1], state.b[2], state.enh];
  if (Object.keys(state.p).length > 0) {
    for (const k of OMEGA_STATS) parts.push(state.p[k] ?? 0);
  }
  return parts.join('~');
}

export function decodeShare(encoded: string): ShareState | null {
  try {
    if (encoded.includes('~')) {
      const parts = encoded.split('~');
      if (parts.length < 6) return null;
      const [c, lv, h, d, s, enh, ...rest] = parts;
      if (!c || lv == null) return null;
      const p: Record<string, number> = {};
      if (rest.length >= OMEGA_STATS.length) {
        OMEGA_STATS.forEach((k, i) => { const v = Number(rest[i] ?? 0); if (v > 0) p[k] = v; });
      }
      return { c, lv: Number(lv), b: [Number(h), Number(d), Number(s)], enh: Number(enh), p };
    }

    // Legacy base64 JSON format
    const padded = encoded + '='.repeat((4 - encoded.length % 4) % 4);
    const parsed = JSON.parse(atob(padded));
    if (!parsed?.c || parsed?.lv == null) return null;
    return { c: parsed.c, lv: parsed.lv, b: parsed.b ?? [0, 0, 0], enh: parsed.enh ?? 0, p: parsed.p ?? {} };
  } catch {
    return null;
  }
}

export function readShareFromURL(): ShareState | null {
  if (typeof window === 'undefined') return null;
  const param = new URLSearchParams(window.location.search).get('share');
  return param ? decodeShare(param) : null;
}

export function writeShareToURL(state: ShareState): void {
  const url = new URL(window.location.href);
  url.searchParams.set('share', encodeShare(state));
  window.history.replaceState({}, '', url.toString());
}

export function clearShareFromURL(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete('share');
  window.history.replaceState({}, '', url.toString());
}
