import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seal, unseal, hashId, sessionId } from './session-crypto';

process.env.SESSION_SECRET = 'test-only-secret-with-at-least-32-characters';

test('session payloads are encrypted and authenticated', () => {
  const value = { accessToken: 'private-token' };
  const encrypted = seal(value);
  assert.ok(!encrypted.includes('private-token'));
  assert.deepEqual(unseal(encrypted), value);
  const bytes = Buffer.from(encrypted, 'base64url');
  bytes[bytes.length - 1] ^= 1;
  assert.throws(() => unseal(bytes.toString('base64url')));
});
test('session IDs are random and stored by hash', () => {
  const id = sessionId();
  assert.notEqual(id, sessionId());
  assert.equal(hashId(id).length, 64);
  assert.notEqual(id, hashId(id));
});
test('changing the secret invalidates existing sessions', () => {
  const encrypted = seal({ token: 'secret' });
  const original = process.env.SESSION_SECRET;
  process.env.SESSION_SECRET = 'another-secret-with-at-least-32-characters';
  assert.throws(() => unseal(encrypted));
  process.env.SESSION_SECRET = original;
});
