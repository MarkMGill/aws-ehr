import { Document } from '../../database/models/index.js';
import { patientWhere } from '../../middleware/permissions.js';
import type { AppUser } from '../users/user.types.js';

export async function listDocuments(user: AppUser) {
  const records = await Document.findAll({
    where: patientWhere(user, 'patientId'), order: [['uploadedAt', 'DESC'], ['id', 'ASC']],
  });
  return records;
}
