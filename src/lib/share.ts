export interface ShareState {
  c: string;
  lv: number;
  b: [number, number, number]; // [health, damage, speed] boosts
  enh: number;
  p: Record<string, number>;   // omega alloc (zero values omitted)
}

export function encodeShare(state: ShareState): string {
  const compact = { ...state, p: Object.fromEntries(Object.entries(state.p).filter(([, v]) => v > 0)) };
  return btoa(JSON.stringify(compact)).replace(/=/g, '');
}

export function decodeShare(encoded: string): ShareState | null {
  try {
    const padded = encoded + '=='.slice((encoded.length + 3) % 4);
    const parsed = JSON.parse(atob(padded));
    if (!parsed?.c || parsed?.lv == null) return null;
    return {
      c: parsed.c,
      lv: parsed.lv,
      b: parsed.b ?? [0, 0, 0],
      enh: parsed.enh ?? 0,
      p: parsed.p ?? {},
    };
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
