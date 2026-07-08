const KEY = 'jwa_onboarded_v1';

export function hasSeenOnboarding(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return true;
  }
}

export function markOnboardingSeen() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, '1');
  } catch {
    // ignore (private mode, quota, etc.)
  }
}

export function resetOnboarding() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
