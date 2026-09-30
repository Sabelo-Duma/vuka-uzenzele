/* ============================================================
   The server's words, in the language of the person reading them.

   The app is in five languages; until now everything the server said — an
   error on the sign-in screen, a notification, an SMS — was English. Two
   different moments need translating:

   · A reply to a request. The app sends X-Vuka-Lang on every call, so the
     error goes back in the language of the screen that asked.
   · A message to somebody who did not ask (push, SMS, the bell). Their
     language is whatever their app last told us, remembered per account.

   English is the key. Every message the server can say is listed in
   messages.mjs exactly as the code writes it, with {placeholders} where the
   code interpolates a name or an amount. A translation is looked up by that
   English text; a templated one is matched by pattern, its values carried
   across (and translated too, when a value is itself a known phrase such as
   "A worker"). Anything unknown stays English — a missing translation can
   never turn a message blank or break a request.

   Not written by first-language speakers; a correction wins.
   ============================================================ */
import { MESSAGES } from './messages.mjs';
import { zu } from './zu.mjs';
import { xh } from './xh.mjs';
import { st } from './st.mjs';
import { af } from './af.mjs';

export const LANG_CODES = ['en', 'zu', 'xh', 'st', 'af'];
const TABLES = { zu, xh, st, af };

export const isLang = (v) => typeof v === 'string' && LANG_CODES.includes(v);

/** The language a request was made in. */
export function langOf(req) {
  const h = String(req.headers?.['x-vuka-lang'] ?? '').toLowerCase().slice(0, 5);
  return isLang(h) ? h : 'en';
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const namesIn = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);

/* Templated messages, longest first, so "…updated. R{amount} is in your
   wallet." is tried before "…updated.". */
const TEMPLATES = MESSAGES.filter((m) => /\{\w+\}/.test(m))
  .sort((a, b) => b.length - a.length)
  .map((en) => ({
    en,
    names: namesIn(en),
    re: new RegExp(`^${en.split(/\{\w+\}/).map(escape).join('(.+?)')}$`, 's'),
  }));
const LITERAL = new Set(MESSAGES.filter((m) => !/\{\w+\}/.test(m)));

/** `text` (English, as the code produced it) in `lang`. */
export function localize(lang, text, depth = 0) {
  if (!text || lang === 'en' || !TABLES[lang] || typeof text !== 'string') return text;
  const table = TABLES[lang];
  if (LITERAL.has(text)) return table[text] || text;
  if (depth > 1) return text;
  for (const t of TEMPLATES) {
    const m = t.re.exec(text);
    if (!m) continue;
    const out = table[t.en];
    if (!out) return text;
    const vars = {};
    t.names.forEach((n, i) => { vars[n] = localize(lang, m[i + 1], depth + 1); });
    return out.replace(/\{(\w+)\}/g, (whole, n) => (n in vars ? vars[n] : whole));
  }
  return text;
}

/**
 * Express middleware: any JSON reply carrying an `error` goes back in the
 * language of the request.
 */
export function localizeErrors(req, res, next) {
  const lang = langOf(req);
  if (lang !== 'en') {
    const json = res.json.bind(res);
    res.json = (body) => {
      if (body && typeof body === 'object' && typeof body.error === 'string') {
        body = { ...body, error: localize(lang, body.error) };
      }
      return json(body);
    };
  }
  next();
}
