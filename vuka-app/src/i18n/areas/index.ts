/**
 * One file per area of the app, each holding that area's strings in all five
 * languages: { en: {...}, zu: {...}, xh: {...}, st: {...}, af: {...} }.
 *
 * Keys are prefixed with the area name, so two areas can never collide.
 * English is the source: copy it byte-for-byte from the screen it came from.
 * The other four were not written by first-language speakers (see the
 * Language screen's caveat); a first-language speaker's correction wins.
 */
import type { Catalog, Lang } from '../index';
import { onboarding } from './onboarding';
import { common } from './common';
import { worker } from './worker';
import { employer } from './employer';
import { profile } from './profile';
import { chat } from './chat';
import { msizi } from './msizi';

export type Area = Record<Lang, Catalog>;

export const AREAS: Area[] = [onboarding, common, worker, employer, profile, chat, msizi];
