import type { UserRole } from './types.js';

// Apply the same patient boundary to synthetic data as to SQL results.
export function scopeRecords<T>(user: { role: UserRole; patientId: string | null }, records: T[], patientId: (record: T) => string): T[] {
  if (user.role !== 'patient') return records;
  return user.patientId ? records.filter((record) => patientId(record) === user.patientId) : [];
}
