export type Role = 'patient' | 'clinician' | 'admin';

export interface UserSession {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
}

export interface DashboardSummary {
  totalPatients: number;
  activePrescriptions: number;
  pendingBills: number;
  recentNotes: number;
  recentPatients: Array<{ id: string; firstName: string; lastName: string; mrn: string; status: string }>;
}

export interface PatientRecord {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  mrn: string;
  status: string;
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
  status: string;
}

export interface BillingRecord {
  id: string;
  patientId: string;
  service: string;
  amount: number;
  status: string;
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
