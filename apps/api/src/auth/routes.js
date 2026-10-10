import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { MIN_PASSWORD_LENGTH } from '../lib/config.js';
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

    res.json({ user: { id: user.id, email: user.email, name: user.name } });
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
