import { Prescription } from '../../database/models/index.js';
import { patientWhere } from '../../middleware/permissions.js';
import type { AppUser } from '../users/user.types.js';

export async function listPrescriptions(user: AppUser) {
  const records = await Prescription.findAll({
    where: patientWhere(user, 'patientId'), order: [['createdAt', 'DESC'], ['id', 'ASC']],
  });
  return records;
}
