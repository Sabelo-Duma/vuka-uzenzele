/**
 * Wait until the app is actually usable, not merely loaded.
 *
 * Every browser check in this folder used `waitUntil: 'networkidle'` and then
 * acted immediately. Network-quiet is not painted, and since the launch screen
 * gained a deliberate minimum hold it is not interactive either: the bundle can
 * be fully downloaded while the splash still covers the page.
 *
 * That assumption broke check-responsive the moment the splash shipped — it
 * looked for the Log in button, found nothing because the splash was still up,
 * silently skipped the click, and then spent thirty seconds waiting for a
 * button on a screen it had never navigated to. The failure named the wrong
 * thing entirely.
 *
 * One definition, imported by every check, so the next person to add a timing
 * rule changes it in one place.
 */

/** Longest we will wait for the launch screen to finish. Comfortably past the
 *  5s cap in src/lib/boot.ts, so this trips on stuck, not on slow. */
const LAUNCH_TIMEOUT_MS = 25_000;

/**
 * Resolve once the launch screen is gone and the app has painted something
 * the user could touch.
 *
 * Both halves matter. Waiting only for the splash to go can still land in the
 * gap before React's first paint; waiting only for a control can match one
 * sitting underneath a splash that is still swallowing taps.
 */
export async function afterLaunch(page) {
  await page.waitForFunction(() => !document.getElementById('boot'), null, {
    timeout: LAUNCH_TIMEOUT_MS,
  });
  await page.waitForFunction(
    () => {
      const root = document.getElementById('root');
      if (!root || root.childElementCount === 0) return false;
      /* A heading or a button means React has rendered a screen rather than an
         empty shell. The splash carries neither. */
      return Boolean(root.querySelector('h1, h2, button'));
    },
    null,
    { timeout: LAUNCH_TIMEOUT_MS },
  );
}

/** goto + afterLaunch, which is what every caller actually wanted. */
export async function open(page, url) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await afterLaunch(page);
}
