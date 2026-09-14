/* ============================================================
   Who is legally behind Vuka, and where the data lives.

   POPIA s18 requires a data subject to be told who the responsible party is
   and how to reach them, so these details are not decoration — the privacy
   notice is incomplete without them, and `legalReady` is false until they are
   filled in. The app then shows a visible "not final" banner on the notice
   rather than passing a draft off as a published policy.

   ONE PLACE TO EDIT. Fill in the three blanks below and the banner disappears:
     · legalName          the registered entity, or the person, that is the
                          responsible party
     · informationOfficer the person registered with the Information Regulator
     · privacyEmail       a mailbox that is actually monitored

   Everything else on this page is already true of the deployment.

   ------------------------------------------------------------
   A note on what this file used to say.

   `tradingName` was 'Gijima'. That one word threaded through the whole privacy
   notice and the whole of the terms: Gijima was named as the responsible party
   under POPIA, as the party that does not process payments, as the party that
   is "not your employer", and as the party whose liability is limited. None of
   that was true, and all of it was published.

   It mattered in three directions at once. It told every user that an
   organisation which has not agreed to any of this is accountable for their
   personal information. It volunteered that organisation into liability for
   jobs arranged between strangers. And it was a standing public statement that
   this product belongs to them — which is exactly the question the author does
   not want decided by a stray string in a config file.

   The responsible party is whoever actually determines why and how this app
   processes personal information. Put that name in `legalName`, and nothing
   else.
   ============================================================ */

export const OPERATOR = {
  /** Product name shown to users. */
  product: 'Vuka Uzenzele',
  /**
   * What the operator is called in running text.
   *
   * Deliberately the product's own name. Anything else here is an assertion
   * about who owns this, made in a place nobody thinks to check.
   */
  tradingName: 'Vuka Uzenzele',
  /**
   * TODO: the responsible party under POPIA.
   *
   * Either a registered company ("Vuka Uzenzele (Pty) Ltd, reg 2026/…") or,
   * until one exists, the individual operating it in their own name. A sole
   * operator is a perfectly lawful responsible party; an unnamed one is not.
   */
  legalName: '',
  /**
   * TODO: the appointed Information Officer (POPIA s55).
   *
   * For a sole operator this is that person by default. Appointment is not the
   * end of it — the Information Officer must also be registered with the
   * Information Regulator before they can act in the role. Registration is free
   * and online, and is the most commonly skipped POPIA obligation in the
   * country.
   */
  informationOfficer: '',
  /** TODO: a monitored mailbox for access, correction and deletion requests. */
  privacyEmail: '',
  /** Where the servers are. Render's Frankfurt region + a managed Postgres. */
  hostingRegion: 'Frankfurt, Germany (EU)',
  /** Last substantive change to the notice and terms. */
  lastUpdated: '14 September 2026',
} as const;

/** True once the notice can honestly be presented as final. */
export const legalReady = Boolean(OPERATOR.legalName && OPERATOR.informationOfficer && OPERATOR.privacyEmail);

/**
 * Whose product this is.
 *
 * Stated positively and without naming anyone else. A notice that says "not
 * affiliated with X" invites the question it is trying to close, and drags a
 * third party into a document they never agreed to; a notice that says who
 * *does* operate the service answers it completely and names only the operator.
 */
export const INDEPENDENCE =
  `${OPERATOR.product} is an independent product. It is built and operated by the party named above, `
  + 'and is not operated by, affiliated with, endorsed by or a product of any other organisation, '
  + "including any of that party's employers or clients.";

/**
 * South Africa's data-protection regulator. Publicly published contact details —
 * POPIA s5(h) gives every data subject the right to complain to them, and a
 * privacy notice that doesn't say how is not much of a notice.
 */
export const REGULATOR = {
  name: 'Information Regulator (South Africa)',
  site: 'https://inforegulator.org.za',
  email: 'POPIAComplaints@inforegulator.org.za',
  address: 'JD House, 27 Stiemens Street, Braamfontein, Johannesburg 2001',
} as const;
