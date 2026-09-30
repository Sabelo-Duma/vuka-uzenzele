import { Fragment, useEffect, useState, type ReactNode } from 'react';
import { Icon } from './Icon';
import { useT } from '../providers/LanguageProvider';
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
  const t = useT();
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
        <Icon name="plus" size={16} /> {t('onboarding.install.button')}
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

/**
 * A translated sentence with {placeholders} filled by JSX (bold labels, the
 * glyph). One key per sentence, so word order can move in every language.
 */
function Rich({ text, parts }: { text: string; parts: Record<string, ReactNode> }) {
  return (
    <>
      {text.split(/(\{\w+\})/).map((seg, i) => {
        const name = /^\{(\w+)\}$/.exec(seg)?.[1];
        return <Fragment key={i}>{name && name in parts ? parts[name] : seg}</Fragment>;
      })}
    </>
  );
}

/* Labels printed by the browser itself, quoted so people can find them. They
   are the browser's words, not ours, so they stay as the browser shows them. */
const BROWSER_LABEL = {
  share: 'Share', // i18n-ignore: Safari's own button label
  addHomeIos: '“Add to Home Screen”', // i18n-ignore: Safari's own menu label
  add: 'Add', // i18n-ignore: Safari's own button label
  installApp: '“Install app”', // i18n-ignore: Chrome's own menu label
  addHomeAndroid: '“Add to Home screen”', // i18n-ignore: Chrome's own menu label
  install: 'Install', // i18n-ignore: the browser's own button label
  edgePath: '⋯ → Apps → Install this site as an app', // i18n-ignore: Edge's own menu path
  chromePath: '⋮ → Cast, save and share → Install page as app', // i18n-ignore: Chrome's own menu path
};

function InstallHelpSheet({ onClose }: { onClose: () => void }) {
  const t = useT();
  const p = detectPlatform();
  const b = (s: ReactNode) => <b>{s}</b>;
  const desktopStep = (
    <Rich
      text={t('onboarding.install.desktopStep')}
      parts={{ icon: b(t('onboarding.install.installIcon')), glyph: <InstallGlyph />, install: b(BROWSER_LABEL.install) }}
    />
  );

  const content: Record<Platform, { title: string; steps: React.ReactNode[]; note?: React.ReactNode }> = {
    ios: {
      title: t('onboarding.install.iosTitle'),
      steps: [
        <Rich text={t('onboarding.install.iosStep1')} parts={{ share: b(BROWSER_LABEL.share) }} />,
        <Rich text={t('onboarding.install.iosStep2')} parts={{ addHome: b(BROWSER_LABEL.addHomeIos) }} />,
        <Rich text={t('onboarding.install.iosStep3')} parts={{ add: b(BROWSER_LABEL.add) }} />,
      ],
      note: <Rich text={t('onboarding.install.iosNote')} parts={{ safari: b('Safari') }} />,
    },
    android: {
      title: t('onboarding.install.androidTitle'),
      steps: [
        <Rich text={t('onboarding.install.androidStep1')} parts={{ menu: b('⋮') }} />,
        <Rich text={t('onboarding.install.androidStep2')} parts={{ installApp: b(BROWSER_LABEL.installApp), addHome: b(BROWSER_LABEL.addHomeAndroid) }} />,
        <Rich text={t('onboarding.install.androidStep3')} parts={{ install: b(BROWSER_LABEL.install) }} />,
      ],
    },
    edge: {
      title: t('onboarding.install.desktopTitle'),
      steps: [desktopStep],
      note: <Rich text={t('onboarding.install.noIcon')} parts={{ path: b(BROWSER_LABEL.edgePath) }} />,
    },
    desktop: {
      title: t('onboarding.install.desktopTitle'),
      steps: [desktopStep],
      note: <Rich text={t('onboarding.install.noIcon')} parts={{ path: b(BROWSER_LABEL.chromePath) }} />,
    },
    firefox: {
      title: t('onboarding.install.firefoxTitle'),
      steps: [
        <>{t('onboarding.install.firefoxStep1')}</>,
        <Rich
          text={t('onboarding.install.firefoxStep2')}
          parts={{ site: b('vuka-uzenzele.onrender.com'), desktop: b(t('onboarding.install.browsersDesktop')), iphone: b(t('onboarding.install.browsersIphone')) }}
        />,
        <Rich text={t('onboarding.install.firefoxStep3')} parts={{ install: b(BROWSER_LABEL.install) }} />,
      ],
    },
  };

  const { title, steps, note } = content[p];

  return (
    <Sheet title={t('onboarding.install.sheetTitle')} onClose={onClose}>
      <div className="flex items-center gap-3 mb-3">
        <SunMark size={48} variant="tile" />
        <div>
          <h3 className="font-display text-title font-extrabold text-ink tracking-tight m-0">{title}</h3>
          <p className="text-small text-dim m-0 mt-0.5">{t('onboarding.install.tagline')}</p>
        </div>
      </div>
      <Steps items={steps} />
      {note && <p className="text-small text-dim leading-snug mt-4 bg-surface-2 rounded-chip px-3.5 py-3">{note}</p>}
      {/* Installing is the browser's gesture, not ours: there is no file to
          download, and a page can only ask when the browser offers. Saying so
          beats leaving someone to wonder why the button gave instructions. */}
      {(p === 'desktop' || p === 'edge') && (
        <p className="text-micro text-faint leading-snug mt-3">
          {t('onboarding.install.manualNote')}
        </p>
      )}
      <Button block variant="ghost" className="mt-5" onClick={onClose}>{t('onboarding.install.gotIt')}</Button>
    </Sheet>
  );
}
