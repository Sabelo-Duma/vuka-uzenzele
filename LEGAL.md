# Ownership, privacy, and the things only you can do

**This is not legal advice.** I am not a lawyer and cannot tell you who owns
this. What follows is what the code now says, what South African law says, and
what the gap between them means — sourced, so you can check it or hand it to
someone who can advise you properly.

---

## 1. What the app used to say about who owns it

`vuka-app/src/data/legal.ts` had one line:

```ts
tradingName: 'Gijima',
```

That single word threaded through the entire privacy notice and the entire
terms of use. On the live site, the app told every user:

- **Gijima is the responsible party** for their personal information under POPIA
- **Gijima** does not process payments
- **Gijima** is *"not your employer"*
- *"To the extent the law allows, **Gijima** is not liable…"*

Three separate problems in one string.

1. Under POPIA the responsible party is whoever **determines the purpose and
   means** of processing. Naming an organisation makes it accountable to the
   Regulator for data it has never seen.
2. The liability clause limited **Gijima's** liability — so the person actually
   running the service had none, and an organisation that never agreed to any of
   it was volunteered into carrying it.
3. It was a standing, published statement that this product belongs to them.

The same claim appeared in the **footer of the public landing page** and beside
the sign-up flow: *"Gijima Innovation Engine · 2026"*.

**All of it is now the product's own name**, and the terms carry a new section:

> ### Who owns Vuka, and who runs it
> Vuka Uzenzele is an independent product. It is built and operated by the party
> named above, and is not operated by, affiliated with, endorsed by or a product
> of any other organisation, including any of that party's employers or clients.

Stated positively and naming nobody else on purpose. A notice that says *"not
affiliated with X"* invites the question it is trying to close and drags a third
party into a document they never signed.

---

## 2. What the law actually says

### The default is not in your favour

[Section 21(1)(d) of the Copyright Act 98 of 1978](https://www.saflii.org/za/legis/consol_act/ca1978133/):
where a work is made **in the course of the author's employment** under a
contract of service, **the employer owns the copyright** — unless otherwise
agreed.

"In the course of employment" is a question of fact, decided case by case. The
factors that matter:

| | helps you | hurts you |
|---|---|---|
| **When** | your own time | working hours |
| **Equipment** | your own laptop | company machine |
| **Relation to your job** | unrelated to your duties | overlaps your role |
| **Resources** | your own accounts, your own money | company accounts, company tooling |

### A verbal go-ahead is worth very little

This is the part worth acting on today.

**[Section 22(3)](https://www.saflii.org/za/legis/consol_act/ca1978133/) requires
an assignment of copyright to be in writing and signed by the assignor.** So even
if your manager fully intended to give you this, a conversation transfers
nothing. And a manager may not be the person with authority to waive company IP
in any case.

What that means in practice:

- Your manager's "go ahead" is **evidence of context**, not a transfer of rights
- If a dispute ever arose, an email thread is a great deal better than a memory
- The ask is small and reasonable: **written confirmation that Vuka Uzenzele is
  your own project, developed in your own time on your own equipment, and that
  the company makes no claim to it.** One paragraph, signed by someone with the
  authority to say it.

Check your employment contract for an IP-assignment or "inventions" clause
before you send it — many South African contracts have one, and some are drafted
widely enough to reach beyond working hours. That clause, not the Copyright Act
default, is likely to be what actually governs this.

---

## 3. The urgent one: this repository is public

`https://github.com/Sabelo-Duma/vuka-uzenzele` is **public**, and it contained
**97 files of `IntelliSource/`** — which is not this project at all. It is an
employer procurement platform:

- `Rough Draft - IntelliSource_Expanded_Business_Case v1.pdf`
- `IntelliSource - Planning Pipeline Review (Procurement) v01.00.docx` / `.pdf`
- a full PRD, architecture document, epics and research brief
- `gijima-styles.css`, extracted from the company's live site
- `_input/Prompt.txt`, referencing another employee's local file path

That is **published on the open internet under your personal account**.

This cuts both ways, and both directions are bad for you:

- **Confidentiality.** Internal planning documents and a business case are
  readable by anyone who finds the repository.
- **Ownership.** Nothing makes "Vuka is separate from my job" harder to argue
  than the company's own project sitting in the same repository.

### What I have done

`git rm -r --cached IntelliSource` plus a `.gitignore` entry. The files are
**still on your disk** — nothing was deleted — but they are no longer part of
this repository going forward.

### What that does not fix, and what you should decide

**The files remain in git history**, and in any clone, fork or cached copy that
already exists. Removing a file in a new commit does not un-publish it.

Your options, roughly in order of how thoroughly they fix it:

1. **Make the repository private** — immediate, reversible, and stops all
   further exposure while you decide. *Cheapest good move.* Note the deployed
   app does not need a public repo.
2. **Rewrite history** (`git filter-repo`, then a force-push) to strip those
   blobs from every commit. Thorough, but destructive and it rewrites every
   commit hash. I have not done this — it is your call, not mine.
3. **Tell someone at work.** If internal documents have been publicly readable,
   that is usually something the company would want to know, and hearing it from
   you is much better than discovering it.

GitHub can also purge cached views on request once the blobs are gone.

---

## 4. Also fixed while I was in there

### The app was accepting children

The terms have always said **18 and over**. Nothing enforced it:

- the sign-up form's age field was `min={16}` — it *invited* under-18s
- the client turned a blank age into `18` before it ever left the phone
- the server's `Number(age) || 18` turned anything unparseable into a
  compliant-looking 18
- a stated `16` was written straight into the profile

[POPIA s34](https://popia.co.za/section-34-prohibition-on-processing-personal-information-of-children/)
**prohibits processing a child's personal information** — a child being anyone
under 18 — unless a competent person (a parent or guardian) has consented. Vuka
has no way to obtain or verify that consent.

So this was not a policy preference the product was free to make. It was a
breach the moment the row was written. It is now refused at the form, at the
API, and in eleven tests.

### An employer's brand colour was still being written to every profile

`#0E355A` — the company's navy — was the default `color` on `worker_profiles`,
in the schema, in the seed and in three API responses. The 2.0 redesign stopped
*using* those colours months ago, but the app kept **writing** one to every new
account and handing it out. Now `#121A2E`, Vuka's own indigo.

### Attribution

`Built for the Gijima Innovation Engine`, `Gijima brand`, `Prototype for Sabelo
Duma · Gijima Innovation Engine` and similar removed from the root README, both
sub-project READMEs, `package.json`, the 2.0 concept build and the original
prototype's source and footer.

---

## 5. What still needs you

These three are in `vuka-app/src/data/legal.ts`, and the app shows a visible
**"Not final yet"** banner on the privacy notice until all three are filled in.

| field | what it needs |
|---|---|
| `legalName` | The responsible party under POPIA. Either a registered company (`Vuka Uzenzele (Pty) Ltd, reg 2026/…`) **or you, in your own name**. A sole operator is a perfectly lawful responsible party; an unnamed one is not. |
| `informationOfficer` | For a sole operator this is **you** by default — but appointment is not enough. The Information Officer must be **registered with the Information Regulator** before they can act in the role. It is free, online, and takes under 30 minutes. It is also the most commonly skipped POPIA obligation among South African SMEs. |
| `privacyEmail` | A mailbox somebody actually reads. The notice promises a response within 30 days. |

Registering a company is not required to launch — but operating in your own name
means the liability limitation in the terms protects *you personally*, which is
worth understanding before you take real sign-ups.

---

## Sources

- [Copyright Act 98 of 1978](https://www.saflii.org/za/legis/consol_act/ca1978133/) — s21(1)(d) employee works, s22(3) assignment in writing
- [Who Owns the Code Your Developer Wrote? SA Guide](https://mjkinc.co.za/software-technology-law/software-development-ip) — side projects, own time and equipment
- [POPIA s18](https://popia.co.za/section-18-notification-to-data-subject-when-collecting-personal-information/) — what a privacy notice must tell a data subject
- [POPIA s34](https://popia.co.za/section-34-prohibition-on-processing-personal-information-of-children/) — children's personal information
- [Information Regulator guidance note on children's information](https://inforegulator.org.za/wp-content/uploads/2020/07/GuidanceNote-Processing-PersonalInformation-Children-20210628-1.pdf)
- [Bowmans — appointment and registration of Information Officers](https://bowmanslaw.com/insights/popia-what-you-need-to-know-about-the-appointment-and-registration-of-information-officers/)

*Last reviewed 14 September 2026. Not legal advice — take section 2 and section
3 to an attorney, and take section 3 to whoever handles information security at
work.*
