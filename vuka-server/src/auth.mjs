import { randomBytes, scryptSync, timingSafeEqual, randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';

const SECRET = process.env.VUKA_JWT_SECRET || 'vuka-dev-secret-change-in-production';
const TOKEN_TTL = '30d';

if (!process.env.VUKA_JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('⚠ VUKA_JWT_SECRET is not set — using an insecure default. Set a strong secret in production.');
}

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

/** Express middleware: require a valid Bearer token. */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "You're signed out. Please sign in and try again." });
  }
  try {
    const payload = jwt.verify(token, SECRET);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
  }
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
