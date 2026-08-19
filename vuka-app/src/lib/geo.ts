/* ============================================================
   Where the user is — asked for, never assumed.

   "3.4 km away" is only worth showing if it's true, so the app measures it:
   the device's own Geolocation API gives a position, the server measures the
   distance to each listing, and anything it can't measure is labelled as an
   estimate instead of dressed up as a fact.

   Free — the browser's geolocation is built in, and there is no geocoding or
   maps call anywhere in the flow.

   Three rules this module exists to enforce:
   · Permission is the user's. Nothing here runs until they tap "near me", and
     a refusal is a normal outcome, not an error state.
   · A cached position expires. A 20-minute-old fix is fine; yesterday's is a
     lie, so it's dropped rather than reused.
   · Coarse is enough. We never ask for high accuracy — a suburb-level fix
     answers "how far is this gig", costs less battery, and reveals less.
   ============================================================ */

export interface Coords { lat: number; lng: number }

const KEY = 'vuka-coords';
/** How long a position stays good enough to reuse without re-asking. */
const MAX_AGE_MS = 20 * 60 * 1000;

/** Does this browser offer geolocation at all? (Also false on insecure origins.) */
export const locationSupported = (): boolean =>
  typeof navigator !== 'undefined' && 'geolocation' in navigator && window.isSecureContext !== false;

interface Stored extends Coords { at: number }

/** The last position, if it's still fresh. Null means "ask again". */
export function cachedCoords(): Coords | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Stored;
    if (!Number.isFinite(s.lat) || !Number.isFinite(s.lng)) return null;
    if (Date.now() - s.at > MAX_AGE_MS) return null;
    return { lat: s.lat, lng: s.lng };
  } catch {
    return null;
  }
}

function remember(c: Coords) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...c, at: Date.now() })); } catch { /* storage unavailable */ }
}

/** Forget the stored position — the "stop using my location" half of the toggle. */
export function forgetCoords(): void {
  try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
}

/**
 * Has the user already decided about location? Lets the UI show the real state
 * instead of a hopeful "Turn on" button they've already refused.
 * `unknown` covers browsers without the Permissions API (Safari, mostly).
 */
export async function locationPermission(): Promise<'granted' | 'prompt' | 'denied' | 'unknown'> {
  try {
    if (!navigator.permissions?.query) return 'unknown';
    const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    return status.state as 'granted' | 'prompt' | 'denied';
  } catch {
    return 'unknown';
  }
}

/**
 * Ask the device where it is. Rejects with a message that's safe to show:
 * a refusal reads as a refusal, not as a crash.
 */
export function requestCoords(): Promise<Coords> {
  if (!locationSupported()) return Promise.reject(new Error("This device can't share its location."));
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        remember(c);
        resolve(c);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) reject(new Error('Location is off. You can still browse — distances just won\'t be exact.'));
        else if (err.code === err.POSITION_UNAVAILABLE) reject(new Error("We couldn't get a fix on your location. Try again outside or near a window."));
        else reject(new Error('Finding your location took too long. Please try again.'));
      },
      // Coarse and cheap: enough to rank gigs by distance, gentle on battery.
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: MAX_AGE_MS },
    );
  });
}

/**
 * How a distance should read, given whether it was actually measured.
 * A measured distance gets stated; an estimate says so; an unknown one is
 * left out entirely rather than shown as "0 km".
 */
export function distanceLabel(km: number, source?: 'measured' | 'listed'): string | null {
  if (source === 'measured') return km < 1 ? `${Math.round(km * 1000)} m away` : `${km} km away`;
  if (km > 0) return `≈ ${km} km`;
  return null;
}
