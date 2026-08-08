import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const active = (path: string) =>
    location.pathname === path
      ? 'text-primary border-b-2 border-primary pb-1'
      : 'text-on-surface-variant hover:text-primary transition-colors';

  const mobileActive = (path: string) =>
    location.pathname === path
      ? 'text-primary bg-primary/5 font-semibold'
      : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low';

  const patronLinks = user && !user.isStaff ? [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/loans', label: 'My Loans' },
    { to: '/fines', label: 'Fines' },
  ] : [];

  return (
    <header className="bg-surface border-b border-outline-variant shadow-sm w-full sticky top-0 z-50" role="banner">
      <div className="flex justify-between items-center w-full px-4 md:px-10 max-w-[1440px] mx-auto h-16">
        <div className="flex items-center gap-8">
          <Link to="/catalog" className="font-semibold text-2xl text-primary flex items-center gap-2" aria-label="Tameion home">
            {logoFailed
              ? <span className="material-symbols-outlined" style={{fontVariationSettings:"'FILL' 1"}} aria-hidden="true">menu_book</span>
              : <img src="/logo.png" alt="" className="h-8 w-auto" onError={() => setLogoFailed(true)} />}
            Tameion
          </Link>
          <nav className="hidden md:flex items-center gap-6 h-full pt-1" aria-label="Main navigation">
            <Link to="/catalog" className={`text-xs tracking-wider uppercase font-medium h-full flex items-center px-2 ${active('/catalog')}`}>Catalog</Link>
            {patronLinks.map(l => (
              <Link key={l.to} to={l.to} className={`text-xs tracking-wider uppercase font-medium h-full flex items-center px-2 ${active(l.to)}`}>{l.label}</Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-surface-container-low transition-colors" aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            <span className="material-symbols-outlined text-on-surface-variant" aria-hidden="true">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
          </button>
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-default" aria-label={`Signed in as ${user.name}`}>
                <span className="material-symbols-outlined text-on-surface-variant" aria-hidden="true">account_circle</span>
                <span className="text-xs font-medium">{user.name}</span>
              </div>
              <button onClick={handleLogout} className="hidden md:block text-xs font-medium text-on-surface-variant hover:text-primary transition-colors px-3 py-1.5 hover:bg-surface-container-low rounded-lg">
                Logout
              </button>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <Link to="/login" className="text-xs font-medium text-on-surface-variant hover:text-primary transition-colors px-4 py-2 hover:bg-surface-container-low rounded-lg">Login</Link>
              <Link to="/register" className="text-xs font-medium bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-colors px-4 py-2 rounded-lg">Register</Link>
            </div>
          )}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg hover:bg-surface-container-low transition-colors"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="mobile-menu">
            <span className="material-symbols-outlined text-on-surface" aria-hidden="true">{menuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav id="mobile-menu" className="md:hidden border-t border-outline-variant bg-surface px-4 py-3 space-y-1" aria-label="Mobile navigation">
          <Link to="/catalog" onClick={() => setMenuOpen(false)} className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${mobileActive('/catalog')}`}>Catalog</Link>
          {patronLinks.map(l => (
            <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)} className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${mobileActive(l.to)}`}>{l.label}</Link>
          ))}
          <div className="border-t border-outline-variant my-2" />
          <button onClick={toggleTheme} className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors flex items-center gap-2"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          {user ? (
            <>
              <div className="px-4 py-2 text-xs text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">account_circle</span>
                {user.name}
              </div>
              <button onClick={() => { setMenuOpen(false); handleLogout(); }} className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-error hover:bg-error-container transition-colors">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors">Login</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 rounded-lg text-sm font-medium bg-primary text-on-primary text-center hover:bg-primary-container hover:text-on-primary-container transition-colors">Register</Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
