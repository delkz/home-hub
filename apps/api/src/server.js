// Long-running server for local development. On Vercel, api/index.js
// imports app.js directly instead.
import app from './app.js';
import { purgeExpiredSessions } from './auth/sessions.js';
import { config } from './lib/config.js';
import { prisma } from './lib/prisma.js';

purgeExpiredSessions().catch(console.error);
setInterval(() => purgeExpiredSessions().catch(console.error), 6 * 60 * 60 * 1000).unref();

const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(`API listening on http://localhost:${config.port}`);
});

const shutdown = async () => {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
