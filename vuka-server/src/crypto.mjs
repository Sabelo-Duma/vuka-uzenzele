/* ============================================================
   Field-level encryption for sensitive columns (payout details).

   Bank account numbers must never sit in the database in the clear: a leaked
   backup or a read-only DB credential would otherwise hand out payout targets.
   Values are sealed with AES-256-GCM (authenticated, so tampering is detected)
   under VUKA_ENCRYPTION_KEY.

   Key handling mirrors the JWT secret's stance, but degrades instead of
   refusing all traffic: in production without a key the server still boots and
   serves everything else — only the endpoints that would *store* a secret
   refuse (503). That way a missing key can never be papered over with a
   guessable default, and it also can't take the whole app down.
   ============================================================ */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const RAW_KEY = process.env.VUKA_ENCRYPTION_KEY || '';
const IS_PROD = process.env.NODE_ENV === 'production';

/** True when we hold a real, operator-supplied key. */
export const hasEncryptionKey = !!RAW_KEY;

/**
 * 32-byte key. A 64-char hex string is used verbatim; any other string is
 * hashed to 32 bytes so a long passphrase works too. With no key at all we
 * derive a DEV-ONLY key so the feature is exercisable locally — never in
 * production, where `hasEncryptionKey` gates the write paths instead.
 */
function deriveKey() {
  if (/^[0-9a-fA-F]{64}$/.test(RAW_KEY)) return Buffer.from(RAW_KEY, 'hex');
  const material = RAW_KEY || `vuka-dev-encryption:${process.env.VUKA_JWT_SECRET || 'dev'}`;
  return createHash('sha256').update(material).digest();
}
const KEY = deriveKey();

if (!hasEncryptionKey) {
  const msg = 'VUKA_ENCRYPTION_KEY is not set — payout details cannot be stored securely.';
  if (IS_PROD) console.error(`FATAL-ISH: ${msg} Banking endpoints will return 503 until it is set. Generate one with: openssl rand -hex 32`);
  else console.warn(`WARNING: ${msg} Using a dev-only derived key.`);
}

/** Sealed form: "v1:<iv>:<tag>:<ciphertext>" (all hex). */
export function encryptField(plaintext) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', KEY, iv);
  const ct = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  return `v1:${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${ct.toString('hex')}`;
}

/**
 * Reverse of encryptField. Returns null when the value can't be opened —
 * wrong/rotated key, or tampering. Callers must treat null as "unavailable",
 * never as empty.
 */
export function decryptField(sealed) {
  try {
    const [v, ivHex, tagHex, ctHex] = String(sealed).split(':');
    if (v !== 'v1' || !ivHex || !tagHex || !ctHex) return null;
    const decipher = createDecipheriv('aes-256-gcm', KEY, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    return Buffer.concat([decipher.update(Buffer.from(ctHex, 'hex')), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}
