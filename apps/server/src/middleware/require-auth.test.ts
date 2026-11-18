import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import type { Response } from 'express';
import { createRequireAuth, type AuthenticatedRequest } from './require-auth.js';

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const pool = 'us-east-2_test';
const verifier = CognitoJwtVerifier.create({ userPoolId: pool, clientId: 'test-client', tokenUse: 'access' });
verifier.cacheJwks({ keys: [{ ...publicKey.export({ format: 'jwk' }), kty: 'RSA', kid: 'test-key', alg: 'RS256', use: 'sig' }] });

function token(overrides: Record<string, unknown> = {}) {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', kid: 'test-key' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ iss: `https://cognito-idp.us-east-2.amazonaws.com/${pool}`,
    sub: 'trusted-sub', client_id: 'test-client', token_use: 'access', exp: Math.floor(Date.now() / 1000) + 300,
    ...overrides })).toString('base64url');
  const body = `${header}.${payload}`;
  return `${body}.${sign('RSA-SHA256', Buffer.from(body), privateKey).toString('base64url')}`;
}

async function authenticate(bearer: string | undefined, profile?: Record<string, unknown>, failDb = false) {
  let status = 200;
  let next = false;
  let lookups = 0;
  const req = { headers: { authorization: bearer ? `Bearer ${bearer}` : undefined } } as AuthenticatedRequest;
  const res = { status(code: number) { status = code; return this; }, json() { return this; } } as unknown as Response;
  const middleware = createRequireAuth((value) => verifier.verify(value), async (sub) => {
    lookups++;
    assert.equal(sub, 'trusted-sub');
    if (failDb) throw new Error('offline');
    return profile ? { id: 'local-id', email: 'test@example.com', firstName: 'Test', lastName: 'User', role: 'clinician', patientId: null, ...profile } as import('../features/users/user.types.js').UserProfile : null;
  });
  await middleware(req, res, () => { next = true; });
  return { status, next, lookups, user: req.user };
}

test('missing and forged credentials never reach profile lookup', async () => {
  for (const value of [undefined, 'forged.jwt.token']) {
    const result = await authenticate(value);
    assert.equal(result.status, 401);
    assert.equal(result.lookups, 0);
    assert.equal(result.next, false);
  }
});
test('reject expired tokens, wrong app clients, ID tokens, and wrong issuers', async () => {
  for (const claims of [{ exp: 1 }, { client_id: 'other-client' }, { token_use: 'id' }, { iss: 'https://attacker.example' }]) {
    const result = await authenticate(token(claims));
    assert.equal(result.status, 401);
    assert.equal(result.lookups, 0);
  }
});
test('a valid Cognito token does not grant an unlinked account access', async () => {
  const result = await authenticate(token());
  assert.equal(result.status, 403);
  assert.equal(result.next, false);
});
test('roles come from the database, never from a token role claim', async () => {
  const result = await authenticate(token({ role: 'admin' }), {
    id: 'local-id', email: 'test@example.com', role: 'patient', patientId: 'p-001',
  });
  assert.equal(result.next, true);
  assert.equal(result.user?.role, 'patient');
  assert.equal(result.user?.id, 'local-id');
});
test('an unlinked chart and a database outage fail closed', async () => {
  assert.equal((await authenticate(token(), { role: 'patient' })).status, 403);
  assert.equal((await authenticate(token(), undefined, true)).status, 503);
});
