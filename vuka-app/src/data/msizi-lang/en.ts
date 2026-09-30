/**
 * English: the sentences Msizi's live answers are built from.
 *
 * The written answers themselves live in data/msizi.ts (English is their
 * source); this file holds only the pieces lib/msizi.ts assembles around a
 * person's own figures. Plurals are `key_one` / `key_other` and are chosen
 * with Intl.PluralRules, never `n === 1`.
 *
 * Byte-for-byte what the answers said before they were translatable:
 * check-msizi.mjs reads them.
 */
import type { MsiziLang } from './types';

export const msiziEn: MsiziLang = {
  entries: {},
  live: {},
  text: {
    noRecord: 'You have not completed a job yet, so there is nothing on your record to read out. Your first completed gig starts it — after that this fills in by itself.',

    'fill.tierFirst': 'the tier everyone starts on',
    'fill.tierReqs': '{jobs} completed jobs, {rating} stars or better, no safety flags',
    'fill.tierLine': '• {icon} {name} — {entry}. Unlocks: {unlocks}',
    'fill.categoryLine': '• {list}.',
    'fill.badgeLine': '• {icon} {label} — {desc}.',
    'fill.hours_one': '{count} hour',
    'fill.hours_other': '{count} hours',
    'fill.days_one': '{count} day',
    'fill.days_other': '{count} days',
    'fill.listSep': ', ',

    'score.value': 'Your Vuka Score is {rep} out of 100.',
    'score.built': 'That is built from {jobs}, an average of {avg} stars, and {safety}.',
    'score.jobs_one': '{count} completed job',
    'score.jobs_other': '{count} completed jobs',
    'score.clean': 'a clean safety record',
    'score.flags_one': '{count} safety flag',
    'score.flags_other': '{count} safety flags',
    'score.flagHolding': 'The flag is what is holding it back, and it is also blocking your next tier.',
    'score.strong': 'That is a strong record. Employers browsing talent will see you near the top.',

    'tier.youAre': 'You are {icon} {name} — {tagline}.',
    'tier.unlocks': 'That unlocks: {unlocks}',
    'tier.top': 'That is the top of The Ladder. There is nothing above it.',
    'tier.next': 'Next is {icon} {name}.',
    'tier.needJobs_one': '{count} more completed job',
    'tier.needJobs_other': '{count} more completed jobs',
    'tier.needRating': 'an average of {rating} stars or better — yours is {avg}',
    'tier.needClean': 'a clean record — a safety flag is blocking it',
    'tier.allMet': 'You meet every condition for it.',
    'tier.stillNeed': 'You still need {list}.',
    'tier.and': ', and ',

    'jobs.done_one': 'You have completed {count} job on Vuka, across {kinds}, at an average of {avg} stars.',
    'jobs.done_other': 'You have completed {count} jobs on Vuka, across {kinds}, at an average of {avg} stars.',
    'jobs.kinds_one': '{count} kind of work',
    'jobs.kinds_other': '{count} kinds of work',

    'earn.total_one': 'You have earned {amount} from {count} completed job, counted from the pay each job listed. What is in your wallet right now is a separate figure — ask me "how much is in my wallet".',
    'earn.total_other': 'You have earned {amount} from {count} completed jobs, counted from the pay each job listed. What is in your wallet right now is a separate figure — ask me "how much is in my wallet".',

    'badges.none': 'You have not earned a badge yet. The first one, First Job, arrives the moment your first gig is confirmed.',
    'badges.earned': 'You have earned {earned} of {total} badges: {list}.',
    'badges.item': '{icon} {label}',
    'badges.missing': 'Still to come: {list}.',
    'badges.missingItem': '{label} ({desc})',
    'badges.missingSep': '; ',

    'wallet.loading': 'Your wallet is still loading. Ask me again in a moment, or open Me, then My wallet.',
    'wallet.error': 'I could not read your wallet just now. Open Me, then My wallet, to see it.',
    'wallet.balance': 'You have {amount} in your wallet, ready to withdraw to your bank.',
    'wallet.empty': 'Your wallet is empty right now.',
    'wallet.pending': 'Another {amount} is secured on jobs you are doing. It arrives when each one is confirmed.',
    'wallet.howLands': 'Pay lands here when an employer confirms a job you did.',
    'wallet.test': 'Payments are in test mode for now, so no real money has moved yet.',

    'apps.none': 'You have not applied for anything yet. Find work shows the gigs near you, and applying is one tap.',
    'apps.some_one': 'You have applied for {count} gig. Employers see everyone who applied and choose from them, so not hearing back on one is normal — keep applying.',
    'apps.some_other': 'You have applied for {count} gigs. Employers see everyone who applied and choose from them, so not hearing back on one is normal — keep applying.',

    'verified.yes': 'Yes — your identity is verified, and the verified mark shows on your profile. That is one of the first things the other side looks at.',
    'verified.no': 'Not yet. You can submit your South African ID number under Me to be verified. It is optional, but an employer choosing between two people will take the verified one.',

    'near.none': 'There is nothing in your feed at the moment. New gigs are posted through the day — turn on New gigs near me under Me, then Notifications, and your phone will tell you instead of you having to check.',
    'near.some_one': 'There is {count} gig in your feed right now, sorted nearest first. Open Find work to see them.',
    'near.some_other': 'There are {count} gigs in your feed right now, sorted nearest first. Open Find work to see them.',

    'messages.none': 'You have no unread messages. Anything new from an employer will show up in Chats, and your phone can tell you if Messages is on under Me, then Notifications.',
    'messages.some_one': 'You have {count} unread message waiting in Chats.',
    'messages.some_other': 'You have {count} unread messages waiting in Chats.',
  },
};
