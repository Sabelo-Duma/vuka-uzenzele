# Security

Vuka Uzenzele holds things people cannot afford to have leaked: South African ID
numbers, bank account details, home suburbs, and private conversations between
strangers who are about to meet in person. This is what is done about that, and
what is not done yet.

## Reporting something

Open a **private** security advisory on this repository
(*Security → Advisories → Report a vulnerability*), or use the privacy address
published in the app once it is set.

Please don't open a public issue for anything exploitable. There is no bounty —
this is a small project — but credit is offered and gladly given.

## What protects what

### Secrets at rest

| | how |
|---|---|
| Passwords | scrypt, 16-byte random salt per password, 64-byte key; never stored or logged in readable form |
| SA ID numbers | AES-256-GCM, shown only as the last four digits — to the owner, to employers, and to the reviewer |
| Bank account numbers | AES-256-GCM, **never returned to any device**; the app can only ever render `Capitec •••• 4321` |
| Encryption key | `VUKA_ENCRYPTION_KEY`, outside the repository. Without it the banking endpoints refuse to store anything in production rather than storing it in the clear |

A date of birth is read out of the ID number rather than typed, so an age on
Vuka cannot be self-asserted.

### Sessions

JWT bearer tokens, plus `users.sessions_valid_from`: **resetting a password ends
every other session**, so a stolen or sold phone loses access immediately rather
than for another thirty days. The live event channel enforces the same check, so
a stream cannot outlive the session that opened it.

### Content Security Policy

Built from what the app actually loads, including a **hash of the one inline
script** in `index.html`, computed at boot from the file being served. No
`unsafe-inline` for scripts, no `unsafe-eval`, `object-src 'none'`,
`frame-ancestors 'none'`.

This was off for most of the project's life, on the reasonable grounds that a
strict policy would break the SPA. `npm run check:csp` is what makes it safe to
keep on: it drives the real single-service build in a browser and fails on any
violation, any console error, or the app not rendering.

> A trap worth knowing about if you touch this: the HTML parser normalises CRLF
> to LF **before** a script has any text, and it is that text a browser hashes.
> Hashing the bytes off disk produces a hash no browser will ever compute — on a
> CRLF checkout the policy looks perfect and blocks the one script it exists to
> allow. See `vuka-server/src/csp.mjs`.

### Attachments

Voice notes and photos are readable **only by the two people in the
conversation**, checked per request against the message that carries them. They
are fetched with the session's `Authorization` header and turned into blob URLs
— a media element cannot send that header, so a plain `<audio src>` would have
meant an unauthenticated route.

Withdrawing a voice note **deletes the bytes**, not just the link. Uploads no
message ever claims are swept hourly.

### Abuse and enumeration

- Per-IP rate limiting on the whole API, and a stricter limiter on the auth
  routes that counts only failed attempts
- Password reset answers identically whether or not the number has an account
- An OTP cannot be replayed; reset codes expire in 15 minutes
- `id_verified` is never accepted from a client — it is granted only by a
  reviewed submission
- Identifiers are UUIDs, so public CV links cannot be walked by incrementing a
  number
- Shared CV pages are served `X-Robots-Tag: noindex, nofollow, noarchive`

### Account enumeration is possible, on purpose

Worth stating plainly rather than leaving someone to discover it. Requesting a
sign-up code for a number that already has an account answers **409 "already
registered"**, and signing in with an unknown number says so rather than
"number or password is incorrect".

That is a deliberate trade, and the reasoning is in `server.mjs` above the login
route. The textbook vague answer tells someone who never registered that they
typed something wrong, so they retype it — repeatedly — and never learn the
actual problem. Meanwhile the sign-up OTP gives enumeration away a request
either side of it, so vagueness at sign-in costs a real person their access
while costing an attacker nothing.

What it means in practice: **someone can learn whether a given phone number has
a Vuka account.** A phone number is not a secret, the per-IP limiter makes
sweeping a range slow, and nothing about the answer reveals the person's name,
role or history. If that trade ever stops being the right one, the place to
change it is both routes at once — changing one alone buys nothing.

### Children

POPIA s34 prohibits processing a child's personal information without a
competent person's consent, and Vuka has no way to obtain it. Anyone under 18 is
refused at the form and at the API. See `LEGAL.md`.

### Dependencies

`npm audit` is clean in both packages, production and dev. The server keeps a
`qs` override because Express 4.x still pins a version carrying two DoS
advisories, and `qs` parses attacker-controlled query strings on a public API.

## Configuration that must be right

| variable | why it matters |
|---|---|
| `VUKA_JWT_SECRET` | signs every session and every connection ticket |
| `VUKA_ENCRYPTION_KEY` | ID numbers and bank details; without it, production refuses to store them |
| `VUKA_ADMIN_TOKEN` | the ops routes that review identity documents and triage safety reports |
| `VUKA_OTP_ECHO` | **must never be set in production.** It echoes one-time codes in API responses, including on the password-reset route — which on a public URL is account takeover, for anyone who knows a phone number |

Verified absent in production; `/api/health` reports what is configured without
revealing any of it.

## Known limits, stated deliberately

**No end-to-end encryption.** Uber, Airbnb and Upwork do not have it either, and
for the same reason: safety reports and dispute resolution require a human being
able to read what was actually said. This is a choice, not an omission.

**Rate limiting is in-process.** Correct for the single instance the free plan
runs; a second instance would let an attacker get two windows' worth. The fix is
a shared store, at the point that becomes true.

**The live channel registry is in-process**, with the same caveat — see
`CHAT.md`.

**No CAPTCHA or device attestation.** Sign-up is gated by an SMS code, which
costs an attacker real money per account but is not free of abuse.

## Running the checks

```bash
cd vuka-server && npm test          # 396 assertions
cd vuka-app    && npm run build     # contrast, types, colour utilities

# The browser gates need a server. CSP only exists on the single-service build:
cd vuka-app    && npm run build
cd vuka-server && VUKA_STATIC=../vuka-app/dist PORT=3002 npm start
cd vuka-app    && npm run check:csp -- http://localhost:3002
               && npm run check:chat -- http://localhost:3002
               && npm run check:responsive -- http://localhost:3002
```

`check:chat` writes messages, so it refuses to run against anything but
localhost unless explicitly overridden.
