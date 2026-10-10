import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const parseTrustProxy = (value) => {
  if (value === undefined || value === '') return isProduction ? 1 : false;
  if (value === 'true') return true;
  if (value === 'false') return false;
  const asNumber = Number(value);
  return Number.isInteger(asNumber) ? asNumber : value;
};

export const config = {
  isProduction,
  port: Number(process.env.PORT || 3001),
  // Number of reverse proxies in front of the API (Caddy in docker-compose.prod.yml).
  // Needed so req.ip / req.secure reflect the real client and HTTPS.
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
  sessionTtlDays: Number(process.env.SESSION_TTL_DAYS || 30),
  // Secure cookies are only sent over HTTPS. Default on in production.
  cookieSecure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : isProduction,
  adminEmail: process.env.ADMIN_EMAIL?.trim().toLowerCase() || null,
  adminPassword: process.env.ADMIN_PASSWORD || null,
  adminName: process.env.ADMIN_NAME?.trim() || null,
};

export const MIN_PASSWORD_LENGTH = 10;
