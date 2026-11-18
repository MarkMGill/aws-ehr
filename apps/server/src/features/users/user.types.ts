export type UserRole = 'patient' | 'clinician' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  patientId: string | null;
}

export interface AppUser extends UserProfile { sub: string }
