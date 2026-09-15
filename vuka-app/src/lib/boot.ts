/**
 * How long the launch screen stays up, and what it waits for.
 *
 * Two separate jobs that happen to share a screen:
 *
 *  1. A minimum. The splash is the app's first impression and a 90ms flash of
 *     it reads as a glitch, so it holds for at least MIN_MS even when the app
 *     was ready instantly.
 *
 *  2. An update check. The service worker is registered with `autoUpdate`,
 *     which picks up a new build on the *next* visit — so without this, someone
 *     who keeps the installed app open for a week stays a week behind. Asking
 *     for the update here means the wait the user is already looking at is
 *     doing something, rather than being a decorative delay.
 *
 * And a cap. An update check against a sleeping free instance can take a long
 * time, and no first impression is worth a user staring at a logo. Past MAX_MS
 * the app opens regardless; the update lands on the next launch, which is the
 * behaviour we had before.
 */
const MIN_MS = 1400;
const MAX_MS = 5000;

/** Set once we have reloaded for a new worker, so two of them cannot loop. */
const RELOAD_FLAG = 'vuka-sw-reloaded';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Ask the service worker to look for a new build.
 *
 * Resolves when the check is done — or immediately, on any browser or context
 * without a worker (Safari private mode, the dev server, a plain http origin).
 * It never rejects: a failed update check must not stop the app opening.
 */
async function checkForUpdate(): Promise<void> {
  try {
    if (!('serviceWorker' in navigator)) return;
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return;
    await reg.update();
  } catch {
    /* Offline, blocked, or unsupported. The app still opens. */
  }
}

/**
 * Reload once when a new worker takes control, so the user lands on the new
 * build rather than the one already in memory.
 *
 * The guard matters. `controllerchange` also fires the first time a worker
 * claims a page that had none, and reloading on that would reload every first
 * visit forever. sessionStorage scopes the flag to this tab's session, which is
 * exactly the lifetime of the risk.
 */
export function reloadOnNewWorker(): void {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    try {
      if (sessionStorage.getItem(RELOAD_FLAG)) return;
      sessionStorage.setItem(RELOAD_FLAG, '1');
    } catch {
      /* No sessionStorage: better to skip the reload than to risk a loop. */
      return;
    }
    window.location.reload();
  });
}

/**
 * Resolves when the splash has earned its keep: the minimum has elapsed and
 * the update check has finished, or the cap has been reached.
 */
export function splashReady(): Promise<void> {
  const work = Promise.all([sleep(MIN_MS), checkForUpdate()]).then(() => undefined);
  return Promise.race([work, sleep(MAX_MS)]);
}

/**
 * Fade out the splash the HTML painted, then remove it.
 *
 * Removed rather than hidden: it is a fixed, full-screen, z-index 9999 element,
 * and one left in the tree swallows every tap on the app behind it.
 */
export function dismissBootSplash(): void {
  /* Hand the status bar back to the theme. index.html inserts this override so
     a light-mode phone does not sit a pale strip above an indigo splash; left
     in place it would keep the app's status bar indigo for the whole session. */
  document.getElementById('boot-theme')?.remove();

  const el = document.getElementById('boot');
  if (!el) return;
  el.dataset.leaving = 'true';
  const done = () => el.remove();
  el.addEventListener('transitionend', done, { once: true });
  /* transitionend does not fire when the motion is off — under
     prefers-reduced-motion, or in a background tab. */
  setTimeout(done, 400);
}
