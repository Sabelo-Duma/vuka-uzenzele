import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';
import { getInstallPrompt, isInstalled, onInstallChange, promptInstall } from '../lib/pwaInstall';

/** Platform-specific manual-install hint, used when the native prompt is unavailable. */
function manualHint(): string {
  if (typeof navigator === 'undefined') return '';
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'Tap the Share button, then “Add to Home Screen”.';
  if (/Android/.test(ua)) return 'Open the browser menu (⋮), then “Install app” / “Add to Home screen”.';
  if (/Edg\//.test(ua)) return 'Click the install icon in the address bar, or menu (…) → Apps → “Install this site as an app”.';
  return 'Click the install icon in the address bar, or the browser menu → “Install app”.';
}

/**
 * "Install app" button for the PWA.
 * - Uses the browser's native install prompt (captured early in lib/pwaInstall).
 * - If the browser hasn't offered one, the button reveals how to install
 *   manually for the current browser — so the option is always discoverable.
 * - Renders nothing once the app is already installed (running standalone).
 */
export function InstallButton({ className = '' }: { className?: string }) {
  // Re-render whenever install state changes (prompt captured, or app installed).
  const [, force] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => onInstallChange(() => force((n) => n + 1)), []);

  // Close the hint when clicking outside.
  useEffect(() => {
    if (!showHint) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setShowHint(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [showHint]);

  if (isInstalled()) return null;

  const onClick = async () => {
    if (getInstallPrompt()) {
      const accepted = await promptInstall();
      if (accepted) setShowHint(false);
      return;
    }
    // No native prompt available — reveal manual instructions.
    setShowHint((v) => !v);
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={onClick}
        className={`inline-flex items-center justify-center gap-2 rounded-pill bg-navy text-white dark:text-navy-deep font-bold text-[13px] px-4 py-2.5 hover:bg-navy-2 transition active:scale-95 ${className}`}
      >
        <Icon name="plus" size={16} /> Install app
      </button>
      {showHint && (
        <div
          role="tooltip"
          className="absolute bottom-full left-0 mb-2 w-64 rounded-xl border border-line bg-surface p-3 text-[12.5px] leading-relaxed text-muted shadow-e2 z-20"
        >
          <span className="font-bold text-navy">Add Vuka to your device</span>
          <p className="mt-1 mb-0">{manualHint()}</p>
        </div>
      )}
    </div>
  );
}
