import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import Icon from './Icon';
import Avatar from './Avatar';
import { api } from '../lib/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const links = [
    { to: '/catalog', label: 'Catalogue' },
    ...(user && !user.isStaff
      ? [
          { to: '/dashboard', label: 'Dashboard' },
          { to: '/loans', label: 'My Loans' },
          { to: '/fines', label: 'Fines' },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-outline-variant bg-surface/95 backdrop-blur" role="banner">
      <div className="mx-auto flex h-16 w-full max-w-shell items-center justify-between px-md md:px-xl">
        <div className="flex items-center gap-xl">
          <Link to="/catalog" className="flex items-center gap-xs text-xl font-bold text-primary" aria-label="Tameion home">
            <Icon name="book-open" size={26} />
            Tameion
          </Link>
          <nav className="hidden h-16 items-center gap-lg md:flex" aria-label="Main navigation">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                aria-current={isActive(l.to) ? 'page' : undefined}
                className={`flex h-full items-center border-b-2 px-2xs text-xs font-semibold uppercase tracking-wider transition-colors duration-fast ${
                  isActive(l.to)
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-primary'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-xs">
          <button
            onClick={toggleTheme}
            className="rounded-md p-2xs text-on-surface-variant transition-colors duration-fast hover:bg-surface-container-low"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={20} />
          </button>

          {user ? (
            <>
              <Link
                to="/profile"
                className="hidden items-center gap-xs rounded-md px-2xs py-3xs transition-colors duration-fast hover:bg-surface-container-low sm:flex"
                aria-label="Your profile"
              >
                <Avatar seed={user.knust_id} name={user.name} src={user.hasAvatar ? api.myAvatarUrl() : null} size={32} />
                <span className="text-xs font-semibold text-on-surface">{user.name}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="hidden items-center gap-2xs rounded-md px-sm py-2xs text-xs font-semibold text-on-surface-variant transition-colors duration-fast hover:bg-surface-container-low hover:text-primary md:inline-flex"
              >
                <Icon name="log-out" size={16} />
                Logout
              </button>
            </>
          ) : (
            <div className="hidden items-center gap-xs md:flex">
              <Link
                to="/login"
                className="rounded-md px-md py-xs text-xs font-semibold text-on-surface-variant transition-colors duration-fast hover:bg-surface-container-low hover:text-primary"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-md bg-primary px-md py-xs text-xs font-semibold text-on-primary transition-colors duration-fast hover:bg-primary-container hover:text-on-primary-container"
              >
                Register
              </Link>
            </div>
          )}

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-md p-2xs text-on-surface transition-colors duration-fast hover:bg-surface-container-low md:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            <Icon name={menuOpen ? 'x' : 'menu'} size={22} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav id="mobile-menu" className="space-y-3xs border-t border-outline-variant bg-surface px-md py-sm md:hidden" aria-label="Mobile navigation">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMenuOpen(false)}
              aria-current={isActive(l.to) ? 'page' : undefined}
              className={`block rounded-md px-md py-xs text-sm font-semibold transition-colors duration-fast ${
                isActive(l.to)
                  ? 'bg-primary-container text-on-primary-container'
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
              }`}
            >
              {l.label}
            </Link>
          ))}
          <div className="my-xs border-t border-outline-variant" />
          <button
            onClick={toggleTheme}
            className="flex w-full items-center gap-xs rounded-md px-md py-xs text-sm font-semibold text-on-surface-variant transition-colors duration-fast hover:bg-surface-container-low"
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          {user ? (
            <>
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-xs rounded-md px-md py-xs text-sm font-semibold text-on-surface-variant transition-colors duration-fast hover:bg-surface-container-low"
              >
                <Avatar seed={user.knust_id} name={user.name} src={user.hasAvatar ? api.myAvatarUrl() : null} size={28} />
                {user.name}
              </Link>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
                className="flex w-full items-center gap-xs rounded-md px-md py-xs text-sm font-semibold text-error transition-colors duration-fast hover:bg-error-container"
              >
                <Icon name="log-out" size={18} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="block rounded-md px-md py-xs text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low">
                Login
              </Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="block rounded-md bg-primary px-md py-xs text-center text-sm font-semibold text-on-primary hover:bg-primary-container hover:text-on-primary-container">
                Register
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
