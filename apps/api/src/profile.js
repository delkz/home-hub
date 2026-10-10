import { Router } from 'express';
import { PRONOUNS, publicUser } from './auth/routes.js';
import { prisma } from './lib/prisma.js';

// The signed-in user's own profile: name and form of address.
// Password changes go through POST /api/auth/password.
export const profileRouter = Router();

profileRouter.get('/', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(publicUser(req.user));
});

profileRouter.put('/', async (req, res, next) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const pronouns = req.body?.pronouns;

    if (!name || name.length > 60 || !PRONOUNS.includes(pronouns)) {
      return res.status(400).json({ message: 'Informe seu nome (até 60 caracteres) e a forma de tratamento.' });
    }

    const user = await prisma.user.update({ where: { id: req.user.id }, data: { name, pronouns } });
    res.json(publicUser(user));
  } catch (error) {
    next(error);
  }
});
