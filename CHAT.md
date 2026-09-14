# Chat

How messaging works in Vuka Uzenzele, and why it is built this way.

Chat is not a side feature here. A gig is agreed in a conversation — the rate,
the time, the gate to come to — and a message that silently fails to send is a
job that silently does not happen. It is also, for a lot of this platform's
users, the most expensive screen in the app: every kilobyte is paid for out of
a prepaid data bundle.

---

## The shape of it

```
  browser                               server
  ────────                              ──────
  outbox.ts        ── POST /api/messages ──────►  messages  (unique on sender+client_id)
   (localStorage)                                     │
  chatTransport.ts ◄── GET /api/events (SSE) ─────────┘
   (EventSource, falls back to delta polling)
  voice.ts         ── POST /api/attachments ─────►  attachments (bytes in the DB)
  api.ts           ◄── GET  /api/attachments/:id ──  → blob URL
```

---

## Sending: queue first, send second

Every message is given a **client id** — a UUID minted in the browser before
the first attempt — and written to a queue in `localStorage` before any network
call happens. It appears in the thread immediately with a clock on it.

The queue is drained one message at a time, in order, and retried when the
network comes back or the app is reopened. A permanent refusal (4xx) stops and
offers *Try again* / *Discard*; anything else keeps trying.

Retrying is safe because the client id travels with it. The server has a unique
index on `(sender_id, client_id)`, so:

- a retry of a request that actually succeeded returns the original message
  with `200` instead of creating a second one
- two retries racing each other both attempt the insert, one loses the index,
  and the loser answers with the row that won

This is the standard way to get effectively-once delivery on top of a transport
that can only promise at-least-once. The unique index is the guarantee; the
lookup before it is just the polite path to the same answer.

**What this replaced:** the composer used to `await` the POST and, on failure,
put the text back in the box with a toast. Fine at a desk. On a phone in a lift
it meant the message was simply gone, and the person had already walked away.

---

## Receiving: one stream, with two safety nets

`GET /api/events` is a **server-sent events** stream, one per signed-in device,
carrying new messages, receipts and typing signals.

SSE rather than WebSockets because nothing in chat needs a client-to-server
stream — sending is a POST that wants a status code back — and because
`EventSource` reconnects by itself. That matters on this deployment
specifically: Render's own docs say to expect connections to close on deploys
and to implement reconnection with backoff, and the free instance is replaced
often.

`EventSource` cannot set headers, so the session token cannot travel the way it
does everywhere else. Putting it in the query string would write a thirty-day
session into every access log, so the app trades its token for a **60-second
single-purpose ticket** (`POST /api/events/ticket`) that opens nothing but this
stream. `/api/events` is excluded from request logging for the same reason.

Because `EventSource` would otherwise reconnect on its own using a ticket that
has since expired — a silent 401 forever — the client closes the stream on any
error and rebuilds it with a fresh ticket, backing off 2s → 30s.

Two nets under it:

1. **A catch-up sync**, even when the stream looks healthy. "Connected" is not
   the same as "received everything". Every 60 seconds while live, every 6
   while polling, every 60 in the background, and immediately on reconnect,
   coming online, or returning to the app.
2. **Delta polling**, when the stream cannot be established at all — a proxy
   that buffers, a network that blocks it. Still far cheaper than what it
   replaced, because it asks only for what changed.

**What this replaced:** the open thread was re-downloaded *in full* every four
seconds. On a hundred-message conversation that is several megabytes an hour to
discover that nothing had happened.

### Cursors

`?since=` is **inclusive**, and the client deduplicates by id. An exclusive
cursor has to be exactly right or it skips a message; a duplicate costs nothing
to throw away.

For that to be safe, `created_at` has to be a total order, so chat timestamps
come from `chatNow()`, which never returns the same millisecond twice. Two
messages written inside one millisecond would otherwise be a tie that paging
could drop a message at.

The client moves its cursor to the **server's** clock, never its own. Phone
clocks are wrong by minutes often enough that trusting one would either skip
messages or re-fetch the same ones forever.

---

## Delivery states

| shown | means | set by |
|---|---|---|
| 🕐 | queued locally, not yet accepted | the outbox |
| ⚠ | gave up; retry or discard | the outbox |
| ✓ | the server has it | `POST /api/messages` |
| ✓✓ | it reached a device they're signed in on | `markDelivered` |
| ✓✓ (blue) | they had the conversation open | `POST /api/messages/read` |

**Read is now an explicit statement.** Loading a thread used to mark it read as
a side effect of a `GET` — which, once the app started syncing threads in the
background, meant telling people their message had been read by an app in
somebody's pocket. Loading marks **delivered**; the screen says **read**, and
only when it is actually in front of someone (`document.hidden` is checked).

---

## Voice notes

The single most useful thing chat can offer this audience: saying "I'm at the
blue gate" takes three seconds to speak and thirty to type, in a second or third
language, on a cheap phone, one-handed.

### Format

There is no one audio format every browser can record.

- Chrome, Edge, Firefox: **WebM/Opus**
- Safari: **MP4/AAC** only, until 18.4 — and 18.4 still *defaults* to MP4

So `pickMimeType()` asks `MediaRecorder.isTypeSupported()` in preference order
and takes the first yes; a `null` answer means "let the browser choose", because
Safari below 18.4 says no to every probe and then records perfectly well. The
blob's **own** `type` is what gets uploaded and stored — never the one we asked
for.

Opus is preferred because it is built for speech: a minute is roughly 100 KB,
where AAC at the same intelligibility is several times that, and every one of
those kilobytes is paid for at both ends.

### Waveform

Measured **while recording**, off an `AnalyserNode` on the live stream, squashed
to 40 digits and sent alongside the clip. The receiving side draws the picture
without downloading or decoding a single byte of audio.

Normalised against the loudest moment in that clip, because phone microphones
differ by far more than speaking voices do.

### Length

The length shown is the one the **sender measured**, not what the audio element
reports. `MediaRecorder` routinely writes WebM with no duration in its header,
and a browser asked how long that is answers `Infinity` — which is how voice
notes end up labelled `0:00` in a lot of otherwise good chat apps.

### Playback

Clips are fetched with `fetch()` and turned into blob URLs, never pointed at
with `<audio src="/api/attachments/…">`. A media element cannot send an
`Authorization` header, and Safari expects a server it streams from to answer
byte-range requests. A blob URL removes both problems, and makes the second
play instant.

Nothing is downloaded until someone presses play.

### Recording is a tap, not a hold

Hold-to-record is what the big messengers do and it is genuinely nice with a
thumb. On its own it is also unusable with a keyboard, unusable with a switch,
and hostile to anyone whose grip is unsteady. Tap to start, tap to send, tap to
discard — three 44px targets that all announce themselves.

---

## Photos

Resized in the browser to 1600px on the long edge and re-encoded as JPEG before
a byte is uploaded — from 8–12 MB off a modern camera to a few hundred KB. That
is the difference between a feature and a bill, given where the bytes live.

Always JPEG out. Not the best codec, but the one every browser can both write
and read, and a photo that arrives and cannot be opened is worse than a slightly
larger one. A shrink that would make the file *bigger* (PNG line art) keeps the
original.

Fetched only when the bubble comes near the screen, and the space it will occupy
is reserved from the dimensions that travelled with the message — so a
late-arriving image doesn't shove the thread under the reader's thumb.

---

## Where the bytes live

**In the database.** Not a choice so much as an observation: the Render service
has no persistent disk, so anything written to the filesystem is gone at the
next deploy, and the Postgres behind `DATABASE_URL` is the only durable store
this platform has.

That is affordable because of the caps, and only because of them:

| | cap | typical |
|---|---|---|
| voice note | 60s, 2 MB | ~100 KB (Opus) |
| photo | 2 MB | ~300 KB |

Uploaded first, attached second: `attachments.message_id` stays `NULL` until a
message claims it, so a send that dies halfway leaves an orphan rather than a
message with a hole in it. A clip can only be claimed by the account that
uploaded it, and only once.

The price of that order is uploads nobody ever claims — the send failed
permanently and the sender pressed *Discard*, or the app was closed between the
two requests. `sweepOrphanAttachments()` runs every fifteen minutes and deletes
unclaimed rows older than an hour. The gap between the two requests is measured
in seconds, so an hour is generous; without the sweep, every abandoned recording
would sit in the storage budget forever.

Bytes come back only to the two people in the conversation. Withdrawing a voice
note **deletes the row**, not just the link to it.

### When to move them

If attachment volume ever approaches the database's headroom, the seam is
`attachments.bytes` and the two routes that touch it. Supabase Storage is the
obvious destination — same project, same credentials. Nothing else in the
system needs to know.

---

## What is deliberately not here

**End-to-end encryption.** Signal and WhatsApp have it; Uber, Airbnb and Upwork
do not, and this is the second kind of product. Vuka has safety reports and
dispute resolution, both of which require a human being able to read what was
actually said. Server-readable is the correct choice here, and it should be an
explicit one rather than an omission.

**Group chats, calls, reactions, forwarding, message search.** Scope, not
principle.

**More than one server instance.** The SSE registry lives in this process's
memory, which is correct for the one instance the free plan runs. Two instances
and a message sent on one would not wake a listener parked on the other. The fix
is a shared bus — Postgres `LISTEN`/`NOTIFY` is already available and costs
nothing extra — and the seam is `emit()` in `realtime.mjs`. Deliberately not
built yet: an untested layer of indirection is worse than a documented limit.

---

## Files

**Server**

| file | what |
|---|---|
| `vuka-server/src/realtime.mjs` | the SSE registry, heartbeats, connection caps |
| `vuka-server/src/server.mjs` | the chat and attachment routes |
| `vuka-server/src/db.mjs` | `messages`, `attachments`, and the unique index |

**Client**

| file | what |
|---|---|
| `vuka-app/src/lib/chatTransport.ts` | one live connection, with its fallbacks |
| `vuka-app/src/lib/outbox.ts` | the durable send queue |
| `vuka-app/src/lib/voice.ts` | recording, format detection, waveform |
| `vuka-app/src/lib/photo.ts` | downscale before upload |
| `vuka-app/src/features/chat/Chat.tsx` | inbox and thread |
| `vuka-app/src/features/chat/Composer.tsx` | the box at the bottom |
| `vuka-app/src/features/chat/VoiceNote.tsx` | the player |
| `vuka-app/src/features/chat/PhotoNote.tsx` | the photo bubble and viewer |

---

## Testing

```bash
cd vuka-server && npm test          # 385 assertions, chat is section 12
cd vuka-app    && npm run check:chat # two real browsers, a real microphone
```

`check:chat` drives two signed-in users at once in Chromium with a synthetic
capture device, and covers what an API test structurally cannot: that a
microphone opens, that whatever this engine records is a format the server
accepts and hands back, that a message reaches the other screen without that
screen asking, that the ticks change when it does, that everything still works
with the event stream blocked outright, and that a message written with the
network cut is on screen immediately, written to disk, and delivered exactly
once when the signal returns.

It needs both servers running (`npm run dev` and the API on `:3001`).

## Configuration

| variable | default | what |
|---|---|---|
| `VUKA_VOICE_MAX_MS` | `60000` | longest voice note |
| `VUKA_ATTACH_MAX_BYTES` | `2097152` | largest attachment |
| `VUKA_MESSAGE_EDIT_MINUTES` | `15` | how long an edit stays possible |
| `VUKA_ATTACH_GRACE_HOURS` | `1` | before an unclaimed upload is swept |
| `VUKA_SSE_MAX` | `200` | live connections this instance will hold |
| `VUKA_RATE_MAX` | `300` | API requests per IP per minute |
