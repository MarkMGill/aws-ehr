import { BillingRecord } from '../../database/models/index.js';
import { patientWhere } from '../../middleware/permissions.js';
import type { AppUser } from '../users/user.types.js';

export async function listBillingRecords(user: AppUser) {
  const records = await BillingRecord.findAll({
    where: patientWhere(user, 'patientId'), order: [['dueDate', 'ASC'], ['id', 'ASC']],
  });
  return records.map((record) => ({ ...record.toJSON(), amount: Number(record.amount) }));
}
