export type Role = 'patient' | 'clinician' | 'admin';

export interface UserSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
}
