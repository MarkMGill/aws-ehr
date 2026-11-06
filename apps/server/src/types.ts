export type UserRole = 'patient' | 'clinician' | 'admin';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: string;
}

export interface PatientRecord {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  mrn: string;
  status: 'active' | 'follow-up' | 'discharged';
}

export interface ClinicalNote {
  id: string;
  patientId: string;
  authorId: string;
  title: string;
  body: string;
  createdAt: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  medication: string;
  dosage: string;
  frequency: string;
  prescriber: string;
  status: 'active' | 'refilled' | 'expired';
}

export interface BillingRecord {
  id: string;
  patientId: string;
  service: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  dueDate: string;
}

export interface DocumentRecord {
  id: string;
  patientId: string;
  name: string;
  category: string;
  s3Key: string;
  uploadedAt: string;
}

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}
