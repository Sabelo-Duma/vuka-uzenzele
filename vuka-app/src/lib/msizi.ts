/* ============================================================
   Msizi — working out which question was asked.

   The job of this file is narrow and worth stating precisely: take a sentence
   somebody typed or said, and decide which of the written answers in
   data/msizi.ts it is asking for — or decide that none of them is, and say so.

   That last clause is the important one. A matcher that always returns its
   best guess will confidently answer a question about bank fraud with the page
   about branch codes. Below a confidence floor this returns a miss, and the UI
   says "I do not know that one" and offers what it does know. Being unhelpful
   is recoverable; being wrong about somebody's wages is not.

   Three things the scoring has to cope with, none of them optional here:

   1. **The question arrives in five languages.** Somebody types "ndingayifumana
      njani imali yam" and means "how do I get paid". The answers are written in
      English, so query words are mapped onto English concepts before scoring.
      This is a lookup table, not a translator — it recognises the words people
      actually reach for when asking for help, which is a much smaller set than
      a language.

   2. **Rare words carry the meaning.** "How do I" appears in most questions and
      tells us nothing; "escrow", "flag", "branch" or "tier" each nearly
      identify an answer on their own. So tokens are weighted by how rare they
      are across the knowledge base, the standard inverse-document-frequency
      idea, rather than counted equally.

   3. **Some questions are about the person asking.** "What is my score" cannot
      be answered from a written page — it needs their record. Those are handled
      as live intents that read app state, and they are scored in the same pass
      so that "how is my score calculated" (a written answer) and "what is my
      score" (a live one) can be told apart.

   Nothing here talks to a network. Everything runs on the phone, in under a
   millisecond, offline, for free.
   ============================================================ */
import { BADGES, CATEGORIES, TIERS } from '../data/catalog';
import { KNOWLEDGE, OPENERS, type KnowledgeEntry } from '../data/msizi';
import { OPERATOR } from '../data/legal';
import { HEADLINE_STATS } from '../data/stats';
import { money } from './format';
import type { CvSnapshot, Role } from '../types';
import type { Screen } from '../store/appStore';

/* ------------------------------------------------------------------
   What Msizi is allowed to know about the person asking.
   ------------------------------------------------------------------ */

export interface MsiziContext {
  role: Role;
  /** First name, for reading a figure back. Empty is fine. */
  name: string;
  /** The worker's own record. Null for employers, or before it has loaded. */
  cv: CvSnapshot | null;
  /** Fair-pay reference in force — server value, never a constant. */
  minWage: number;
  /** The employer confirmation window in force — server value. */
  autoReleaseHours: number;
  /** How many gigs this worker has applied for. */
  applied: number;
  /** Gigs currently in the feed near them. */
  gigsNearby: number;
  /** Unread direct messages. */
  unread: number;
  idVerified: boolean;
}

/* ------------------------------------------------------------------
   Filling in the figures.

   Every {placeholder} resolves from live state or from the same module the
   screens read. There are no numbers written into the answers, which is what
   stops Msizi becoming another constant that quietly goes stale each March.
   ------------------------------------------------------------------ */

function tierLines(): string {
  return TIERS.map((t) => {
    const entry = t.minJobs === 0
      ? 'the tier everyone starts on'
      : `${t.minJobs} completed jobs, ${t.minRating.toFixed(1)} stars or better, no safety flags`;
    return `• ${t.icon} ${t.name} — ${entry}. Unlocks: ${t.unlocks}`;
  }).join('\n');
}

function categoryLine(): string {
  return `• ${CATEGORIES.map((c) => c.label).join(', ')}.`;
}

function badgeLines(): string {
  return BADGES.map((b) => `• ${b.icon} ${b.label} — ${b.desc}.`).join('\n');
}

function youthFigure(): string {
  const stat = HEADLINE_STATS.find((s) => s.label.toLowerCase().includes('unemployment'));
  return stat ? stat.value : '';
}

/** Turn "{autoReleaseHours} hours" into something a person would say. */
function hoursPhrase(hours: number): string {
  if (hours % 24 === 0 && hours >= 24) {
    const days = hours / 24;
    return `${days} day${days === 1 ? '' : 's'}`;
  }
  return `${hours} hour${hours === 1 ? '' : 's'}`;
}

/** Resolve every {placeholder} in an answer body. */
export function fill(text: string, ctx: MsiziContext): string {
  return text
    .replace(/\{minWage\}/g, money(ctx.minWage))
    .replace(/\{autoReleaseHours\}/g, hoursPhrase(ctx.autoReleaseHours))
    .replace(/\{tiers\}/g, tierLines())
    .replace(/\{categories\}/g, categoryLine())
    .replace(/\{badges\}/g, badgeLines())
    .replace(/\{hosting\}/g, OPERATOR.hostingRegion)
    .replace(/\{youthUnemployment\}/g, youthFigure());
}

/* ------------------------------------------------------------------
   Questions that can only be answered from the asker's own record.
   ------------------------------------------------------------------ */

export interface LiveIntent {
  id: string;
  title: string;
  asks: string[];
  keywords?: string[];
  role?: Role;
  /** Null means "I could answer this, but there is nothing there yet". */
  resolve: (ctx: MsiziContext) => string | null;
}

const NO_RECORD =
  'You have not completed a job yet, so there is nothing on your record to read out. '
  + 'Your first completed gig starts it — after that this fills in by itself.';

export const LIVE_INTENTS: LiveIntent[] = [
  {
    id: 'my-score',
    title: 'Your Vuka Score',
    asks: ['What is my score?', 'How am I doing?', 'What is my Vuka Score right now?'],
    keywords: ['my score', 'my rep', 'my reputation', 'my points', 'how am i doing'],
    role: 'worker',
    resolve: (ctx) => {
      if (!ctx.cv || ctx.cv.jobsDone === 0) return NO_RECORD;
      const { rep, avg, jobsDone, flags } = ctx.cv;
      const parts = [`Your Vuka Score is ${rep} out of 100.`];
      parts.push(`That is built from ${jobsDone} completed job${jobsDone === 1 ? '' : 's'}, an average of ${avg.toFixed(1)} stars, and ${flags === 0 ? 'a clean safety record' : `${flags} safety flag${flags === 1 ? '' : 's'}`}.`);
      if (flags > 0) parts.push('The flag is what is holding it back, and it is also blocking your next tier.');
      else if (rep >= 85) parts.push('That is a strong record. Employers browsing talent will see you near the top.');
      return parts.join('\n');
    },
  },
  {
    id: 'my-tier',
    title: 'Your tier',
    asks: ['What is my tier?', 'What level am I?', 'How far am I from the next tier?'],
    keywords: ['my tier', 'my level', 'my rank', 'next tier', 'how far', 'my ladder'],
    role: 'worker',
    resolve: (ctx) => {
      if (!ctx.cv) return NO_RECORD;
      const { tier, nextTier, jobsToGo, ratingMet, flagBlocked, avg } = ctx.cv;
      const parts = [`You are ${tier.icon} ${tier.name} — ${tier.tagline}.`];
      parts.push(`That unlocks: ${tier.unlocks}`);
      if (!nextTier) {
        parts.push('That is the top of The Ladder. There is nothing above it.');
        return parts.join('\n');
      }
      parts.push(`Next is ${nextTier.icon} ${nextTier.name}.`);
      const blocking: string[] = [];
      if (jobsToGo > 0) blocking.push(`${jobsToGo} more completed job${jobsToGo === 1 ? '' : 's'}`);
      if (!ratingMet) blocking.push(`an average of ${nextTier.minRating.toFixed(1)} stars or better — yours is ${avg.toFixed(1)}`);
      if (flagBlocked) blocking.push('a clean record — a safety flag is blocking it');
      parts.push(blocking.length === 0
        ? 'You meet every condition for it.'
        : `You still need ${blocking.join(', and ')}.`);
      return parts.join('\n');
    },
  },
  {
    id: 'my-jobs',
    title: 'Jobs you have completed',
    asks: ['How many jobs have I done?', 'How many jobs have I completed?'],
    keywords: ['my jobs', 'jobs done', 'how many jobs', 'completed jobs', 'jobs completed'],
    role: 'worker',
    resolve: (ctx) => {
      if (!ctx.cv) return NO_RECORD;
      const { jobsDone, categoriesWorked, avg } = ctx.cv;
      if (jobsDone === 0) return NO_RECORD;
      return `You have completed ${jobsDone} job${jobsDone === 1 ? '' : 's'} on Vuka, across ${categoriesWorked} `
        + `kind${categoriesWorked === 1 ? '' : 's'} of work, at an average of ${avg.toFixed(1)} stars.`;
    },
  },
  {
    id: 'my-earnings',
    title: 'What you have earned',
    asks: ['How much have I earned?', 'What are my total earnings?'],
    keywords: ['my earnings', 'earned', 'how much have i', 'total earned', 'my money'],
    role: 'worker',
    resolve: (ctx) => {
      if (!ctx.cv || ctx.cv.jobsDone === 0) return NO_RECORD;
      return `You have earned ${money(ctx.cv.totalEarned)} from ${ctx.cv.jobsDone} completed `
        + `job${ctx.cv.jobsDone === 1 ? '' : 's'}. That is what the employers paid you directly — `
        + 'Vuka never handled it.';
    },
  },
  {
    id: 'my-badges',
    title: 'Your badges',
    asks: ['What badges do I have?', 'Which badges have I earned?'],
    keywords: ['my badges', 'my awards', 'badges earned', 'which badges'],
    role: 'worker',
    resolve: (ctx) => {
      if (!ctx.cv) return NO_RECORD;
      const earned = BADGES.filter((b) => ctx.cv?.earnedBadges.has(b.id));
      if (earned.length === 0) {
        return 'You have not earned a badge yet. The first one, First Job, arrives the moment your first gig is confirmed.';
      }
      const missing = BADGES.filter((b) => !ctx.cv?.earnedBadges.has(b.id));
      const lines = [`You have earned ${earned.length} of ${BADGES.length} badges: ${earned.map((b) => `${b.icon} ${b.label}`).join(', ')}.`];
      if (missing.length > 0) lines.push(`Still to come: ${missing.map((b) => `${b.label} (${b.desc.toLowerCase()})`).join('; ')}.`);
      return lines.join(' ');
    },
  },
  {
    id: 'my-applications',
    title: 'Jobs you have applied for',
    asks: ['How many jobs have I applied for?', 'What have I applied for?'],
    keywords: ['my applications', 'applied for', 'how many applied', 'my applies'],
    role: 'worker',
    resolve: (ctx) =>
      ctx.applied === 0
        ? 'You have not applied for anything yet. Find work shows the gigs near you, and applying is one tap.'
        : `You have applied for ${ctx.applied} gig${ctx.applied === 1 ? '' : 's'}. `
          + 'Employers see everyone who applied and choose from them, so not hearing back on one is normal — keep applying.',
  },
  {
    id: 'my-verification',
    title: 'Whether your ID is verified',
    asks: ['Am I verified?', 'Is my ID verified?'],
    keywords: ['am i verified', 'my verification', 'my id verified'],
    resolve: (ctx) =>
      ctx.idVerified
        ? 'Yes — your identity is verified, and the verified mark shows on your profile. That is one of the first things the other side looks at.'
        : 'Not yet. You can submit your South African ID number under Me to be verified. It is optional, but an employer choosing between two people will take the verified one.',
  },
  {
    id: 'jobs-near-me',
    title: 'Work near you',
    asks: ['What work is near me?', 'Are there any jobs right now?', 'How many jobs are there?'],
    keywords: ['jobs near', 'work near me', 'any jobs', 'whats available', 'jobs right now'],
    role: 'worker',
    resolve: (ctx) =>
      ctx.gigsNearby === 0
        ? 'There is nothing in your feed at the moment. New gigs are posted through the day — turn on Job alerts under Me and your phone will tell you instead of you having to check.'
        : `There ${ctx.gigsNearby === 1 ? 'is' : 'are'} ${ctx.gigsNearby} gig${ctx.gigsNearby === 1 ? '' : 's'} in your feed right now, sorted nearest first. Open Find work to see them.`,
  },
  {
    id: 'my-messages',
    title: 'Your unread messages',
    asks: ['Do I have any messages?', 'Any unread messages?'],
    keywords: ['my messages', 'unread', 'new messages', 'anyone message'],
    resolve: (ctx) =>
      ctx.unread === 0
        ? 'You have no unread messages. Anything new from an employer will show up in Chats, and your phone can tell you if Job alerts are on.'
        : `You have ${ctx.unread} unread message${ctx.unread === 1 ? '' : 's'} waiting in Chats.`,
  },
];

const LIVE_BY_ID = new Map(LIVE_INTENTS.map((i) => [i.id, i]));

/* ------------------------------------------------------------------
   Turning a sentence into comparable tokens.
   ------------------------------------------------------------------ */

/**
 * Words that appear in almost every question and identify nothing.
 *
 * Two entries are load-bearing and were arrived at the hard way.
 *
 * **Question words are stopwords.** "how", "what", "who", "where" carry no
 * information about which answer is wanted — every entry here is a question.
 * Leaving "who" in meant "who won the soccer last night" scored a confident
 * match against "Who is Msizi", because it was the only word the corpus
 * recognised and it therefore accounted for the entire question.
 *
 * **"my" is NOT a stopword, and must not become one.** It is the single word
 * separating "how is my score calculated" — a written explanation — from "what
 * is my score", which can only be answered from the asker's own record. With
 * "my" discarded, both collapse to the same two tokens and every personal
 * question returned the general page instead of the person's own number.
 */
const STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'am', 'was', 'were', 'be', 'been', 'do', 'does', 'did',
  'you', 'it', 'this', 'that', 'these', 'those', 'to', 'of', 'in', 'on', 'at', 'for',
  'and', 'or', 'but', 'if', 'so', 'as', 'with', 'from', 'by', 'about', 'me', 'your',
  'can', 'could', 'would', 'should', 'will', 'shall', 'may', 'might', 'must', 'have', 'has',
  'had', 'get', 'got', 'please', 'tell', 'know', 'want', 'need', 'there', 'here', 'now',
  'some', 'any', 'all', 'more', 'very', 'just', 'like', 'also', 'then', 'than', 'up',
  /* Question words — see above. */
  'how', 'what', 'who', 'whom', 'whose', 'when', 'where', 'why', 'which',
  /* Filler verbs. "What happens if I get a flag" was answered from "What
     happens after I apply", because both entries matched on "happens" and only
     one of them matched on anything that mattered. */
  'happen', 'mean', 'go', 'goes', 'thing', 'many', 'much', 'still', 'ever',
]);

/**
 * Words from the app's other four languages, and from how South Africans
 * actually talk, mapped onto the English concepts the answers are written in.
 *
 * This is a recognition aid, not a translation layer, and it is deliberately
 * small: the words somebody reaches for when they are stuck are a far shorter
 * list than a language. It was not written by first-language speakers — same
 * caveat the Language screen already makes about the catalogues — so treat a
 * correction from a user as authoritative over anything in here.
 *
 * Note what is absent: the question words. "kanjani", "joang" and "hoe" all
 * mean "how", and "how" is a stopword, so mapping them buys nothing. Only
 * words that name a *subject* — work, money, safety, language — earn a place.
 */
const ALIASES: Record<string, string> = {
  /* isiZulu / isiXhosa */
  umsebenzi: 'work job', msebenzi: 'work job', ukusebenza: 'work', sebenza: 'work',
  imali: 'money pay', mali: 'money pay', ukukhokha: 'pay', khokha: 'pay', khokhela: 'pay',
  usizo: 'help', siza: 'help', ngisize: 'help', ncedo: 'help', nceda: 'help',
  ithuba: 'job opportunity', amathuba: 'job opportunity',
  ukuphepha: 'safety safe', phepha: 'safety safe', khuseleko: 'safety safe',
  umholo: 'wage pay', isazisi: 'id identity', ibhange: 'bank', amaphuzu: 'score points',
  izinga: 'tier level', isitifiketi: 'certificate', ulimi: 'language',
  /* Sesotho */
  mosebetsi: 'work job', chelete: 'money pay', thusa: 'help', thuso: 'help',
  tshireletso: 'safety safe', polokeho: 'safety safe', moputso: 'wage pay',
  boemo: 'tier level', banka: 'bank', puo: 'language',
  /* Afrikaans */
  werk: 'work job', werksgeleentheid: 'job opportunity', geld: 'money pay',
  hulp: 'help', veilig: 'safety safe', veiligheid: 'safety safe',
  betaal: 'pay', betaling: 'payment', loon: 'wage pay', minimumloon: 'wage minimum',
  vlak: 'tier level', taal: 'language', rekening: 'account bank',
  verander: 'change', skep: 'create', soek: 'find search', stuur: 'send',
  aansoek: 'apply application', wagwoord: 'password', rekord: 'record',
  /* South African English, and how people actually phrase it */
  'piece': 'gig', bucks: 'money', bux: 'money', cash: 'money', bread: 'money',
  hustle: 'work job', boss: 'employer', madam: 'employer', client: 'employer',
  paid: 'pay', paying: 'pay', payment: 'pay', wages: 'wage pay', salary: 'wage pay',
  cv: 'record cv', resume: 'record cv', reference: 'record reference',
  otp: 'otp code sms', pin: 'code', signal: 'connection', airtime: 'data',
};

/** Strip accents, punctuation and case. */
function normalise(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Conservative stemming — enough to join "jobs" to "job" and "applying" to
 * "apply", and deliberately not enough to do anything clever. An aggressive
 * stemmer collapses words that mean different things, and every collapse here
 * is a wrong answer given confidently.
 */
function stem(word: string): string {
  if (word.length <= 4) return word;
  if (word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (word.endsWith('ing')) return word.slice(0, -3);
  if (word.endsWith('ed')) return word.slice(0, -2);
  if (word.endsWith('es')) return word.slice(0, -2);
  if (word.endsWith('s')) return word.slice(0, -1);
  return word;
}

/** Normalise, expand aliases, drop stopwords, stem. */
export function tokenise(text: string): string[] {
  const out: string[] = [];
  for (const raw of normalise(text).split(' ')) {
    if (!raw) continue;
    const expanded = ALIASES[raw];
    const words = expanded ? expanded.split(' ') : [raw];
    for (const w of words) {
      if (STOPWORDS.has(w)) continue;
      const s = stem(w);
      /* Checked again after stemming, so the list can hold one form of a word
         rather than every inflection of it — "happens" stems to "happen". */
      if (STOPWORDS.has(s)) continue;
      if (s.length > 1) out.push(s);
    }
  }
  return out;
}

/* ------------------------------------------------------------------
   Scoring.
   ------------------------------------------------------------------ */

interface Indexed {
  id: string;
  title: string;
  /** token -> accumulated field weight */
  weights: Map<string, number>;
  /** Normalised phrasings, precomputed — compared against on every query. */
  phrasings: string[];
  role?: Role;
  live: boolean;
}

/** How much a match in each field is worth. */
const FIELD = { ask: 3, title: 2, keyword: 2.5, body: 0.4 } as const;

function addField(weights: Map<string, number>, text: string, weight: number) {
  for (const token of tokenise(text)) {
    weights.set(token, (weights.get(token) ?? 0) + weight);
  }
}

function buildIndex(): { docs: Indexed[]; idf: Map<string, number> } {
  const docs: Indexed[] = [];

  for (const e of KNOWLEDGE) {
    const weights = new Map<string, number>();
    addField(weights, e.title, FIELD.title);
    for (const a of e.asks) addField(weights, a, FIELD.ask);
    for (const k of e.keywords ?? []) addField(weights, k, FIELD.keyword);
    addField(weights, e.body, FIELD.body);
    docs.push({ id: e.id, title: e.title, weights, phrasings: e.asks.map(normalise), role: e.role, live: false });
  }

  for (const i of LIVE_INTENTS) {
    const weights = new Map<string, number>();
    addField(weights, i.title, FIELD.title);
    for (const a of i.asks) addField(weights, a, FIELD.ask);
    for (const k of i.keywords ?? []) addField(weights, k, FIELD.keyword);
    docs.push({ id: i.id, title: i.title, weights, phrasings: i.asks.map(normalise), role: i.role, live: true });
  }

  /* Inverse document frequency. A token in nearly every entry ("job", "work")
     barely moves a score; one in a single entry ("branch", "escrow", "otp")
     very nearly decides it on its own. */
  const seen = new Map<string, number>();
  for (const d of docs) for (const token of d.weights.keys()) seen.set(token, (seen.get(token) ?? 0) + 1);
  const idf = new Map<string, number>();
  for (const [token, n] of seen) idf.set(token, Math.log(1 + docs.length / n));

  return { docs, idf };
}

const INDEX = buildIndex();

/**
 * Answers written for the other role are not hidden, only pushed down.
 *
 * A worker asking "how do I post a job" is usually confused rather than wrong,
 * and answering is kinder than a blank. But an employer's answer should never
 * outrank a worker's on a worker's phone, hence the penalty rather than a
 * filter.
 */
const OTHER_ROLE_PENALTY = 0.55;

/**
 * Below this, Msizi says it does not know.
 *
 * Tuned against check-msizi.mjs: high enough that unrelated questions fall
 * through to an honest miss, low enough that a real question phrased oddly
 * still lands. Moving it means re-running that suite, in both directions —
 * the tests assert what must match AND what must not.
 */
export const CONFIDENCE_FLOOR = 0.34;

/**
 * How much recognised weight a question needs before its score is taken at
 * face value, in inverse-document-frequency units.
 *
 * Roughly: one word unique to a single entry ("escrow", "otp", "branch") clears
 * it comfortably on its own; two or three moderately common ones clear it
 * together; and the single most common word in the knowledge base, on its own,
 * does not — which is the entire point.
 */
const EVIDENCE_TARGET = 3.2;

export interface Scored { id: string; score: number; live: boolean }

/**
 * Rank every entry against a question. Exported so the tests can see inside.
 *
 * The score is deliberately NOT clamped to 1. An earlier version was, and the
 * clamp quietly destroyed the thing it was meant to tidy: a dozen entries all
 * saturated at exactly 1.00, the sort became a no-op, and the winner was
 * whichever happened to sit earliest in the array. Every symptom looked like a
 * matching bug and none of them was.
 */
export function rank(query: string, role: Role): Scored[] {
  /* Nothing to go on at all — an empty box, or pure punctuation. Note this is
     a check on the normalised text rather than on the tokens: a question can
     tokenise to nothing and still be perfectly answerable ("Who are you?" is
     three stopwords), so an empty token list must not end the search. */
  const nq = normalise(query);
  if (nq.length === 0) return [];

  const tokens = tokenise(query);

  /* Only words the knowledge base has ever seen count toward the question's
     weight. A word we have no answer about anywhere — "weather", "soccer", or
     an isiZulu verb not in the alias table — is noise, and judging an entry
     for failing to match noise would mark every entry down equally while
     leaving their order, and therefore the winner, unchanged. Dropping them
     instead means an unanswerable question ends with nothing known at all,
     which is exactly the honest miss it should be. */
  const known = new Map<string, number>();
  for (const t of tokens) {
    const weight = INDEX.idf.get(t);
    if (weight === undefined) continue;
    known.set(t, weight);
  }

  let total = 0;
  for (const w of known.values()) total += w;

  /* Note there is no early return when nothing is known. "Who are you?" is
     every bit a real question and consists entirely of stopwords, so it has no
     tokens to score at all — it is recognised by the phrasing pass below and
     by nothing else. */

  /* The most a single field weight is worth, so that quality saturates rather
     than letting one heavily repeated keyword dominate the whole score. */
  const fieldCeiling = Math.log1p(FIELD.ask * 2);

  const out: Scored[] = [];
  for (const doc of INDEX.docs) {
    let matchedWeight = 0;
    let quality = 0;
    let hits = 0;
    for (const [token, weight] of known) {
      const field = doc.weights.get(token);
      if (field === undefined) continue;
      matchedWeight += weight;
      quality += Math.min(1, Math.log1p(field) / fieldCeiling);
      hits += 1;
    }

    /* Somebody who typed a phrasing verbatim is not guessing, and neither are
       we. An exact match ends the argument; a containment is strong evidence
       but not proof, because "how do i apply" sits inside several questions. */
    let phraseBonus = 0;
    for (const phrase of doc.phrasings) {
      if (phrase === nq) { phraseBonus = 1; break; }
      /* Both sides must be substantial. Without the length floor on the query,
         every phrase contains the empty string and a blank question matches
         the entire knowledge base at once. */
      if (phrase.length >= 10 && nq.length >= 10 && (nq.includes(phrase) || phrase.includes(nq))) {
        phraseBonus = 0.3;
        break;
      }
    }

    if (hits === 0 && phraseBonus === 0) continue;

    /* Coverage multiplied by prominence, not averaged with it.

       How much of the question this entry accounts for is only half the
       question; the other half is WHERE the matched words live. A word found
       only in body prose is weak evidence, and multiplying rather than adding
       is what keeps it weak. Without this, a question containing one word that
       happens to appear once in one body — "today", say — scored a full
       coverage of 1.0 and was answered with total confidence from an entry
       about something else entirely. */
    const coverage = total > 0 ? matchedWeight / total : 0;

    /* And then damped by how much was actually recognised, in absolute terms.

       Coverage is a ratio, so a question whose single recognised word is the
       commonest word in the whole knowledge base still scores a perfect 1.0 —
       it accounted for 100% of what we understood, which was almost nothing.
       "I was robbed at a job" was answered, confidently, with the page
       explaining why a formal job is locked, because "job" was the only word
       Msizi knew and "job" is in nearly every entry. Requiring a floor of real
       evidence is what turns that into the honest miss it has to be. */
    const evidence = Math.min(1, matchedWeight / EVIDENCE_TARGET);

    let score = hits > 0 ? coverage * (quality / hits) * evidence : 0;
    score += phraseBonus;

    if (doc.role && doc.role !== role) score *= OTHER_ROLE_PENALTY;

    out.push({ id: doc.id, score, live: doc.live });
  }

  return out.sort((a, b) => b.score - a.score);
}

/* ------------------------------------------------------------------
   The answer.
   ------------------------------------------------------------------ */

export interface MsiziReply {
  /** 'miss' means Msizi does not know — the UI must not dress it up.
      'chat' is small talk (lib/msiziChat.ts); 'ai' came from the model
      fallback and is labelled as such; 'thinking' is waiting on it. */
  kind: 'answer' | 'live' | 'miss' | 'chat' | 'ai' | 'thinking';
  id: string | null;
  title: string;
  /** Fully resolved. No placeholders survive this. */
  body: string;
  goto?: { screen: Screen; labelKey: string };
  /** Entry ids to offer as follow-up chips. */
  suggestions: string[];
  /** For the tests and for tuning. Not shown. */
  score: number;
}

/** Title and canonical phrasing for a chip, whichever kind of entry it is. */
export function lookup(id: string): { id: string; title: string; ask: string } | null {
  const k = KNOWLEDGE.find((e) => e.id === id);
  if (k) return { id, title: k.title, ask: k.asks[0] };
  const l = LIVE_BY_ID.get(id);
  if (l) return { id, title: l.title, ask: l.asks[0] };
  return null;
}

/**
 * The written entries nearest a question, resolved, for the model fallback to
 * answer from. Live intents are left out on purpose: they are built from the
 * person's own record, and that never goes to the model.
 */
export function groundingFor(query: string, ctx: MsiziContext, max = 4): { title: string; body: string }[] {
  const out: { title: string; body: string }[] = [];
  for (const r of rank(query, ctx.role)) {
    if (out.length >= max) break;
    if (r.live || r.score < 0.05) continue;
    const e = KNOWLEDGE.find((k) => k.id === r.id);
    if (e) out.push({ title: e.title, body: fill(e.body, ctx) });
  }
  /* Nothing near at all: give it the basics, so "what is this app" in words
     the index has never seen still gets a grounded answer. */
  if (out.length === 0) {
    for (const id of ['what-is-vuka', 'how-payment-works', 'is-it-safe']) {
      const e = KNOWLEDGE.find((k) => k.id === id);
      if (e) out.push({ title: e.title, body: fill(e.body, ctx) });
    }
  }
  return out;
}

/** The chips to show before anything has been asked. */
export function openers(role: Role): string[] {
  return OPENERS[role].filter((id) => lookup(id) !== null);
}

function entryReply(entry: KnowledgeEntry, ctx: MsiziContext, score: number): MsiziReply {
  const suggestions = (entry.next ?? []).filter((id) => {
    const target = KNOWLEDGE.find((e) => e.id === id) ?? LIVE_BY_ID.get(id);
    if (!target) return false;
    /* Never offer a follow-up written for the other role — the user did not
       ask for it, so there is no confusion to be generous about. */
    return !target.role || target.role === ctx.role;
  });
  return {
    kind: 'answer',
    id: entry.id,
    title: entry.title,
    body: fill(entry.body, ctx),
    goto: entry.goto,
    suggestions,
    score,
  };
}

/**
 * Answer a question.
 *
 * Never throws, never returns an empty body, and never presents a guess as an
 * answer. When it does not know, `kind` is 'miss' and `suggestions` carries the
 * nearest things it does know, so the user has somewhere to go.
 */
export function ask(query: string, ctx: MsiziContext): MsiziReply {
  const ranked = rank(query, ctx.role);
  const best = ranked[0];

  if (!best || best.score < CONFIDENCE_FLOOR) {
    /* Offer the closest few — but only ones that were genuinely close.

       An earlier version offered whatever ranked highest regardless of how low
       that was, so "who won the soccer last night" came back with the single
       suggestion "Why does Vuka want my bank details?". A near miss is a useful
       "did you mean"; a distant one is a non sequitur that makes Msizi look
       like it understood something. Anything thin is topped up with the
       openers, which are at least always sensible. */
    const near = ranked.filter((r) => r.score >= 0.2).slice(0, 3).map((r) => r.id);
    const suggestions = [...near];
    for (const id of openers(ctx.role)) {
      if (suggestions.length >= 3) break;
      if (!suggestions.includes(id)) suggestions.push(id);
    }
    return {
      kind: 'miss',
      id: null,
      title: '',
      body: '',
      suggestions,
      score: best?.score ?? 0,
    };
  }

  if (best.live) {
    const intent = LIVE_BY_ID.get(best.id);
    if (intent) {
      const body = intent.resolve(ctx);
      if (body) {
        /* Alongside a figure, offer the written answer that explains it. */
        const related = KNOWLEDGE
          .filter((e) => (e.next ?? []).includes(intent.id))
          .slice(0, 2)
          .map((e) => e.id);
        return { kind: 'live', id: intent.id, title: intent.title, body, suggestions: related, score: best.score };
      }
    }
  }

  const entry = KNOWLEDGE.find((e) => e.id === best.id);
  if (entry) return entryReply(entry, ctx, best.score);

  return { kind: 'miss', id: null, title: '', body: '', suggestions: openers(ctx.role), score: 0 };
}

/** Answer by id, for when a chip is tapped rather than a question typed. */
export function askById(id: string, ctx: MsiziContext): MsiziReply | null {
  const entry = KNOWLEDGE.find((e) => e.id === id);
  if (entry) return entryReply(entry, ctx, 1);
  const intent = LIVE_BY_ID.get(id);
  if (intent) {
    const body = intent.resolve(ctx);
    if (body) {
      const related = KNOWLEDGE.filter((e) => (e.next ?? []).includes(intent.id)).slice(0, 2).map((e) => e.id);
      return { kind: 'live', id: intent.id, title: intent.title, body, suggestions: related, score: 1 };
    }
  }
  return null;
}
