import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import Icon, { type IconName } from './Icon';
import Avatar from './Avatar';

const navItems: { path: string; icon: IconName; label: string }[] = [
  { path: '/admin', icon: 'layout-dashboard', label: 'Dashboard' },
  { path: '/admin/members', icon: 'users', label: 'Members' },
  { path: '/admin/books', icon: 'book-open', label: 'Books' },
  { path: '/admin/loans', icon: 'calendar', label: 'Loans' },
  { path: '/admin/fines', icon: 'banknote', label: 'Fines' },
  { path: '/admin/reservations', icon: 'bookmark', label: 'Reservations' },
  { path: '/admin/staff', icon: 'id-card', label: 'Staff' },
  { path: '/admin/branches', icon: 'landmark', label: 'Branches' },
  { path: '/admin/audit-log', icon: 'history', label: 'Audit Log' },
  { path: '/admin/reports', icon: 'chart-bar', label: 'Reports' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const [sideOpen, setSideOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-on-surface-variant">
        Loading...
      </div>
    );
  }
  if (!user || !user.isStaff) return <Navigate to="/login" replace />;

  const isActive = (path: string) => location.pathname === path;

  const sidebar = (
    <nav className="flex h-full flex-col bg-surface-container-low py-lg" aria-label="Admin navigation">
      <div className="mb-md border-b border-surface-container-high px-md pb-md">
        <div className="mb-lg flex items-center gap-xs text-xl font-bold text-primary">
          <Icon name="book-open" size={24} />
          Tameion
        </div>
        <div className="flex items-center gap-sm">
          <Avatar seed={user.knust_id} name={user.name} size={40} />
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-on-surface">{user.name}</h2>
            <p className="text-2xs uppercase tracking-wider text-on-surface-variant">
              {user.role === 'admin' ? 'Administrator' : 'Librarian'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2xs">
        <ul className="space-y-3xs">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                onClick={() => setSideOpen(false)}
                aria-current={isActive(item.path) ? 'page' : undefined}
                className={`mx-2xs flex items-center gap-xs rounded-md px-sm py-xs text-xs font-semibold transition-colors duration-fast ${
                  isActive(item.path)
                    ? 'bg-primary-container text-on-primary-container'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <Icon name={item.icon} size={18} />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto space-y-3xs border-t border-surface-container-high px-md pt-md">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-xs rounded-md px-sm py-xs text-xs font-semibold text-on-surface-variant transition-colors duration-fast hover:bg-surface-container-high"
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-xs rounded-md px-sm py-xs text-xs font-semibold text-error transition-colors duration-fast hover:bg-error-container"
        >
          <Icon name="log-out" size={18} />
          Logout
        </button>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {sideOpen && (
        <button
          className="fixed inset-0 z-40 bg-on-surface/40 md:hidden"
          onClick={() => setSideOpen(false)}
          aria-label="Close navigation"
        />
      )}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-64 transform transition-transform duration-normal md:translate-x-0 ${
          sideOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebar}
      </aside>

      <div className="min-w-0 flex-1 md:ml-64">
        <div className="sticky top-0 z-30 flex items-center gap-sm border-b border-outline-variant bg-surface px-md py-sm md:hidden">
          <button onClick={() => setSideOpen(true)} aria-label="Open navigation" aria-expanded={sideOpen}>
            <Icon name="menu" size={22} />
          </button>
          <span className="flex items-center gap-2xs text-base font-bold text-primary">
            <Icon name="book-open" size={20} />
            Tameion
          </span>
        </div>
        <main className="mx-auto w-full max-w-shell p-md md:p-xl">{children}</main>
      </div>
    </div>
  );
}
