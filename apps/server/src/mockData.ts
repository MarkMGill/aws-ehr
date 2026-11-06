import type { BillingRecord, ClinicalNote, DocumentRecord, PatientRecord, Prescription, UserRecord } from './types.js';

export const mockUsers: UserRecord[] = [
  {
    id: 'u-001',
    email: 'admin@clinic.local',
    passwordHash: '$2a$10$x02lkOtSXNsGi0pFNdXzNe/e4YIdNx9vv9hqq0mW0.RRSYx8ZLZrG',
    firstName: 'Ava',
    lastName: 'Murphy',
    role: 'admin',
    createdAt: '2024-01-01T08:00:00.000Z',
  },
  {
    id: 'u-002',
    email: 'clinician@clinic.local',
    passwordHash: '$2a$10$x02lkOtSXNsGi0pFNdXzNe/e4YIdNx9vv9hqq0mW0.RRSYx8ZLZrG',
    firstName: 'Noah',
    lastName: 'Singh',
    role: 'clinician',
    createdAt: '2024-01-05T09:15:00.000Z',
  },
  {
    id: 'u-003',
    email: 'patient@clinic.local',
    passwordHash: '$2a$10$x02lkOtSXNsGi0pFNdXzNe/e4YIdNx9vv9hqq0mW0.RRSYx8ZLZrG',
    firstName: 'Olivia',
    lastName: 'Patel',
    role: 'patient',
    createdAt: '2024-02-01T11:20:00.000Z',
  },
];

export const mockPatients: PatientRecord[] = [
  { id: 'p-001', firstName: 'Olivia', lastName: 'Patel', dob: '1988-05-11', mrn: 'MRN-00421', status: 'active' },
  { id: 'p-002', firstName: 'Marcus', lastName: 'Chen', dob: '1976-09-28', mrn: 'MRN-00812', status: 'follow-up' },
  { id: 'p-003', firstName: 'Priya', lastName: 'Nguyen', dob: '1994-02-14', mrn: 'MRN-01077', status: 'active' },
];

export const mockClinicalNotes: ClinicalNote[] = [
  {
    id: 'n-001',
    patientId: 'p-001',
    authorId: 'u-002',
    title: 'Follow-up post-visit',
    body: 'Patient reports improved energy levels and adherence to BP log. Continue current medication plan.',
    createdAt: '2025-04-04T12:00:00.000Z',
  },
  {
    id: 'n-002',
    patientId: 'p-002',
    authorId: 'u-002',
    title: 'Diabetes education',
    body: 'Reviewed meal plan and glucose monitoring schedule. Patient requested digital portal onboarding.',
    createdAt: '2025-04-09T14:30:00.000Z',
  },
];

export const mockPrescriptions: Prescription[] = [
  { id: 'rx-001', patientId: 'p-001', medication: 'Lisinopril', dosage: '10 mg', frequency: 'Once daily', prescriber: 'Dr. Singh', status: 'active' },
  { id: 'rx-002', patientId: 'p-002', medication: 'Metformin', dosage: '500 mg', frequency: 'Twice daily', prescriber: 'Dr. Murphy', status: 'refilled' },
];

export const mockBilling: BillingRecord[] = [
  { id: 'b-001', patientId: 'p-001', service: 'Annual wellness exam', amount: 245.0, status: 'pending', dueDate: '2025-05-05' },
  { id: 'b-002', patientId: 'p-002', service: 'Lab panel', amount: 320.5, status: 'paid', dueDate: '2025-04-20' },
];

export const mockDocuments: DocumentRecord[] = [
  { id: 'd-001', patientId: 'p-001', name: 'Annual wellness summary.pdf', category: 'care-plan', s3Key: 'ehr/p-001/annual-wellness-summary.pdf', uploadedAt: '2025-04-11T10:00:00.000Z' },
  { id: 'd-002', patientId: 'p-002', name: 'Lab results.csv', category: 'lab', s3Key: 'ehr/p-002/lab-results.csv', uploadedAt: '2025-04-15T09:00:00.000Z' },
];
