import { hashPassword } from '../../features/users/password.js';
import { sequelize } from '../sequelize.js';
import { User, Patient, ClinicalNote, Prescription, BillingRecord, Document } from '../models/index.js';

const userSeed = [
  ['u-001', 'admin@clinic.local', 'Password123!', 'Ava', 'Murphy', 'admin'],
  ['u-002', 'clinician@clinic.local', 'Password123!', 'Noah', 'Singh', 'clinician'],
  ['u-003', 'patient@clinic.local', 'Password123!', 'Olivia', 'Patel', 'patient'],
] as const;

const patientSeed = [
  ['p-001', 'Olivia', 'Patel', '1988-05-11', 'MRN-00421', 'active'],
  ['p-002', 'Marcus', 'Chen', '1976-09-28', 'MRN-00812', 'follow-up'],
  ['p-003', 'Priya', 'Nguyen', '1994-02-14', 'MRN-01077', 'active'],
] as const;

const notesSeed = [
  ['n-001', 'p-001', 'u-002', 'Follow-up post-visit', 'Patient reports improved energy levels and adherence to BP log. Continue current medication plan.'],
  ['n-002', 'p-002', 'u-002', 'Diabetes education', 'Reviewed meal plan and glucose monitoring schedule. Patient requested digital portal onboarding.'],
] as const;

const prescriptionsSeed = [
  ['rx-001', 'p-001', 'Lisinopril', '10 mg', 'Once daily', 'Dr. Singh', 'active'],
  ['rx-002', 'p-002', 'Metformin', '500 mg', 'Twice daily', 'Dr. Murphy', 'refilled'],
] as const;

const billingSeed = [
  ['b-001', 'p-001', 'Annual wellness exam', 245.0, 'pending', '2025-05-05'],
  ['b-002', 'p-002', 'Lab panel', 320.5, 'paid', '2025-04-20'],
] as const;

const documentsSeed = [
  ['d-001', 'p-001', 'Annual wellness summary.pdf', 'care-plan', 'ehr/p-001/annual-wellness-summary.pdf'],
  ['d-002', 'p-002', 'Lab results.csv', 'lab', 'ehr/p-002/lab-results.csv'],
] as const;

export async function seedDemoData() {
  // All records commit together. Existing records, including identity links,
  // modified names, and password hashes, are never overwritten.
  await sequelize.transaction(async (transaction) => {
    for (const [id, email, password, firstName, lastName, role] of userSeed) {
      await User.findOrCreate({ where: { email }, defaults: {
        id, email, passwordHash: await hashPassword(password), firstName, lastName, role,
      }, transaction });
    }
    for (const [id, firstName, lastName, dob, mrn, status] of patientSeed) {
      await Patient.findOrCreate({ where: { id }, defaults: { id, firstName, lastName, dob, mrn, status }, transaction });
    }
    for (const [id, patientId, authorId, title, body] of notesSeed) {
      await ClinicalNote.findOrCreate({ where: { id }, defaults: { id, patientId, authorId, title, body }, transaction });
    }
    for (const [id, patientId, medication, dosage, frequency, prescriber, status] of prescriptionsSeed) {
      await Prescription.findOrCreate({ where: { id }, defaults: { id, patientId, medication, dosage, frequency, prescriber, status }, transaction });
    }
    for (const [id, patientId, service, amount, status, dueDate] of billingSeed) {
      await BillingRecord.findOrCreate({ where: { id }, defaults: { id, patientId, service, amount, status, dueDate }, transaction });
    }
    for (const [id, patientId, name, category, s3Key] of documentsSeed) {
      await Document.findOrCreate({ where: { id }, defaults: { id, patientId, name, category, s3Key }, transaction });
    }
  });
}
