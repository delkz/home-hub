import { config, MIN_PASSWORD_LENGTH } from '../lib/config.js';
import { hashPassword } from '../lib/password.js';
import { prisma } from '../lib/prisma.js';

// There is no public sign-up. The first (admin) user is created from
// ADMIN_EMAIL / ADMIN_PASSWORD when the users table is empty. Later changes go
// through `npm run user:set-password` or the change-password endpoint.
export async function ensureAdminUser() {
  const count = await prisma.user.count();
  if (count > 0) return;

  if (!config.adminEmail || !config.adminPassword) {
    console.warn('[auth] No users exist yet. Set ADMIN_EMAIL and ADMIN_PASSWORD to create the first account.');
    return;
  }

  if (config.adminPassword.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`ADMIN_PASSWORD must have at least ${MIN_PASSWORD_LENGTH} characters`);
  }

  await prisma.user.create({
    data: {
      email: config.adminEmail,
      name: config.adminName,
      passwordHash: await hashPassword(config.adminPassword),
    },
  });

  console.log(`[auth] Created initial user ${config.adminEmail}. You can now remove ADMIN_PASSWORD from the environment.`);
}
