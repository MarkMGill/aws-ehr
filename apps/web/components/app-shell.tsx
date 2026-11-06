'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/patients', label: 'Patients' },
  { href: '/clinical-notes', label: 'Clinical Notes' },
  { href: '/prescriptions', label: 'Prescriptions' },
  { href: '/billing', label: 'Billing' },
  { href: '/portal', label: 'Patient Portal' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">E</div>
          <div>
            <strong>AWS EHR</strong>
            <small>Clinical Operations</small>
          </div>
        </div>

        <nav className="nav-stack">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={pathname === link.href ? 'nav-link active' : 'nav-link'}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="user-card">
          <span className="eyebrow">Signed in</span>
          <strong>{user ? `${user.firstName} ${user.lastName}` : 'Guest'}</strong>
          <small>{user ? user.role : 'Not authenticated'}</small>
          <button className="button secondary" onClick={handleLogout} type="button">
            Log out
          </button>
        </div>
      </aside>

      <main className="content-panel">{children}</main>
    </div>
  );
}
