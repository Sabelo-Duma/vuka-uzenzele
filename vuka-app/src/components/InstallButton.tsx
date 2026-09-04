import { useEffect, useState } from 'react';
import { Icon } from './Icon';
import { Button, Sheet } from './ui';
import { getInstallPrompt, isInstalled, onInstallChange, promptInstall } from '../lib/pwaInstall';

type Platform = 'ios' | 'android' | 'edge' | 'firefox' | 'desktop';
function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  if (/Firefox/.test(ua)) return 'firefox';
  if (/Edg\//.test(ua)) return 'edge';
  return 'desktop';
}

/**
 * "Install app" button for the PWA.
 * - One-tap install when the browser offers the native prompt (captured early
 *   in lib/pwaInstall, so we don't miss the event).
 * - Otherwise opens a clear, platform-specific how-to sheet — because many
 *   browsers (iOS Safari, Firefox, or Chrome after a dismissal) never fire the
 *   native prompt, and install there is always manual.
 * - Renders nothing once installed (running standalone).
 */
export function InstallButton({ className = '' }: { className?: string }) {
  const [, force] = useState(0);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => onInstallChange(() => force((n) => n + 1)), []);

  if (isInstalled()) return null;

  const onClick = async () => {
    if (getInstallPrompt()) {
      const accepted = await promptInstall();
      if (!accepted && !getInstallPrompt()) setShowHelp(true); // prompt used up / unavailable
      return;
    }
    setShowHelp(true);
  };

  return (
    <>
      <button
        onClick={onClick}
        className={`inline-flex items-center justify-center gap-2 rounded-pill bg-navy text-white dark:text-navy-deep font-bold text-small px-4 py-2.5 hover:bg-navy-2 transition active:scale-95 ${className}`}
      >
        <Icon name="plus" size={16} /> Install app
      </button>
      {showHelp && <InstallHelpSheet onClose={() => setShowHelp(false)} />}
    </>
  );
}

function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="flex flex-col gap-2.5 mt-1">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3 items-start">
          <span className="grid place-items-center w-6 h-6 rounded-full bg-navy text-white dark:text-navy-deep text-small font-extrabold shrink-0 tnum">{i + 1}</span>
          <span className="text-small text-ink leading-snug pt-0.5">{it}</span>
        </li>
      ))}
    </ol>
  );
}

function InstallHelpSheet({ onClose }: { onClose: () => void }) {
  const p = detectPlatform();

  const content: Record<Platform, { title: string; steps: React.ReactNode[]; note?: React.ReactNode }> = {
    ios: {
      title: 'Add Vuka to your iPhone',
      steps: [
        <>Tap the <b>Share</b> button (the box with an ↑ arrow) at the bottom of Safari.</>,
        <>Scroll down and tap <b>“Add to Home Screen”</b>.</>,
        <>Tap <b>Add</b> — Vuka appears on your home screen like an app.</>,
      ],
      note: <>iPhone installs only work in <b>Safari</b> (not Chrome). Apple doesn’t allow one-tap install.</>,
    },
    android: {
      title: 'Add Vuka to your phone',
      steps: [
        <>Tap the <b>⋮</b> menu (top-right of the browser).</>,
        <>Tap <b>“Install app”</b> or <b>“Add to Home screen”</b>.</>,
        <>Tap <b>Install</b> — Vuka is added like a normal app.</>,
      ],
    },
    edge: {
      title: 'Install Vuka on your computer',
      steps: [
        <>Click the <b>install icon</b> (a small monitor/⊕ icon) at the right of the address bar,</>,
        <>…or open <b>⋯ menu → Apps → “Install this site as an app”</b>.</>,
        <>Click <b>Install</b>.</>,
      ],
    },
    desktop: {
      title: 'Install Vuka on your computer',
      steps: [
        <>Click the <b>install icon</b> (a small monitor/⊕ icon) at the right of the address bar,</>,
        <>…or open the <b>⋮ menu → “Install Vuka…”</b>.</>,
        <>Click <b>Install</b>.</>,
      ],
    },
    firefox: {
      title: 'Installing Vuka',
      steps: [
        <>Firefox can’t install web apps directly.</>,
        <>Open <b>vuka-uzenzele.onrender.com</b> in <b>Chrome, Edge (computer)</b> or <b>Safari (iPhone)</b>.</>,
        <>Then use that browser’s <b>Install</b> option.</>,
      ],
    },
  };

  const { title, steps, note } = content[p];

  return (
    <Sheet title="Install Vuka" onClose={onClose}>
      <div className="flex items-center gap-3 mb-3">
        <span className="grid place-items-center w-12 h-12 rounded-[16px] text-white text-2xl shrink-0" style={{ background: 'linear-gradient(135deg,var(--gj-navy),#123e69)' }} aria-hidden="true">V</span>
        <div>
          <h3 className="text-title font-extrabold text-navy tracking-tight m-0">{title}</h3>
          <p className="text-small text-muted m-0 mt-0.5">Works offline · no app store needed · free</p>
        </div>
      </div>
      <Steps items={steps} />
      {note && <p className="text-small text-muted leading-snug mt-4 bg-surface-2 rounded-xl px-3 py-2.5">💡 {note}</p>}
      <Button block variant="ghost" className="mt-5" onClick={onClose}>Got it</Button>
    </Sheet>
  );
}
