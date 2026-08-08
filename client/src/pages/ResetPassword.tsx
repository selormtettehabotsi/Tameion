import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import AuthLayout from '../components/AuthLayout';
import Icon from '../components/Icon';
import { Alert, Button, Input } from '../components/ui';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      const message = err instanceof Object && 'message' in err ? String(err.message) : 'Reset failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <AuthLayout title="Password updated" subtitle="You can sign in with your new password">
        <div className="text-center">
          <div className="mx-auto mb-md grid h-14 w-14 place-items-center rounded-full bg-success-container text-on-success-container">
            <Icon name="circle-check" size={26} />
          </div>
          <p className="text-sm text-on-surface-variant">Your password has been changed.</p>
          <Link to="/login" className="mt-lg inline-block">
            <Button>Go to login</Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set a new password" subtitle="Choose something you have not used before">
      {error && (
        <div className="mb-md">
          <Alert tone="danger" title="Could not reset password">{error}</Alert>
        </div>
      )}
      {!token && (
        <div className="mb-md">
          <Alert tone="warning" title="Missing reset token">
            Open the link from your reset email to continue.
          </Alert>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-md">
        <Input label="New password" type="password" required autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters" />
        <Input label="Confirm password" type="password" required autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} />
        <Button type="submit" size="lg" disabled={loading || !token} className="w-full">
          {loading ? 'Resetting…' : 'Reset password'}
        </Button>
      </form>
    </AuthLayout>
  );
}
