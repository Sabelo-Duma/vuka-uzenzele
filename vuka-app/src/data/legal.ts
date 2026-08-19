/* ============================================================
   Who is legally behind Vuka, and where the data lives.

   POPIA s18 requires a data subject to be told who the responsible party is
   and how to reach them, so these details are not decoration — the privacy
   notice is incomplete without them, and `legalReady` is false until they are
   filled in. The app then shows a visible "not final" banner on the notice
   rather than passing a draft off as a published policy.

   ONE PLACE TO EDIT. Fill in the three blanks below and the banner disappears:
     · legalName          the registered entity that is the responsible party
     · informationOfficer the person registered with the Information Regulator
     · privacyEmail       a mailbox that is actually monitored

   Everything else on this page is already true of the deployment.
   ============================================================ */

export const OPERATOR = {
  /** Product name shown to users. */
  product: 'Vuka Uzenzele',
  /** Trading name. */
  tradingName: 'Gijima',
  /** TODO: the registered company name and registration number. */
  legalName: '',
  /** TODO: the appointed Information Officer (POPIA s55). */
  informationOfficer: '',
  /** TODO: a monitored mailbox for access, correction and deletion requests. */
  privacyEmail: '',
  /** Where the servers are. Render's Frankfurt region + a managed Postgres. */
  hostingRegion: 'Frankfurt, Germany (EU)',
  /** Last substantive change to the notice and terms. */
  lastUpdated: '19 August 2026',
} as const;

/** True once the notice can honestly be presented as final. */
export const legalReady = Boolean(OPERATOR.legalName && OPERATOR.informationOfficer && OPERATOR.privacyEmail);

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
