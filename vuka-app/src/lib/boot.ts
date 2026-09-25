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
    /* update() resolves when the CHECK is done, not when the new build is in.
       Downloading and activating it takes longer — and that gap is what put
       the app on screen and then reloaded it under the user's thumb: splash,
       app, splash, app. So if a new worker is on its way, wait for it to take
       over while the splash is still up (the cap in splashReady still holds);
       the reload then happens behind the splash, and the second splash is the
       same picture, so it reads as one launch. */
    const incoming = reg.installing ?? reg.waiting;
    if (incoming && navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => {
        navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true });
        incoming.addEventListener('statechange', () => {
          if (incoming.state === 'redundant') resolve();
        });
      });
    }
  } catch {
    /* Offline, blocked, or unsupported. The app still opens. */
  }
}

/**
 * True while a launch screen is showing. Once the app is on screen, a new
 * build is never forced on the user mid-use — it is picked up next launch.
 */
let splashShowing = true;

/**
 * Reload when a NEW worker takes over, so the user lands on the new build
 * rather than the one already in memory.
 *
 * The word doing the work is "new". `controllerchange` fires for two quite
 * different things:
 *
 *   · an update activating and replacing the worker that was running — the
 *     case this exists for
 *   · the very first worker claiming a page that had none, which happens on
 *     every first visit
 *
 * Only the first is an update. Telling them apart is what
 * `hadControllerAtLoad` is for: if there was no controller when this page
 * loaded, the change is the initial claim and reloading for it is a wasted
 * round trip the user sits and watches — splash, app, splash, app.
 *
 * An earlier version described this hazard in a comment and then did not
 * actually prevent it: a sessionStorage flag stopped it RECURRING but let the
 * first one through, so every first visit reloaded itself once. Measured in a
 * fresh browser against production: two main-frame navigations for one visit.
 */
export function reloadOnNewWorker(): void {
  if (!('serviceWorker' in navigator)) return;

  /* Read now, before anything can claim the page. Reading it inside the
     handler would always say true, which is the whole bug. */
  const hadControllerAtLoad = Boolean(navigator.serviceWorker.controller);
  let reloading = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadControllerAtLoad) return;
    if (reloading) return;
    /* Reported from a phone: the app appeared, then the loading screen came
       back and it loaded again. That was this reload firing after the splash
       had gone. A new build now only reloads the page while the splash still
       covers it; after that it waits for the next launch. */
    if (!splashShowing) return;
    reloading = true;
    /* A second stop, in case a pathological worker activates on every load:
       one reload per tab session, whatever else happens. */
    try {
      if (sessionStorage.getItem(RELOAD_FLAG)) return;
      sessionStorage.setItem(RELOAD_FLAG, '1');
    } catch {
      /* No storage. The in-memory guard above still holds for this page. */
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
  splashShowing = false;

  const el = document.getElementById('boot');
  if (!el) return;
  el.dataset.leaving = 'true';
  const done = () => el.remove();
  el.addEventListener('transitionend', done, { once: true });
  /* transitionend does not fire when the motion is off — under
     prefers-reduced-motion, or in a background tab. */
  setTimeout(done, 400);
}
