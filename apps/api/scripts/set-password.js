// Creates a user or resets its password, signing out all of its sessions.
// Usage: npm run user:set-password -- <email> [name]
// The password is read from the terminal (or from the NEW_PASSWORD env var).
import { createInterface } from 'node:readline/promises';
import { MIN_PASSWORD_LENGTH } from '../src/lib/config.js';
import { hashPassword } from '../src/lib/password.js';
import { prisma } from '../src/lib/prisma.js';

const [emailArg, name] = process.argv.slice(2);
const email = emailArg?.trim().toLowerCase();

if (!email) {
  console.error('Usage: npm run user:set-password -- <email> [name]');
  process.exit(1);
}

let password = process.env.NEW_PASSWORD;
if (!password) {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  rl._writeToOutput = (text) => {
    if (text.includes('Nova senha')) rl.output.write(text);
  };
  password = await rl.question('Nova senha: ');
  rl.close();
  process.stdout.write('\n');
}

if (password.length < MIN_PASSWORD_LENGTH) {
  console.error(`A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
  process.exit(1);
}

const passwordHash = await hashPassword(password);
const user = await prisma.user.upsert({
  where: { email },
  update: { passwordHash, ...(name ? { name } : {}) },
  create: { email, name: name ?? null, passwordHash },
});
await prisma.session.deleteMany({ where: { userId: user.id } });
await prisma.$disconnect();

console.log(`Senha definida para ${email}. Todas as sessões anteriores foram encerradas.`);
