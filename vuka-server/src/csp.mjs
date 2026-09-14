/* ============================================================
   Content Security Policy.

   This was off. `helmet({ contentSecurityPolicy: false })`, with a comment
   explaining that a strict CSP would break the SPA — which was true of a
   strict one, and became the reason there was no policy at all. The result:
   the single most effective mitigation against cross-site scripting was
   absent from a service that stores ID numbers, bank account details and
   private conversations, and which renders employer-supplied text (job titles,
   descriptions, names) on the screens of strangers.

   React escapes what it interpolates, so this is defence in depth rather than
   the only thing standing between a user and an injected script. Defence in
   depth is the point: the day something gets through — a dangerouslySetInnerHTML
   added in a hurry, a dependency with a bad release — the policy is what stops
   an injected tag from loading anything or phoning anywhere.

   The awkward part, and why this file exists.

   index.html carries one inline script: the theme bootstrap, which has to run
   before first paint or someone who keeps their phone in dark mode gets a
   white flash on every cold start. Inline scripts are exactly what a CSP is
   for, so it needs either a nonce or a hash.

     · a nonce means templating index.html on every navigation, so the shell
       can no longer be sent with sendFile and has to be re-rendered per request
     · a hard-coded hash rots the moment the bootstrap changes, and the failure
       is a blank app rather than a test going red
     · moving the script to its own file costs a blocking round trip before
       first paint, on the connections least able to afford one

   So the hash is computed at boot from the file actually being served. Change
   the bootstrap, rebuild, restart: the policy follows. Nothing to remember.
   ============================================================ */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

/** Where the built front-end lives, when this service is also serving it. */
export const STATIC_DIR = process.env.VUKA_STATIC || join(here, '..', '..', 'vuka-app', 'dist');

/** Scripts written into the HTML itself, as opposed to loaded with src=. */
const INLINE_SCRIPT = /<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi;

/* Spelled out rather than escaped. These are the characters the HTML parser
   collapses before a script has any text at all, and they are the reason the
   hash below is not simply a digest of the file. */
const CR = String.fromCharCode(13);
const LF = String.fromCharCode(10);
const CRLF = CR + LF;

/**
 * A CSP hash source for every inline script in the served index.html.
 *
 * The digest is over the script's text, whitespace included — so a reformat
 * changes the hash, and the policy is regenerated on the next boot to match.
 *
 * With one correction that is not optional and is invisible until it bites:
 * **newlines have to be normalised first.** The HTML parser rewrites every
 * CRLF and lone CR to a single LF before the script's text exists, and it is
 * that text a browser hashes. Every file in this repository is CRLF, so
 * hashing the bytes off disk produced a hash no browser would ever compute —
 * a policy that looked correct, and blocked the one script it was written to
 * allow. The symptom would have been the app not starting.
 */
function inlineScriptHashes() {
  const index = join(STATIC_DIR, 'index.html');
  if (!existsSync(index)) return [];
  const html = readFileSync(index, 'utf8');
  const hashes = [];
  for (const [, body] of html.matchAll(INLINE_SCRIPT)) {
    if (!body) continue;
    const asParsed = body.split(CRLF).join(LF).split(CR).join(LF);
    hashes.push(`'sha256-${createHash('sha256').update(asParsed, 'utf8').digest('base64')}'`);
  }
  return hashes;
}

/**
 * The policy.
 *
 * Every source here is something the app demonstrably loads. Nothing is opened
 * up speculatively, because a directive nobody needs is a directive nobody
 * removes.
 */
export function cspDirectives() {
  const scriptHashes = inlineScriptHashes();
  return {
    defaultSrc: ["'self'"],

    /* Same-origin bundles, plus the measured hash of the theme bootstrap.
       No 'unsafe-inline' and no 'unsafe-eval': the Vite production build needs
       neither, and allowing either would leave the directive decorative. */
    scriptSrc: ["'self'", ...scriptHashes],

    /* 'unsafe-inline' is genuinely required here and is a much smaller
       concession than it sounds. React sets element style attributes directly —
       a voice note's waveform bars, an upload's progress width — and those are
       governed by style-src-attr, which falls back to this. Injected CSS can
       deface a page; it cannot exfiltrate a session the way a script can. */
    styleSrc: ["'self'", "'unsafe-inline'"],

    /* blob: is how attachments are shown. A photo is fetched with the session's
       Authorization header, turned into an object URL and handed to an <img>,
       because a media element cannot send that header itself. data: covers the
       inline SVG favicon. */
    imgSrc: ["'self'", 'data:', 'blob:'],

    /* Voice notes, for the same reason — and it keeps Safari out of the
       byte-range negotiation it insists on with a real URL. */
    mediaSrc: ["'self'", 'blob:'],

    // The typefaces are bundled and served from this origin. Nothing external.
    fontSrc: ["'self'"],

    /* The API and the live event stream, both same-origin. Split deployments
       set VUKA_API_ORIGIN so the front-end can still reach its own API. */
    connectSrc: ["'self'", ...(process.env.VUKA_API_ORIGIN ? [process.env.VUKA_API_ORIGIN] : [])],

    // The service worker, which carries offline support and push.
    workerSrc: ["'self'", 'blob:'],
    manifestSrc: ["'self'"],

    // Nothing here is a plugin, a frame, or a form that posts off-site.
    objectSrc: ["'none'"],
    frameSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],

    /* Stricter than the X-Frame-Options helmet already sets. Vuka is never
       framed, by itself or anyone — and clickjacking a hire button or a
       "delete my account" confirmation is a real thing to want to prevent. */
    frameAncestors: ["'none'"],

    upgradeInsecureRequests: [],
  };
}

/** True when the hash could actually be computed — i.e. there is a build to serve. */
export const cspCoversInlineScripts = () => inlineScriptHashes().length > 0;
