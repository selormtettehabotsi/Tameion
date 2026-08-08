import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import Icon from '../components/Icon';
import { Alert, Button, Input } from '../components/ui';

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
    } catch (err) {
      const message = err instanceof Object && 'message' in err ? String(err.message) : 'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Sign in"
      subtitle="KNUST Library System"
      footer={
        <>
          <p className="text-sm text-on-surface-variant">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-semibold text-primary hover:underline">Register</Link>
          </p>
          <div className="flex w-full max-w-[200px] items-center gap-xs">
            <div className="h-px flex-1 bg-outline-variant" />
            <span className="text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">or</span>
            <div className="h-px flex-1 bg-outline-variant" />
          </div>
          <Link to="/catalog" className="inline-flex items-center gap-xs text-sm font-semibold text-on-surface-variant transition-colors duration-fast hover:text-primary">
            <Icon name="search" size={18} />
            Browse the catalogue
          </Link>
        </>
      }
    >
      {error && (
        <div className="mb-md">
          <Alert tone="danger" title="Sign in failed">{error}</Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-md">
        <Input
          label="KNUST ID or email"
          id="identifier"
          icon="user"
          type="text"
          required
          autoComplete="username"
          value={identifier}
          onChange={e => setIdentifier(e.target.value)}
          placeholder="STU-2024001 or name@knust.edu.gh"
        />

        <div>
          <div className="mb-2xs flex items-center justify-between">
            <label htmlFor="password" className="text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Password
            </label>
            <Link to="/forgot-password" className="text-2xs font-semibold text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <span className="pointer-events-none absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant">
              <Icon name="lock" size={16} />
            </span>
            <input
              id="password"
              type={showPw ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-md border border-outline-variant bg-surface-container-lowest py-xs pl-xl pr-xl text-sm text-on-surface transition-colors duration-fast focus:border-primary"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              aria-label={showPw ? 'Hide password' : 'Show password'}
              className="absolute right-sm top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors duration-fast hover:text-on-surface"
            >
              <Icon name={showPw ? 'eye-off' : 'eye'} size={16} />
            </button>
          </div>
        </div>

        <Button type="submit" size="lg" disabled={loading} className="mt-2xs w-full">
          {loading ? 'Signing in…' : 'Log in'}
          {!loading && <Icon name="arrow-right" size={18} />}
        </Button>
      </form>
    </AuthLayout>
  );
}
