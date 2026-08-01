/**
 * PWA install-prompt capture.
 *
 * The browser fires `beforeinstallprompt` very early — often BEFORE React has
 * mounted the InstallButton. If we only listen inside a component's effect we
 * miss it, and the button can then only ever show manual instructions.
 *
 * This module attaches the listener the moment it is imported (we import it at
 * the top of main.tsx, before rendering), stashes the event, and lets any
 * component subscribe. That makes the real one-tap install work reliably.
 */

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

if (typeof window !== 'undefined') {
  installed = isStandalone();
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();          // stop Chrome's mini-infobar; we drive the prompt
    deferred = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    installed = true;
    notify();
  });
}

/** Current captured prompt (or null if the browser hasn't offered one yet). */
export function getInstallPrompt(): BeforeInstallPromptEvent | null {
  return deferred;
}

export function isInstalled(): boolean {
  return installed;
}

/** Trigger the native install prompt. Returns true if the user accepted. */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  await deferred.prompt();
  const choice = await deferred.userChoice;
  if (choice.outcome === 'accepted') {
    deferred = null;
    notify();
    return true;
  }
  return false;
}

/** Subscribe to install-state changes; returns an unsubscribe fn. */
export function onInstallChange(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
