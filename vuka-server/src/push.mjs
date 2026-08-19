/* ============================================================
   Web Push — free notifications, no gateway, no per-message cost.

   Job alerts were stored as a preference that nothing acted on, because
   delivering them meant an SMS contract. Web Push doesn't: the browser's own
   push service (FCM for Chrome, Mozilla's for Firefox, Apple's for Safari)
   delivers the message, and none of them charge for it. An installed PWA on
   Android or desktop gets a real system notification; iOS 16.4+ does too once
   the app is added to the Home Screen.

   Implemented straight against the specs with Node's built-in crypto — no
   dependency, nothing to keep patched:
     · RFC 8291  message encryption (ECDH + HKDF + AES-128-GCM)
     · RFC 8188  aes128gcm content coding
     · RFC 8292  VAPID (an ES256 JWT identifying this server)

   The encryption path is verified in the test suite against the published
   test vector in RFC 8291 §5 — hand-rolled crypto that isn't checked against
   a known-answer test is not worth trusting.

   Setup (once, free):
     npm run vapid:keys            → prints a keypair
     VUKA_VAPID_PUBLIC_KEY=…       → also served to the client at /api/config
     VUKA_VAPID_PRIVATE_KEY=…
     VUKA_VAPID_SUBJECT=mailto:you@example.com
   Unset, sendPush() reports "not configured" and nothing else changes.
   ============================================================ */

import {
  createECDH, createHmac, createPrivateKey, createCipheriv,
  randomBytes, sign as signOneShot, generateKeyPairSync,
} from 'node:crypto';

const b64url = (buf) => Buffer.from(buf).toString('base64url');
const fromB64url = (s) => Buffer.from(String(s), 'base64url');

export const vapidPublicKey = process.env.VUKA_VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VUKA_VAPID_PRIVATE_KEY || '';
const vapidSubject = process.env.VUKA_VAPID_SUBJECT || 'mailto:support@vuka.example';

/** True when push can actually be delivered. */
export const pushConfigured = !!(vapidPublicKey && vapidPrivateKey);

if (process.env.NODE_ENV === 'production' && !pushConfigured) {
  console.warn('Push notifications are off: set VUKA_VAPID_PUBLIC_KEY / _PRIVATE_KEY (generate with `npm run vapid:keys`). Job alerts stay a stored preference until then.');
}

/** Generate a VAPID keypair in the raw base64url form the spec and browsers use. */
export function generateVapidKeys() {
  const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const priv = privateKey.export({ format: 'jwk' });
  const pub = publicKey.export({ format: 'jwk' });
  if (pub.x !== priv.x || pub.y !== priv.y) throw new Error('key export mismatch');
  const point = Buffer.concat([Buffer.from([0x04]), fromB64url(priv.x), fromB64url(priv.y)]);
  return { publicKey: b64url(point), privateKey: priv.d };
}

/** HKDF, in the two-step form the push specs are written in. */
const hkdfExtract = (salt, ikm) => createHmac('sha256', salt).update(ikm).digest();
const hkdfExpand = (prk, info, length) =>
  createHmac('sha256', prk).update(Buffer.concat([Buffer.from(info), Buffer.from([0x01])])).digest().subarray(0, length);

/**
 * Encrypt a payload for one subscription (RFC 8291 + RFC 8188).
 *
 * @param plaintext   Buffer|string — the notification JSON
 * @param uaPublicKey subscription.keys.p256dh (base64url, 65-byte EC point)
 * @param authSecret  subscription.keys.auth (base64url, 16 bytes)
 * @param override    test-only: fixed salt / server keypair, so the RFC's
 *                    known-answer vector can be reproduced exactly
 * @returns {{body: Buffer, serverPublicKey: Buffer}}
 */
export function encryptPayload(plaintext, uaPublicKey, authSecret, override = {}) {
  const uaPublic = fromB64url(uaPublicKey);
  const auth = fromB64url(authSecret);
  if (uaPublic.length !== 65 || uaPublic[0] !== 0x04) throw new Error('p256dh must be a 65-byte uncompressed EC point');
  if (auth.length !== 16) throw new Error('auth secret must be 16 bytes');

  const salt = override.salt ?? randomBytes(16);
  const ecdh = createECDH('prime256v1');
  if (override.serverPrivateKey) ecdh.setPrivateKey(override.serverPrivateKey);
  else ecdh.generateKeys();
  const serverPublicKey = ecdh.getPublicKey();
  const sharedSecret = ecdh.computeSecret(uaPublic);

  // RFC 8291 §3.4 — bind the key material to BOTH public keys, so a captured
  // ciphertext can't be replayed against a different subscription.
  const prkKey = hkdfExtract(auth, sharedSecret);
  const keyInfo = Buffer.concat([Buffer.from('WebPush: info\0'), uaPublic, serverPublicKey]);
  const ikm = hkdfExpand(prkKey, keyInfo, 32);

  // RFC 8188 §2.2 — content-encryption key and nonce.
  const prk = hkdfExtract(salt, ikm);
  const cek = hkdfExpand(prk, 'Content-Encoding: aes128gcm\0', 16);
  const nonce = hkdfExpand(prk, 'Content-Encoding: nonce\0', 12);

  // One record, so the padding delimiter is 0x02 ("last record").
  const record = Buffer.concat([Buffer.from(plaintext), Buffer.from([0x02])]);
  const cipher = createCipheriv('aes-128-gcm', cek, nonce);
  const ciphertext = Buffer.concat([cipher.update(record), cipher.final(), cipher.getAuthTag()]);

  const rs = Buffer.alloc(4);
  rs.writeUInt32BE(4096);
  const header = Buffer.concat([salt, rs, Buffer.from([serverPublicKey.length]), serverPublicKey]);
  return { body: Buffer.concat([header, ciphertext]), serverPublicKey };
}

/** The VAPID Authorization header proving this server sent the message (RFC 8292). */
function vapidHeader(endpoint) {
  const { origin } = new URL(endpoint);
  const header = b64url(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const claims = b64url(JSON.stringify({
    aud: origin,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,   // the spec caps this at 24h
    sub: vapidSubject,
  }));
  const pub = fromB64url(vapidPublicKey);
  const key = createPrivateKey({
    format: 'jwk',
    key: {
      kty: 'EC',
      crv: 'P-256',
      d: vapidPrivateKey,
      x: b64url(pub.subarray(1, 33)),
      y: b64url(pub.subarray(33, 65)),
    },
  });
  // JWS wants the raw r||s pair, not the DER wrapper Node defaults to.
  const signature = b64url(signOneShot('sha256', Buffer.from(`${header}.${claims}`), { key, dsaEncoding: 'ieee-p1363' }));
  return `vapid t=${header}.${claims}.${signature}, k=${vapidPublicKey}`;
}

/**
 * Deliver one notification. Never throws.
 *
 * @param sub     {endpoint, keys:{p256dh, auth}}
 * @param payload any JSON-serialisable object; the service worker reads it
 * @param ttl     seconds the push service may hold it for an offline device
 * @returns {Promise<{delivered: boolean, status?: number, gone?: boolean, error?: string}>}
 *          `gone: true` means the subscription is dead (404/410) and the caller
 *          should delete the row — otherwise we retry a dead device forever.
 */
export async function sendPush(sub, payload, { ttl = 6 * 60 * 60 } = {}) {
  if (!pushConfigured) return { delivered: false, error: 'push not configured' };
  try {
    const { body } = encryptPayload(JSON.stringify(payload), sub.keys.p256dh, sub.keys.auth);
    const res = await fetch(sub.endpoint, {
      method: 'POST',
      headers: {
        Authorization: vapidHeader(sub.endpoint),
        'Content-Encoding': 'aes128gcm',
        'Content-Type': 'application/octet-stream',
        TTL: String(ttl),
        Urgency: 'normal',
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    if (res.status === 404 || res.status === 410) return { delivered: false, status: res.status, gone: true };
    if (!res.ok) return { delivered: false, status: res.status, error: `push service responded ${res.status}` };
    return { delivered: true, status: res.status };
  } catch (e) {
    return { delivered: false, error: e.message };
  }
}
