import type { Lang } from '../../i18n';
import type { MsiziLang } from './types';
import { msiziEn } from './en';
import { msiziZu } from './zu';
import { msiziXh } from './xh';
import { msiziSt } from './st';
import { msiziAf } from './af';

export type { MsiziLang } from './types';

/** Msizi's words, per app language. English written answers are in data/msizi.ts. */
export const MSIZI_LANGS: Record<Lang, MsiziLang> = { en: msiziEn, zu: msiziZu, xh: msiziXh, st: msiziSt, af: msiziAf };
