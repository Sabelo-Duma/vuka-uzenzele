/* ============================================================
   Notifications — the free channel.

   The "Job alerts" toggle used to save a preference that nothing acted on,
   because delivering an alert meant paying for an SMS. Web Push doesn't cost
   anything: the browser's own push service carries the message, and an
   installed Vuka gets a real notification on the lock screen.

   What that costs the user: one permission prompt, and only when they ask for
   alerts. What it costs us: nothing per message.

   Support is uneven, so every path here degrades quietly:
   · Android / desktop Chrome, Edge, Firefox — works installed or in the tab.
   · iOS 16.4+ — works, but ONLY once the app is added to the Home Screen.
     That's an Apple restriction; `pushSupported()` reports it honestly rather
     than showing a prompt that can't succeed.
   · Anything older — the toggle still saves the preference server-side, so
     turning it on isn't wasted when the browser catches up.
   ============================================================ */
import { api } from './api';

/** Can this browser receive push at all? */
export const pushSupported = (): boolean =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

/**
 * iOS only allows push from an app added to the Home Screen. Detecting that
 * lets us say "add Vuka to your Home Screen first" instead of failing silently.
 */
export const pushNeedsInstall = (): boolean => {
  if (!pushSupported()) return false;
  const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as { standalone?: boolean }).standalone === true;
  return iOS && !standalone;
};

export const pushPermission = (): NotificationPermission | 'unsupported' =>
  pushSupported() ? Notification.permission : 'unsupported';

/** VAPID keys travel as base64url; PushManager wants raw bytes. */
function toBytes(base64url: string): Uint8Array {
  const padded = base64url.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (base64url.length % 4)) % 4);
  const raw = atob(padded);
  return Uint8Array.from(raw, (ch) => ch.charCodeAt(0));
}

const readySw = () => navigator.serviceWorker.ready;

/** The subscription this browser already holds, if any. */
export async function currentSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null;
  try {
    return await (await readySw()).pushManager.getSubscription();
  } catch {
    return null;
  }
}

/**
 * Ask permission, subscribe, and register the subscription with the server.
 *
 * @param vapidPublicKey from GET /api/config — empty means the server has push
 *        switched off, and we say so rather than prompting for nothing.
 * @throws an Error whose message is safe to show the user
 */
export async function enablePush(vapidPublicKey: string): Promise<void> {
  if (!pushSupported()) throw new Error("This browser can't show notifications.");
  if (!vapidPublicKey) throw new Error('Notifications are not switched on for this server yet.');
  if (pushNeedsInstall()) throw new Error('On iPhone, add Vuka to your Home Screen first — then notifications can be switched on.');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notifications are blocked. You can allow them in your browser settings.');

  const reg = await readySw();
  // An existing subscription is reused. Re-subscribing with a different key
  // would silently orphan the old endpoint, so if the key changed we replace it.
  let sub = await reg.pushManager.getSubscription();
  if (sub) {
    const same = sub.options?.applicationServerKey
      && new Uint8Array(sub.options.applicationServerKey).toString() === toBytes(vapidPublicKey).toString();
    if (!same) { await sub.unsubscribe(); sub = null; }
  }
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,                       // required by every browser
      applicationServerKey: toBytes(vapidPublicKey) as BufferSource,
    });
  }

  const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) throw new Error("This browser didn't return a usable subscription.");
  await api.subscribePush({ endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } });
}

/**
 * Stop notifications on this device: drop the browser subscription AND the
 * server row, so we never keep pushing to somebody who turned it off.
 */
export async function disablePush(): Promise<void> {
  const sub = await currentSubscription();
  const endpoint = sub?.endpoint;
  try { await sub?.unsubscribe(); } catch { /* already gone */ }
  try { await api.unsubscribePush(endpoint); } catch { /* the preference is what matters */ }
}
