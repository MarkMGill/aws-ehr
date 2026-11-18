import { Patient } from '../../database/models/index.js';
import { patientWhere } from '../../middleware/permissions.js';
import type { AppUser } from '../users/user.types.js';

// Appointment management is not implemented yet. Preserve the existing sample
// appointment display only for the original demo chart, never another patient.
const demoAppointments = [
  { time: '2025-04-18 09:30', provider: 'Dr. Singh', type: 'Follow-up visit' },
  { time: '2025-04-23 14:15', provider: 'Pharmacist', type: 'Medication review' },
];

export async function getPortal(user: AppUser) {
  const patient = await Patient.findOne({ where: patientWhere(user, 'id'), order: [['id', 'ASC']] });
  return {
    patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Patient',
    lastVisit: patient?.id === 'p-001' ? '2025-04-02' : 'Not available',
    upcomingAppointments: patient?.id === 'p-001' ? demoAppointments : [],
  };
}
