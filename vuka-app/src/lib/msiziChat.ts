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

   Like the knowledge base, nothing here leaves the phone.
   ============================================================ */
import type { Lang } from '../i18n';
import type { Role } from '../types';

type Intent =
  | 'greet' | 'howAreYou' | 'thanks' | 'bye' | 'capabilities' | 'whoAreYou'
  | 'areYouAi' | 'joke' | 'ack' | 'laugh' | 'praise' | 'upset';

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
  'goeie more', 'goeie middag', 'goeienaand', 'goeie naand', 'more more',
  'sanibonani', 'sawubona', 'sawbona', 'molweni', 'molo', 'dumelang', 'dumela', 'lumela', 'lumelang',
  'avuxeni', 'ndaa', 'thobela',
  'howzit', 'heita', 'hola', 'aweh', 'eita',
  'hallo', 'hello', 'helo', 'hiya', 'hey', 'hi', 'yo', 'greetings', 'morning', 'evening', 'afternoon',
];

const PATTERNS: [Intent, RegExp][] = [
  ['howAreYou', /^(how are (you|u)( doing| today)?|how r u|hows it going|how is it going|whats up|wassup|sup|unjani|ninjani|unjani wena|o kae|o phela joang|le kae|hoe gaan dit( met jou)?|hoe gaan dit|kunjani|kuhamba kanjani|ungubani wena kanjani)$/],
  ['thanks', /^(thank (you|u)( so much| very much)?|thanks( a lot| so much)?|thx|ta|cheers|shot|sharp|ngiyabonga|siyabonga|ngiyabonga kakhulu|enkosi|enkosi kakhulu|ndiyabulela|ke a leboha|kea leboha|ke leboha|dankie|baie dankie)( msizi)?$/],
  ['bye', /^(bye|bye bye|goodbye|good bye|see (you|ya)( later)?|later|good night|night|sala kahle|salani kahle|hamba kahle|sala sentle|hamba kakuhle|salang hantle|tsamaya hantle|sala hantle|totsiens|tot siens|mooi loop|lekker bly|sharp sharp|chat later)$/],
  ['capabilities', /^(help|help me|i need help|can you help( me)?|what can (you|u) do|what do you do|what are you for|what can i ask( you)?|how does this work|ngisize|ngicela usizo|ndincede|nceda|nthuse|ke kopa thuso|help my|kan jy my help|wat kan jy doen)$/],
  ['whoAreYou', /^(who are (you|u)|whats your name|what is your name|your name|ungubani|ngubani igama lakho|ungubani wena|ndiwe bani|o mang|lebitso la hao ke mang|wie is jy|wat is jou naam)$/],
  ['areYouAi', /^(are (you|u) (a )?(robot|bot|ai|human|real|real person|person|machine|computer|chatgpt|siri)|is this (a )?(bot|robot|ai|real person)|am i talking to (a )?(bot|robot|person|human)|are you alive|is jy n robot|ungumuntu|uyirobhothi)$/],
  ['joke', /^(tell me a joke|say something funny|make me laugh|a joke|joke|vertel my n grap|ngixoxele ihlaya)$/],
  ['ack', /^(ok|okay|okey|k|kk|ok thanks|okay thanks|alright|all right|cool|nice|great|good|fine|got it|i see|understood|sure|yes|yeah|yep|no|nope|nah|yebo|ja|nee|ee|aowa|kulungile|kuhle|ho lokile|reg so|mooi)$/],
  ['laugh', /^(lol|lmao|haha+|hahaha+|hehe+|ha ha|lekker)$/],
  ['praise', /^(you are (great|awesome|amazing|the best|helpful|smart|clever)|good (bot|job)|well done|nice one|i love (you|this|this app)|ngiyakuthanda|uyasiza|jy is wonderlik)$/],
  ['upset', /^(you are (useless|stupid|dumb|bad|rubbish)|useless|stupid|this is useless|you dont understand|you do not understand|wrong|thats wrong|that is wrong|not helpful|awusizi lutho)$/],
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

function intentOf(text: string): Intent | null {
  const n = norm(text).replace(/\b(msizi|umsizi|please|pls|plz)\b/g, '').replace(/\s+/g, ' ').trim();
  if (!n) return null;
  if (GREETINGS.includes(n)) return 'greet';
  for (const [intent, re] of PATTERNS) if (re.test(n)) return intent;
  return null;
}

/* ---- The replies, in each app language ----------------------------------

   Written by the same team that wrote the catalogues, not by first-language
   speakers — the Language screen's caveat applies here too. {name} is the
   first name, or empty. */

type Lines = Record<Intent, string[]>;

const REPLIES: Record<Lang, Lines> = {
  en: {
    greet: ['{Greeting}{name}! I am Msizi, your helper on Vuka. Ask me anything — finding work, getting paid, your record, or staying safe.'],
    howAreYou: ['I am well, thank you for asking{name}! How can I help you today?'],
    thanks: ['It is a pleasure{name}. I am here whenever you need me.', 'Any time{name}! Good luck out there.'],
    bye: ['Go well{name}! Come back any time you have a question.'],
    capabilities: ['I can help you with:\n• Finding work near you and applying\n• How you get paid, and fair pay\n• Your record, your Vuka Score and The Ladder\n• Staying safe, and spotting scams\n• Reading your own score, jobs and messages to you\nType your question, or tap the microphone and just ask.'],
    whoAreYou: ['I am Msizi — "umsizi" means helper in isiZulu. I live inside Vuka and I help you use it. You can type to me or talk to me.'],
    areYouAi: ['I am not a person — I am Msizi, Vuka\'s helper. Most of my answers come from notes written by the Vuka team, and when a question is new to me I use AI to work it out from those notes. For anything important, check it in the app.'],
    joke: ['Why did the gardener get hired first? Because their record kept growing! Now — what can I help you with on Vuka?'],
    ack: ['Great. Is there anything else I can help you with?'],
    laugh: ['Glad that made you smile! Anything else I can help with?'],
    praise: ['Thank you{name}, that is kind! What else can I help you with?'],
    upset: ['Sorry{name} — I did not get that right. Try asking in different words, or tap one of the questions below.'],
  },
  zu: {
    greet: ['{Greeting}{name}! NginguMsizi, umsizi wakho ku-Vuka. Ngibuze noma yini — ukuthola umsebenzi, ukukhokhelwa, irekhodi lakho, noma ukuphepha.'],
    howAreYou: ['Ngiyaphila, ngiyabonga ukubuza{name}! Ngingakusiza ngani namuhla?'],
    thanks: ['Kube yinjabulo{name}. Ngikhona noma nini uma ungidinga.'],
    bye: ['Uhambe kahle{name}! Buya noma nini uma unombuzo.'],
    capabilities: ['Ngingakusiza nge:\n• Ukuthola umsebenzi eduze kwakho nokufaka isicelo\n• Ukuthi ukhokhelwa kanjani, neholo elifanele\n• Irekhodi lakho, i-Vuka Score ne-Ladder\n• Ukuphepha nokubona ukukhwabanisa\nBhala umbuzo wakho, noma uthinte imakrofoni ubuze.'],
    whoAreYou: ['NginguMsizi — "umsizi" kusho umuntu osizayo. Ngihlala ku-Vuka futhi ngikusiza ukuyisebenzisa. Ungangibhalela noma ukhulume nami.'],
    areYouAi: ['Angisuye umuntu — nginguMsizi, umsizi we-Vuka. Izimpendulo zami eziningi zivela emibhalweni yethimba le-Vuka, kanti uma umbuzo umusha ngisebenzisa i-AI. Uma kubalulekile, hlola ku-app.'],
    joke: ['Kungani umlimi waqashwa kuqala? Ngoba irekhodi lakhe lalilokhu likhula! Manje — ngingakusiza ngani ku-Vuka?'],
    ack: ['Kulungile. Kukhona okunye engingakusiza ngakho?'],
    laugh: ['Ngiyajabula ukuthi umamathekile! Kukhona okunye?'],
    praise: ['Ngiyabonga{name}! Yini enye engingakusiza ngayo?'],
    upset: ['Uxolo{name} — angikutholanga kahle. Zama ukubuza ngamanye amagama, noma uthinte omunye wemibuzo ngezansi.'],
  },
  xh: {
    greet: ['{Greeting}{name}! NdinguMsizi, umncedisi wakho kwi-Vuka. Ndibuze nantoni na — ukufumana umsebenzi, ukuhlawulwa, irekhodi yakho, okanye ukhuseleko.'],
    howAreYou: ['Ndiphilile, enkosi ngokubuza{name}! Ndingakunceda ngantoni namhlanje?'],
    thanks: ['Kuyavuyisa{name}. Ndikhona nanini na xa undidinga.'],
    bye: ['Uhambe kakuhle{name}! Buya nanini na xa unombuzo.'],
    capabilities: ['Ndingakunceda nge:\n• Ukufumana umsebenzi kufutshane nawe nokufaka isicelo\n• Indlela ohlawulwa ngayo, nomvuzo ofanelekileyo\n• Irekhodi yakho, i-Vuka Score ne-Ladder\n• Ukhuseleko nokubona ubuqhetseba\nBhala umbuzo wakho, okanye uchukumise imayikrofoni ubuze.'],
    whoAreYou: ['NdinguMsizi — "umsizi" lithetha umncedisi. Ndihlala kwi-Vuka kwaye ndikunceda ukuyisebenzisa. Ungandibhalela okanye uthethe nam.'],
    areYouAi: ['Andingomntu — ndinguMsizi, umncedisi we-Vuka. Uninzi lweempendulo zam luvela kumanqaku eqela le-Vuka, kwaye xa umbuzo umtsha ndisebenzisa i-AI. Ukuba kubalulekile, jonga kwi-app.'],
    joke: ['Kutheni umlimi waqeshwa kuqala? Kuba irekhodi yakhe yayisoloko ikhula! Ngoku — ndingakunceda ngantoni kwi-Vuka?'],
    ack: ['Kulungile. Ingaba kukho enye into endingakunceda ngayo?'],
    laugh: ['Ndiyavuya ukuba uncumile! Ikhona enye into?'],
    praise: ['Enkosi{name}! Yintoni enye endingakunceda ngayo?'],
    upset: ['Uxolo{name} — andikuvanga kakuhle. Zama ukubuza ngamanye amagama, okanye uchukumise omnye wemibuzo engezantsi.'],
  },
  st: {
    greet: ['{Greeting}{name}! Ke Msizi, mothusi wa hao ho Vuka. Mpotse eng kapa eng — ho fumana mosebetsi, ho lefuwa, rekoto ya hao, kapa polokeho.'],
    howAreYou: ['Ke phela hantle, ke a leboha ho botsa{name}! Nka o thusa ka eng kajeno?'],
    thanks: ['Ke thabo{name}. Ke teng nako efe kapa efe ha o nhloka.'],
    bye: ['Tsamaya hantle{name}! Kgutla nako efe kapa efe ha o na le potso.'],
    capabilities: ['Nka o thusa ka:\n• Ho fumana mosebetsi haufi le wena le ho etsa kopo\n• Kamoo o lefuwang ka teng, le moputso o nepahetseng\n• Rekoto ya hao, Vuka Score le Ladder\n• Polokeho le ho lemoha bomenemene\nNgola potso ya hao, kapa o tobetse maekrofounu o botse.'],
    whoAreYou: ['Ke Msizi — "umsizi" ho bolela mothusi ka isiZulu. Ke dula ho Vuka mme ke o thusa ho e sebedisa. O ka ngolla kapa wa bua le nna.'],
    areYouAi: ['Ha ke motho — ke Msizi, mothusi wa Vuka. Boholo ba dikarabo tsa ka bo tswa dintlheng tsa sehlopha sa Vuka, mme ha potso e le ntjha ke sebedisa AI. Bakeng sa ntho ya bohlokwa, sheba ho app.'],
    joke: ['Hobaneng ha molemi a ile a hirwa pele? Hobane rekoto ya hae e ne e dula e hola! Jwale — nka o thusa ka eng ho Vuka?'],
    ack: ['Ho lokile. Na ho na le ntho e nngwe eo nka o thusang ka yona?'],
    laugh: ['Ke thabile hore o bososele! Ho na le ntho e nngwe?'],
    praise: ['Ke a leboha{name}! Nka o thusa ka eng hape?'],
    upset: ['Ke kopa tshwarelo{name} — ha ke a o utlwisisa hantle. Leka ho botsa ka mantswe a mang, kapa o tobetse e nngwe ya dipotso tse ka tlase.'],
  },
  af: {
    greet: ['{Greeting}{name}! Ek is Msizi, jou helper op Vuka. Vra my enigiets — werk kry, betaal word, jou rekord, of veilig bly.'],
    howAreYou: ['Dit gaan goed, dankie dat jy vra{name}! Hoe kan ek jou vandag help?'],
    thanks: ['Plesier{name}. Ek is hier wanneer jy my nodig het.'],
    bye: ['Mooi loop{name}! Kom terug wanneer jy \'n vraag het.'],
    capabilities: ['Ek kan jou help met:\n• Werk naby jou kry en aansoek doen\n• Hoe jy betaal word, en billike betaling\n• Jou rekord, jou Vuka Score en The Ladder\n• Veilig bly, en swendelary raaksien\nTik jou vraag, of tik die mikrofoon en vra net.'],
    whoAreYou: ['Ek is Msizi — "umsizi" beteken helper in isiZulu. Ek woon in Vuka en help jou om dit te gebruik. Jy kan vir my tik of met my praat.'],
    areYouAi: ['Ek is nie \'n mens nie — ek is Msizi, Vuka se helper. Die meeste van my antwoorde kom uit notas wat die Vuka-span geskryf het, en as \'n vraag nuut is, gebruik ek KI om dit uit daardie notas uit te werk. Kontroleer belangrike dinge in die app.'],
    joke: ['Hoekom is die tuinier eerste aangestel? Want sy rekord het aanhou groei! Nou — waarmee kan ek jou op Vuka help?'],
    ack: ['Goed. Is daar nog iets waarmee ek kan help?'],
    laugh: ['Bly dit het jou laat glimlag! Nog iets?'],
    praise: ['Dankie{name}, dis gaaf van jou! Waarmee kan ek nog help?'],
    upset: ['Jammer{name} — ek het dit nie reg gekry nie. Probeer dit in ander woorde vra, of tik een van die vrae hieronder.'],
  },
};

const DEFAULT_GREETING: Record<Lang, string> = {
  en: 'Hello', zu: 'Sawubona', xh: 'Molo', st: 'Dumela', af: 'Hallo',
};

/* Greetings worth echoing back in the person's own words. */
const ECHO: Record<string, string> = {
  sawubona: 'Sawubona', sanibonani: 'Sanibonani', molo: 'Molo', molweni: 'Molweni',
  dumela: 'Dumela', dumelang: 'Dumelang', lumela: 'Lumela', howzit: 'Howzit', heita: 'Heita',
  aweh: 'Aweh', hallo: 'Hallo', 'good morning': 'Good morning', 'good afternoon': 'Good afternoon',
  'good evening': 'Good evening', 'goeie more': 'Goeie môre', avuxeni: 'Avuxeni', thobela: 'Thobela',
};

export interface ChatReply {
  kind: 'chat';
  intent: string;
  body: string;
  /** Show the opener chips under it — true after a greeting or "help". */
  offerOpeners: boolean;
}

/** Answer small talk, or return null if this is not small talk. */
export function smallTalk(text: string, lang: Lang, firstName: string, _role: Role): ChatReply | null {
  const intent = intentOf(text);
  if (!intent) return null;
  const options = REPLIES[lang]?.[intent] ?? REPLIES.en[intent];
  const line = options[Math.floor(Math.random() * options.length)];
  const greetingWord = ECHO[norm(text)] ?? DEFAULT_GREETING[lang];
  const name = firstName ? (intent === 'greet' ? ` ${firstName}` : `, ${firstName}`) : '';
  const body = line.replace('{Greeting}', greetingWord).replace('{name}', name);
  return {
    kind: 'chat',
    intent,
    body,
    offerOpeners: intent === 'greet' || intent === 'capabilities' || intent === 'upset' || intent === 'whoAreYou',
  };
}

/** Exported for the tests. */
export const __test = { intentOf, norm };
