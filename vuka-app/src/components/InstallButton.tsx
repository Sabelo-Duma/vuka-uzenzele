import { useEffect, useState } from 'react';
import { Icon } from './Icon';

/** The (non-standard) beforeinstallprompt event, typed minimally. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * "Install app" button for the PWA. Renders nothing until the browser fires
 * `beforeinstallprompt` (i.e. the app is installable and not yet installed),
 * so it's safe to place anywhere.
 */
export function InstallButton({ className = '' }: { className?: string }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setDeferred(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!deferred) return null;

  return (
    <button
      onClick={async () => {
        await deferred.prompt();
        const choice = await deferred.userChoice;
        if (choice.outcome === 'accepted') setDeferred(null);
      }}
      className={`inline-flex items-center justify-center gap-2 rounded-pill bg-navy text-white dark:text-navy-deep font-bold text-[13px] px-4 py-2.5 hover:bg-navy-2 transition active:scale-95 ${className}`}
    >
      <Icon name="plus" size={16} /> Install app
    </button>
  );
}
