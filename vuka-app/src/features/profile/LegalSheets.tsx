/* ============================================================
   Privacy notice and terms of use.

   Written to be read, not skimmed past. Two rules held throughout:

   1. It only claims what the code actually does. Every "we store X" and
      "we don't do Y" below is checkable against the server: payout numbers are
      AES-256-GCM encrypted and returned masked, ID numbers are encrypted and
      only ever shown as last-4, location is asked for and never taken, and no
      money moves through Vuka at all yet — so the notice says so.
   2. It names the gaps. Where a detail still needs a human decision (the
      registered entity, the Information Officer), the page says the notice is
      not final rather than quietly reading as published policy.

   POPIA s18 shapes the privacy sections: who is responsible, what is collected,
   why, on what lawful basis, who it goes to, whether it leaves the country,
   how long it's kept, and how to complain.
   ============================================================ */
import { Sheet } from '../../components/ui';
import { legalReady, OPERATOR, REGULATOR } from '../../data/legal';

const responsibleParty = OPERATOR.legalName || `${OPERATOR.tradingName} (registered name to be confirmed)`;
const privacyContact = OPERATOR.privacyEmail || 'the contact address published in the app';

function H({ children }: { children: React.ReactNode }) {
  return <h4 className="text-[13.5px] font-extrabold text-navy tracking-tight mt-4 mb-1.5">{children}</h4>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[12.5px] text-muted leading-relaxed mb-2">{children}</p>;
}
function L({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="text-[12.5px] text-muted leading-relaxed mb-2 space-y-1.5">
      {items.map((item, i) => <li key={i} className="flex gap-2"><span className="text-navy/40 shrink-0">·</span><span>{item}</span></li>)}
    </ul>
  );
}

/** Shown until the operator's own details are filled in — see data/legal.ts. */
function DraftNotice() {
  if (legalReady) return null;
  return (
    <div className="rounded-xl bg-[#fff8e6] dark:bg-amber-400/10 border border-amber-400/40 px-3.5 py-3 mb-3 text-[12px] text-navy leading-snug">
      <b>Not final yet.</b> The registered company details, Information Officer and privacy
      mailbox still have to be confirmed before launch. Everything below describes what the
      app actually does today.
    </div>
  );
}

function Updated() {
  return <p className="text-[11.5px] text-subtle mt-5 pt-3 border-t border-line">Last updated {OPERATOR.lastUpdated}.</p>;
}

/* ---------------- Privacy notice (POPIA) ---------------- */
export function PrivacySheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet title="Privacy & your data" onClose={onClose}>
      <h3 className="text-[19px] font-extrabold text-navy tracking-tight m-0">Privacy &amp; your data<span className="text-red">.</span></h3>
      <p className="text-[12.5px] text-muted mt-1 mb-3 leading-relaxed">
        What {OPERATOR.product} collects, why, and what you can make us do about it. Written under the
        Protection of Personal Information Act (POPIA).
      </p>
      <DraftNotice />

      <H>Who is responsible</H>
      <P>
        {responsibleParty} is the responsible party for your personal information.
        {OPERATOR.informationOfficer ? ` Our Information Officer is ${OPERATOR.informationOfficer}.` : ' An Information Officer is being appointed.'}
        {' '}Reach us at {privacyContact}.
      </P>

      <H>What we collect, and why</H>
      <L items={[
        <><b>Your name and mobile number</b> — to create your account, prove the number is yours by SMS code, and let the other side of a job contact you.</>,
        <><b>A password</b> — stored only as a one-way hash. Nobody at {OPERATOR.tradingName}, including us, can read it.</>,
        <><b>Your suburb, age, education and skills</b> — to match you with work near you and show employers who they're hiring.</>,
        <><b>Your work record</b> — jobs done, hours, pay, ratings and written references. This is your CV; it's the point of the product.</>,
        <><b>Messages</b> you send through the app — so a conversation about a job has a record if something goes wrong.</>,
        <><b>Your SA ID number and full name</b>, if you choose to verify your identity — see below.</>,
        <><b>Your bank account details</b>, if you choose to add them, so you can be paid.</>,
        <><b>Your device's location</b>, only when you tap to share it — to measure how far a job actually is.</>,
        <><b>A notification address</b> for your browser, only if you turn on job alerts.</>,
      ]} />

      <H>Your ID number is special, and treated that way</H>
      <P>
        An ID number is "special personal information" under POPIA, so we only collect it with your
        consent, for one purpose: confirming you are who you say you are. It is encrypted before it
        is stored (AES-256-GCM), and after that the app only ever shows the last four digits — to
        you, to employers, and to the person reviewing your verification. Your date of birth is read
        from the ID rather than typed in, so your age on Vuka can't be faked.
      </P>

      <H>Your bank details never touch your phone twice</H>
      <P>
        Account numbers are encrypted at rest and are never sent back to any device. Once saved, the
        app can only ever display something like "Capitec •••• 4321". {OPERATOR.tradingName} does not
        process payments and no money moves through Vuka — payment for a job is arranged directly
        between you and the employer.
      </P>

      <H>The lawful basis we rely on</H>
      <L items={[
        <><b>Performing our agreement with you</b> — your account, your work record, your messages.</>,
        <><b>Your consent</b> — identity verification, location, notifications, bank details. Each of these is opt-in and each can be withdrawn.</>,
        <><b>Our legitimate interests</b> — keeping the platform safe: rate limiting, fraud and abuse prevention, investigating safety reports.</>,
      ]} />

      <H>Who else sees it</H>
      <P>Only the parties that make the app work, and only what they need:</P>
      <L items={[
        <>Our hosting and database providers, who store the data.</>,
        <>An SMS provider, which sees your mobile number and the code or notice being sent.</>,
        <>Your browser's push service (Google, Mozilla or Apple, depending on your device), if you turn on notifications. The message is encrypted end-to-end; they carry it without being able to read it.</>,
        <>An error-monitoring service, if enabled, which sees technical fault details — never your ID number, password or account number.</>,
      ]} />
      <P>
        We do not sell your personal information, and we do not use it for advertising. Employers see
        your work record, suburb, skills and verification status — never your ID number, your bank
        details or your exact location.
      </P>

      <H>Where it's stored, and crossing borders</H>
      <P>
        Our servers are in {OPERATOR.hostingRegion}, so your information leaves South Africa. POPIA
        allows this where the destination has comparable protection — the EU's GDPR meets that bar.
      </P>

      <H>How long we keep it</H>
      <L items={[
        <>Your account and work record: for as long as your account exists. Your CV is the asset you're building, so we don't quietly expire it.</>,
        <>One-time SMS codes: minutes. Reset codes: 15 minutes.</>,
        <>Verification records: kept while your verified badge stands, so a decision can be audited.</>,
        <>Safety reports: kept after they're resolved, because a pattern across reports is exactly what protects the next person.</>,
        <>Bank details: until you delete them, which you can do at any time from Get paid.</>,
      ]} />

      <H>What you can require of us</H>
      <P>Under POPIA you may ask us to:</P>
      <L items={[
        'Tell you what we hold about you, and give you a copy.',
        'Correct anything that is wrong or out of date.',
        'Delete information we no longer have a reason to keep.',
        'Stop processing your information for a particular purpose, or withdraw a consent you gave.',
      ]} />
      <P>
        Write to {privacyContact} and we will respond within 30 days. Note that a verified reference
        an employer wrote about a real job is part of the record of that job — we can correct it if
        it's factually wrong, but we won't delete a rating simply because it was unflattering.
      </P>

      <H>If we get it wrong</H>
      <P>
        Tell us first — but you have the right to complain directly to the {REGULATOR.name}:
        {' '}{REGULATOR.email}, {REGULATOR.site}, {REGULATOR.address}.
      </P>

      <H>Keeping it safe</H>
      <L items={[
        'Everything travels over HTTPS.',
        'Passwords are hashed, never stored or logged in readable form.',
        'ID numbers and bank account numbers are encrypted at rest with separate keys.',
        'Resetting your password ends every other signed-in session, so a stolen phone loses access.',
        'Sign-in and sign-up attempts are rate limited against brute force.',
      ]} />
      <P>
        No system is perfect. If a breach ever puts your information at risk, POPIA requires us to
        notify both you and the Regulator — and we will.
      </P>

      <H>Under 18</H>
      <P>
        Vuka is for people 18 and over. If we learn an account belongs to a child, we delete it.
      </P>

      <Updated />
    </Sheet>
  );
}

/* ---------------- Terms of use ---------------- */
export function TermsSheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet title="Terms of use" onClose={onClose}>
      <h3 className="text-[19px] font-extrabold text-navy tracking-tight m-0">Terms of use<span className="text-red">.</span></h3>
      <p className="text-[12.5px] text-muted mt-1 mb-3 leading-relaxed">The deal between you and {OPERATOR.product}. Plain language, and it means what it says.</p>
      <DraftNotice />

      <H>What Vuka is — and isn't</H>
      <P>
        Vuka introduces people who need work done to people who want to do it, and keeps a verified
        record of the work that follows. That's all. {OPERATOR.tradingName} is <b>not your employer</b>,
        not a labour broker, and not a party to the arrangement you make with the other side. We
        don't set your hours, supervise the work, or guarantee that a job exists, that it pays, or
        that anyone turns up.
      </P>

      <H>Who can use it</H>
      <P>You must be 18 or older and entitled to work in South Africa. One account per person, under your real name — the whole system rests on a record that belongs to a real, verifiable individual.</P>

      <H>Your account is yours to protect</H>
      <P>Keep your password to yourself. Anything done from your account is treated as done by you. If you lose control of your number or your phone, reset your password immediately — that ends every other session.</P>

      <H>Money</H>
      <P>
        Payment is arranged and made <b>directly between the worker and the employer</b>. Vuka does
        not hold, transfer or guarantee any payment, and takes no commission from what you earn.
        Bank details you add are stored so you can be paid; adding them does not mean Vuka is paying you.
      </P>

      <H>The fair-pay check is guidance</H>
      <P>
        We flag any gig priced below the national minimum wage reference we publish, because a young
        person shouldn't have to work out whether an offer is legal. That flag is information, not a
        legal determination, and it doesn't make an underpaid job lawful or an over-minimum job fair.
      </P>

      <H>Ratings and references are earned</H>
      <P>
        A reference lands on your CV only when the employer confirms the work was done and rates it.
        You can't rate yourself, you can't buy a rating, and you can't remove one you didn't like.
        Employers are rated by workers the same way. If a rating is factually wrong, report it and
        we'll investigate; if it's simply unwelcome, it stays.
      </P>

      <H>Things you may not do</H>
      <L items={[
        'Lie about who you are, your age, your qualifications or your work record.',
        'Post work that is illegal, unsafe, or paid below the legal minimum.',
        'Harass, threaten, defraud or discriminate against anyone.',
        'Use the app to recruit for anything other than genuine work.',
        'Scrape, overload or attempt to break the service, or work around its limits.',
      ]} />
      <P>We can suspend or close an account that does any of this, and we may report unlawful conduct to the authorities.</P>

      <H>Safety</H>
      <P>
        Meet in public where you can, tell someone where you're going, and trust your instincts.
        Report anything that felt wrong through the Safety centre — a report is read and acted on,
        and a pattern across reports is what protects the next person. In an emergency call 10111,
        or 112 from any mobile.
      </P>

      <H>Verification is a check, not a guarantee</H>
      <P>
        A verified badge means an ID number passed validation and a person reviewed the submission.
        It does not mean we vouch for someone's character or conduct. Keep using your judgement.
      </P>

      <H>Availability</H>
      <P>
        We'll keep Vuka running as reliably as we can, but we don't promise uninterrupted service.
        Much of the app works offline once loaded; some things need a connection.
      </P>

      <H>Where we limit our liability</H>
      <P>
        To the extent the law allows, {OPERATOR.tradingName} is not liable for loss arising out of a
        job arranged through Vuka, the conduct of another user, or unpaid work. Nothing here takes
        away rights you have under the Consumer Protection Act or any other law that cannot be
        contracted out of.
      </P>

      <H>Closing your account</H>
      <P>You can stop using Vuka at any time and ask us to delete your account. Records we must keep — a resolved safety report, for instance — are covered in the privacy notice.</P>

      <H>Changes and governing law</H>
      <P>
        If we change these terms in a way that matters, we'll tell you in the app. These terms are
        governed by South African law, and the South African courts have jurisdiction.
      </P>

      <Updated />
    </Sheet>
  );
}
