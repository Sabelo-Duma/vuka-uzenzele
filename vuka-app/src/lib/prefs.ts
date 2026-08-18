/**
 * Device-local preferences (toggles). Persists across reloads.
 *
 * Only for choices that are genuinely per-device — data saver, language.
 * Anything the SERVER must act on (job alerts, which drive push/SMS) lives on
 * the account instead: see `/api/me/preferences` via the app store.
 */
export function getPref(key: string, def: boolean): boolean {
  try {
    const v = localStorage.getItem(`vuka-pref-${key}`);
    return v === null ? def : v === '1';
  } catch {
    return def;
  }
}

export function setPref(key: string, val: boolean): void {
  try {
    localStorage.setItem(`vuka-pref-${key}`, val ? '1' : '0');
  } catch {
    /* storage unavailable */
  }
}
