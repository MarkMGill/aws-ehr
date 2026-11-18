import { Patient, ClinicalNote, Prescription, BillingRecord } from '../../database/models/index.js';
import { patientWhere } from '../../middleware/permissions.js';
import type { AppUser } from '../users/user.types.js';

export async function getDashboard(user: AppUser) {
  const where = patientWhere(user);
  const patients = patientWhere(user, 'id');
  const [totalPatients, activePrescriptions, pendingBills, recentNotes, recentPatients] = await Promise.all([
    Patient.count({ where: patients }),
    Prescription.count({ where: { ...where, status: 'active' } }),
    BillingRecord.count({ where: { ...where, status: 'pending' } }),
    ClinicalNote.count({ where }),
    Patient.findAll({ where: patients, order: [['createdAt', 'DESC'], ['id', 'ASC']], limit: 3 }),
  ]);
  return { totalPatients, activePrescriptions, pendingBills, recentNotes, recentPatients };
}
