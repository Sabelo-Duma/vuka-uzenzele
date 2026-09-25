/* ============================================================
   Keeping the shell exactly as tall as the window really is.

   `.app-shell` is `100dvh`, and dvh is the right unit — it is what the tab bar
   being pinned to the bottom depends on. But on a phone the launch of an
   INSTALLED app is the one moment the browser is worst at resolving it: the
   window is still settling around the system bars when first layout runs, dvh
   is computed against that half-finished window, and nothing tells the page to
   look again.

   The symptom, reported from a real handset: open the installed app and the tab
   bar sits somewhere above the bottom of the screen with a strip of canvas
   underneath it. Scroll once and it drops into place — because scrolling is
   what finally forces the recalculation that never happened at launch.

   So the height stops being something the browser resolves once and becomes
   something measured, published as `--app-height`, and re-measured whenever the
   window changes. `.app-shell` takes it as the last of its four declarations,
   with dvh as the fallback, so if this file never runs nothing is worse than it
   was.

   ------------------------------------------------------------
   Two details that are not interchangeable with the obvious alternatives.

   **It measures `documentElement.clientHeight`, never `window.innerHeight`.**
   They differ in exactly the case that matters. On current Android and iOS the
   on-screen keyboard resizes only the VISUAL viewport and leaves the layout
   viewport alone — that is the whole premise of useKeyboardOpen, which detects
   the keyboard by the gap between the two. `innerHeight` tracks the visual
   viewport on some builds, so publishing it here would collapse the shell to
   the height above the keyboard every time somebody typed, and the app would
   fight its own keyboard handling. `clientHeight` on the root element is
   defined to be the layout viewport, which is what dvh tracks, so this is the
   same number dvh was already giving — just measured when we ask rather than
   when the browser last felt like it.

   **It re-measures a few times after boot.** The launch measurement is the one
   that is wrong, so a single reading at startup would faithfully record the
   wrong answer. The deferred passes cost nothing and are the ones that actually
   land the fix.
   ============================================================ */

/** How long after boot to keep re-checking, in ms. Past the splash's own hold. */
const SETTLE_PASSES = [0, 120, 400, 1000, 2000];

let frame = 0;

/**
 * Publish the current layout-viewport height.
 *
 * Writes nothing when the value has not changed, so a stream of resize events
 * during a URL-bar animation does not invalidate style on every frame.
 */
/**
 * True for the app launched from the iPhone home screen.
 *
 * That is the one place measuring the layout viewport is NOT enough, and it
 * is the handset the bug was reported from. With viewport-fit=cover and a
 * black-translucent status bar, iOS draws the page under the status bar but
 * sizes the layout viewport as though it were not there: clientHeight, 100%,
 * 100dvh and 100svh all come back one status bar SHORT — about 59pt on a
 * Dynamic Island phone, which is exactly the strip the report showed under the
 * tab bar — until the first scroll makes WebKit look again. So measuring
 * faithfully records the wrong number.
 *
 * In that mode there is no browser chrome at all: the window IS the screen.
 * So the screen's own size is the right answer, and the one number iOS does
 * not get wrong at launch.
 */
function iosStandalone(): boolean {
  return (navigator as unknown as { standalone?: boolean }).standalone === true;
}

function measure(): number {
  const layout = document.documentElement.clientHeight;
  if (!iosStandalone()) return layout;
  const { width, height } = window.screen;
  /* screen.width/height do not swap on rotation in iOS, so pick by the
     window's own shape. */
  const portrait = window.innerHeight >= window.innerWidth;
  const full = portrait ? Math.max(width, height) : Math.min(width, height);
  const across = portrait ? Math.min(width, height) : Math.max(width, height);
  /* Only when the window really is the whole screen. An iPad in Split View is
     narrower than the screen, and its height is not the screen's to borrow. */
  if (full <= 0 || Math.abs(window.innerWidth - across) > 2) return layout;
  /* Never smaller than what was measured, in case a later iOS fixes this. */
  return Math.max(full, layout);
}

function apply(): void {
  const height = measure();
  if (!Number.isFinite(height) || height <= 0) return;
  const next = `${height}px`;
  const root = document.documentElement;
  if (root.style.getPropertyValue('--app-height') === next) return;
  root.style.setProperty('--app-height', next);
}

/** Coalesce bursts of events into one measurement per frame. */
function schedule(): void {
  if (frame) return;
  frame = window.requestAnimationFrame(() => {
    frame = 0;
    apply();
  });
}

/**
 * Start tracking. Safe to call more than once; called before React mounts so
 * the first paint already has a measured height rather than a guessed one.
 */
export function trackViewportHeight(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  apply();

  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('orientationchange', schedule, { passive: true });
  /* Coming back from the background — or from the bfcache, where the window
     may have been resized while the page was frozen and no resize fired. */
  window.addEventListener('pageshow', schedule, { passive: true });
  /* The visual viewport moves for the keyboard, which must NOT change the
     shell — but it also fires when the window itself settles after launch,
     which must. apply() reads the layout viewport either way, so listening
     here is safe and catches the launch case on builds where `resize` does
     not fire. */
  window.visualViewport?.addEventListener('resize', schedule, { passive: true });

  /* An installed app that changes display mode (standalone to fullscreen, say)
     gets a new window without necessarily firing resize first. */
  try {
    window.matchMedia('(display-mode: standalone)').addEventListener('change', schedule);
  } catch { /* older browsers: no addEventListener on MediaQueryList */ }

  for (const delay of SETTLE_PASSES) {
    window.setTimeout(apply, delay);
  }
}
