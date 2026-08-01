/** Simple device-local user preferences (toggles). Persists across reloads. */
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
