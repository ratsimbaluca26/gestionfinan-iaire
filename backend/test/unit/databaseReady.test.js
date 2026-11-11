const assert = require('node:assert/strict');
const test = require('node:test');
const databaseReady = require('../../utils/databaseReady');

test('databaseReady returns true when PostgreSQL responds', async () => {
  const database = { query: async () => ({ rows: [{ value: 1 }] }) };
  assert.equal(await databaseReady(database), true);
});

test('databaseReady returns false when PostgreSQL is unavailable', async () => {
  const database = { query: async () => { throw new Error('connection refused'); } };
  assert.equal(await databaseReady(database), false);
});
