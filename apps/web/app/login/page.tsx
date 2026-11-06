'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [form, setForm] = useState({ email: 'clinician@clinic.local', password: 'Password123!' });

  const loginMutation = useMutation({
    mutationFn: async () =>
      api.post<{ token: string; user: { id: string; email: string; firstName: string; lastName: string; role: string } }>('/auth/login', form),
    onSuccess: ({ token, user }) => {
      setSession(token, {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as 'patient' | 'clinician' | 'admin',
      });
      router.push('/dashboard');
    },
  });

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <span className="eyebrow">Secure sign in</span>
        <h1>Access the EHR workspace</h1>
        <p>Use the demo clinician credentials below for a quick walkthrough of the app.</p>
        <div className="form-grid">
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            />
          </label>
        </div>

        <button className="button primary full" type="button" onClick={() => loginMutation.mutate()}>
          {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
        </button>

        {loginMutation.isError ? <p className="error-text">{loginMutation.error.message}</p> : null}

        <div className="demo-box">
          <strong>Demo credentials</strong>
          <p>clinician@clinic.local / Password123!</p>
          <p>patient@clinic.local / Password123!</p>
          <p>admin@clinic.local / Password123!</p>
        </div>
      </section>
    </main>
  );
}
