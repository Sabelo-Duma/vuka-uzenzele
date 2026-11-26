/* ============================================================
   Msizi — being a person to talk to, not only a help index.

   The first Msizi answered "hello" with "I do not know that one". That was
   technically honest and felt like a door shut in somebody's face — the very
   first thing most people type to an assistant is a greeting, and the reply
   decides whether they type a second thing.

   So conversation comes first, before the knowledge base is consulted:
   greetings, thanks, goodbyes, "how are you", "what can you do", "are you a
   robot". These are recognised in all five app languages (and in the way
   South Africans actually greet each other — howzit, heita, aweh) and answered
   in the app's language, using the person's first name.

   Two rules keep this from getting in the way of real questions:

   · A greeting in FRONT of a question is peeled off, not answered. "Hi, how
     do I get paid?" goes to the knowledge base as "how do I get paid?" — see
     `peelGreeting`, which the screen calls before `ask`.
   · Small talk only matches short messages made almost entirely of small
     talk. "Thanks, but what about my bank details" is a question.

   Most intents have a few ways of saying the same thing, picked at random,
   so the third "thanks" of a chat does not get the same words as the first.
   The lines here are small talk only: no advice and no facts about Vuka.
   Facts live in the knowledge base, where they are checked.

   Like the knowledge base, nothing here leaves the phone.
   ============================================================ */
import type { Lang } from '../i18n';
import type { Role } from '../types';

type Intent =
  | 'greet' | 'howAreYou' | 'imWell' | 'thanks' | 'bye' | 'night' | 'capabilities' | 'whoAreYou'
  | 'areYouAi' | 'joke' | 'ack' | 'laugh' | 'praise' | 'upset' | 'sorry' | 'there' | 'down'
  /* Handled by the screen, which re-reads the previous answer; the lines
     below are only for when there is nothing to repeat yet. */
  | 'repeat';

/* What the screen is told. "Good night" is a goodbye — it must end a voice
   conversation the same way "bye" does — it just gets warmer words. */
const PUBLIC_INTENT: Partial<Record<Intent, string>> = { night: 'bye' };

function norm(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, ' ')
    .replace(/'/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/* Greetings, longest first so "good morning" wins over "morning". */
const GREETINGS = [
  'good morning', 'good afternoon', 'good evening', 'good day', 'hello there', 'hi there', 'hey there',
  'goeie more', 'goeie middag', 'goeie aand', 'goeienaand', 'goeie naand', 'more more',
  'goeiemore', 'goeiemiddag', 'goeiedag',
  'sanibonani', 'sawubona', 'sawbona', 'molweni', 'molo', 'dumelang', 'dumela', 'lumela', 'lumelang',
  'avuxeni', 'ndaa', 'thobela',
  'howzit', 'heita', 'heyta', 'hola', 'aweh', 'eita',
  'hallo', 'hello', 'helo', 'hiya', 'hey', 'hi', 'yo', 'greetings', 'morning', 'evening', 'afternoon',
];

const PATTERNS: [Intent, RegExp][] = [
  ['repeat', /^(repeat|repeat (that|it)|(can|could) (you|u) repeat( that| it)?|say (that|it) again|come again|pardon|sorry what|what did you say|again|once more|phinda|phinda futhi|phinda kabili|phinda uthi|pheta|pheta hape|herhaal|sê weer|se weer)$/],
  ['howAreYou', /^(how are (you|u)( doing)?( today)?|how r u|how is your day|hows your day|how you doing|hows it going|how is it going|whats up|wassup|sup|unjani|ninjani|unjani wena|o kae|o phela joang|le kae|hoe gaan dit( met jou)?|hoe gaan dit|kunjani|kuhamba kanjani|ungubani wena kanjani)$/],
  /* The answer to "how are you?" when she asks it back. Before 'ack', which
     would otherwise take "fine thanks". */
  ['imWell', /^((im|i am) (good|fine|well|ok|okay|alright|great|doing (good|well|fine|great|ok|okay))( thanks| thank you)?( (and|n) (you|u|yourself))?|(good|fine|well|great|not bad)( thanks| thank you)? (and|n) (you|u|yourself)|fine (thanks|thank you)|not bad( thanks| thank you)?|(ngiyaphila|sikhona|ngikhona)( ngiyabonga)?( wena| nawe| wena unjani| unjani wena)?|(ndiphilile|ndikhona)( enkosi)?( wena| nawe| unjani wena| wena unjani)?|(ke phela hantle|ke teng|re teng|ke hantle)( ke a leboha)?( le wena| wena o kae)?|dit gaan goed( dankie)?( en (met )?jou| en jy)?|(goed|baie goed) dankie( en (met )?jou| en jy)?|ek is (goed|oraait|oukei))$/],
  ['thanks', /^(thank (you|u)( so much| very much)?|thanks( a lot| so much)?|thx|ta|cheers|shot|sharp|shap|sharp (bro|bru|boss|my bru|sho)|ngiyabonga|siyabonga|ngiyabonga kakhulu|enkosi|enkosi kakhulu|ndiyabulela|ke a leboha|kea leboha|ke leboha|dankie|baie dankie)( msizi)?$/],
  ['night', /^(good ?night|night|nite|night night|sleep well|sleep tight|lala kahle|ulale kahle|lalani kahle|lala kakuhle|ulale kakuhle|lalani kakuhle|robala hantle|o robale hantle|le robale hantle|goeie ?nag|lekker slaap|slaap lekker|slaap gerus)$/],
  ['bye', /^(bye|bye bye|goodbye|good bye|see (you|ya)( later| tomorrow)?|later|sala kahle|salani kahle|hamba kahle|sala sentle|hamba kakuhle|salang hantle|tsamaya hantle|sala hantle|totsiens|tot siens|mooi loop|lekker bly|sharp sharp|chat later)$/],
  ['capabilities', /^(help|help me|i need help|can you help( me)?|what can (you|u) do|what do you do|what are you for|what can i ask( you)?|how does this work|ngisize|ngicela usizo|ndincede|nceda|nthuse|ke kopa thuso|help my|kan jy my help|wat kan jy doen)$/],
  ['whoAreYou', /^(who are (you|u)|whats your name|what is your name|your name|ungubani|ngubani igama lakho|ungubani wena|ndiwe bani|o mang|lebitso la hao ke mang|wie is jy|wat is jou naam)$/],
  ['areYouAi', /^(are (you|u) (a )?(robot|bot|ai|human|real|real person|person|machine|computer|chatgpt|siri)|is this (a )?(bot|robot|ai|real person)|am i talking to (a )?(bot|robot|person|human)|are you alive|is jy n robot|ungumuntu|uyirobhothi)$/],
  ['there', /^(are (you|u) (still )?there|(you|u) there|r u there|(is )?any(one|body) (there|here)|ukhona( na)?|usekhona|ukhona wena|o teng( na)?|o sa ntse o le teng|is jy (nog )?daar|is iemand daar)$/],
  ['joke', /^(tell me a joke|say something funny|make me laugh|a joke|joke|vertel my n grap|ngixoxele ihlaya)$/],
  ['ack', /^((ok|okay|okey|k|kk|alright|all right|cool|nice|great|good|fine|perfect|awesome|sweet|noted|lovely)( cool| then| great| thanks| thank you| nice| good)?|got it|i see|understood|sure|sounds good|makes sense|yes|yeah|yep|no|nope|nah|yebo|ja|nee|ee|aowa|kulungile|kuhle|ho lokile|reg so|mooi)$/],
  ['laugh', /^(lol|lmao|haha+|hahaha+|hehe+|ha ha|lekker)$/],
  ['praise', /^((you are|youre|ur|u r) (so |very |really )?(great|awesome|amazing|the best|helpful|smart|clever|kind|a star|a legend)|(good|great|smart) (bot|job)|well done|nice one|you rock|that (was|is) (very |really |so )?(helpful|useful)|that helped( a lot)?|that helps|i love (you|this|this app)|ngiyakuthanda|uyasiza|uyasiza kakhulu|uyanceda|uyanceda kakhulu|o a thusa|o thusa haholo|jy is wonderlik|jy is baie behulpsaam|baie behulpsaam)$/],
  ['upset', /^((you are|youre) (useless|stupid|dumb|bad|rubbish|not helping)|useless|stupid|this is useless|you dont understand|you do not understand|wrong|thats wrong|that is wrong|not helpful|not helping|this is not helping|awusizi lutho)$/],
  ['sorry', /^((im |i am )?(so )?sorry( about that| for that)?|oh sorry|my bad|oops|uxolo|ngiyaxolisa|ngicela uxolo|ndicela uxolo|ndiyaxolisa|ke kopa tshwarelo|tshwarelo|jammer|ekskuus|verskoon my)$/],
  /* Tired, stressed, nobody hiring. Only the plain, whole-message forms: "I
     can't find work near me" is a question and goes to the knowledge base. */
  ['down', /^((im|i am) (so |really |very |just )?(tired|exhausted|stressed|frustrated|struggling|hopeless|losing hope|giving up|sad|depressed)( of (looking|searching|trying|waiting)( for (a )?(job|work))?)?|(im|i am) not (ok|okay|good|well|fine)( at all)?|not so good|not great|i give up|i want to give up|(nobody|no one|noone) (hires|wants to hire|will hire|wants) me|i (still )?(cant|can not|cannot) find (a )?(job|work)|its (so )?(hard|tough)( out here| out there)?|life is hard|ngikhathele( ukufuna( umsebenzi)?)?|ngidiniwe|kunzima|ngiphelelwe yithemba|ndidiniwe|ndikhathele|ndiphelelwe lithemba|ke kgathetse|ke kgathetse ho batla mosebetsi|ho thata|ek is moeg( van soek)?|ek gee op|niemand wil my huur nie|dit is swaar|dis swaar)$/],
];

/**
 * Remove a greeting from the front of a message.
 * Returns the greeting (if any) and what is left to answer.
 */
export function peelGreeting(text: string): { greeting: string | null; rest: string } {
  const n = norm(text);
  for (const g of GREETINGS) {
    if (n === g) return { greeting: g, rest: '' };
    if (n.startsWith(`${g} `)) {
      /* Cut the same number of words off the original, so the rest keeps its
         punctuation and capitals for display and for the matcher. */
      const words = g.split(' ').length;
      let rest = text.trim().split(/\s+/).slice(words).join(' ');
      rest = rest.replace(/^(msizi|umsizi)\b[\s,!.]*/i, '').replace(/^[\s,!.;:-]+/, '');
      return { greeting: g, rest };
    }
  }
  return { greeting: null, rest: text };
}

/* The message as the matcher sees it: no name, no "please", and the
   stretched greetings people type ("hellooo", "hiii", "heyyy") pulled back. */
function clean(text: string): string {
  return norm(text)
    .replace(/\b(msizi|umsizi|please|pls|plz)\b/g, '')
    .split(' ')
    .map((w) => (/^hel+o+$/.test(w) ? 'hello' : /^hi+$/.test(w) ? 'hi' : /^he+y+$/.test(w) ? 'hey' : w))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* "Thanks, bye" and "ok good night": a thank-you or an okay in front of a
   goodbye or a compliment. Longest first, so "thank you so much" is taken
   whole. Anything else after it — "thanks, how do I get paid" — is a question. */
const LEAD_IN = /^(thank you so much|thank you very much|thanks so much|thanks a lot|thank you|thank u|thanks|ngiyabonga kakhulu|ngiyabonga|enkosi kakhulu|enkosi|ke a leboha|baie dankie|dankie|okay|ok|alright|cool|sharp|shap) (.+)$/;
const AFTER_LEAD_IN: Intent[] = ['bye', 'night', 'praise'];

function matchIntent(n: string): Intent | null {
  if (GREETINGS.includes(n)) return 'greet';
  for (const [intent, re] of PATTERNS) if (re.test(n)) return intent;
  return null;
}

/** The intent, and whether a greeting was peeled off the front to find it. */
function detect(text: string): { intent: Intent; greeted: boolean } | null {
  const raw = norm(text);
  const n = clean(text);
  /* Only the name — "Msizi?" — is somebody checking she is there. */
  if (!n) return /\b(msizi|umsizi)\b/.test(raw) ? { intent: 'there', greeted: false } : null;
  /* "Sorry?" with a question mark is "pardon?", not an apology. */
  if (/^(sorry|ekskuus|jammer)$/.test(n) && /\?\s*$/.test(text)) return { intent: 'repeat', greeted: false };
  const direct = matchIntent(n);
  if (direct) return { intent: direct, greeted: false };
  /* "Hi, how are you?" — the greeting peeled, the rest still small talk. */
  const { greeting, rest } = peelGreeting(n);
  if (greeting && rest) {
    const inner = matchIntent(rest);
    if (inner) return { intent: inner, greeted: true };
  }
  const lead = LEAD_IN.exec(n);
  if (lead) {
    const inner = matchIntent(lead[2]);
    if (inner && AFTER_LEAD_IN.includes(inner)) return { intent: inner, greeted: false };
  }
  return null;
}

function intentOf(text: string): Intent | null {
  return detect(text)?.intent ?? null;
}

/* ---- The replies, in each app language ----------------------------------

   Written by the same team that wrote the catalogues, not by first-language
   speakers — the Language screen's caveat applies here too. {name} is the
   first name, or empty. Every whoAreYou line ends with the "type or talk"
   sentence: it is cut for people without voice. */

type Lines = Record<Intent, string[]>;

const REPLIES: Record<Lang, Lines> = {
  en: {
    greet: [
      '{Greeting}{name}! I am Msizi, your helper on Vuka. Ask me anything — finding work, getting paid, your record, or staying safe.',
      '{Greeting}{name}! Good to see you. What can I help you with today?',
      '{Greeting}{name}! I am here to help. Ask me anything.',
    ],
    howAreYou: [
      'I am well, thank you for asking{name}. How can I help you today?',
      'I am good{name}, thanks. And you, how are you doing?',
      'All good on my side{name}. How are you?',
    ],
    imWell: [
      'Good to hear{name}. What can I help you with today?',
      'Glad you are well{name}. What can I do for you?',
    ],
    thanks: [
      'It is a pleasure{name}. I am here whenever you need me.',
      'Any time{name}. Good luck out there.',
      'Shap{name}. Shout if you need anything else.',
    ],
    bye: [
      'Go well{name}. Come back any time you have a question.',
      'Sharp{name}, go well. I am here when you need me.',
      'Bye for now{name}. Good luck with everything.',
    ],
    night: [
      'Good night{name}. Sleep well.',
      'Sleep well{name}. I will be here tomorrow.',
    ],
    capabilities: ['I can help you with:\n• Finding work near you and applying\n• How you get paid, and fair pay\n• Your record, your Vuka Score and The Ladder\n• Staying safe, and spotting scams\n• Reading your own score, jobs and messages to you\nType your question, or tap the microphone and just ask.'],
    whoAreYou: [
      'I am Msizi — "umsizi" means helper in isiZulu. I live inside Vuka and I help you use it. You can type to me or talk to me.',
      'My name is Msizi. It means "helper" in isiZulu, and that is my job here on Vuka. You can type to me or talk to me.',
    ],
    areYouAi: ['I am not a person — I am Msizi, Vuka\'s helper. Most of my answers come from notes written by the Vuka team, and when a question is new to me I use AI to work it out from those notes. For anything important, check it in the app.'],
    there: [
      'I am here{name}. What can I help you with?',
      'Yes, I am here{name}. Go ahead.',
      'Still here{name}. What do you need?',
    ],
    joke: ['Why did the gardener get hired first? Because their record kept growing! Now — what can I help you with on Vuka?'],
    ack: [
      'Great. Is there anything else I can help you with?',
      'Okay{name}. Anything else?',
      'Sharp. Just ask if something else comes up.',
    ],
    laugh: [
      'Glad that made you smile. Anything else I can help with?',
      'Haha. Anything else on your mind?',
    ],
    praise: [
      'Thank you{name}, that is kind. What else can I help you with?',
      'Ah, thank you{name}. That made my day.',
      'Thanks{name}. I am glad I could help.',
    ],
    upset: [
      'Sorry{name} — I did not get that right. Try asking in different words, or tap one of the questions below.',
      'I hear you{name}, and I am sorry. Try asking me in other words, or pick one of the questions below.',
    ],
    sorry: [
      'No need to say sorry{name}. What can I help you with?',
      'It is fine{name}, no stress. Go ahead.',
      'Do not worry about it{name}.',
    ],
    down: [
      'I hear you{name}. Looking for work is tiring, and feeling this way does not mean you are failing. Let us take one small step together — pick something below.',
      'That sounds hard{name}, and I am sorry. You are not alone in this. When you are ready, here are a few places we can start.',
      'It is okay to feel tired{name}. Take a breath. When you are ready, we can try one thing at a time — see below.',
    ],
    repeat: [
      'I have not said anything yet{name} — ask me a question and I will answer it.',
      'Nothing to repeat yet{name}. Ask me something and I will answer.',
    ],
  },
  zu: {
    greet: [
      '{Greeting}{name}! NginguMsizi, umsizi wakho ku-Vuka. Ngibuze noma yini — ukuthola umsebenzi, ukukhokhelwa, irekhodi lakho, noma ukuphepha.',
      '{Greeting}{name}! Kuhle ukukubona. Ngingakusiza ngani namuhla?',
      '{Greeting}{name}! Ngikhona ukuze ngikusize. Ngibuze noma yini.',
    ],
    howAreYou: [
      'Ngiyaphila, ngiyabonga ukubuza{name}. Ngingakusiza ngani namuhla?',
      'Ngikhona{name}, ngiyabonga. Wena unjani?',
      'Ngiyaphila{name}. Unjani wena?',
    ],
    imWell: [
      'Kuhle ukuzwa lokho{name}. Ngingakusiza ngani namuhla?',
      'Ngiyajabula ukuthi uyaphila{name}. Ngingakusiza ngani?',
    ],
    thanks: [
      'Kube yinjabulo{name}. Ngikhona noma nini uma ungidinga.',
      'Akunankinga{name}. Ngikufisela inhlanhla.',
      'Kulungile{name}. Ngikhona uma ungidinga futhi.',
    ],
    bye: [
      'Uhambe kahle{name}. Buya noma nini uma unombuzo.',
      'Sharp{name}, hamba kahle. Ngizobe ngikhona uma ungidinga.',
    ],
    night: [
      'Ulale kahle{name}.',
      'Lala kahle{name}. Ngizobe ngikhona kusasa.',
    ],
    capabilities: ['Ngingakusiza nge:\n• Ukuthola umsebenzi eduze kwakho nokufaka isicelo\n• Ukuthi ukhokhelwa kanjani, neholo elifanele\n• Irekhodi lakho, i-Vuka Score ne-Ladder\n• Ukuphepha nokubona ukukhwabanisa\nBhala umbuzo wakho, noma uthinte imakrofoni ubuze.'],
    whoAreYou: [
      'NginguMsizi — "umsizi" kusho umuntu osizayo. Ngihlala ku-Vuka futhi ngikusiza ukuyisebenzisa. Ungangibhalela noma ukhulume nami.',
      'Igama lami nguMsizi — kusho umuntu osizayo, futhi yilokho engikwenzayo lapha ku-Vuka. Ungangibhalela noma ukhulume nami.',
    ],
    areYouAi: ['Angisuye umuntu — nginguMsizi, umsizi we-Vuka. Izimpendulo zami eziningi zivela emibhalweni yethimba le-Vuka, kanti uma umbuzo umusha ngisebenzisa i-AI. Uma kubalulekile, hlola ku-app.'],
    there: [
      'Ngikhona{name}. Ngingakusiza ngani?',
      'Yebo, ngikhona{name}. Qhubeka.',
    ],
    joke: ['Kungani umlimi waqashwa kuqala? Ngoba irekhodi lakhe lalilokhu likhula! Manje — ngingakusiza ngani ku-Vuka?'],
    ack: [
      'Kulungile. Kukhona okunye engingakusiza ngakho?',
      'Kulungile{name}. Kukhona okunye?',
      'Sharp. Ngibuze uma kukhona okunye.',
    ],
    laugh: [
      'Ngiyajabula ukuthi umamathekile. Kukhona okunye?',
      'Haha. Kukhona okunye engingakusiza ngakho?',
    ],
    praise: [
      'Ngiyabonga{name}. Yini enye engingakusiza ngayo?',
      'Hawu, ngiyabonga{name}. Ngiyajabula ukuthi ngikusizile.',
    ],
    upset: [
      'Uxolo{name} — angikutholanga kahle. Zama ukubuza ngamanye amagama, noma uthinte omunye wemibuzo ngezansi.',
      'Ngiyakuzwa{name}, uxolo. Zama ukungibuza ngenye indlela, noma ukhethe umbuzo ngezansi.',
    ],
    sorry: [
      'Akunankinga{name}. Ngingakusiza ngani?',
      'Kulungile{name}, ungakhathazeki.',
    ],
    down: [
      'Ngiyakuzwa{name}. Ukufuna umsebenzi kuyakhathaza, futhi ukuzizwa kanje akusho ukuthi uyehluleka. Masithathe isinyathelo esisodwa — khetha okuthile ngezansi.',
      'Ngiyazi kunzima{name}. Awuwedwa. Uma usulungile, nazi izindawo esingaqala kuzo.',
      'Kulungile ukukhathala{name}. Phumula kancane. Uma usulungile, sizozama into eyodwa ngesikhathi — bheka ngezansi.',
    ],
    repeat: [
      'Angikasho lutho{name} — ngibuze umbuzo ngizowuphendula.',
      'Akukho engingakuphinda okwamanje{name}. Ngibuze, ngizophendula.',
    ],
  },
  xh: {
    greet: [
      '{Greeting}{name}! NdinguMsizi, umncedisi wakho kwi-Vuka. Ndibuze nantoni na — ukufumana umsebenzi, ukuhlawulwa, irekhodi yakho, okanye ukhuseleko.',
      '{Greeting}{name}! Kumnandi ukukubona. Ndingakunceda ngantoni namhlanje?',
      '{Greeting}{name}! Ndilapha ukuze ndikuncede. Ndibuze nantoni na.',
    ],
    howAreYou: [
      'Ndiphilile, enkosi ngokubuza{name}. Ndingakunceda ngantoni namhlanje?',
      'Ndikhona{name}, enkosi. Wena unjani?',
      'Ndiphilile{name}. Unjani wena?',
    ],
    imWell: [
      'Kuhle ukuva oko{name}. Ndingakunceda ngantoni namhlanje?',
      'Ndiyavuya ukuba uphilile{name}. Ndingakunceda ngantoni?',
    ],
    thanks: [
      'Kuyavuyisa{name}. Ndikhona nanini na xa undidinga.',
      'Akukho ngxaki{name}. Ndikunqwenelela okuhle.',
      'Kulungile{name}. Ndikhona xa undidinga kwakhona.',
    ],
    bye: [
      'Uhambe kakuhle{name}. Buya nanini na xa unombuzo.',
      'Sharp{name}, hamba kakuhle. Ndiza kubakho xa undidinga.',
    ],
    night: [
      'Ulale kakuhle{name}.',
      'Lala kakuhle{name}. Ndiza kubakho ngomso.',
    ],
    capabilities: ['Ndingakunceda nge:\n• Ukufumana umsebenzi kufutshane nawe nokufaka isicelo\n• Indlela ohlawulwa ngayo, nomvuzo ofanelekileyo\n• Irekhodi yakho, i-Vuka Score ne-Ladder\n• Ukhuseleko nokubona ubuqhetseba\nBhala umbuzo wakho, okanye uchukumise imayikrofoni ubuze.'],
    whoAreYou: [
      'NdinguMsizi — "umsizi" lithetha umncedisi. Ndihlala kwi-Vuka kwaye ndikunceda ukuyisebenzisa. Ungandibhalela okanye uthethe nam.',
      'Igama lam nguMsizi — lithetha umncedisi ngesiZulu, kwaye yile nto ndiyenzayo apha kwi-Vuka. Ungandibhalela okanye uthethe nam.',
    ],
    areYouAi: ['Andingomntu — ndinguMsizi, umncedisi we-Vuka. Uninzi lweempendulo zam luvela kumanqaku eqela le-Vuka, kwaye xa umbuzo umtsha ndisebenzisa i-AI. Ukuba kubalulekile, jonga kwi-app.'],
    there: [
      'Ndikhona{name}. Ndingakunceda ngantoni?',
      'Ewe, ndikhona{name}. Qhubeka.',
    ],
    joke: ['Kutheni umlimi waqeshwa kuqala? Kuba irekhodi yakhe yayisoloko ikhula! Ngoku — ndingakunceda ngantoni kwi-Vuka?'],
    ack: [
      'Kulungile. Ingaba kukho enye into endingakunceda ngayo?',
      'Kulungile{name}. Ikhona enye into?',
      'Sharp. Ndibuze ukuba kukho enye into.',
    ],
    laugh: [
      'Ndiyavuya ukuba uncumile. Ikhona enye into?',
      'Haha. Ikhona enye into endingakunceda ngayo?',
    ],
    praise: [
      'Enkosi{name}. Yintoni enye endingakunceda ngayo?',
      'Hayi, enkosi{name}. Ndiyavuya ukuba ndikuncedile.',
    ],
    upset: [
      'Uxolo{name} — andikuvanga kakuhle. Zama ukubuza ngamanye amagama, okanye uchukumise omnye wemibuzo engezantsi.',
      'Ndiyakuva{name}, uxolo. Zama ukundibuza ngenye indlela, okanye ukhethe umbuzo ongezantsi.',
    ],
    sorry: [
      'Akukho ngxaki{name}. Ndingakunceda ngantoni?',
      'Kulungile{name}, sukuxhalaba.',
    ],
    down: [
      'Ndiyakuva{name}. Ukufuna umsebenzi kuyadinisa, kwaye ukuziva ngolu hlobo akuthethi ukuba uyasilela. Masithathe inyathelo elinye — khetha into engezantsi.',
      'Ndiyazi kunzima{name}. Awuwedwa. Xa ukulungele, nazi iindawo esinokuqala kuzo.',
      'Kulungile ukudinwa{name}. Phumla kancinci. Xa ukulungele, siza kuzama into enye ngexesha — jonga ngezantsi.',
    ],
    repeat: [
      'Andikathethi nto{name} — ndibuze umbuzo ndiza kuwuphendula.',
      'Akukho nto ndinokuyiphinda okwangoku{name}. Ndibuze, ndiza kuphendula.',
    ],
  },
  st: {
    greet: [
      '{Greeting}{name}! Ke Msizi, mothusi wa hao ho Vuka. Mpotse eng kapa eng — ho fumana mosebetsi, ho lefuwa, rekoto ya hao, kapa polokeho.',
      '{Greeting}{name}! Ke thabela ho o bona. Nka o thusa ka eng kajeno?',
      '{Greeting}{name}! Ke teng ho o thusa. Mpotse eng kapa eng.',
    ],
    howAreYou: [
      'Ke phela hantle, ke a leboha ho botsa{name}. Nka o thusa ka eng kajeno?',
      'Ke teng{name}, ke a leboha. Wena o kae?',
      'Ke phela hantle{name}. Wena o phela jwang?',
    ],
    imWell: [
      'Ke thabela ho utlwa seo{name}. Nka o thusa ka eng kajeno?',
      'Ke thabile hore o phela hantle{name}. Nka o thusa ka eng?',
    ],
    thanks: [
      'Ke thabo{name}. Ke teng nako efe kapa efe ha o nhloka.',
      'Ha ho na taba{name}. Ke o lakaletsa mahlohonolo.',
      'Ho lokile{name}. Ke teng ha o nhloka hape.',
    ],
    bye: [
      'Tsamaya hantle{name}. Kgutla nako efe kapa efe ha o na le potso.',
      'Sharp{name}, tsamaya hantle. Ke tla be ke le teng ha o nhloka.',
    ],
    night: [
      'Robala hantle{name}.',
      'O robale hantle{name}. Ke tla be ke le teng hosane.',
    ],
    capabilities: ['Nka o thusa ka:\n• Ho fumana mosebetsi haufi le wena le ho etsa kopo\n• Kamoo o lefuwang ka teng, le moputso o nepahetseng\n• Rekoto ya hao, Vuka Score le Ladder\n• Polokeho le ho lemoha bomenemene\nNgola potso ya hao, kapa o tobetse maekrofounu o botse.'],
    whoAreYou: [
      'Ke Msizi — "umsizi" ho bolela mothusi ka isiZulu. Ke dula ho Vuka mme ke o thusa ho e sebedisa. O ka ngolla kapa wa bua le nna.',
      'Lebitso la ka ke Msizi — le bolela mothusi ka isiZulu, mme ke sona seo ke se etsang mona ho Vuka. O ka ngolla kapa wa bua le nna.',
    ],
    areYouAi: ['Ha ke motho — ke Msizi, mothusi wa Vuka. Boholo ba dikarabo tsa ka bo tswa dintlheng tsa sehlopha sa Vuka, mme ha potso e le ntjha ke sebedisa AI. Bakeng sa ntho ya bohlokwa, sheba ho app.'],
    there: [
      'Ke teng{name}. Nka o thusa ka eng?',
      'E, ke teng{name}. Tswela pele.',
    ],
    joke: ['Hobaneng ha molemi a ile a hirwa pele? Hobane rekoto ya hae e ne e dula e hola! Jwale — nka o thusa ka eng ho Vuka?'],
    ack: [
      'Ho lokile. Na ho na le ntho e nngwe eo nka o thusang ka yona?',
      'Ho lokile{name}. Ho na le ntho e nngwe?',
      'Sharp. Mpotse ha ho na le ntho e nngwe.',
    ],
    laugh: [
      'Ke thabile hore o bososele. Ho na le ntho e nngwe?',
      'Haha. Ho na le ntho e nngwe eo nka o thusang ka yona?',
    ],
    praise: [
      'Ke a leboha{name}. Nka o thusa ka eng hape?',
      'Ao, ke a leboha{name}. Ke thabile hore ke o thusitse.',
    ],
    upset: [
      'Ke kopa tshwarelo{name} — ha ke a o utlwisisa hantle. Leka ho botsa ka mantswe a mang, kapa o tobetse e nngwe ya dipotso tse ka tlase.',
      'Ke a o utlwa{name}, ke kopa tshwarelo. Leka ho mpotsa ka tsela e nngwe, kapa o kgethe potso e ka tlase.',
    ],
    sorry: [
      'Ha ho na taba{name}. Nka o thusa ka eng?',
      'Ho lokile{name}, o se ke wa tshwenyeha.',
    ],
    down: [
      'Ke a o utlwa{name}. Ho batla mosebetsi hoa kgathatsa, mme ho ikutlwa tjena ha ho bolele hore o a hloleha. Ha re nke mohato o le mong — kgetha ntho e ka tlase.',
      'Ke a tseba ho thata{name}. Ha o mong. Ha o se o loketse, mona ke moo re ka qalang teng.',
      'Ho lokile ho kgathala{name}. Phomola hanyane. Ha o se o loketse, re tla leka ntho e le nngwe ka nako — sheba ka tlase.',
    ],
    repeat: [
      'Ha ke eso bue letho{name} — mpotse potso mme ke tla e araba.',
      'Ha ho letho leo nka le phetang hajwale{name}. Mpotse, ke tla araba.',
    ],
  },
  af: {
    greet: [
      '{Greeting}{name}! Ek is Msizi, jou helper op Vuka. Vra my enigiets — werk kry, betaal word, jou rekord, of veilig bly.',
      '{Greeting}{name}! Lekker om jou te sien. Hoe kan ek vandag help?',
      '{Greeting}{name}! Ek is hier om te help. Vra my enigiets.',
    ],
    howAreYou: [
      'Dit gaan goed, dankie dat jy vra{name}. Hoe kan ek jou vandag help?',
      'Goed dankie{name}. En met jou?',
      'Alles reg hier{name}. Hoe gaan dit met jou?',
    ],
    imWell: [
      'Lekker om te hoor{name}. Hoe kan ek jou vandag help?',
      'Bly dit gaan goed{name}. Waarmee kan ek help?',
    ],
    thanks: [
      'Plesier{name}. Ek is hier wanneer jy my nodig het.',
      'Geen probleem nie{name}. Sterkte.',
      'Reg so{name}. Ek is hier as jy weer iets nodig het.',
    ],
    bye: [
      'Mooi loop{name}. Kom terug wanneer jy \'n vraag het.',
      'Sharp{name}, mooi loop. Ek is hier as jy my nodig het.',
    ],
    night: [
      'Lekker slaap{name}.',
      'Goeie nag{name}. Ek is môre nog hier.',
    ],
    capabilities: ['Ek kan jou help met:\n• Werk naby jou kry en aansoek doen\n• Hoe jy betaal word, en billike betaling\n• Jou rekord, jou Vuka Score en The Ladder\n• Veilig bly, en swendelary raaksien\nTik jou vraag, of tik die mikrofoon en vra net.'],
    whoAreYou: [
      'Ek is Msizi — "umsizi" beteken helper in isiZulu. Ek woon in Vuka en help jou om dit te gebruik. Jy kan vir my tik of met my praat.',
      'My naam is Msizi — dit beteken "helper" in isiZulu, en dis presies wat ek hier op Vuka doen. Jy kan vir my tik of met my praat.',
    ],
    areYouAi: ['Ek is nie \'n mens nie — ek is Msizi, Vuka se helper. Die meeste van my antwoorde kom uit notas wat die Vuka-span geskryf het, en as \'n vraag nuut is, gebruik ek KI om dit uit daardie notas uit te werk. Kontroleer belangrike dinge in die app.'],
    there: [
      'Ek is hier{name}. Hoe kan ek help?',
      'Ja, ek is hier{name}. Gaan voort.',
    ],
    joke: ['Hoekom is die tuinier eerste aangestel? Want sy rekord het aanhou groei! Nou — waarmee kan ek jou op Vuka help?'],
    ack: [
      'Goed. Is daar nog iets waarmee ek kan help?',
      'Reg so{name}. Nog iets?',
      'Sharp. Vra gerus as daar nog iets is.',
    ],
    laugh: [
      'Bly dit het jou laat glimlag. Nog iets?',
      'Haha. Is daar nog iets waarmee ek kan help?',
    ],
    praise: [
      'Dankie{name}, dis gaaf van jou. Waarmee kan ek nog help?',
      'Ag, dankie{name}. Ek is bly ek kon help.',
    ],
    upset: [
      'Jammer{name} — ek het dit nie reg gekry nie. Probeer dit in ander woorde vra, of tik een van die vrae hieronder.',
      'Ek hoor jou{name}, jammer. Probeer my op \'n ander manier vra, of kies een van die vrae hieronder.',
    ],
    sorry: [
      'Geen probleem nie{name}. Hoe kan ek help?',
      'Dis reg so{name}, moenie worry nie.',
    ],
    down: [
      'Ek hoor jou{name}. Werk soek is uitputtend, en om so te voel beteken nie jy faal nie. Kom ons vat een tree op \'n slag — kies iets hieronder.',
      'Dit klink swaar{name}, en ek is jammer. Jy is nie alleen nie. Wanneer jy gereed is, hier is \'n paar plekke waar ons kan begin.',
      'Dis oukei om moeg te wees{name}. Vat \'n oomblik. Wanneer jy reg is, probeer ons een ding op \'n slag — kyk hieronder.',
    ],
    repeat: [
      'Ek het nog niks gesê nie{name} — vra my iets en ek sal antwoord.',
      'Daar is nog niks om te herhaal nie{name}. Vra my iets, dan antwoord ek.',
    ],
  },
};

const DEFAULT_GREETING: Record<Lang, string> = {
  en: 'Hello', zu: 'Sawubona', xh: 'Molo', st: 'Dumela', af: 'Hallo',
};

/* Greetings worth echoing back in the person's own words. */
const ECHO: Record<string, string> = {
  sawubona: 'Sawubona', sawbona: 'Sawubona', sanibonani: 'Sanibonani', molo: 'Molo', molweni: 'Molweni',
  dumela: 'Dumela', dumelang: 'Dumelang', lumela: 'Lumela', lumelang: 'Lumelang',
  howzit: 'Howzit', heita: 'Heita', heyta: 'Heyta', eita: 'Eita', aweh: 'Aweh', hallo: 'Hallo',
  'good morning': 'Good morning', 'good afternoon': 'Good afternoon', 'good evening': 'Good evening',
  morning: 'Morning', evening: 'Evening', afternoon: 'Afternoon',
  'goeie more': 'Goeie môre', goeiemore: 'Goeiemôre', 'goeie middag': 'Goeie middag', goeiemiddag: 'Goeiemiddag',
  'goeie aand': 'Goeie aand', goeienaand: 'Goeienaand', 'goeie naand': 'Goeienaand', goeiedag: 'Goeiedag',
  avuxeni: 'Avuxeni', thobela: 'Thobela',
};

export interface ChatReply {
  kind: 'chat';
  intent: string;
  body: string;
  /** Show the opener chips under it — true after a greeting or "help". */
  offerOpeners: boolean;
}

/** Answer small talk, or return null if this is not small talk. */
export function smallTalk(text: string, lang: Lang, firstName: string, _role: Role, voice = true): ChatReply | null {
  const found = detect(text);
  if (!found) return null;
  const { intent, greeted } = found;
  const options = REPLIES[lang]?.[intent] ?? REPLIES.en[intent];
  const line = options[Math.floor(Math.random() * options.length)];
  const said = clean(text);
  const greetingWord = ECHO[said] ?? ECHO[peelGreeting(said).greeting ?? ''] ?? DEFAULT_GREETING[lang];
  const name = firstName ? (intent === 'greet' ? ` ${firstName}` : `, ${firstName}`) : '';
  let body = line.replace('{Greeting}', greetingWord).replace('{name}', name);
  /* "Hi, how are you?" is greeted back before it is answered. */
  if (greeted && (intent === 'howAreYou' || intent === 'there')) body = `${greetingWord}. ${body}`;
  /* "You can type to me or talk to me" — only where talking is switched on. */
  if (!voice && intent === 'whoAreYou') body = body.replace(/\s*[^.!?]*[.!?]$/, '');
  return {
    kind: 'chat',
    intent: PUBLIC_INTENT[intent] ?? intent,
    body,
    offerOpeners: intent === 'greet' || intent === 'capabilities' || intent === 'upset' || intent === 'whoAreYou' || intent === 'down',
  };
}

/** Exported for the tests. */
export const __test = { intentOf, norm };
