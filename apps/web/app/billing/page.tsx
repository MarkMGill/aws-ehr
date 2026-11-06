'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { BillingRecord } from '@/lib/types';

export default function BillingPage() {
  const { data, isLoading, error } = useQuery<BillingRecord[]>({
    queryKey: ['billing'],
    queryFn: () => api.get('/billing'),
  });

  if (isLoading) return <div className="panel">Loading billing records...</div>;
  if (error) return <div className="panel error-box">{error.message}</div>;

  return (
    <div className="stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">Revenue cycle</span>
          <h1>Billing overview</h1>
        </div>
      </header>

      <section className="panel">
        <table>
          <thead>
            <tr>
              <th>Service</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Due</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((bill) => (
              <tr key={bill.id}>
                <td>{bill.service}</td>
                <td>${bill.amount.toFixed(2)}</td>
                <td>{bill.status}</td>
                <td>{bill.dueDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
