import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { LANGS, type Lang } from '../i18n';
import { useLanguage } from '../providers/LanguageProvider';
import { Icon } from './Icon';

/**
 * Language switch for people who are not signed in yet (landing page, sign-up
 * and sign-in), so the whole first experience can be had in their language.
 *
 * Each option shows the language's own name with the English name underneath:
 * someone who picked a language they cannot read has to be able to find their
 * way back.
 *
 * `compact`: below the sm breakpoint the button shows the globe and a two-letter
 * code instead of the full name, for headers that are already full at 360px.
 */
export function LanguagePicker({ compact = false, align = 'right', className = '', hover = 'hover:bg-surface-2' }: {
  compact?: boolean;
  /** Which edge of the button the menu lines up with. 'left' when the button
      sits away from the right edge (the landing header at 360px), so the menu
      opens into the screen rather than off it. */
  align?: 'left' | 'right';
  className?: string;
  /** Hover fill for the button: it must differ from the header it sits on. */
  hover?: string;
}) {
  const { lang, meta, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);
  const listId = useId();

  const current = Math.max(0, LANGS.findIndex((l) => l.id === lang));

  /* Close on a tap or click anywhere outside. */
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  /* Keep keyboard focus on the highlighted option while the list is open. */
  useEffect(() => {
    if (open) optionRefs.current[active]?.focus();
  }, [open, active]);

  const openList = (at = current) => { setActive(at); setOpen(true); };
  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) buttonRef.current?.focus();
  };
  const choose = (id: Lang) => {
    setLang(id);
    close();
  };

  const onButtonKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      openList(e.key === 'ArrowUp' ? LANGS.length - 1 : current);
    }
  };

  const onListKey = (e: KeyboardEvent<HTMLUListElement>) => {
    const last = LANGS.length - 1;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => (i >= last ? 0 : i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => (i <= 0 ? last : i - 1)); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
    else if (e.key === 'End') { e.preventDefault(); setActive(last); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(LANGS[active].id); }
    else if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'Tab') { close(false); }
  };

  return (
    <div ref={wrapRef} className={`relative shrink-0 ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (open ? close() : openList())}
        onKeyDown={onButtonKey}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={t('onboarding.lang.button', { language: meta.label })}
        className={`inline-flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] px-2.5 sm:px-3 rounded-chip border border-line text-ink text-small font-bold whitespace-nowrap ${hover} transition active:scale-95`}
      >
        <Icon name="globe" size={18} />
        {compact ? (
          <>
            <span aria-hidden="true" className="sm:hidden font-mono tnum">{lang.toUpperCase()}</span>
            <span aria-hidden="true" className="hidden sm:inline">{meta.label}</span>
          </>
        ) : (
          <span aria-hidden="true">{meta.label}</span>
        )}
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={t('onboarding.lang.choose')}
          tabIndex={-1}
          onKeyDown={onListKey}
          className={`absolute ${align === 'left' ? 'left-0' : 'right-0'} top-full mt-2 z-50 w-56 max-w-[calc(100vw-2rem)] p-1.5 rounded-card border border-line bg-surface text-ink shadow-e2 list-none m-0`}
        >
          {LANGS.map((l, i) => {
            const selected = l.id === lang;
            return (
              <li
                key={l.id}
                id={`${listId}-${l.id}`}
                ref={(el) => { optionRefs.current[i] = el; }}
                role="option"
                aria-selected={selected}
                tabIndex={i === active ? 0 : -1}
                onClick={() => choose(l.id)}
                onMouseEnter={() => setActive(i)}
                className={`flex items-center gap-3 min-h-[48px] px-3 py-2 rounded-chip cursor-pointer outline-none transition hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:ring-2 focus-visible:ring-brand ${selected ? 'bg-surface-2' : ''}`}
              >
                <span className="flex-1 min-w-0">
                  <span lang={l.tag} className="block text-small font-bold leading-tight">{l.label}</span>
                  {l.english !== l.label && <span lang="en" className="block text-micro text-dim leading-tight mt-0.5">{l.english}</span>}
                </span>
                <span className={`shrink-0 text-brand ${selected ? '' : 'invisible'}`} aria-hidden="true"><Icon name="check" size={16} /></span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
