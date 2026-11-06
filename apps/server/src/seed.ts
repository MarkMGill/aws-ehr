import { hashPassword } from './auth.js';
import { query } from './db.js';

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

async function seed() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      dob DATE NOT NULL,
      mrn TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS clinical_notes (
      id TEXT PRIMARY KEY,
      patient_id TEXT REFERENCES patients(id),
      author_id TEXT REFERENCES users(id),
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS prescriptions (
      id TEXT PRIMARY KEY,
      patient_id TEXT REFERENCES patients(id),
      medication TEXT NOT NULL,
      dosage TEXT NOT NULL,
      frequency TEXT NOT NULL,
      prescriber_name TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS billing_records (
      id TEXT PRIMARY KEY,
      patient_id TEXT REFERENCES patients(id),
      service TEXT NOT NULL,
      amount NUMERIC(10,2) NOT NULL,
      status TEXT NOT NULL,
      due_date DATE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      patient_id TEXT REFERENCES patients(id),
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      s3_key TEXT NOT NULL,
      uploaded_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  for (const [id, email, password, firstName, lastName, role] of userSeed) {
    const passwordHash = await hashPassword(password);
    await query(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO NOTHING`,
      [id, email, passwordHash, firstName, lastName, role],
    );
  }

  for (const [id, firstName, lastName, dob, mrn, status] of patientSeed) {
    await query(
      `INSERT INTO patients (id, first_name, last_name, dob, mrn, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [id, firstName, lastName, dob, mrn, status],
    );
  }

  for (const [id, patientId, authorId, title, body] of notesSeed) {
    await query(
      `INSERT INTO clinical_notes (id, patient_id, author_id, title, body)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [id, patientId, authorId, title, body],
    );
  }

  for (const [id, patientId, medication, dosage, frequency, prescriber, status] of prescriptionsSeed) {
    await query(
      `INSERT INTO prescriptions (id, patient_id, medication, dosage, frequency, prescriber_name, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING`,
      [id, patientId, medication, dosage, frequency, prescriber, status],
    );
  }

  for (const [id, patientId, service, amount, status, dueDate] of billingSeed) {
    await query(
      `INSERT INTO billing_records (id, patient_id, service, amount, status, due_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [id, patientId, service, amount, status, dueDate],
    );
  }

  for (const [id, patientId, name, category, s3Key] of documentsSeed) {
    await query(
      `INSERT INTO documents (id, patient_id, name, category, s3_key)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [id, patientId, name, category, s3Key],
    );
  }

  console.log('Database seed complete.');
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
