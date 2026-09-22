/* ============================================================
   What Msizi knows.

   "umsizi" is isiZulu for a helper, and that is the whole job: answer any
   question about how this app works, in plain words, for someone who may be
   using their first smartphone to look for their first job.

   ------------------------------------------------------------
   Why this is a written knowledge base and not a language model.

   Because it has to be RIGHT, and because it has to be free.

   Right: every question here has exactly one true answer, and that answer is
   about someone's income, their reputation, or their safety walking to a
   stranger's address. A generative model asked "does Vuka hold my money until
   the job is done?" will produce a fluent, plausible, reassuring yes — because
   that is what such apps usually do. It is not what this one does, and a
   worker who believes it has been told to expect protection that will not
   arrive. A closed domain with a known answer set does not need a model; it
   needs the answers written down by someone who checked.

   Free: every model call costs money, on every message, forever, for an app
   whose users are by definition not earning. This file costs nothing to ask,
   works with no signal, and does not send a single word about anybody's work
   history to a third party.

   ------------------------------------------------------------
   THE RULE THAT KEEPS THIS HONEST: no figure is typed here.

   Wages, confirmation windows, tiers, badges and categories are written as
   {placeholders} and resolved at render time from the same modules the screens
   use — which take their values from the server. This is deliberate and is not
   a style preference.

   The national minimum wage is re-gazetted every March. It has already gone
   stale in this codebase once, in two hardcoded constants that the Fair-Pay
   meter was showing users as though it were law. An assistant that confidently
   recites last year's wage to somebody deciding whether a job is worth taking
   would be the third such constant, and the most damaging, because it sounds
   like an authority. So there is nothing here to go stale.

   If you add an entry, check it against the code that implements it. An answer
   nobody verified is worse than no answer, because the user cannot tell which
   kind they just received.
   ============================================================ */
import type { Role } from '../types';
import type { Screen } from '../store/appStore';

export interface KnowledgeEntry {
  id: string;
  /** Heading shown above the answer. */
  title: string;
  /**
   * Ways somebody might ask this. The first is canonical and is what gets
   * offered as a suggestion chip, so write that one the way a person speaks.
   */
  asks: string[];
  /** Words that should pull toward this answer without being phrasings. */
  keywords?: string[];
  /** The answer. Lines beginning "• " render as bullets. */
  body: string;
  /** Who this is for. Omitted means both roles. */
  role?: Role;
  /** Offered underneath as "next" chips. */
  next?: string[];
  /** Where to send someone who wants to act on the answer. */
  goto?: { screen: Screen; labelKey: string };
}

/* ------------------------------------------------------------------
   The entries.

   Grouped by the question someone is actually trying to answer, not by the
   part of the codebase that implements it.
   ------------------------------------------------------------------ */

export const KNOWLEDGE: KnowledgeEntry[] = [
  /* ---------------- What this is ---------------- */
  {
    id: 'what-is-vuka',
    title: 'What Vuka Uzenzele is',
    asks: ['What is Vuka?', 'What does this app do?', 'Explain this app to me'],
    keywords: ['about', 'purpose', 'vuka', 'uzenzele', 'app', 'platform'],
    body:
      'Vuka Uzenzele connects young South Africans to work — starting with small local gigs, and building into formal jobs.\n'
      + 'The idea is simple. You do not need a CV to start. You do a job, the employer rates you, and that rating becomes your record. Enough good work and you move up The Ladder, which unlocks better-paying and more formal roles.\n'
      + 'It is free to use, for workers and for employers.\n'
      + 'Youth unemployment in South Africa is {youthUnemployment} for ages 15 to 24. This app exists to give people a way in when nobody will give them a first chance.',
    next: ['how-to-start', 'the-ladder', 'is-it-free'],
  },
  {
    id: 'is-it-free',
    title: 'What it costs',
    asks: ['Is Vuka free?', 'How much does it cost?', 'Do I have to pay to use this?'],
    keywords: ['free', 'cost', 'price', 'fee', 'charge', 'subscription', 'pay to use'],
    body:
      'Vuka is free. There is no sign-up fee, no monthly fee, and no charge to apply for work or to post a job.\n'
      + 'Vuka also does not take a cut of what you earn, because Vuka does not handle the money at all — the employer pays you directly.\n'
      + 'If anyone ever asks you to pay a fee to get a job on Vuka, that is a scam. Report it.',
    next: ['how-payment-works', 'report-someone'],
  },
  {
    id: 'who-is-msizi',
    title: 'Who Msizi is',
    asks: ['Who are you?', 'What can you do?', 'Are you a robot?'],
    keywords: ['msizi', 'assistant', 'help', 'bot', 'ai', 'robot', 'you'],
    body:
      'I am Msizi — "umsizi" means helper. I answer questions about how Vuka works.\n'
      + 'I am not an artificial intelligence and I do not guess. I am a set of answers written and checked against how this app actually behaves, so if I tell you something, it is true of Vuka. If I do not know something, I will say so rather than invent it.\n'
      + 'I can read your own record back to you — your score, your tier, your jobs, your applications — because that is on your phone already. I cannot apply for jobs for you, hire anyone, or touch your banking details. Those stay your decision, always.\n'
      + 'You can type to me or tap the microphone and talk.',
    next: ['msizi-languages', 'my-score', 'find-work'],
  },
  {
    id: 'msizi-languages',
    title: 'Talking to Msizi in your language',
    asks: ['Can you speak isiZulu?', 'What languages do you speak?', 'Can I talk to you in my language?'],
    keywords: ['language', 'isizulu', 'zulu', 'xhosa', 'isixhosa', 'sesotho', 'sotho', 'afrikaans', 'english', 'speak', 'translate'],
    body:
      'You can ask me questions in isiZulu, isiXhosa, Sesotho, Afrikaans or English, and I will understand common words in all of them.\n'
      + 'My answers are written in English for now. That is honest rather than ideal — the app is being translated screen by screen, and I would rather give you a correct English answer than a rough translation of something about your money or your safety.\n'
      + 'Talking out loud is a separate problem. Your phone does the listening and the speaking, not Vuka, and most phones can only do that in English and Afrikaans. isiZulu, isiXhosa and Sesotho voices mostly do not exist yet on phones. If yours cannot manage your language, I will tell you on the screen instead of quietly doing nothing.',
    next: ['change-language', 'who-is-msizi'],
  },

  /* ---------------- Getting started ---------------- */
  {
    id: 'how-to-start',
    title: 'Getting started',
    asks: ['How do I start?', 'How do I sign up?', 'How do I create an account?'],
    keywords: ['start', 'signup', 'sign up', 'register', 'join', 'account', 'new'],
    body:
      'Choose whether you are looking for work or looking to hire, then sign up with your phone number.\n'
      + '• We send a one-time code by SMS to check the number is really yours.\n'
      + '• You pick a password and add a few details — your area, your age, the kinds of work you can do.\n'
      + '• That is it. You can start applying for gigs straight away, with no CV and no work history.\n'
      + 'Your first job is the one that starts your record. After that, the record does the talking for you.',
    next: ['worker-or-employer', 'otp-problems', 'find-work'],
  },
  {
    id: 'worker-or-employer',
    title: 'Worker account or employer account',
    asks: ['What is the difference between a worker and an employer account?', 'Which account should I choose?'],
    keywords: ['worker', 'employer', 'account type', 'role', 'difference', 'choose'],
    body:
      'A worker account is for finding work. You browse gigs, apply, do the job, and build a record that unlocks better jobs.\n'
      + 'An employer account is for hiring. You post a job, see who applies, pick someone, and confirm the work when it is done.\n'
      + 'One phone number is one account, so pick the one that matches what you are here to do. If you need both, use a different number for the second.',
    next: ['how-to-start', 'post-a-job'],
  },
  {
    id: 'minimum-age',
    title: 'How old you have to be',
    asks: ['How old do I have to be?', 'Can I work on Vuka if I am 16?', 'What is the minimum age?'],
    keywords: ['age', 'old', 'young', 'minimum age', 'teenager', 'under 18', 'school leaver'],
    body:
      'You have to be 18 or older to use Vuka.\n'
      + 'South African law does allow people from 15 to do certain work, so this is our limit rather than the country’s. The reason is POPIA: anyone under 18 is legally a child, and a child’s personal information may not be handled without a guardian’s consent. Vuka has no way to obtain and verify that consent yet, so rather than collect a young person’s ID, location and banking details without it, we do not take the account at all.\n'
      + 'If you are turning 18 soon, sign up then. Nothing is lost by waiting.',
    next: ['how-to-start', 'what-data'],
  },
  {
    id: 'otp-problems',
    title: 'When the SMS code does not arrive',
    asks: ['I did not get my OTP', 'The SMS code is not coming', 'I cannot verify my number'],
    keywords: ['otp', 'sms', 'code', 'verify', 'verification', 'not received', 'text message'],
    body:
      'The code is sent by SMS and usually lands within a minute.\n'
      + '• Check the number you typed, including the leading 0.\n'
      + '• Make sure you have signal. The code cannot arrive if the phone has no network.\n'
      + '• Wait a full minute before asking for another one — requesting several in a row can put you behind a rate limit.\n'
      + 'If it still does not arrive, it is a problem on our side rather than yours, and the app will say so rather than leave you guessing.',
    next: ['how-to-start', 'forgot-password'],
  },
  {
    id: 'forgot-password',
    title: 'Forgotten password',
    asks: ['I forgot my password', 'How do I reset my password?', 'I cannot log in'],
    keywords: ['password', 'forgot', 'reset', 'login', 'log in', 'locked out', 'cannot sign in'],
    body:
      'On the log-in screen, choose to reset your password. We send a code to your phone number, and once you enter it you can set a new password.\n'
      + 'The reset only works on the number the account was created with — that is what stops somebody else resetting your password for you.',
    next: ['otp-problems'],
  },
  {
    id: 'change-language',
    title: 'Changing the language',
    asks: ['How do I change the language?', 'Can I use this in isiZulu?'],
    keywords: ['language', 'change', 'isizulu', 'isixhosa', 'sesotho', 'afrikaans', 'english', 'switch'],
    body:
      'Go to Me, then Language. Vuka is available in English, isiZulu, isiXhosa, Sesotho and Afrikaans, and your choice is remembered even when you are offline.\n'
      + 'Be aware that the app is being translated screen by screen, so some screens are still English. The Language screen tells you honestly how far along it is.\n'
      + 'The legal pages stay in English on purpose — a mistranslated legal term misleads people, and that is worse than asking you to read it in English.\n'
      + 'If a translation reads wrong to you, there is a box on that screen to tell us. A person reads those.',
    goto: { screen: 'me', labelKey: 'msizi.goto.me' },
    next: ['msizi-languages'],
  },
  {
    id: 'install-app',
    title: 'Installing Vuka on your phone',
    asks: ['How do I install the app?', 'Can I add this to my home screen?', 'Is there an app to download?'],
    keywords: ['install', 'download', 'home screen', 'app store', 'play store', 'pwa', 'offline'],
    body:
      'Vuka installs straight from the browser — there is nothing to download from an app store, which means no big download and no data spent on updates.\n'
      + 'Look for the install button in the app, or use your browser menu and choose Add to home screen.\n'
      + 'Once installed it opens like any other app, works with a weak signal, and shows your saved screens even when you are offline.',
    next: ['works-offline'],
  },
  {
    id: 'works-offline',
    title: 'Using Vuka without data',
    asks: ['Does this work offline?', 'Can I use Vuka without data?', 'What happens if I lose signal?'],
    keywords: ['offline', 'data', 'signal', 'connection', 'internet', 'airplane', 'no network'],
    body:
      'Partly, and deliberately so. Vuka is built for a phone with an empty data bundle in a place with one bar.\n'
      + '• The app itself opens with no signal, in the language you chose.\n'
      + '• Screens you have already seen stay readable.\n'
      + '• Messages you send while offline wait and go out when the signal comes back, rather than being lost.\n'
      + 'What does need a connection: new job listings, applying, and anything that has to reach the other person.',
    next: ['install-app'],
  },

  /* ---------------- Finding work ---------------- */
  {
    id: 'find-work',
    title: 'Finding work',
    asks: ['How do I find work?', 'Where are the jobs?', 'How do I get a job?'],
    keywords: ['find', 'work', 'job', 'jobs', 'gig', 'gigs', 'search', 'browse', 'apply', 'hiring'],
    role: 'worker',
    body:
      'Tap Find work. You will see gigs near you, nearest first.\n'
      + '• Filter by the kind of work using the category row at the top.\n'
      + '• Each listing shows the pay per hour, how long it is, how far away it is, and who is offering it.\n'
      + '• Open one to read the detail, then apply. Applying takes one tap and costs nothing.\n'
      + 'You can apply for as many as you like. The employer sees your record — your rating, your jobs done, your tier — and picks from the people who applied.',
    goto: { screen: 'jobs', labelKey: 'msizi.goto.jobs' },
    next: ['job-types', 'after-i-apply', 'distance'],
  },
  {
    id: 'job-types',
    title: 'The kinds of work on Vuka',
    asks: ['What kind of jobs are there?', 'What work can I do?', 'What categories are there?'],
    keywords: ['categories', 'kinds', 'types', 'what jobs', 'cleaning', 'gardening', 'tutoring'],
    body:
      'Gigs — short, local, paid by the hour. Right now these are:\n'
      + '{categories}\n'
      + 'Formal jobs — proper shift and entry-level employment, like petrol attendant, warehouse work, cashier, security officer, call-centre agent and retail assistant.\n'
      + 'Formal jobs are earned rather than browsed. Each one needs a tier, and you reach a tier by doing gigs well. That is the whole point of the ladder: the small jobs are how you get to the big ones without a CV.',
    next: ['the-ladder', 'formal-jobs-locked'],
  },
  {
    id: 'no-matric-needed',
    title: 'Whether you need matric or experience',
    asks: ['Do I need matric?', 'Do I need experience?', 'Do I need a CV to start?'],
    keywords: ['matric', 'grade 12', 'qualification', 'education', 'certificate', 'experience', 'cv', 'school', 'diploma', 'no experience'],
    role: 'worker',
    body:
      'No. You do not need matric, a CV, experience, or a reference to start on Vuka. That is the point of it.\n'
      + 'Gigs are open to everyone. You do a job, the employer rates you, and that rating is the experience — it becomes the record that gets you the next one.\n'
      + 'Formal jobs are gated by your tier, not by your schooling. A tier is earned from completed work, so somebody who left school early and works well reaches cashier and call-centre roles the same way anyone else does. Some individual listings do state their own requirements, and the listing tells you.\n'
      + 'If you do have matric or a certificate, add it to your profile — it can only help. It is never the thing standing between you and a first gig.',
    next: ['the-ladder', 'my-record', 'find-work'],
  },
  {
    id: 'after-i-apply',
    title: 'What happens after you apply',
    asks: ['What happens after I apply?', 'How do I know if I got the job?', 'Why has nobody replied?'],
    keywords: ['applied', 'application', 'waiting', 'reply', 'response', 'hired', 'status', 'nobody'],
    role: 'worker',
    body:
      'The employer sees everyone who applied, along with each person record, and chooses. If they choose you, you are hired and you get a notification.\n'
      + 'You can see everything you have applied for on your Home screen.\n'
      + 'Not hearing back is normal and it is not a judgement on you — a gig that needs one person may have had twenty applicants. Keep applying. The single biggest thing that changes your odds is having a few completed jobs and a good rating behind you, which is why the first one matters more than the rest.',
    next: ['my-applications', 'the-ladder'],
  },
  {
    id: 'distance',
    title: 'How far away a job is',
    asks: ['How far is this job?', 'How does Vuka know my location?', 'Why does it show the wrong distance?'],
    keywords: ['distance', 'far', 'location', 'gps', 'near', 'km', 'travel', 'where'],
    body:
      'If you let Vuka use your location, distances are measured from where you actually are, and the feed is sorted nearest first.\n'
      + 'If you do not, each listing still shows its own area label, and the app marks that as an estimate rather than pretending it measured it.\n'
      + 'Your position is used on your phone to sort and measure. Distance matters here more than it looks: transport is the single biggest cost of looking for work in South Africa, so a job two taxis away can cost more to reach than it pays.',
    next: ['find-work', 'fair-pay'],
  },
  {
    id: 'invitations',
    title: 'Job invitations',
    asks: ['What is an invitation?', 'An employer invited me — what does that mean?'],
    keywords: ['invite', 'invitation', 'invited', 'offered', 'approached'],
    role: 'worker',
    body:
      'An employer who has seen your record can invite you to a specific job directly, instead of waiting for you to find it.\n'
      + 'An invitation is not a hire yet — it is being asked to apply. You can accept or decline, and declining costs you nothing and is not held against your record.\n'
      + 'Invitations become much more common once you are Trusted or above, because that is the point at which employers start browsing talent rather than just posting and waiting.',
    next: ['the-ladder'],
  },
  {
    id: 'change-my-mind',
    title: 'Changing your mind about a job',
    asks: ['Can I cancel a job?', 'How do I withdraw my application?', 'I cannot go to the job anymore'],
    keywords: ['cancel', 'withdraw', 'unapply', 'change mind', 'pull out', 'cannot go', 'no longer', 'quit job'],
    role: 'worker',
    body:
      'There is no un-apply button in the app yet, so an application you have sent stays sent.\n'
      + 'If you can no longer do a job, message the employer in Chats and tell them as soon as you know. That is the whole of it — telling them early costs you nothing, and it is what a reliable person does.\n'
      + 'What does damage a record is silence: being hired and then not arriving, with no message. The employer can rate that, and it is the one thing that is genuinely hard to recover from.\n'
      + 'Applying to something and never hearing back is not the same thing and carries no penalty at all.',
    next: ['chats', 'after-i-apply'],
  },
  {
    id: 'formal-jobs-locked',
    title: 'Why a formal job is locked',
    asks: ['Why can I not apply for this job?', 'Why is this job locked?', 'How do I unlock formal jobs?'],
    keywords: ['locked', 'cannot apply', 'tier required', 'formal', 'unlock', 'blocked', 'greyed out'],
    role: 'worker',
    body:
      'Formal jobs each need a minimum tier, and you reach a tier by completing gigs with good ratings.\n'
      + 'This is not us keeping you out. It is the opposite: an employer offering a real shift job will not take someone with no history, so the tier is the evidence that stands in for the CV and the references you do not have yet. When Vuka says you are Trusted, that is three completed jobs and a rating behind it.\n'
      + 'The job listing tells you which tier it needs. Your Record tells you how far you are from it.',
    next: ['the-ladder', 'move-up-tier'],
  },

  /* ---------------- Record, score and ladder ---------------- */
  {
    id: 'my-record',
    title: 'My Record',
    asks: ['What is My Record?', 'What is on my record?', 'Where is my CV?'],
    keywords: ['record', 'cv', 'profile', 'history', 'resume', 'work history', 'reference', 'references', 'proof of work'],
    role: 'worker',
    body:
      'My Record is the CV the app writes for you, from work you have actually done.\n'
      + 'It holds every completed job, what it was, who it was for, what you were paid, and the rating and review the employer left. It also carries your Vuka Score, your tier and your badges.\n'
      + 'You never write it and you cannot edit it, which is exactly why an employer believes it. Each job is listed under a proper occupational title — a moving job reads as Removals Assistant, not "moving help" — because that is what someone hiring is scanning for.\n'
      + 'You can share it as a public link, so it works as a CV outside the app too.',
    goto: { screen: 'cv', labelKey: 'msizi.goto.cv' },
    next: ['vuka-score', 'the-ladder', 'public-cv'],
  },
  {
    id: 'vuka-score',
    title: 'The Vuka Score',
    asks: ['What is the Vuka Score?', 'How is my score calculated?', 'How do I raise my score?'],
    keywords: ['score', 'rep', 'reputation', 'points', 'rating', 'calculated', 'percentage'],
    role: 'worker',
    body:
      'Your Vuka Score is a single number out of 100 that sums up your record. It is built from three things:\n'
      + '• Your average star rating, which is the largest part of it.\n'
      + '• How many jobs you have completed, counting up to twelve.\n'
      + '• A clean safety record, with no flags against you.\n'
      + 'It stays at zero until your first completed job, because there is nothing to measure yet.\n'
      + 'The way to raise it is the ordinary way: turn up, do the work properly, and be someone an employer wants back. There is no way to buy it or boost it, which is the only reason it is worth anything.',
    next: ['the-ladder', 'safety-flag', 'my-score'],
  },
  {
    id: 'the-ladder',
    title: 'The Ladder',
    asks: ['What is The Ladder?', 'What are the tiers?', 'Explain the tiers to me'],
    keywords: ['ladder', 'tier', 'tiers', 'level', 'levels', 'rank', 'starter', 'trusted', 'professional', 'elite', 'medal'],
    role: 'worker',
    body:
      'The Ladder is how small jobs turn into real ones. There are four tiers, and each is earned:\n'
      + '{tiers}\n'
      + 'You move up automatically the moment you meet every condition for the next tier — jobs done, average rating, and no safety flags.\n'
      + 'Nothing here can be bought and nothing expires.',
    next: ['move-up-tier', 'vuka-score', 'my-tier'],
  },
  {
    id: 'move-up-tier',
    title: 'Moving up a tier',
    asks: ['How do I move up a tier?', 'How do I get to the next level?', 'What is stopping me moving up?'],
    keywords: ['move up', 'next tier', 'promotion', 'upgrade', 'progress', 'stuck', 'requirements'],
    role: 'worker',
    body:
      'Three conditions, all of which must be true at once:\n'
      + '• Enough completed jobs for that tier.\n'
      + '• An average rating at or above what the tier asks.\n'
      + '• No safety flags on your record.\n'
      + 'Your Record shows which of the three you have met and which you have not, so you can see exactly what is in the way rather than guessing.\n'
      + 'Ask me "what is my tier" and I will read your own numbers back to you.',
    next: ['the-ladder', 'safety-flag', 'my-tier'],
  },
  {
    id: 'badges',
    title: 'Badges',
    asks: ['What are badges?', 'How do I earn badges?'],
    keywords: ['badge', 'badges', 'award', 'achievement', 'earn', 'medal'],
    role: 'worker',
    body:
      'Badges mark specific things you have done. They sit on your record where an employer can see them:\n'
      + '{badges}\n'
      + 'They are earned automatically. You never have to claim one.',
    next: ['my-badges', 'id-verification'],
  },
  {
    id: 'ratings-average',
    title: 'How your rating works',
    asks: ['How does my rating work?', 'Why did my average not change?', 'Who rates me?'],
    keywords: ['rating', 'stars', 'average', 'review', 'rated', 'feedback'],
    role: 'worker',
    body:
      'When you finish a job the employer confirms it and rates you from one to five stars, with a short review. That rating goes onto your record and into your average.\n'
      + 'One case surprises people, and it is in your favour. If an employer never gets round to confirming, the job is credited to you anyway after the confirmation window — but it is stored with no rating at all, and left out of your average entirely. So an employer going quiet can neither help nor hurt your rating. You still get the job, the earnings and the record entry.',
    next: ['confirm-work', 'vuka-score'],
  },
  {
    id: 'safety-flag',
    title: 'Safety flags',
    asks: ['What is a safety flag?', 'How does a flag affect me?', 'Can a flag be removed?'],
    keywords: ['flag', 'flagged', 'safety flag', 'warning', 'blocked', 'mark'],
    body:
      'A safety flag is raised when someone reports a genuine safety concern about a job — by the worker about the employer, or the other way round.\n'
      + 'A flag on your record stops you moving up a tier, because every tier above Starter requires a clean record.\n'
      + 'Flags are read by a person, not decided by the app. They exist to keep people safe walking into strangers homes and to keep the ladder worth something — not as a punishment for a job that went badly. A disagreement about the work is not a safety flag.',
    next: ['report-someone', 'move-up-tier'],
  },
  {
    id: 'public-cv',
    title: 'Sharing your record',
    asks: ['How do I share my CV?', 'Can I send my record to someone?', 'Can people see my record without the app?'],
    keywords: ['share', 'link', 'public', 'cv', 'send', 'whatsapp', 'outside', 'reference', 'show employer'],
    role: 'worker',
    body:
      'Your record can be shared as a link. Anyone who opens it sees a read-only version of your work history, rating and tier, without needing a Vuka account.\n'
      + 'This is how you answer "do you have a CV?" when you do not have one. Send the link on WhatsApp.\n'
      + 'The public version shows your work and your reputation. It does not show your phone number, your ID number or your banking details.',
    goto: { screen: 'cv', labelKey: 'msizi.goto.cv' },
    next: ['my-record', 'what-data'],
  },

  /* ---------------- Money ---------------- */
  {
    id: 'how-payment-works',
    title: 'How you get paid',
    asks: ['How do I get paid?', 'Does Vuka hold my money?', 'When do I get my money?'],
    keywords: ['paid', 'payment', 'money', 'wages', 'cash', 'eft', 'salary', 'earn', 'escrow'],
    body:
      'The employer pays you directly. Vuka does not process payments and does not hold your money at any point.\n'
      + 'This matters, so it is worth being plain about it: Vuka is not an escrow service. When an employer confirms your finished job in the app, what that releases is your reference — the entry on your record, your rating and your tier progress. It does not release money, because the money was never with us.\n'
      + 'So agree the amount and how you will be paid with the employer before you start the work. The listing shows the rate per hour and the hours, which is what you should be paid.\n'
      + 'If an employer does not pay you, report it. That is exactly what the safety report is for.',
    next: ['banking-details', 'fair-pay', 'report-someone'],
  },
  {
    id: 'banking-details',
    title: 'Your banking details',
    asks: ['Why does Vuka want my bank details?', 'Are my banking details safe?', 'How do I add my bank account?'],
    keywords: ['bank', 'banking', 'account number', 'branch code', 'payout', 'capitec', 'fnb', 'absa'],
    body:
      'You can save your banking details under Me, so you have them ready to give an employer without digging for a card.\n'
      + 'They are encrypted on the server and are never sent back to the app. Even you only ever see a masked hint — your bank, the account type, and the last four digits. Nothing sensitive is stored on your phone.\n'
      + 'Adding them is optional, and Vuka does not pay you through them today, since the employer pays you directly.\n'
      + 'Nobody from Vuka will ever phone or message you asking for your account number, your PIN or an OTP. Anyone who does is not from Vuka.',
    goto: { screen: 'me', labelKey: 'msizi.goto.me' },
    next: ['how-payment-works', 'what-data'],
  },
  {
    id: 'fair-pay',
    title: 'The Fair-Pay meter and the minimum wage',
    asks: ['What is the fair pay meter?', 'What is minimum wage?', 'Is this job paying me enough?'],
    keywords: ['fair', 'pay meter', 'minimum wage', 'underpaid', 'rate', 'per hour', 'legal', 'too low'],
    body:
      'The national minimum wage in South Africa is {minWage} per hour. It is set by government and re-gazetted every year, effective 1 March.\n'
      + 'Every gig on Vuka shows a Fair-Pay meter comparing its rate against that figure, so you can tell at a glance whether what you are being offered is legal and fair before you spend taxi fare getting there.\n'
      + 'A job paying under the minimum wage is not lawful. You are allowed to say no, and you are allowed to report it.\n'
      + 'Also weigh the travel. A rate that looks fine can be worse than staying home once two taxis are paid for.',
    next: ['how-payment-works', 'distance'],
  },
  {
    id: 'total-earned',
    /* Careful: the phrasings here must not collide with the live my-earnings
       intent, which reads the person's own figure back to them. "How much have
       I earned?" belongs to that one; this entry explains what the number is
       counting. Two entries sharing a phrasing is a coin toss at match time. */
    title: 'What the total earned figure counts',
    asks: ['What does total earned include?', 'How is my total earnings worked out?'],
    keywords: ['earned', 'earnings', 'total', 'income', 'money made', 'counted'],
    role: 'worker',
    body:
      'Your Record adds up everything from every completed job and shows it as your total earned.\n'
      + 'It counts work that was confirmed, including jobs credited automatically when an employer never confirmed. It does not count jobs you have applied for or are still busy with.\n'
      + 'Ask me "how much have I earned" and I will read you your own figure.',
    next: ['my-earnings', 'my-record'],
  },

  /* ---------------- Doing the work ---------------- */
  {
    id: 'mark-job-done',
    title: 'Marking a job done',
    asks: ['How do I mark a job as done?', 'I finished the job — what now?'],
    keywords: ['done', 'finished', 'complete', 'completed', 'mark', 'end job', 'rate employer', 'rate the employer', 'review employer', 'star the employer'],
    role: 'worker',
    body:
      'Open the job from your Home screen and mark it done. You will be asked to rate the employer out of five stars before you can — this is the part that keeps employers honest, and it is why other workers can see who is good to work for.\n'
      + 'If something about the job was unsafe, there is a box to raise a safety flag at the same time. A person reads those.\n'
      + 'The employer is then asked to confirm. Once they do, the job lands on your record with their rating and review.',
    next: ['confirm-work', 'ratings-average'],
  },
  {
    id: 'confirm-work',
    title: 'Waiting for an employer to confirm',
    asks: ['The employer has not confirmed my job', 'How long does confirmation take?', 'What if they never confirm?'],
    keywords: ['confirm', 'confirmation', 'waiting', 'pending', 'never confirmed', 'auto release', 'stuck'],
    body:
      'After you mark a job done, the employer has {autoReleaseHours} hours to confirm it.\n'
      + 'If they never do, the job is credited to you anyway once that window passes. You get the record entry, the earnings and the tier progress. It is stored without a rating, so their silence cannot drag your average down — or push it up.\n'
      + 'This exists because an employer who simply stops replying used to cancel a worker progress permanently, for work that was genuinely done. Now they cannot.',
    next: ['ratings-average', 'my-jobs'],
  },

  /* ---------------- Employers ---------------- */
  {
    id: 'post-a-job',
    title: 'Posting a job',
    asks: ['How do I post a job?', 'How do I hire someone?', 'How do I advertise work?'],
    keywords: ['post', 'advertise', 'hire', 'list', 'job posting', 'create job', 'need someone'],
    role: 'employer',
    body:
      'Tap Post. You describe the work, where it is, how many hours, and what you are paying per hour.\n'
      + '• The Fair-Pay meter shows you how your rate compares with the national minimum wage of {minWage} per hour as you type. Paying under it is not lawful.\n'
      + '• Your job goes live to workers near you immediately.\n'
      + '• You see everyone who applies, with their record — rating, jobs completed, tier and badges.\n'
      + 'Posting is free, and Vuka takes no commission.',
    goto: { screen: 'post', labelKey: 'msizi.goto.post' },
    next: ['choose-worker', 'employer-confirm', 'fair-pay'],
  },
  {
    id: 'choose-worker',
    title: 'Choosing who to hire',
    asks: ['How do I choose a worker?', 'How do I know who is reliable?', 'What do the tiers mean when hiring?'],
    keywords: ['choose', 'pick', 'select', 'applicants', 'reliable', 'trust', 'who to hire', 'talent'],
    role: 'employer',
    body:
      'Every applicant carries a record built from work they have actually done on Vuka — their average rating, how many jobs they have completed, their tier, and whether their ID is verified.\n'
      + 'The tier is the quickest read. Trusted means at least three completed jobs at a good average with no safety flags. Professional and Elite mean considerably more.\n'
      + 'You can also browse Talent directly and invite someone to a job rather than waiting for applications.\n'
      + 'Worth knowing: workers rate you too, and that rating is shown on your listings. Confirming work promptly and paying what you advertised is what keeps good people applying to you.',
    next: ['employer-confirm', 'the-ladder'],
  },
  {
    id: 'employer-confirm',
    title: 'Confirming finished work',
    asks: ['How do I confirm a job is done?', 'Why must I confirm?', 'What happens if I do not confirm?'],
    keywords: ['confirm', 'approve', 'sign off', 'rate worker', 'finished', 'complete'],
    role: 'employer',
    body:
      'When a worker marks a job done you get a notification. Open it, confirm the work, and rate them out of five with a short review.\n'
      + 'Please do it promptly. For you it is a tap; for them it is the entry on their record that unlocks the next tier and the next kind of job.\n'
      + 'If you do not confirm within {autoReleaseHours} hours, the job is credited to the worker automatically, without a rating. Your review is the part that is lost, and that review is the most valuable thing you can give someone who is building a first work history.\n'
      + 'Confirming releases their reference. It does not move money — you pay the worker directly.',
    next: ['how-payment-works', 'choose-worker'],
  },
  {
    id: 'employer-cost',
    title: 'What it costs an employer',
    asks: ['What does it cost to post a job?', 'Does Vuka take commission?'],
    keywords: ['cost', 'fee', 'commission', 'charge', 'free', 'price', 'employer'],
    role: 'employer',
    body:
      'Nothing. Posting a job is free, hiring is free, and Vuka takes no commission on what you pay the worker.\n'
      + 'Vuka does not handle the payment at all — you pay the worker directly, however the two of you agree.',
    next: ['how-payment-works', 'post-a-job'],
  },

  /* ---------------- Safety, trust and privacy ---------------- */
  {
    id: 'is-it-safe',
    title: 'Staying safe',
    asks: ['Is Vuka safe?', 'How do I stay safe?', 'Is it safe to go to a stranger house?'],
    keywords: ['safe', 'safety', 'danger', 'scam', 'risk', 'stranger', 'protect', 'careful'],
    body:
      'Vuka gives you information to judge with, but you are the one travelling to an address, so the sensible precautions still apply:\n'
      + '• Check whether the employer ID is verified, and look at their rating from other workers.\n'
      + '• Keep the conversation in the app. It is a record, and it can be read by a person if something goes wrong.\n'
      + '• Tell someone where you are going and when you expect to be back.\n'
      + '• Agree the pay before you travel.\n'
      + '• Never pay anyone to get a job, and never send your ID or banking details to someone who asks for them in a chat.\n'
      + 'If anything feels wrong, leave. You can report a person, block them, and raise a safety flag on the job.',
    next: ['report-someone', 'id-verification', 'block-someone'],
  },
  {
    id: 'scam-warning',
    title: 'When someone asks you for money or documents',
    asks: [
      'Someone is asking me for money to get a job',
      'An employer asked for my ID number in the chat',
      'Is this a scam?',
    ],
    keywords: [
      'scam', 'scammer', 'fraud', 'asking for money', 'asked for my id', 'send my id',
      'registration fee', 'deposit', 'upfront', 'pin', 'otp', 'suspicious', 'fake', 'cheated',
    ],
    body:
      'Stop, and report them. These are the patterns worth knowing by heart, because every one of them is somebody trying to take from a person who is looking for work:\n'
      + '• Asking you to pay anything — a registration fee, a deposit, a "training" cost, transport money up front. Vuka is free and no real employer charges you to work.\n'
      + '• Asking for your ID number, a photo of your ID, or your banking details in a chat. A real employer does not need any of it to give you a day of work. Vuka asks for your ID only inside the app, for verification, and never through a message.\n'
      + '• Asking for an OTP or a PIN. Nobody legitimate will ever ask for these. Not Vuka, not your bank, not an employer.\n'
      + '• Pushing you to move the conversation to another number and pay there.\n'
      + 'Keep the conversation in the app so there is a record, block them, and report them from the Safety centre. A person reads every report.\n'
      + 'You have not done anything wrong by being asked. Reporting it protects the next person.',
    next: ['report-someone', 'block-someone', 'is-it-safe'],
  },
  {
    id: 'report-someone',
    title: 'Reporting someone',
    asks: ['How do I report someone?', 'Someone did not pay me', 'How do I report a scam?'],
    keywords: ['report', 'complaint', 'abuse', 'did not pay', 'unsafe', 'harassment', 'safety centre', 'robbed', 'assaulted', 'threatened', 'attacked', 'stole', 'hurt', 'mugged'],
    body:
      'Use the Safety centre under Me, or raise a flag when you mark a job done.\n'
      + 'Tell us what happened in your own words. Reports go to a queue that a person reads — they are not handled by a machine.\n'
      + 'Report anyone who does not pay you what was agreed, who asks you for money to get a job, who asks for your ID or banking details in a chat, or who behaves in a way that makes you unsafe.\n'
      + 'Reporting does not put your own record at risk.',
    goto: { screen: 'me', labelKey: 'msizi.goto.me' },
    next: ['block-someone', 'safety-flag', 'is-it-safe'],
  },
  {
    id: 'block-someone',
    title: 'Blocking someone',
    asks: ['How do I block someone?', 'Can I stop someone messaging me?'],
    keywords: ['block', 'blocked', 'stop messages', 'ignore', 'mute'],
    body:
      'Open the chat with that person and block them. They can no longer message you, and you will not see messages from them.\n'
      + 'Blocking is separate from reporting. Blocking stops the contact; reporting tells us there is something a person needs to look at. If someone has done something wrong, do both.',
    next: ['report-someone'],
  },
  {
    id: 'id-verification',
    title: 'ID verification',
    asks: ['How do I verify my ID?', 'What does the verified tick mean?', 'Why should I verify my identity?'],
    keywords: ['id', 'identity', 'verify', 'verified', 'tick', 'green', 'sa id', 'document'],
    body:
      'You can submit your South African ID number to be verified. Once a person has checked it, a verified mark appears on your profile and you earn the ID Verified badge.\n'
      + 'It is optional, and you can use Vuka without it. It is worth doing: an employer choosing between two applicants will take the verified one, and a worker deciding whether to walk to an address will feel very differently about a verified employer.\n'
      + 'Your ID number is encrypted and is not shown to other users. What they see is the verified mark, not the number.',
    next: ['what-data', 'badges'],
  },
  {
    id: 'what-data',
    title: 'What Vuka knows about you',
    asks: ['What data do you keep about me?', 'Who can see my information?', 'Is my data private?'],
    keywords: ['data', 'privacy', 'popia', 'personal information', 'store', 'gdpr', 'who sees', 'secure'],
    body:
      'Vuka keeps what it needs to run: your name and phone number, your profile, your work history and ratings, your messages, and — if you chose to add them — your ID number and banking details, both encrypted.\n'
      + 'Other users see your name, your area, your record and your badges. They do not see your phone number, your ID number or your banking details.\n'
      + 'The servers are in {hosting}.\n'
      + 'You have rights under POPIA to see what is held about you, to correct it, and to have it deleted. The privacy notice under Me explains how to ask, and who to ask.',
    goto: { screen: 'me', labelKey: 'msizi.goto.me' },
    next: ['delete-account', 'banking-details'],
  },
  {
    id: 'delete-account',
    title: 'Deleting your account',
    asks: ['How do I delete my account?', 'Can I remove my information?'],
    keywords: ['delete', 'remove', 'close account', 'erase', 'quit', 'leave'],
    body:
      'You can ask for your account and your personal information to be deleted. The privacy notice under Me has the contact for that request, which is a right you have under POPIA rather than a favour.\n'
      + 'Worth thinking about first: deleting removes your work record, which is the reputation you built and the thing that unlocks formal jobs. It cannot be rebuilt from nothing. If you simply want to stop for a while, you can just stop — nothing expires.',
    next: ['what-data'],
  },

  /* ---------------- Chats ---------------- */
  {
    id: 'chats',
    title: 'Messaging',
    asks: ['How do I message someone?', 'Where are my chats?', 'Can I send a voice note?'],
    keywords: ['chat', 'message', 'messages', 'talk', 'voice note', 'photo', 'send', 'reply', 'whatsapp'],
    body:
      'Chats are in the app, between you and the people you are working with.\n'
      + '• You can send text, voice notes and photos.\n'
      + '• A voice note is often easier than typing — especially in your own language, or when you are describing where you are.\n'
      + '• Messages written with no signal are sent when the signal returns.\n'
      + 'Keep job conversations in the app rather than moving to another number. It is a record, and if something goes wrong it is what a person reviewing a report can actually read.',
    goto: { screen: 'messages', labelKey: 'msizi.goto.messages' },
    next: ['block-someone', 'is-it-safe'],
  },
  {
    id: 'notifications',
    title: 'Job alerts and notifications',
    asks: ['How do I get job alerts?', 'How do I turn on notifications?', 'Why am I not getting alerts?'],
    keywords: ['alert', 'alerts', 'notification', 'notifications', 'push', 'notify', 'sms'],
    body:
      'Turn on Job alerts under Me and your phone will notify you when new work is posted near you, when you are hired, and when someone messages you.\n'
      + 'Your phone will ask permission the first time. If you said no and changed your mind, you have to re-allow notifications for Vuka in your browser or phone settings — the app cannot ask again once it has been refused.',
    goto: { screen: 'me', labelKey: 'msizi.goto.me' },
    next: ['find-work'],
  },
];

/** Every entry, by id, for follow-up chips and direct lookup. */
export const BY_ID: Map<string, KnowledgeEntry> = new Map(KNOWLEDGE.map((e) => [e.id, e]));

/**
 * What to offer someone who has just opened Msizi and has not asked anything.
 *
 * Chosen to be the questions a real person actually arrives with, split by
 * role — not the ones that show the app off best.
 */
export const OPENERS: Record<Role, string[]> = {
  worker: ['find-work', 'the-ladder', 'how-payment-works', 'vuka-score', 'is-it-safe'],
  employer: ['post-a-job', 'choose-worker', 'employer-confirm', 'employer-cost', 'is-it-safe'],
};
