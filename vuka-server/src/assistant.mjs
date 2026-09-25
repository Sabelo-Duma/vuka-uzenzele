/* ============================================================
   Msizi's second brain — a free language model, on a short leash.

   The app answers most questions on its own, from the written knowledge base
   in vuka-app/src/data/msizi.ts. That stays the first and trusted path. This
   module handles what that path cannot: questions phrased in a way no entry
   anticipated, follow-ups ("and how long does that take?"), and questions in
   isiZulu, isiXhosa or Sesotho that the alias table does not recognise.

   ------------------------------------------------------------
   Why this is allowed now when it was refused before.

   The first Msizi refused a model for two reasons: cost, and a model
   describing how payment "usually" works on gig apps instead of how it works
   here. Both are handled here rather than waved away:

   COST. Only free tiers, never a card on file. Groq's free tier (no payment
   method, no training on API data) is the default; Google's Gemini free tier
   is an optional second. If neither key is set, or both are over their daily
   quota, this answers 503 and the app falls back to the knowledge base — the
   app never breaks for want of a model. A daily cap sits below the provider's
   own so that one busy day does not burn the quota by lunchtime.

   ACCURACY. The model is never asked what it knows. It is handed:
     · the non-negotiable facts below, which are true of this codebase, and
     · the knowledge-base entries nearest the question, chosen by the app,
   and told to answer ONLY from those, and to say plainly when they do not
   cover the question. The facts lead with the payment one on purpose.

   PRIVACY (POPIA). What leaves the server is the question, the last couple of
   turns, and public help text — never the person's record, name, earnings or
   phone. Long digit runs (ID numbers, phone numbers, account numbers) are
   masked before sending, because people type those into help boxes.
   ============================================================ */

const LANGS = {
  en: 'English',
  zu: 'isiZulu',
  xh: 'isiXhosa',
  st: 'Sesotho',
  af: 'Afrikaans',
};

/* ---- providers ---------------------------------------------------------

   Both speak the OpenAI chat-completions shape, so one code path serves
   either. Order is preference: Groq first because its free tier does not use
   API traffic for training; Gemini's free tier does, which is why it is the
   fallback and not the default. */

function providers() {
  const list = [];
  const groq = process.env.VUKA_GROQ_API_KEY?.trim();
  if (groq) {
    list.push({
      name: 'groq',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      key: groq,
      model: process.env.VUKA_GROQ_MODEL?.trim() || 'openai/gpt-oss-120b',
      extra: { reasoning_effort: 'low' },
    });
  }
  const gemini = process.env.VUKA_GEMINI_API_KEY?.trim();
  if (gemini) {
    list.push({
      name: 'gemini',
      url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      key: gemini,
      model: process.env.VUKA_GEMINI_MODEL?.trim() || 'gemini-2.5-flash',
      extra: {},
    });
  }
  return list;
}

export const aiConfigured = () => providers().length > 0;

/* ---- budget ------------------------------------------------------------

   In memory, like the rate limiters: one instance, and a restart forgiving
   the count is harmless. Groq's free tier allows about 1,000 requests a day
   per model; staying under that keeps the last person of the day answered. */

const DAILY_CAP = Number(process.env.VUKA_AI_DAILY_CAP || 900);
const PER_USER_DAILY = Number(process.env.VUKA_AI_PER_USER_DAILY || 60);

let budgetDay = '';
let usedToday = 0;
const perUser = new Map();

function spend(userId) {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== budgetDay) { budgetDay = today; usedToday = 0; perUser.clear(); }
  if (usedToday >= DAILY_CAP) return 'daily';
  const mine = perUser.get(userId) ?? 0;
  if (mine >= PER_USER_DAILY) return 'user';
  usedToday += 1;
  perUser.set(userId, mine + 1);
  return null;
}

export function aiStats() {
  return { configured: aiConfigured(), usedToday, dailyCap: DAILY_CAP };
}

/* ---- privacy ------------------------------------------------------------ */

/** Mask anything that looks like an ID, phone or account number, and emails. */
export function redact(text) {
  return String(text ?? '')
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[email]')
    .replace(/\+?\d[\d\s-]{5,}\d/g, '[number]')
    .slice(0, 600);
}

/* ---- the brief --------------------------------------------------------- */

/**
 * True of this codebase. Each line is here because a plausible model answer
 * would contradict it. Change one only after checking the code that it
 * describes.
 */
const FACTS = [
  'Vuka Uzenzele ("Vuka") is a free South African app that connects people looking for work with gigs (short jobs like cleaning, gardening, dog-walking, moving help, errands, car washing) and formal jobs.',
  'HOW PAYMENT WORKS (escrow, see escrow.mjs): the employer secures the full pay for a job in Vuka before anyone is hired — when posting it, or later. Workers see "Funds secured" on a job before they apply. Nobody can be hired onto a job until its pay is secured.',
  'Until a worker is hired, the employer can take the funds back at no fee. From the moment someone is hired, the funds are locked for that worker and cannot be taken back.',
  'When the employer confirms the job — or automatically, if they never answer within the confirmation window — the pay moves into the worker\'s Vuka wallet, and the job is added to their record ("My Record"). The worker withdraws from the wallet to the bank account saved under "Me".',
  'PAYMENTS ARE IN TEST MODE. No real money moves yet: funding, the wallet and withdrawals are a practice run until a payment provider is connected. Whenever you explain payments, say that it is test mode.',
  'My Record is a verified work CV built from completed, confirmed jobs. The Vuka Score, tiers on "The Ladder", badges and star ratings come from it.',
  'Workers find work under "Find work", apply with one tap, chat with employers in "Chats", and see their record in "My Record". Settings, language, ID verification, banking details and job alerts are under "Me".',
  'Employers post a job with the + button, choose from applicants, and confirm the work afterwards.',
  'Safety: meet in daylight where possible, tell someone where you are going, never pay money to get a job — any "job" asking the worker for a fee is a scam. Report or block anyone from their profile or chat. In danger, phone the police on 10111, or 112 from a cellphone.',
  'Msizi (isiZulu "umsizi" = helper) is the in-app helper. It can explain and look things up, but it cannot apply, hire, post, pay or change anything on anyone\'s behalf.',
];

function systemPrompt(lang) {
  const language = LANGS[lang] ?? 'English';
  return [
    'You are Msizi, the warm, patient helper inside the Vuka Uzenzele app in South Africa.',
    'The person you are talking to may be looking for their first job and may be reading in their second or third language.',
    '',
    'RULES — follow all of them:',
    `1. Reply in ${language}. If they wrote in a different South African language, reply in the language they wrote in.`,
    '2. Answer ONLY from the FACTS and the HELP ENTRIES below. Do not use outside knowledge about Vuka or about other apps.',
    '3. If the facts and entries do not answer the question, say honestly that you are not sure, and suggest where in the app to look or what they could ask instead. Never invent a feature, a figure, an amount, a law or a time limit.',
    '4. Never quote a rand amount, wage or number of hours unless it appears word for word in the entries.',
    '5. If the question has nothing to do with Vuka, work or safety, answer in one friendly sentence at most and steer back to what you can help with.',
    '6. Keep it short: two to five plain sentences, or a few lines starting with "• ". No markdown, no headings, no bold, no emoji, no links.',
    '7. Talk like a kind person, not a manual. Use "you". Your answer may be read out loud, so write it to be spoken.',
    '8. You cannot take any action in the app. If asked to, explain where they can do it themselves.',
    '9. If someone says they are in danger, tell them to phone 10111 (or 112 from a cellphone) first.',
    '',
    'FACTS:',
    ...FACTS.map((f) => `- ${f}`),
  ].join('\n');
}

function entriesBlock(entries) {
  if (!entries.length) return 'HELP ENTRIES: (none matched this question)';
  return ['HELP ENTRIES:', ...entries.map((e) => `## ${e.title}\n${e.body}`)].join('\n\n');
}

/** Take the client's entries, but only in a shape and size that we choose. */
function cleanEntries(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 5).map((e) => ({
    title: String(e?.title ?? '').slice(0, 120),
    body: String(e?.body ?? '').slice(0, 1500),
  })).filter((e) => e.title && e.body);
}

function cleanHistory(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.slice(-3).map((t) => ({
    q: redact(t?.q).slice(0, 300),
    a: String(t?.a ?? '').slice(0, 600),
  })).filter((t) => t.q);
}

/** Models sometimes ignore "no markdown". The app renders plain text only. */
export function tidy(text) {
  return String(text ?? '')
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*]\s+/gm, '• ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * The last line of defence on how payment works. Models reach for the most
 * common gig-app pattern, and for Vuka both of these are wrong:
 *
 *  · "the employer pays you directly / in cash" or "Vuka does not handle the
 *    money" — the old model. Pay is secured in escrow before anyone is hired.
 *  · "the employer can cancel and take the money back" once someone is hired —
 *    it is locked from the moment of hiring.
 *
 * A reply making either claim is replaced, not edited.
 */
const OLD_MODEL = /\b(pays? (you|the worker|workers) (directly|in cash|cash)|paid directly by the employer|vuka (does not|doesn.t|never|won.t) (hold|handle|process|touch|keep)s?\b)/i;
const LATE_REVERSAL = /\b(after|once|even after)\b[^.]{0,40}\bhired\b[^.]{0,60}\b(take|get|pull|withdraw|reverse)s?\b[^.]{0,20}\b(back|refund|money|funds)\b/i;

export function violatesFacts(text) {
  if (OLD_MODEL.test(text)) return true;
  const late = text.match(LATE_REVERSAL)?.[0];
  return !!late && !/\b(not|never|cannot|can.t|no longer|locked)\b/i.test(late);
}

const ESCROW_ANSWER =
  'The employer secures the full pay for the job in Vuka before anyone is hired, and you can see "Funds secured" on the job before you apply. '
  + 'Until someone is hired the employer can take the funds back for free; once you are hired they are locked for you. '
  + 'When the employer confirms the job, or automatically if they never answer, the pay moves into your Vuka wallet and you withdraw it to your bank account.';

/* Said whenever money comes up, in the language of the answer, because it is
   true right now and a person deciding whether to take a job needs it. */
const TEST_NOTE = {
  en: 'Payments are in test mode for now, so no real money moves yet.',
  zu: 'Izinkokhelo zisesimweni sokuhlola okwamanje, ngakho ayikho imali yangempela edluliswayo okwamanje.',
  xh: 'Iintlawulo zikwimo yovavanyo okwangoku, ngoko akukho mali yokwenyani ihambayo okwangoku.',
  st: 'Ditefo di maemong a teko hajwale, kahoo ha ho chelete ya nnete e fetisetswang hajwale.',
  af: 'Betalings is vir eers in toetsmodus, so geen regte geld beweeg nog nie.',
};
const MONEY_WORDS = /\b(pay|paid|payment|money|funds?|wallet|withdraw|escrow|secured|rand|imali|chelete|geld|betaal|umholo|moputso|ukukhokhelwa)\b/i;
const HAS_TEST_NOTE = /test mode|\btest\b|practice|no real money|toetsmodus|hlola|vavanyo|\bteko\b/i;

/** Append the test-mode note to any answer about money that lacks one. */
export function withTestNote(text, lang = 'en') {
  if (!MONEY_WORDS.test(text) || HAS_TEST_NOTE.test(text)) return text;
  return `${text}\n${TEST_NOTE[lang] ?? TEST_NOTE.en}`;
}

async function callProvider(p, messages) {
  const res = await fetch(p.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p.key}` },
    body: JSON.stringify({
      model: p.model,
      messages,
      temperature: 0.3,
      max_tokens: 700,
      ...p.extra,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    const err = new Error(`${p.name} ${res.status}: ${detail.slice(0, 200)}`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? '';
}

/**
 * Answer one question. Resolves to { answer, provider } or throws an Error
 * with `.code` of 'not_configured' | 'over_budget' | 'unavailable'.
 */
export async function askAssistant({ userId, question, lang, entries, history }) {
  const list = providers();
  if (list.length === 0) throw Object.assign(new Error('AI not configured'), { code: 'not_configured' });

  const over = spend(userId);
  if (over) throw Object.assign(new Error(`AI budget reached (${over})`), { code: 'over_budget' });

  const safeLang = LANGS[lang] ? lang : 'en';
  const messages = [
    { role: 'system', content: `${systemPrompt(safeLang)}\n\n${entriesBlock(cleanEntries(entries))}` },
  ];
  for (const turn of cleanHistory(history)) {
    messages.push({ role: 'user', content: turn.q });
    if (turn.a) messages.push({ role: 'assistant', content: turn.a });
  }
  messages.push({ role: 'user', content: redact(question) });

  let lastError = null;
  for (const p of list) {
    try {
      const answer = tidy(await callProvider(p, messages));
      if (!answer) throw new Error(`${p.name}: empty answer`);
      if (violatesFacts(answer)) {
        return { provider: p.name, answer: withTestNote(ESCROW_ANSWER, 'en') };
      }
      return { answer: withTestNote(answer, safeLang), provider: p.name };
    } catch (e) {
      lastError = e;
    }
  }
  throw Object.assign(new Error(lastError?.message ?? 'AI unavailable'), { code: 'unavailable', cause: lastError });
}
