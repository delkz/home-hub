import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { timingSafeEqual } from 'node:crypto';
import { config, MIN_PASSWORD_LENGTH } from '../lib/config.js';
import { burnPasswordCheck, hashPassword, verifyPassword } from '../lib/password.js';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from './middleware.js';
import { createSession, destroySession, purgeExpiredSessions } from './sessions.js';

export const authRouter = Router();

// Brute-force protection: 10 failed attempts per IP every 15 minutes.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Muitas tentativas de login. Tente novamente em alguns minutos.' },
});

const DEFAULT_CATEGORIES = [
  { name: 'Alimentos', icon: '🍽️' },
  { name: 'Limpeza', icon: '🧽' },
  { name: 'Higiene', icon: '🧴' },
  { name: 'Casa', icon: '🏠' },
  { name: 'Outros', icon: '📦' },
];

export const PRONOUNS = ['he', 'she'];
export const publicUser = (user) => ({ id: user.id, email: user.email, name: user.name, pronouns: user.pronouns });

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SETUP_LOCK_KEY = 4815162342;

const setupTokenMatches = (provided) => {
  if (!config.setupToken) return true;
  const a = Buffer.from(String(provided || ''));
  const b = Buffer.from(config.setupToken);
  return a.length === b.length && timingSafeEqual(a, b);
};

class SetupClosedError extends Error {}

// First-access onboarding: while there are no users, anyone who opens the app
// can create the (single) admin account. Once it exists, this closes for good.
authRouter.get('/setup', async (_req, res, next) => {
  try {
    const needsSetup = (await prisma.user.count()) === 0;
    res.json({ needsSetup, requiresToken: needsSetup && Boolean(config.setupToken) });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/setup', loginLimiter, async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim();
    const pronouns = String(req.body?.pronouns || '');
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const houseName = String(req.body?.houseName || '').trim();

    if (!setupTokenMatches(req.body?.setupToken)) {
      return res.status(403).json({ message: 'Código de configuração inválido' });
    }
    if (!name || name.length > 60) return res.status(400).json({ message: 'Informe seu nome (até 60 caracteres)' });
    if (!PRONOUNS.includes(pronouns)) return res.status(400).json({ message: 'Escolha uma forma de tratamento' });
    if (!EMAIL_PATTERN.test(email) || email.length > 255) return res.status(400).json({ message: 'Informe um e-mail válido' });
    if (password.length < MIN_PASSWORD_LENGTH || password.length > 1024) {
      return res.status(400).json({ message: `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres` });
    }
    if (houseName.length > 255) return res.status(400).json({ message: 'Nome da casa muito longo' });

    const passwordHash = await hashPassword(password);

    const user = await prisma.$transaction(async (tx) => {
      // Serializes concurrent setup attempts so only one account can ever be created here.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${SETUP_LOCK_KEY})`;
      if ((await tx.user.count()) > 0) throw new SetupClosedError();

      const created = await tx.user.create({ data: { name, pronouns, email, passwordHash, lastLoginAt: new Date() } });

      if (houseName) {
        const setting = await tx.setting.findFirst();
        if (setting) await tx.setting.update({ where: { id: setting.id }, data: { houseName } });
        else await tx.setting.create({ data: { houseName } });
      }

      if ((await tx.category.count()) === 0) {
        await tx.category.createMany({ data: DEFAULT_CATEGORIES, skipDuplicates: true });
      }

      return created;
    });

    await createSession(res, req, user);
    res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    if (error instanceof SetupClosedError) {
      return res.status(409).json({ message: 'A conta principal já foi criada. Faça login.' });
    }
    next(error);
  }
});

const INVALID_CREDENTIALS = { message: 'E-mail ou senha inválidos' };

authRouter.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!email || !password || password.length > 1024) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      await burnPasswordCheck(password);
      return res.status(401).json(INVALID_CREDENTIALS);
    }

    if (!(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json(INVALID_CREDENTIALS);
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await createSession(res, req, user);
    // Serverless deployments have no background timer, so clean up here too.
    purgeExpiredSessions().catch(console.error);

    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/logout', async (req, res, next) => {
  try {
    await destroySession(req, res);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

authRouter.post('/password', requireAuth, loginLimiter, async (req, res, next) => {
  try {
    const currentPassword = String(req.body?.currentPassword || '');
    const newPassword = String(req.body?.newPassword || '');

    if (newPassword.length < MIN_PASSWORD_LENGTH || newPassword.length > 1024) {
      return res.status(400).json({ message: `A nova senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres` });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!(await verifyPassword(currentPassword, user.passwordHash))) {
      return res.status(401).json({ message: 'Senha atual incorreta' });
    }

    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(newPassword) } }),
      // Sign out every other device.
      prisma.session.deleteMany({ where: { userId: user.id, NOT: { id: req.session.id } } }),
    ]);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});
