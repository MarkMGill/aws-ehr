'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Prescription } from '@/lib/types';

export default function PrescriptionsPage() {
  const { data, isLoading, error } = useQuery<Prescription[]>({
    queryKey: ['prescriptions'],
    queryFn: () => api.get('/prescriptions'),
  });

  if (isLoading) return <div className="panel">Loading prescriptions...</div>;
  if (error) return <div className="panel error-box">{error.message}</div>;

  return (
    <div className="stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">Medication management</span>
          <h1>Prescriptions</h1>
        </div>
      </header>

      <section className="panel">
        <table>
          <thead>
            <tr>
              <th>Medication</th>
              <th>Dosage</th>
              <th>Frequency</th>
              <th>Prescriber</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((rx) => (
              <tr key={rx.id}>
                <td>{rx.medication}</td>
                <td>{rx.dosage}</td>
                <td>{rx.frequency}</td>
                <td>{rx.prescriber}</td>
                <td>{rx.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
