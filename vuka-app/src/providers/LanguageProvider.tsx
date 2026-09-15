import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  coverage,
  detectLang,
  langMeta,
  persistLang,
  translate,
  type Lang,
  type LangMeta,
  type Vars,
} from '../i18n';

interface LanguageValue {
  lang: Lang;
  meta: LangMeta;
  /** How much of the catalogue this language actually has, 0–100. */
  coverage: number;
  setLang: (lang: Lang) => void;
  t: (key: string, vars?: Vars) => string;
}

const LanguageContext = createContext<LanguageValue | null>(null);

/**
 * Wraps the app in a language.
 *
 * Sits ABOVE AppProvider in main.tsx, because the store raises toasts that
 * need translating and nothing in here depends on the store.
 *
 * `document.documentElement.lang` is kept in step. That is not decoration: it
 * is what a screen reader uses to choose a voice, and what the browser uses to
 * pick hyphenation. Getting it wrong makes isiZulu read aloud in an English
 * accent.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => detectLang());

  useEffect(() => {
    const meta = langMeta(lang);
    document.documentElement.lang = meta.tag;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    persistLang(next);
  }, []);

  /* t is rebuilt only when the language changes, so a component that depends
     on it does not re-render on every parent render. */
  const t = useCallback((key: string, vars?: Vars) => translate(lang, key, vars), [lang]);

  const value = useMemo<LanguageValue>(
    () => ({ lang, meta: langMeta(lang), coverage: coverage(lang), setLang, t }),
    [lang, setLang, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
}

/** The common case: `const t = useT()` then `t('nav.home')`. */
export function useT(): (key: string, vars?: Vars) => string {
  return useLanguage().t;
}
