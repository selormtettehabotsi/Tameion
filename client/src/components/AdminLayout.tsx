import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';

const navItems = [
  { path: '/admin', icon: 'dashboard', label: 'Dashboard' },
  { path: '/admin/members', icon: 'group', label: 'Members' },
  { path: '/admin/books', icon: 'menu_book', label: 'Books' },
  { path: '/admin/loans', icon: 'calendar_today', label: 'Loans' },
  { path: '/admin/fines', icon: 'payments', label: 'Fines' },
  { path: '/admin/reservations', icon: 'bookmark', label: 'Reservations' },
  { path: '/admin/staff', icon: 'badge', label: 'Staff' },
  { path: '/admin/branches', icon: 'account_balance', label: 'Branches' },
  { path: '/admin/audit-log', icon: 'history', label: 'Audit Log' },
  { path: '/admin/reports', icon: 'bar_chart', label: 'Reports' },
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

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-on-surface-variant">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.isStaff) return <Navigate to="/login" replace />;

  const isActive = (path: string) => location.pathname === path;

  const sidebar = (
    <nav className="flex flex-col py-6 h-full bg-surface-container-low">
      <div className="px-4 pb-4 border-b border-surface-container-high mb-4">
        <div className="flex items-center gap-2 mb-6">
          <span className="font-bold text-2xl text-primary">Tameion</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary-container">admin_panel_settings</span>
          </div>
          <div>
            <h2 className="text-base font-semibold text-on-surface">{user.name}</h2>
            <p className="text-xs tracking-wider text-on-surface-variant">Admin Terminal</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-1">
        <ul className="space-y-1">
          {navItems.map(item => (
            <li key={item.path}>
              <Link to={item.path} onClick={() => setSideOpen(false)}
                className={`flex items-center px-4 py-2 rounded-lg mx-2 text-xs tracking-wider font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-primary-container text-on-primary-container'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}>
                <span className="material-symbols-outlined mr-2 text-[20px]">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="px-4 pt-4 border-t border-surface-container-high mt-auto space-y-2">
        <button onClick={toggleTheme}
          className="flex items-center w-full px-4 py-2 rounded-lg mx-0 text-on-surface-variant hover:bg-surface-container-high transition-colors text-xs tracking-wider font-medium">
          <span className="material-symbols-outlined mr-2 text-[20px]">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
        <button onClick={handleLogout}
          className="flex items-center w-full px-4 py-2 rounded-lg mx-0 text-error hover:bg-error-container transition-colors text-xs tracking-wider font-medium">
          <span className="material-symbols-outlined mr-2 text-[20px]">logout</span>
          Logout
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {sideOpen && <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setSideOpen(false)} />}
      <aside className={`fixed top-0 left-0 h-screen w-64 z-50 transform transition-transform md:translate-x-0 ${sideOpen ? 'translate-x-0' : '-translate-x-full'} md:block`}>
        {sidebar}
      </aside>
      <div className="flex-1 md:ml-64">
        <div className="md:hidden sticky top-0 z-30 bg-surface border-b border-outline-variant px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSideOpen(true)}><span className="material-symbols-outlined">menu</span></button>
          <span className="font-bold text-lg text-primary">Tameion</span>
        </div>
        <main className="p-4 md:p-10 max-w-[1440px]">
          {children}
        </main>
      </div>
    </div>
  );
}
