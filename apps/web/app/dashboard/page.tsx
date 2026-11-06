'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { DashboardSummary } from '@/lib/types';

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery<DashboardSummary>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard'),
  });

  if (isLoading) return <div className="panel">Loading dashboard...</div>;
  if (error) return <div className="panel error-box">{error.message}</div>;

  return (
    <div className="stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">Operations overview</span>
          <h1>Clinical dashboard</h1>
        </div>
      </header>

      <section className="stats-grid">
        <div className="stat-card">
          <span>Total patients</span>
          <strong>{data?.totalPatients ?? 0}</strong>
        </div>
        <div className="stat-card">
          <span>Active prescriptions</span>
          <strong>{data?.activePrescriptions ?? 0}</strong>
        </div>
        <div className="stat-card">
          <span>Pending billing</span>
          <strong>{data?.pendingBills ?? 0}</strong>
        </div>
        <div className="stat-card">
          <span>Clinical notes</span>
          <strong>{data?.recentNotes ?? 0}</strong>
        </div>
      </section>

      <section className="panel">
        <h2>Recent patients</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>MRN</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {(data?.recentPatients ?? []).map((patient) => (
              <tr key={patient.id}>
                <td>{patient.firstName} {patient.lastName}</td>
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
