/* ============================================================
   Push handlers for the Vuka service worker.

   Pulled into the generated Workbox service worker via
   `workbox.importScripts` in vite.config.ts, so the precaching/auto-update
   behaviour stays exactly as it was and this file only adds notifications.

   Two events, and the second one matters as much as the first: a notification
   nobody can act on is just noise, so tapping one focuses the tab that's
   already open (or opens the app) at the screen the notification was about.
   ============================================================ */
/* eslint-env serviceworker */
/* global self, clients */

self.addEventListener('push', (event) => {
  // Browsers require a visible notification for every push we accept, so a
  // malformed or empty payload still shows something honest rather than the
  // browser's own "This site has been updated in the background".
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = {}; }

  const title = data.title || 'Vuka Uzenzele';
  const options = {
    body: data.body || 'Open Vuka to see what changed.',
    icon: '/pwa-192x192.png',
    badge: '/favicon-48x48.png',
    // A tag replaces an earlier notification about the same thing instead of
    // stacking five copies of it.
    tag: data.tag || 'vuka',
    renotify: true,
    data: { url: data.url || '/', type: data.type || 'generic' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/', self.location.origin);

  event.waitUntil((async () => {
    const open = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    // Reuse a window that's already on this origin — opening a second copy of
    // the app loses whatever the person was doing in the first.
    for (const client of open) {
      if (new URL(client.url).origin !== target.origin) continue;
      await client.focus();
      if ('navigate' in client) { try { await client.navigate(target.href); } catch { /* focus is enough */ } }
      return;
    }
    await clients.openWindow(target.href);
  })());
});
