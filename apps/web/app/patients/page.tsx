'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { PatientRecord } from '@/lib/types';

export default function PatientsPage() {
  const { data, isLoading, error } = useQuery<PatientRecord[]>({
    queryKey: ['patients'],
    queryFn: () => api.get('/patients'),
  });

  if (isLoading) return <div className="panel">Loading patients...</div>;
  if (error) return <div className="panel error-box">{error.message}</div>;

  return (
    <div className="stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">Patient registry</span>
          <h1>Patient list</h1>
        </div>
      </header>

      <section className="panel">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>DOB</th>
              <th>MRN</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((patient) => (
              <tr key={patient.id}>
                <td>{patient.firstName} {patient.lastName}</td>
                <td>{patient.dob}</td>
                <td>{patient.mrn}</td>
                <td>{patient.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
