import { createHash, randomBytes } from 'node:crypto';
import { config } from '../lib/config.js';
import { prisma } from '../lib/prisma.js';

export const SESSION_COOKIE = config.cookieSecure ? '__Host-homehub_session' : 'homehub_session';

const DAY_MS = 24 * 60 * 60 * 1000;
const hashToken = (token) => createHash('sha256').update(token).digest('hex');

const cookieOptions = () => ({
  httpOnly: true,
  secure: config.cookieSecure,
  sameSite: 'strict',
  path: '/',
});

export async function createSession(res, req, user) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + config.sessionTtlDays * DAY_MS);

  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId: user.id,
      userAgent: req.get('user-agent')?.slice(0, 255) ?? null,
      ip: req.ip?.slice(0, 64) ?? null,
      expiresAt,
    },
  });

  res.cookie(SESSION_COOKIE, token, { ...cookieOptions(), expires: expiresAt });
}

export async function findSession(req) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, email: true, name: true, pronouns: true } } },
  });

  if (!session) return null;
  if (session.expiresAt <= new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  // Touch at most once an hour to avoid a write on every request.
  if (Date.now() - session.lastSeenAt.getTime() > 60 * 60 * 1000) {
    await prisma.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } }).catch(() => {});
  }

  return session;
}

export async function destroySession(req, res) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  res.clearCookie(SESSION_COOKIE, cookieOptions());
}

export async function purgeExpiredSessions() {
  await prisma.session.deleteMany({ where: { expiresAt: { lte: new Date() } } });
}
