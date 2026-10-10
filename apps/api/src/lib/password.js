import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

// scrypt parameters (OWASP-recommended baseline: N=2^17, r=8, p=1).
const N = 2 ** 17;
const r = 8;
const p = 1;
const KEY_LENGTH = 64;
const MAX_MEMORY = 256 * 1024 * 1024;

// Format: scrypt$N$r$p$saltBase64$hashBase64
export async function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = await scryptAsync(password, salt, KEY_LENGTH, { N, r, p, maxmem: MAX_MEMORY });
  return ['scrypt', N, r, p, salt.toString('base64'), derived.toString('base64')].join('$');
}

export async function verifyPassword(password, stored) {
  const parts = String(stored || '').split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

  const [, n, rr, pp, saltB64, hashB64] = parts;
  const expected = Buffer.from(hashB64, 'base64');
  const derived = await scryptAsync(password, Buffer.from(saltB64, 'base64'), expected.length, {
    N: Number(n),
    r: Number(rr),
    p: Number(pp),
    maxmem: MAX_MEMORY,
  });

  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

// Used when the email doesn't exist, so the response time doesn't reveal it.
let dummyHash;
export async function burnPasswordCheck(password) {
  dummyHash ??= await hashPassword('home-hub-dummy-password');
  await verifyPassword(password, dummyHash);
}
