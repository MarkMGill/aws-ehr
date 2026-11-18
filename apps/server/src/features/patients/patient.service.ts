import { Patient } from '../../database/models/index.js';
import { patientWhere } from '../../middleware/permissions.js';
import type { AppUser } from '../users/user.types.js';

export async function listPatients(user: AppUser) {
  const records = await Patient.findAll({
    where: patientWhere(user, 'id'), order: [['lastName', 'ASC'], ['id', 'ASC']],
  });
  return records;
}
