'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ClinicalNote } from '@/lib/types';

export default function ClinicalNotesPage() {
  const { data, isLoading, error } = useQuery<ClinicalNote[]>({
    queryKey: ['clinical-notes'],
    queryFn: () => api.get('/clinical-notes'),
  });

  if (isLoading) return <div className="panel">Loading notes...</div>;
  if (error) return <div className="panel error-box">{error.message}</div>;

  return (
    <div className="stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">Clinical documentation</span>
          <h1>Clinical notes</h1>
        </div>
      </header>

      <section className="stack-list">
        {(data ?? []).map((note) => (
          <article key={note.id} className="panel">
            <h2>{note.title}</h2>
            <small>{note.createdAt}</small>
            <p>{note.body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
