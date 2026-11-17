// Run after `npm run build`. No AWS credentials or database required.
import { spawn } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';
import assert from 'node:assert/strict';

const env = { ...process.env, PORT: '4107', APP_URL: 'http://localhost:3107',
  API_URL: 'http://localhost:4107/api', COGNITO_CLIENT_SECRET: 'smoke-test-only',
  COGNITO_DOMAIN: 'https://smoke-test.auth.us-east-2.amazoncognito.com' };
const children = [
  spawn(process.execPath, ['apps/server/dist/index.js'], { env, stdio: 'pipe' }),
  spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', 'apps/web', '-p', '3107'], { env, stdio: 'pipe' }),
];
for (const child of children) {
  child.stdout.resume();
  child.stderr.resume();
}

async function ready(url) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (children.some((child) => child.exitCode !== null)) throw new Error('A smoke-test server exited. Check whether ports 3107/4107 are already in use.');
    try { await fetch(url); return; } catch { await setTimeout(100); }
  }
  throw new Error('Timed out waiting for smoke-test servers.');
}

try {
  await Promise.all([ready('http://localhost:4107/health'), ready('http://localhost:3107/login')]);
  const cases = [
    ['http://localhost:4107/api/patients', {}, 401],
    ['http://localhost:4107/api/patients', { headers: { Authorization: 'Bearer forged.jwt.token' } }, 401],
    ['http://localhost:4107/api/auth/login', { method: 'POST' }, 410],
    ['http://localhost:4107/api/auth/register', { method: 'POST' }, 410],
    ['http://localhost:3107/api/auth/session', {}, 401],
    ['http://localhost:3107/api/ehr/patients', {}, 401],
    ['http://localhost:3107/api/ehr/auth/login', {}, 404],
    ['http://localhost:3107/api/auth/logout', { method: 'POST', headers: { Origin: 'https://attacker.example' } }, 403],
  ];
  for (const [url, options, expected] of cases) {
    const response = await fetch(url, { ...options, redirect: 'manual' });
    assert.equal(response.status, expected, url);
  }
  const callback = await fetch('http://localhost:3107/api/auth/callback/cognito?code=forged&state=forged', { redirect: 'manual' });
  assert.equal(callback.status, 307);
  assert.equal(callback.headers.get('location'), 'http://localhost:3107/login?error=signin');
  assert.match(callback.headers.get('set-cookie') ?? '', /ehr_login=/);
  console.log('Passed 9 auth HTTP smoke checks: API protection, disabled demo login, session/proxy protection, logout origin check, and callback rejection.');
} finally {
  for (const child of children) child.kill('SIGTERM');
}
