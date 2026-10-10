// Integration test against a real PostgreSQL database.
// It wipes users and sessions, so it only runs against TEST_DATABASE_URL:
//   TEST_DATABASE_URL=postgres://... npx prisma migrate deploy   (with DATABASE_URL set to the same URL)
//   TEST_DATABASE_URL=postgres://... npm test
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

if (!process.env.TEST_DATABASE_URL) {
  console.log('Skipping: set TEST_DATABASE_URL to a disposable database.');
  process.exit(0);
}
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.NODE_ENV = 'test';

const { default: app } = await import('../src/app.js');
const { prisma } = await import('../src/lib/prisma.js');

let server;
let base;
let cookie = '';

const call = async (path, { method = 'GET', body, auth = true, csrf = true } = {}) => {
  const headers = {};
  if (csrf) headers['X-Requested-With'] = 'HomeHub';
  if (body) headers['Content-Type'] = 'application/json';
  if (auth && cookie) headers.Cookie = cookie;
  const response = await fetch(`${base}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) cookie = setCookie.split(';')[0];
  return { status: response.status, body: await response.json().catch(() => null) };
};

before(async () => {
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
});

test('onboarding creates the only account, then closes', async () => {
  assert.deepEqual((await call('/api/auth/setup')).body, { needsSetup: true, requiresToken: false });
  assert.equal((await call('/api/inventory')).status, 401);

  for (const body of [
    { name: ' ', pronouns: 'he', email: 'a@b.co', password: 'senha-forte-123' },
    { name: 'Ana', pronouns: 'x', email: 'a@b.co', password: 'senha-forte-123' },
    { name: 'Ana', pronouns: 'she', email: 'nope', password: 'senha-forte-123' },
    { name: 'Ana', pronouns: 'she', email: 'a@b.co', password: 'curta' },
  ]) {
    assert.equal((await call('/api/auth/setup', { method: 'POST', body })).status, 400);
  }

  const created = await call('/api/auth/setup', {
    method: 'POST',
    body: { name: ' Ana ', pronouns: 'she', email: 'Ana@Casa.com', password: 'senha-forte-123' },
  });
  assert.equal(created.status, 201);
  assert.deepEqual({ ...created.body.user, id: undefined }, { id: undefined, name: 'Ana', pronouns: 'she', email: 'ana@casa.com' });

  const stored = await prisma.user.findUnique({ where: { email: 'ana@casa.com' } });
  assert.match(stored.passwordHash, /^scrypt\$/);
  assert.equal(JSON.stringify(created.body).includes('scrypt'), false);

  assert.equal((await call('/api/auth/setup')).body.needsSetup, false);
  const second = await call('/api/auth/setup', {
    method: 'POST',
    body: { name: 'Outro', pronouns: 'he', email: 'o@casa.com', password: 'senha-forte-123' },
  });
  assert.equal(second.status, 409);
});

test('profile can be read and updated by the signed-in user', async () => {
  assert.equal((await call('/api/profile')).body.name, 'Ana');
  assert.equal((await call('/api/profile', { method: 'PUT', body: { name: '', pronouns: 'he' } })).status, 400);
  assert.equal((await call('/api/profile', { method: 'PUT', body: { name: 'Alex', pronouns: 'he' }, csrf: false })).status, 403);

  const updated = await call('/api/profile', { method: 'PUT', body: { name: ' Alex ', pronouns: 'he' } });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.name, 'Alex');
  assert.equal(updated.body.pronouns, 'he');
  assert.equal((await call('/api/auth/me')).body.user.name, 'Alex');
});

test('login, password change and logout', async () => {
  assert.equal((await call('/api/auth/password', { method: 'POST', body: { currentPassword: 'errada', newPassword: 'nova-senha-456' } })).status, 401);
  assert.equal((await call('/api/auth/password', { method: 'POST', body: { currentPassword: 'senha-forte-123', newPassword: 'nova-senha-456' } })).status, 200);

  assert.equal((await call('/api/auth/logout', { method: 'POST' })).status, 200);
  cookie = '';
  assert.equal((await call('/api/profile')).status, 401);

  assert.equal((await call('/api/auth/login', { method: 'POST', body: { email: 'ana@casa.com', password: 'senha-forte-123' } })).status, 401);
  const login = await call('/api/auth/login', { method: 'POST', body: { email: 'ANA@casa.com', password: 'nova-senha-456' } });
  assert.equal(login.status, 200);
  assert.equal((await call('/api/profile')).status, 200);
});
