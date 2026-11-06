'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function PortalPage() {
  const { data, isLoading, error } = useQuery<{ patientName: string; lastVisit: string; upcomingAppointments: Array<{ time: string; provider: string; type: string }> }>({
    queryKey: ['portal'],
    queryFn: () => api.get('/portal'),
  });

  if (isLoading) return <div className="panel">Loading patient portal...</div>;
  if (error) return <div className="panel error-box">{error.message}</div>;

  return (
    <div className="stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">Patient access</span>
          <h1>Patient portal</h1>
        </div>
      </header>

      <section className="panel hero-grid">
        <div>
          <h2>{data?.patientName}</h2>
          <p>Last visit: {data?.lastVisit}</p>
        </div>
        <div className="mini-card">
          <strong>Upcoming appointments</strong>
          <ul>
            {(data?.upcomingAppointments ?? []).map((appointment) => (
              <li key={`${appointment.time}-${appointment.provider}`}>
                {appointment.time} • {appointment.type} • {appointment.provider}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
