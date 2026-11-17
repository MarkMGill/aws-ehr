'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import type { UserSession } from '@/lib/types';
import { AppShell } from './app-shell';

function SessionGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const setUser = useAuthStore((state) => state.setUser);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const isPublic = pathname === '/' || pathname === '/login';

  useEffect(() => {
    if (isPublic) { setUser(null); return; }
    let cancelled = false;
    setStatus('loading');
    fetch('/api/auth/session', { cache: 'no-store' }).then(async (response) => {
      if (cancelled) return;
      if (response.status === 401) { window.location.replace('/login'); return; }
      if (response.status === 403) { window.location.replace('/login?error=unlinked'); return; }
      if (!response.ok) throw new Error('Session unavailable');
      const user: UserSession = await response.json();
      if (!cancelled) { setUser(user); setStatus('ready'); }
    }).catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, [pathname, isPublic, setUser]);

  if (isPublic) return <>{children}</>;
  if (status === 'error') return <main className="panel">Unable to verify your session. Please reload to retry.</main>;
  if (status !== 'ready') return <main className="panel">Checking your session...</main>;
  return <AppShell>{children}</AppShell>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return <QueryClientProvider client={queryClient}><SessionGate>{children}</SessionGate></QueryClientProvider>;
}
