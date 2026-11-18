import { test } from 'node:test';
import assert from 'node:assert/strict';
import { patientWhere } from './permissions.js';

test('patients restrict both chart and child-record queries', () => {
  const user = { role: 'patient' as const, patientId: 'p-002' };
  assert.deepEqual(patientWhere(user, 'id'), { id: 'p-002' });
  assert.deepEqual(patientWhere(user), { patientId: 'p-002' });
});
test('an unlinked patient cannot issue an unrestricted query', () => {
  assert.throws(() => patientWhere({ role: 'patient', patientId: null }), /not been linked/);
});
test('staff retain access to the learning registry', () => {
  assert.deepEqual(patientWhere({ role: 'clinician', patientId: null }), {});
});
