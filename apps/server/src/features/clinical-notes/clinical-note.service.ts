import { ClinicalNote } from '../../database/models/index.js';
import { patientWhere } from '../../middleware/permissions.js';
import type { AppUser } from '../users/user.types.js';

export async function listClinicalNotes(user: AppUser) {
  const records = await ClinicalNote.findAll({
    where: patientWhere(user, 'patientId'), order: [['createdAt', 'DESC'], ['id', 'ASC']],
  });
  return records;
}
