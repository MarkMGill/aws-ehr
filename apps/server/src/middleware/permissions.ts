import type { WhereOptions } from 'sequelize';
import type { UserProfile } from '../features/users/user.types.js';
import { HttpError } from './error-handler.js';

// A missing patient link must never turn into an unrestricted query.
export function patientWhere(user: Pick<UserProfile, 'role' | 'patientId'>, field: 'id' | 'patientId' = 'patientId'): WhereOptions {
  if (user.role !== 'patient') return {};
  if (!user.patientId) throw new HttpError(403, 'Your patient profile has not been linked to a chart.');
  return { [field]: user.patientId };
}
