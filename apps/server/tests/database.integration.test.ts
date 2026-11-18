import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { once } from 'node:events';
import type { Server } from 'node:http';
import { sequelize } from '../src/database/sequelize.js';
import { migrate, migrator } from '../src/database/migrator.js';
import { seedDemoData } from '../src/database/seeders/demo.js';
import { User, Patient, ClinicalNote, Prescription, BillingRecord, Document, WebSession } from '../src/database/models/index.js';
import { createApp } from '../src/app.js';
import { createRequireAuth } from '../src/middleware/require-auth.js';
import { findUserByCognitoSub, linkCognitoUser } from '../src/features/users/user.service.js';

if (process.env.NODE_ENV !== 'test' || !new URL(process.env.DATABASE_URL!).pathname.startsWith('/ehr_test_')) {
  throw new Error('Refusing to run database integration tests outside an isolated test database.');
}
const legacy = process.env.TEST_SCENARIO === 'legacy';
let server: Server;
let base: string;

before(async () => {
  if (legacy) {
    // Old SQL exists only as a compatibility fixture, never a runtime schema path.
    for (const file of ['legacy-schema.sql', 'legacy-cognito.sql']) {
      await sequelize.query(await readFile(new URL(`./fixtures/${file}`, import.meta.url), 'utf8'));
    }
    await sequelize.getQueryInterface().bulkInsert('users', [{
      id: 'u-002', email: 'clinician@clinic.local', password_hash: 'preserved-hash',
      first_name: 'Existing', last_name: 'Clinician', role: 'clinician', cognito_sub: 'clinician-sub',
    }]);
    await sequelize.getQueryInterface().bulkInsert('web_sessions', [{
      id: 'existing-session', kind: 'session', payload: 'preserved-encrypted-payload', expires_at: new Date(Date.now() + 60_000),
    }]);
  }
  assert.equal((await migrate()).length, 2);
  await seedDemoData();
  await seedDemoData();
  await linkCognitoUser('clinician@clinic.local', 'clinician-sub');
  await linkCognitoUser('patient@clinic.local', 'patient-sub', 'p-001');
  await linkCognitoUser('admin@clinic.local', 'admin-sub');
  // Stub only cryptographic verification. User lookup and authorization use the
  // real middleware and PostgreSQL. JWT cryptography has separate unit tests.
  const authenticate = createRequireAuth(async (sub) => {
    if (!['clinician-sub', 'patient-sub', 'admin-sub', 'unlinked-sub'].includes(sub)) throw new Error('Invalid test credential');
    return { sub };
  });
  server = createApp({ authenticate }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('HTTP server unavailable');
  base = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (server) await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  await sequelize.close();
});

async function request(path: string, sub = 'clinician-sub') {
  return fetch(`${base}/api${path}`, { headers: { Authorization: `Bearer ${sub}` } });
}

test(`${legacy ? 'legacy adoption' : 'fresh schema'}: migration tracking and repeated seeds preserve data`, async () => {
  assert.equal((await migrate()).length, 0);
  assert.equal((await migrator.executed()).length, 2);
  assert.equal(await User.count(), 3);
  assert.equal(await Patient.count(), 3);
  assert.equal(await ClinicalNote.count(), 2);
  assert.equal(await Prescription.count(), 2);
  assert.equal(await BillingRecord.count(), 2);
  assert.equal(await Document.count(), 2);
  if (legacy) {
    const user = await User.unscoped().findByPk('u-002');
    assert.equal(user?.firstName, 'Existing');
    assert.equal(user?.passwordHash, 'preserved-hash');
    assert.equal(user?.cognitoSub, 'clinician-sub');
    assert.equal((await WebSession.findByPk('existing-session'))?.payload, 'preserved-encrypted-payload');
  }
  await Patient.update({ firstName: 'Edited' }, { where: { id: 'p-001' } });
  await seedDemoData();
  assert.equal((await Patient.findByPk('p-001'))?.firstName, 'Edited');
  assert.equal((await User.findByPk('u-002'))?.cognitoSub, 'clinician-sub');
});

test('ORM associations join notes to their patient and author without password hashes', async () => {
  const note = await ClinicalNote.findByPk('n-001', { include: ['patient', 'author'] });
  const json = note!.toJSON() as unknown as { patient: { id: string }; author: { id: string; passwordHash?: string } };
  assert.equal(json.patient.id, 'p-001');
  assert.equal(json.author.id, 'u-002');
  assert.equal(json.author.passwordHash, undefined);
});

test('Cognito linking is repeatable and rejects reassignment and placeholders', async () => {
  await linkCognitoUser('patient@clinic.local', 'patient-sub');
  assert.equal((await findUserByCognitoSub('patient-sub'))?.patientId, 'p-001');
  await assert.rejects(() => linkCognitoUser('clinician@clinic.local', 'different-sub'), /already linked/);
  await assert.rejects(() => linkCognitoUser('admin@clinic.local', 'YOUR_COGNITO_SUB'), /placeholder/);
  await assert.rejects(() => linkCognitoUser('patient@clinic.local', 'patient-sub', 'missing-chart'), /chart not found/);
});

test('all clinical endpoints retain camelCase response fields and patient isolation', async () => {
  const routes = [
    ['/patients', 'id', 'firstName'], ['/clinical-notes', 'patientId', 'authorId'],
    ['/prescriptions', 'patientId', 'prescriber'], ['/billing', 'patientId', 'dueDate'],
    ['/documents', 'patientId', 's3Key'],
  ];
  for (const [path, patientKey, field] of routes) {
    const response = await request(path);
    assert.equal(response.status, 200, path);
    const all = await response.json() as Array<Record<string, unknown>>;
    assert.ok(all.length >= 2, path);
    assert.ok(field in all[0], path);
    assert.ok(!Object.keys(all[0]).some((key) => key.includes('_')), path);
    const patient = await request(path, 'patient-sub');
    assert.equal(patient.status, 200, path);
    const own = await patient.json() as Array<Record<string, unknown>>;
    assert.ok(own.length > 0, path);
    assert.ok(own.every((row) => row[patientKey] === 'p-001'), path);
  }
  const billing = await (await request('/billing')).json();
  assert.equal(typeof billing[0].amount, 'number');
});

test('empty chart results stay empty instead of falling back to another demo record', async () => {
  const patient = await User.findOne({ where: { cognitoSub: 'patient-sub' } });
  await patient!.update({ patientId: 'p-003' });
  try {
    for (const path of ['/clinical-notes', '/prescriptions', '/billing', '/documents']) {
      assert.deepEqual(await (await request(path, 'patient-sub')).json(), [], path);
    }
    const portal = await (await request('/portal', 'patient-sub')).json();
    assert.equal(portal.patientName, 'Priya Nguyen');
    assert.deepEqual(portal.upcomingAppointments, []);
  } finally { await patient!.update({ patientId: 'p-001' }); }
});

test('dashboard totals use persisted data and respect the patient boundary', async () => {
  const staff = await (await request('/dashboard')).json();
  assert.equal(staff.totalPatients, 3);
  const patient = await (await request('/dashboard', 'patient-sub')).json();
  assert.equal(patient.totalPatients, 1);
  assert.ok(patient.recentPatients.every((row: { id: string }) => row.id === 'p-001'));
  await Prescription.create({ id: 'extra-rx', patientId: 'p-001', medication: 'Test', dosage: 'Test', frequency: 'Test', prescriber: 'Test', status: 'active' });
  try {
    assert.equal((await (await request('/dashboard')).json()).activePrescriptions, staff.activePrescriptions + 1);
  } finally { await Prescription.destroy({ where: { id: 'extra-rx' } }); }
});

test('profile responses omit password hashes and deny unknown identities', async () => {
  const profile = await (await request('/me')).json();
  assert.equal(profile.id, 'u-002');
  assert.equal(profile.role, 'clinician');
  assert.equal(profile.passwordHash, undefined);
  assert.equal(profile.password_hash, undefined);
  assert.equal((await request('/me', 'unlinked-sub')).status, 403);
  assert.equal((await request('/patients', 'invalid')).status, 401);
  assert.equal((await fetch(`${base}/api/patients`)).status, 401);
});

test('database foreign keys reject orphan clinical records', async () => {
  await assert.rejects(() => ClinicalNote.create({ id: 'orphan-note', patientId: 'missing', authorId: 'u-002', title: 'Test', body: 'Test' }));
  assert.equal(await ClinicalNote.count(), 2);
});

test('database failures return a safe error rather than synthetic records', async () => {
  const routeApp = createApp({ authenticate: (req, _res, next) => {
    (req as import('../src/middleware/require-auth.js').AuthenticatedRequest).user = {
      id: 'test', sub: 'test', email: 'test@example.com', firstName: 'Test', lastName: 'Test', role: 'clinician', patientId: null,
    };
    next();
  } });
  // Inject a driver-level failure through the model method without stopping the
  // database or affecting any other connection.
  const { ConnectionError } = await import('sequelize');
  const original = Patient.findAll;
  Patient.findAll = async () => { throw new ConnectionError(new Error('private database details')); };
  const failing = routeApp.listen(0, '127.0.0.1');
  await once(failing, 'listening');
  try {
    const address = failing.address() as { port: number };
    const response = await fetch(`http://127.0.0.1:${address.port}/api/patients`);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { message: 'Database unavailable. Please try again later.' });
  } finally {
    Patient.findAll = original;
    await new Promise<void>((resolve) => failing.close(() => resolve()));
  }
});
