import { randomBytes, randomInt, scryptSync, timingSafeEqual, randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { get } from './db.mjs';

// In production a strong secret is mandatory — never fall back to a known
// default (that would let anyone forge session tokens). We fail fast at boot
// so a misconfigured deploy is caught immediately instead of silently
// shipping with a guessable secret.
if (!process.env.VUKA_JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('VUKA_JWT_SECRET must be set in production. Refusing to start with an insecure default.');
}
const SECRET = process.env.VUKA_JWT_SECRET || 'vuka-dev-secret-change-in-production';
const TOKEN_TTL = '30d';

export const uuid = () => randomUUID();

/** Hash a password with scrypt: returns "salt:hash" (hex). */
export function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

export function verifyPassword(password, stored) {
  try {
    const [saltHex, hashHex] = stored.split(':');
    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(hashHex, 'hex');
    const actual = scryptSync(password, salt, 64);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, SECRET, { expiresIn: TOKEN_TTL });
}

/* ---------------- one-time codes (SMS OTP, password reset) ---------------- */

/** A cryptographically random numeric code, e.g. randomDigits(6) → "048213". */
export function randomDigits(n) {
  let out = '';
  for (let i = 0; i < n; i++) out += randomInt(10);
  return out;
}

// Codes are salted + hashed exactly like passwords: a leaked table row must not
// hand over a live code.
export const hashCode = hashPassword;
export const verifyCode = verifyPassword;

/**
 * Short-lived, single-purpose token — proof of something already checked
 * (e.g. "this phone number passed OTP"). Separate `purpose` so a token minted
 * for one flow can't be replayed in another, and distinct from session tokens
 * because it carries no user id.
 */
export function signPurposeToken(purpose, claims, ttlSeconds) {
  return jwt.sign({ ...claims, purpose }, SECRET, { expiresIn: ttlSeconds });
}

/** Verify a purpose token. Returns the payload, or null if invalid/expired/wrong purpose. */
export function verifyPurposeToken(token, purpose) {
  try {
    const payload = jwt.verify(token, SECRET);
    return payload?.purpose === purpose ? payload : null;
  } catch {
    return null;
  }
}

/**
 * Express middleware: require a valid Bearer token.
 *
 * Also enforces `users.sessions_valid_from`: after a password reset, tokens
 * minted before the change stop working — otherwise whoever prompted the reset
 * would keep their 30-day session.
 */
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "You're signed out. Please sign in and try again." });
  }
  let payload;
  try {
    payload = jwt.verify(token, SECRET);
  } catch {
    return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
  }
  try {
    const row = await get('SELECT sessions_valid_from FROM users WHERE id = ?', [payload.sub]);
    if (!row) return res.status(401).json({ error: 'Your account could not be found. Please sign in again.' });
    if (row.sessions_valid_from && Number(payload.iat) < Number(row.sessions_valid_from)) {
      return res.status(401).json({ error: 'Your password was changed, so this session ended. Please sign in again.' });
    }
  } catch (e) {
    return next(e);
  }
  req.user = { id: payload.sub, role: payload.role };
  next();
}

/** Require a specific role after requireAuth. */
export function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ error: `This action is only available to ${role} accounts.` });
    }
    next();
  };
}
