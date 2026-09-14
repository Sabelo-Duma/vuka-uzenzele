import { useEffect, useState } from 'react';
import { Icon } from './Icon';
import { Button, Sheet } from './ui';
import { SunMark } from './SunMark';
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
        className={`inline-flex items-center justify-center gap-2 rounded-pill bg-ink text-canvas font-bold text-small min-h-[44px] px-4 py-2.5 hover:bg-ink transition active:scale-95 ${className}`}
      >
        <Icon name="plus" size={16} /> Install app
      </button>
      {showHelp && <InstallHelpSheet onClose={() => setShowHelp(false)} />}
    </>
  );
}

/** A drawn stand-in for the browser's own install button, so "the install
 *  icon" is something you can recognise rather than something to hunt for. */
function InstallGlyph() {
  return (
    <span className="inline-flex items-center justify-center align-middle w-6 h-6 rounded-md border border-line bg-surface-2 mx-0.5" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink">
        <rect x="3" y="4" width="18" height="13" rx="2" />
        <path d="M9 21h6M12 8v5M9.5 10.5 12 13l2.5-2.5" />
      </svg>
    </span>
  );
}

function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="flex flex-col gap-2.5 mt-1">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3 items-start">
          <span className="grid place-items-center w-6 h-6 rounded-full bg-ink text-canvas text-small font-extrabold shrink-0 font-mono tnum">{i + 1}</span>
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
        <>Click the <b>install icon</b> <InstallGlyph /> at the right of the address bar, then <b>Install</b>.</>,
      ],
      note: <>No icon there? Open <b>⋯ → Apps → Install this site as an app</b>.</>,
    },
    desktop: {
      title: 'Install Vuka on your computer',
      steps: [
        <>Click the <b>install icon</b> <InstallGlyph /> at the right of the address bar, then <b>Install</b>.</>,
      ],
      note: <>No icon there? Open <b>⋮ → Cast, save and share → Install page as app</b>.</>,
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
        <SunMark size={48} variant="tile" />
        <div>
          <h3 className="font-display text-title font-extrabold text-ink tracking-tight m-0">{title}</h3>
          <p className="text-small text-dim m-0 mt-0.5">Opens with no signal · no app store needed · free</p>
        </div>
      </div>
      <Steps items={steps} />
      {note && <p className="text-small text-dim leading-snug mt-4 bg-surface-2 rounded-chip px-3.5 py-3">💡 {note}</p>}
      {/* Installing is the browser's gesture, not ours: there is no file to
          download, and a page can only ask when the browser offers. Saying so
          beats leaving someone to wonder why the button gave instructions. */}
      {(p === 'desktop' || p === 'edge') && (
        <p className="text-micro text-faint leading-snug mt-3">
          Browsers only let a site offer one-click install once, and not at all if it is already
          installed. That is why this is a manual step rather than a button.
        </p>
      )}
      <Button block variant="ghost" className="mt-5" onClick={onClose}>Got it</Button>
    </Sheet>
  );
}
