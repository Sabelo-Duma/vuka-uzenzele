/**
 * Translation engine.
 *
 * Design notes, because the obvious shortcuts are all wrong here:
 *
 * 1. Locales are imported statically, not fetched. Vuka is a PWA that has to
 *    open with no signal, and a language the user chose must survive going
 *    offline. Five catalogues is a few tens of KB — cheaper than the service
 *    worker logic that lazy-loading would need, and with no flash of English
 *    on first paint.
 *
 * 2. Plurals go through Intl.PluralRules rather than `n === 1 ? a : b`. The
 *    hardcoded version is correct for English and an assumption everywhere
 *    else, and this app ships four other languages.
 *
 * 3. A missing key falls back to English, never to a blank. A half-translated
 *    screen is usable; an empty button is not. `missingKeys()` reports what
 *    fell back so the check script can measure it instead of guessing.
 */
import { en } from './locales/en';
import { zu } from './locales/zu';
import { xh } from './locales/xh';
import { st } from './locales/st';
import { af } from './locales/af';

export type Catalog = Record<string, string>;
export type Lang = 'en' | 'zu' | 'xh' | 'st' | 'af';

export interface LangMeta {
  id: Lang;
  /** What the language calls itself. This is what a speaker looks for. */
  label: string;
  /** English name, shown underneath — you have to be able to find your way
      back from a language you cannot read. */
  english: string;
  /** BCP 47 tag, for <html lang> and Intl. */
  tag: string;
}

export const LANGS: LangMeta[] = [
  { id: 'en', label: 'English', english: 'English', tag: 'en-ZA' },
  { id: 'zu', label: 'isiZulu', english: 'Zulu', tag: 'zu-ZA' },
  { id: 'xh', label: 'isiXhosa', english: 'Xhosa', tag: 'xh-ZA' },
  { id: 'st', label: 'Sesotho', english: 'Southern Sotho', tag: 'st-ZA' },
  { id: 'af', label: 'Afrikaans', english: 'Afrikaans', tag: 'af-ZA' },
];

export const CATALOGS: Record<Lang, Catalog> = { en, zu, xh, st, af };

export const DEFAULT_LANG: Lang = 'en';
const STORAGE_KEY = 'vuka-lang';

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && LANGS.some((l) => l.id === value);
}

export function langMeta(lang: Lang): LangMeta {
  return LANGS.find((l) => l.id === lang) ?? LANGS[0];
}

/**
 * What the device asks for, if we speak it. navigator.languages is ordered by
 * the user's own preference, so the first match wins rather than the first
 * language we happen to support.
 */
export function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLang(saved)) return saved;
  } catch {
    /* storage unavailable — fall through to the browser's own preference */
  }
  try {
    const wanted = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const raw of wanted) {
      if (!raw) continue;
      const base = raw.toLowerCase().split('-')[0];
      if (isLang(base)) return base;
    }
  } catch {
    /* no navigator (SSR, tests) */
  }
  return DEFAULT_LANG;
}

export function persistLang(lang: Lang): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* storage unavailable — the choice lasts for this session only */
  }
}

/** Keys present in English but absent (or blank) in `lang`. */
export function missingKeys(lang: Lang): string[] {
  const target = CATALOGS[lang];
  return Object.keys(en).filter((k) => {
    const v = target[k];
    return typeof v !== 'string' || v.trim() === '';
  });
}

/** 0–100, rounded. What the Language screen shows next to each option. */
export function coverage(lang: Lang): number {
  const total = Object.keys(en).length;
  if (total === 0) return 100;
  return Math.round(((total - missingKeys(lang).length) / total) * 100);
}

const pluralCache = new Map<string, Intl.PluralRules>();
function pluralRules(tag: string): Intl.PluralRules | null {
  const hit = pluralCache.get(tag);
  if (hit) return hit;
  try {
    const rules = new Intl.PluralRules(tag);
    pluralCache.set(tag, rules);
    return rules;
  } catch {
    return null;
  }
}

export interface Vars {
  [name: string]: string | number;
}

/**
 * Replace {placeholders}. Unknown names are left exactly as written rather
 * than blanked, so a typo shows up as `{nmae}` on screen instead of silently
 * deleting half a sentence.
 */
function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : whole,
  );
}

/**
 * Look up `key` in `lang`, falling back to English, then to the key itself.
 *
 * Pass `count` in `vars` to select a plural form: the lookup tries
 * `key_<category>` (one/other/few/many/zero/two) before plain `key`, so a
 * language that needs more than two forms can have them without any caller
 * changing.
 */
export function translate(lang: Lang, key: string, vars?: Vars): string {
  const primary = CATALOGS[lang] ?? en;
  const candidates: string[] = [];

  if (vars && typeof vars.count === 'number') {
    const rules = pluralRules(langMeta(lang).tag);
    const category = rules ? rules.select(vars.count) : vars.count === 1 ? 'one' : 'other';
    candidates.push(`${key}_${category}`);
    if (category !== 'other') candidates.push(`${key}_other`);
  }
  candidates.push(key);

  for (const candidate of candidates) {
    const hit = primary[candidate];
    if (typeof hit === 'string' && hit.trim() !== '') return interpolate(hit, vars);
  }
  /* `en` is a literal type so its keys are known — good for callers, but it
     cannot be indexed by an arbitrary string. The catalogue view of it can. */
  const fallback: Catalog = en;
  for (const candidate of candidates) {
    const hit = fallback[candidate];
    if (typeof hit === 'string' && hit.trim() !== '') return interpolate(hit, vars);
  }
  /* Nothing at all: show the key. Visible, greppable, and never blank. */
  return key;
}
