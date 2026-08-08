import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { isStaff } = await login(identifier, password);
      navigate(isStaff ? '/admin' : '/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const ic = 'w-full pl-10 pr-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-on-surface outline-none';

  return (
    <div className="bg-background min-h-screen flex">
      {/* Left panel — branded visual (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        <img src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1200&q=80&auto=format&fit=crop" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/85 via-[#004d21]/75 to-[#003318]/80" />
        <div className="relative z-10 text-center max-w-md p-12">
          <div className="w-24 h-24 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-8 border border-white/20">
            <span className="material-symbols-outlined text-white text-5xl" style={{fontVariationSettings:"'FILL' 1"}}>menu_book</span>
          </div>
          <h2 className="text-4xl font-bold text-white tracking-tight mb-4">Tameion</h2>
          <p className="text-lg text-white/80 leading-relaxed">Your gateway to knowledge. Access thousands of academic and recreational resources from KNUST libraries.</p>
          <div className="mt-10 flex items-center justify-center gap-8 text-white/60 text-sm">
            <div className="flex flex-col items-center gap-1">
              <span className="material-symbols-outlined text-white/80">library_books</span>
              <span>10,000+ Books</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="material-symbols-outlined text-white/80">domain</span>
              <span>6 Branches</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="material-symbols-outlined text-white/80">groups</span>
              <span>5,000+ Members</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-10">
      <div className="w-full max-w-[440px] flex flex-col items-center">
        <div className="flex flex-col items-center mb-8 w-full">
          <div className="w-20 h-20 bg-primary-container rounded-full flex items-center justify-center mb-4 shadow-sm">
            <span className="material-symbols-outlined text-on-primary-container text-4xl">account_balance</span>
          </div>
          <h1 className="font-semibold text-2xl md:text-3xl text-primary tracking-tight">Tameion</h1>
          <p className="text-sm text-on-surface-variant mt-2">KNUST Library System</p>
        </div>

        {error && (
          <div className="w-full bg-error-container text-on-error-container p-4 rounded-lg mb-4 flex items-start gap-2 border border-error/20">
            <span className="material-symbols-outlined mt-0.5">error</span>
            <div>
              <p className="font-semibold text-base">Login Failed</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        <div className="w-full bg-surface-container-lowest rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-surface-variant p-6 md:p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="username" className="text-xs tracking-wider font-medium text-on-surface">KNUST ID or Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-on-surface-variant">person</span>
                </div>
                <input id="username" type="text" required value={identifier} onChange={e => setIdentifier(e.target.value)}
                  className={ic} placeholder="e.g. STU-2024001 or name@knust.edu.gh" />
              </div>
            </div>
            <div className="flex flex-col gap-1 mt-2">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-xs tracking-wider font-medium text-on-surface">Password</label>
                <Link to="/forgot-password" className="text-xs tracking-wider font-medium text-primary hover:text-on-primary-fixed-variant transition-colors">Forgot password?</Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-on-surface-variant">lock</span>
                </div>
                <input id="password" type={showPw ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                  className={ic + ' pr-10'} placeholder="••••••••" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute inset-y-0 right-0 pr-2 flex items-center text-on-surface-variant hover:text-on-surface">
                  <span className="material-symbols-outlined">{showPw ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full mt-4 bg-primary hover:bg-on-primary-fixed-variant text-on-primary font-semibold text-base py-2 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? 'Signing in...' : 'Log In'}
              {!loading && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
            </button>
          </form>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-on-surface-variant">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-semibold hover:underline ml-1">Register</Link>
          </p>
          <div className="flex items-center gap-2 w-full max-w-[200px] mt-2">
            <div className="h-px bg-outline-variant flex-1" />
            <span className="text-xs tracking-wider font-medium text-on-surface-variant uppercase">or</span>
            <div className="h-px bg-outline-variant flex-1" />
          </div>
          <Link to="/catalog" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mt-2 font-semibold text-base">
            <span className="material-symbols-outlined">search</span>
            Browse Catalog
          </Link>
        </div>
      </div>
      </div>
    </div>
  );
}
