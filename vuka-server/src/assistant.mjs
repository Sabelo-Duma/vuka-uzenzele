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
import { feePercent, paystackMode, paystackOn } from './payments.mjs';

/** How money moves right now: 'card' once Paystack is switched on, else the test ledger. */
export function paymentModel() { return paystackOn() ? 'card' : 'ledger'; }

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

function spend(userId, cap = PER_USER_DAILY) {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== budgetDay) { budgetDay = today; usedToday = 0; perUser.clear(); }
  if (usedToday >= DAILY_CAP) return 'daily';
  const mine = perUser.get(userId) ?? 0;
  if (mine >= Math.min(cap, PER_USER_DAILY)) return 'user';
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
/* Card mode (payments.mjs): nothing is held anywhere. The employer's saved card
   is charged when the job is confirmed, and Paystack splits the charge: the
   full pay to the worker's bank, the fee to Vuka. */
function cardFacts() {
  const out = [
    'HOW PAYMENT WORKS (card, through Paystack, see payments.mjs): before their first hire, the employer adds a card on Paystack\'s secure page. To check the card, Paystack charges a small amount and refunds it straight away. Nothing is charged for a job when it is posted or when someone is hired.',
    `When the employer confirms the job — or automatically, if they never answer within the confirmation window — their card is charged the pay plus Vuka's fee of ${feePercent()}% of the pay, and Paystack sends the full pay straight to the worker's bank account. The job is added to the worker's record ("My Record") either way. Vuka takes nothing from the worker's pay. There is no Vuka wallet and nothing to withdraw; the money does not pass through Vuka's own account.`,
    'Workers add their bank details under "Me", then "Get paid". If they are missing when a job is confirmed, the payment waits and goes through as soon as they are added. If a card charge fails, the employer is asked to pay again from the job. Workers see what they have been paid under "Me", then "My pay".',
    'Vuka never sees or stores a full card number; Paystack keeps the card. Withdrawing a job before anyone is hired costs nothing.',
    'CASH, TIPS AND BONUSES: the app has no way to record a cash payment, a tip or a bonus. Pay on Vuka is the job\'s pay, charged to the employer\'s card when the job is confirmed (or automatically after the confirmation window), so an employer who also paid cash would pay twice. Anything extra is between the worker and the employer, outside the app.',
  ];
  if (paystackMode() !== 'live') out.push('PAYMENTS ARE IN PAYSTACK TEST MODE: only test cards work and no real money moves yet, so for now the worker and employer agree how the pay is really made. Mention test mode only when they ask how to pay, how to get paid, or why money has not arrived.');
  return out;
}

const LEDGER_HIRING = 'HIRING: once a worker is hired, the job can no longer be removed and its secured pay stays locked for that worker. If a hired worker does not arrive, the employer should message them in "Chats", and can report a problem from the Safety centre under "Me". There is no button to un-hire.';
const CARD_HIRING = 'HIRING: once a worker is hired, the job can no longer be removed and the hire cannot be undone. If a hired worker does not arrive, the employer should message them in "Chats", and can report a problem from the Safety centre under "Me". There is no button to un-hire.';

/** The facts for the payment model in force. */
export function factsFor(model = paymentModel()) {
  return FACTS.flatMap((f) => {
    if (f === LEDGER_MONEY) return model === 'card' ? cardFacts() : LEDGER_FACTS;
    if (f === LEDGER_HIRING) return [model === 'card' ? CARD_HIRING : LEDGER_HIRING];
    if (f === WHAT_IS_VUKA) return [model === 'card' ? WHAT_IS_VUKA.replace('is a free South African app', 'is a South African app, free for workers,') : f];
    return [f];
  });
}

const WHAT_IS_VUKA = 'Vuka Uzenzele ("Vuka") is a free South African app that connects people looking for work with gigs (short jobs like cleaning, gardening, dog-walking, moving help, errands, car washing) and formal jobs.';
/** Stands in FACTS for the ledger's payment lines below. */
const LEDGER_MONEY = '(payment)';
const LEDGER_FACTS = [
  'HOW PAYMENT WORKS (escrow, see escrow.mjs): the employer secures the full pay for a job in Vuka before anyone is hired — when posting it, or later. Workers see "Funds secured" on a job before they apply. Nobody can be hired onto a job until its pay is secured.',
  'Until a worker is hired, the employer can take the funds back at no fee. From the moment someone is hired, the funds are locked for that worker and cannot be taken back.',
  'When the employer confirms the job — or automatically, if they never answer within the confirmation window — the pay moves into the worker\'s Vuka wallet, and the job is added to their record ("My Record"). The worker withdraws from the wallet to the bank account saved under "Me".',
  'PAYMENTS ARE IN TEST MODE. No real money moves yet: funding, the wallet and withdrawals are a practice run until a payment provider is connected. Whenever you explain payments, say that it is test mode.',
];

const FACTS = [
  WHAT_IS_VUKA,
  LEDGER_MONEY,
  'My Record is a verified work CV built from completed, confirmed jobs. The Vuka Score, tiers on "The Ladder", badges and star ratings come from it.',
  'Workers find work under "Find work", apply with one tap, chat with employers in "Chats", and see their record in "My Record". Settings, language, ID verification, banking details and job alerts are under "Me".',
  'Employers post a job with the + button, choose from applicants, and confirm the work afterwards.',
  'Safety: meet in daylight where possible, tell someone where you are going, never pay money to get a job — any "job" asking the worker for a fee is a scam. Report or block anyone from their profile or chat. In danger, phone the police on 10111, or 112 from a cellphone.',
  'Msizi (isiZulu "umsizi" = helper) is the in-app helper. It can explain and look things up, but it cannot apply, hire, post, pay or change anything on anyone\'s behalf. Most of its answers are written and checked; questions they do not cover are answered by AI from those same entries, and those answers are marked.',
  'ACCOUNT: the mobile number is the login and cannot be changed in the app. Under "Me" a person can change their name, email, area, languages, education and short bio. A forgotten password is reset from the log-in screen with a code sent to that number.',
  LEDGER_HIRING,
  'CONFIRMING: the employer can confirm a job only after the worker has marked it done, and must give a star rating from 1 to 5 (a written review is optional). That rating goes on the worker\'s record, so a poor rating is how poor work is recorded. Serious problems can also be reported.',
  'Employers can browse workers under "Talent", look at their record, and message them. Workers find jobs under "Find work"; if nothing shows, there may be no jobs posted near them yet, and turning on job alerts under "Me" tells them when one is.',
  'Vuka runs in the phone\'s web browser and can be added to the home screen like an app. It is built to use little data and to open with a weak signal.',
  'Vuka is a small, independent South African project. The privacy notice under "Me" says who runs it and how to ask about your data.',
];

export function systemPrompt(lang, role = 'worker') {
  const language = LANGS[lang] ?? 'English';
  const who = role === 'employer'
    ? 'The person asking is an EMPLOYER: someone who posts jobs, hires and pays. Answer from their side.'
    : 'The person asking is a WORKER: someone looking for work, applying and getting paid. Answer from their side.';
  return [
    'You are Msizi, the warm, patient helper inside the Vuka Uzenzele app in South Africa.',
    who,
    'The person you are talking to may be looking for their first job and may be reading in their second or third language.',
    '',
    'RULES — follow all of them:',
    `1. Reply in ${language}. If they wrote in a different South African language, reply in the language they wrote in.`,
    '2. Everything you say about Vuka, money, payments, laws, wages or time limits must come from the FACTS or the HELP ENTRIES below — never from what other apps usually do. For general job advice (writing a CV, an interview, what to wear, talking to an employer) you may give two or three short common-sense tips of your own, but never state a law, an amount or a Vuka feature that is not written below.',
    '3. The HELP ENTRIES were found by a word search, so they may NOT be about the question at all — "safe" finds the safety page even when someone asks about swimming. Use an entry only if it really answers what was asked. Never answer a different question from the one asked just because an entry is nearby.',
    '4. If a question is in scope (rule 6) but the facts and entries do not answer it, say plainly that you are not sure, then say where to look in the app or who to ask (for example, the employer in Chats). Never invent a feature, a button, a figure, an amount, a law or a time limit.',
    '5. Never quote a rand amount, wage or number of hours unless it appears word for word in the entries.',
    '6. You ONLY help with: Vuka and how to use it; finding, applying for and doing work (including general job advice such as CVs, interviews and fair pay in South Africa); getting paid on Vuka; the person\'s record, ratings and tiers; and staying safe at work. These are IN scope even with no written answer: being paid in cash, tips or a bonus, bringing a child or a friend to a job, getting to a job, what to wear, how to behave at a job. Sharing your record on WhatsApp, Paystack, and the bank account your pay goes into are also in scope. Anything else — sport, weather, news, general knowledge, homework, jokes, recipes, other apps, loans, grants, shopping, relationships, money owed by a partner, family or friend, and pay, work or laws in other countries — is OFF topic, even when it shares a word like "pay", "safe", "money", "bank" or "job". For an off-topic question, begin your reply with OFFTOPIC: and then write one or two warm sentences in their language: say kindly that you cannot help with that, naming it in a few words so they know you understood, and say in a few words that you can help with work, pay and safety on Vuka. If they sound upset, you may first say you are sorry they are dealing with it. Do not answer it, not even partly, not even with a tip, and do not mention any Vuka feature, screen, figure or fact in an off-topic reply. For another country, do not offer the South African figure instead.',
    '7. If part of the question is in scope and part is not, answer the in-scope part, add one short sentence that you cannot help with the rest, and do NOT start with OFFTOPIC:.',
    '8. Talk like a kind, down-to-earth person, not a manual or a call centre. Answer what they actually asked in your first sentence. Do not repeat their question back, do not start with "Great question" or "Certainly", and do not list everything you know — pick the two or three things that matter most. Use "you" and simple everyday words. Your answer may be read out loud, so write it to be spoken.',
    '9. If they sound worried, upset or frustrated, acknowledge it in a few words before you help. If the question is unclear or could mean two different things, ask one short question back instead of guessing — for example, "my CV" could mean a document they already have or their Vuka record.',
    '10. Use the conversation so far to understand short follow-ups ("and how long does that take?").',
    '11. Keep it short: one to four plain sentences, or a few lines starting with "• ". No markdown, no headings, no bold, no emoji, no links.',
    '12. You cannot take any action in the app. If asked to, explain where they can do it themselves.',
    '13. If someone says they are in danger, tell them to phone 10111 (or 112 from a cellphone) first.',
    '',
    'FACTS:',
    ...factsFor().map((f) => `- ${f}`),
  ].join('\n');
}

export function entriesBlock(entries) {
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

/**
 * The model's signal that a question is not about Vuka (rule 5). Tolerant of
 * punctuation or formatting around the word, and of a reasoning model that
 * adds a stray sentence after it — but only when the reply STARTS with it, so
 * an answer that merely mentions the word is not swallowed.
 */
export function isOffTopic(raw) {
  const t = String(raw ?? '').replace(/<think>[\s\S]*?<\/think>/g, '').trim().replace(/^[\s*_`"'\[(]+/, '');
  return /^OFF[\s_-]?TOPIC\b/i.test(t);
}

/**
 * The model's own kind "I can't help with that" after the OFFTOPIC marker —
 * it names what was asked, in the person's language, which a fixed sentence
 * cannot. Empty when there is none, or when what follows is not a decline at
 * all (a model that answered anyway): the app then says its own.
 */
export function offTopicReply(raw) {
  const t = String(raw ?? '').replace(/<think>[\s\S]*?<\/think>/g, '').trim()
    .replace(/^[\s*_`"'\[(]+/, '').replace(/^OFF[\s_-]?TOPIC\b[\s:.\-—–*_`"'\])]*/i, '');
  const text = tidy(t);
  if (!text || text.length > 400 || /\d{2,}/.test(text)) return '';
  return text;
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
    /* No emoji: the app does not show them in answers, and a voice reads them out. */
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '')
    .replace(/[ \t]{2,}/g, ' ')
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
/* "after hiring", "once they are hired", "after you hire" — and the claim that
   money can then be taken or got back. The negation is looked for only
   between the hiring and the claim, so "not" elsewhere cannot excuse it. */
const LATE_REVERSAL = /\b(after|once|even after)\b[^.]{0,40}\bhir(e|ed|ing)\b([^.]{0,60}?)\b(take|get|pull|withdraw|reverse|cancel)s?\b[^.]{0,30}\b(back|refund|refunded|money|funds)\b/i;

/* Card mode turns the ledger's truths into falsehoods: there is no wallet,
   nothing to withdraw, and nothing "secured" before the hire. Vuka not holding
   the money is now TRUE, so OLD_MODEL does not apply there. Cash is still
   wrong either way: the app pays by card or not at all. */
const LEDGER_TALK = /\b(vuka wallet|your wallet|the wallet|worker'?s? wallet|withdraw (it|your pay|the money|from)|funds secured|secures? the (full )?pay)\b/i;
const CASH = /\bpays? (you|the worker|workers) (in cash|cash)\b/i;

export function violatesFacts(text, model = paymentModel()) {
  if (model === 'card') {
    if (LEDGER_TALK.test(text) || CASH.test(text)) return true;
  } else if (OLD_MODEL.test(text)) return true;
  const late = text.match(LATE_REVERSAL);
  if (!late) return false;
  return !/\b(not|never|cannot|can.t|no longer|locked)\b/i.test(late[3] ?? '');
}

/* The replacement when a reply gets payment wrong — one for each side, since
   "once you are hired" is nonsense to the person doing the hiring. */
const CARD_ANSWER = {
  worker:
    'Before an employer can hire anyone, they add a card on Paystack\'s secure page. '
    + 'When they confirm your finished job, or automatically if they never answer, their card is charged and Paystack sends your full pay straight to your bank account. '
    + 'Add your bank details under Me, then Get paid. Vuka takes nothing from your pay, and there is no wallet to withdraw from.',
  employer:
    'Before your first hire you add a card on Paystack\'s secure page; nothing is charged for the job then. '
    + 'When you confirm the finished work, or automatically if you do not answer in time, your card is charged the pay plus Vuka\'s fee, and the pay goes straight to the worker\'s bank. '
    + 'Once someone is hired, the hire cannot be undone.',
};
const ESCROW_ANSWER = {
  worker:
    'The employer secures the full pay for the job in Vuka before anyone is hired, and you can see "Funds secured" on the job before you apply. '
    + 'Until someone is hired the employer can take the funds back for free; once you are hired they are locked for you. '
    + 'When the employer confirms the job, or automatically if they never answer, the pay moves into your Vuka wallet and you withdraw it to your bank account.',
  employer:
    'You secure the full pay for a job in Vuka before you hire anyone — when you post it, or later — and nobody can be hired until you do. '
    + 'Until you hire, you can take the funds back for free. From the moment you hire someone they are locked for that worker, '
    + 'and they move into the worker wallet when you confirm the job, or automatically if you do not answer in time.',
};

/* Said whenever money comes up, in the language of the answer, because it is
   true right now and a person deciding whether to take a job needs it. */
const TEST_NOTE = {
  en: 'Payments are in test mode for now, so no real money moves yet.',
  zu: 'Izinkokhelo zisesimweni sokuhlola okwamanje, ngakho ayikho imali yangempela edluliswayo okwamanje.',
  xh: 'Iintlawulo zikwimo yovavanyo okwangoku, ngoko akukho mali yokwenyani ihambayo okwangoku.',
  st: 'Ditefo di maemong a teko hajwale, kahoo ha ho chelete ya nnete e fetisetswang hajwale.',
  af: 'Betalings is vir eers in toetsmodus, so geen regte geld beweeg nog nie.',
};
/* Not the bare words "pay" or "rand": they turn up in every answer about the
   minimum wage and fair pay, which are not about money moving through Vuka. */
/* Card mode before a live key: real cards are refused, which is what a person
   about to pay needs to hear. */
const CARD_TEST_NOTE = {
  en: 'Payments are in Paystack test mode for now: only test cards work, and no real money moves yet.',
  zu: 'Izinkokhelo zisesimweni sokuhlola se-Paystack okwamanje: kusebenza amakhadi okuhlola kuphela, futhi ayikho imali yangempela edluliswayo okwamanje.',
  xh: 'Iintlawulo zikwimo yovavanyo ye-Paystack okwangoku: kusebenza amakhadi ovavanyo kuphela, kwaye akukho mali yokwenyani ihambayo okwangoku.',
  st: 'Ditefo di maemong a teko a Paystack hajwale: ho sebetsa dikarete tsa teko feela, mme ha ho chelete ya nnete e fetisetswang hajwale.',
  af: 'Betalings is vir eers in Paystack se toetsmodus: net toetskaarte werk, en geen regte geld beweeg nog nie.',
};
const MONEY_WORDS = /\b(paid|payment|payments|money|funds?|wallet|withdraw|withdrawal|escrow|secured|charged|imali|chelete|geld|betaal|umholo|moputso|ukukhokhelwa)\b/i;
/* Not a bare "test" either — an answer mentioning a test is not a test-mode note. */
const HAS_TEST_NOTE = /test mode|practice run|no real money|toetsmodus|hlola|vavanyo|\bteko\b/i;

/** Append the test-mode note to any answer about money that lacks one. Live card payments get none. */
export function withTestNote(text, lang = 'en', model = paymentModel()) {
  if (model === 'card' && paystackMode() === 'live') return text;
  if (!MONEY_WORDS.test(text) || HAS_TEST_NOTE.test(text)) return text;
  const notes = model === 'card' ? CARD_TEST_NOTE : TEST_NOTE;
  return `${text}\n${notes[lang] ?? notes.en}`;
}

/** The safe answer when a reply got payment wrong. */
export function paymentAnswer(role = 'worker', model = paymentModel()) {
  const set = model === 'card' ? CARD_ANSWER : ESCROW_ANSWER;
  return set[role] ?? set.worker;
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
export async function askAssistant({ userId, role = 'worker', question, lang, entries, history, perUserCap }) {
  const list = providers();
  if (list.length === 0) throw Object.assign(new Error('AI not configured'), { code: 'not_configured' });

  const over = spend(userId, perUserCap);
  if (over) throw Object.assign(new Error(`AI budget reached (${over})`), { code: 'over_budget' });

  const safeLang = LANGS[lang] ? lang : 'en';
  const messages = [
    { role: 'system', content: `${systemPrompt(safeLang, role)}\n\n${entriesBlock(cleanEntries(entries))}` },
  ];
  for (const turn of cleanHistory(history)) {
    messages.push({ role: 'user', content: turn.q });
    if (turn.a) messages.push({ role: 'assistant', content: turn.a });
  }
  messages.push({ role: 'user', content: redact(question) });

  let lastError = null;
  for (const p of list) {
    try {
      const raw = await callProvider(p, messages);
      /* Not a Vuka question. Answered by the app with its own honest "I only
         help with Vuka" in the person's language — never by the model having
         a go at the football results. */
      if (isOffTopic(raw)) return { provider: p.name, answer: offTopicReply(raw), offTopic: true };
      const answer = tidy(raw);
      if (!answer) throw new Error(`${p.name}: empty answer`);
      if (violatesFacts(answer)) {
        return { provider: p.name, answer: withTestNote(paymentAnswer(role), 'en') };
      }
      return { answer: withTestNote(answer, safeLang), provider: p.name };
    } catch (e) {
      lastError = e;
    }
  }
  throw Object.assign(new Error(lastError?.message ?? 'AI unavailable'), { code: 'unavailable', cause: lastError });
}
