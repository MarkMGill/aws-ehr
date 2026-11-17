import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scopeRecords } from './permissions.js';

const charts = [{ id: 'p-001' }, { id: 'p-002' }];
test('patients only receive their linked chart', () => {
  assert.deepEqual(scopeRecords({ role: 'patient', patientId: 'p-002' }, charts, (row) => row.id), [{ id: 'p-002' }]);
});
test('unlinked patients receive no records', () => {
  assert.deepEqual(scopeRecords({ role: 'patient', patientId: null }, charts, (row) => row.id), []);
});
test('staff retain access to the learning project registry', () => {
  assert.deepEqual(scopeRecords({ role: 'clinician', patientId: null }, charts, (row) => row.id), charts);
});
