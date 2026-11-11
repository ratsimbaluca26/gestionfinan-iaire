const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const app = require('../../app');
const pool = require('../../db');

let server;
let baseUrl;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

test('health endpoint reaches the real PostgreSQL test service', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, database: 'available' });
});

test('registration validates input through the real HTTP route', async () => {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'CI Test', email: 'not-an-email', password: 'test-password-123' })
  });
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /Gmail valide/i);
});

test('valid registration fails closed when SMTP credentials are absent', async () => {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'CI Test', email: `ci-${Date.now()}@gmail.com`, password: 'test-password-123' })
  });
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /confirmation par e-mail n’est pas configurée/i);
});
