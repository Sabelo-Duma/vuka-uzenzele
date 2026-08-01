/**
 * Formal-job applications, stored on the device.
 *
 * Formal roles are curated listings without a live employer inbox yet, so an
 * application is recorded locally: the button reflects a real, persistent state
 * (it survives reloads) instead of firing a fake "sent" toast. When the backend
 * gains a formal-application endpoint, swap these three functions for API calls.
 */
const KEY = 'vuka-applied-formal';

function read(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function isFormalApplied(id: string): boolean {
  return read().has(id);
}

export function markFormalApplied(id: string): void {
  try {
    const set = read();
    set.add(id);
    localStorage.setItem(KEY, JSON.stringify([...set]));
  } catch {
    /* storage unavailable — the in-memory component state still updates */
  }
}
