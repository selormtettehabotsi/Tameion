import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import AuthLayout from '../components/AuthLayout';
import Icon, { type IconName } from '../components/Icon';
import { Button } from '../components/ui';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('No verification token provided.');
      return;
    }
    api.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((e) => {
        setStatus('error');
        setError(e instanceof Object && 'message' in e ? String(e.message) : 'Verification failed');
      });
  }, [token]);

  const view: Record<typeof status, { icon: IconName; title: string; body: string; tone: string }> = {
    loading: { icon: 'rotate-cw', title: 'Verifying…', body: 'Checking your verification link.', tone: 'bg-primary-container text-on-primary-container' },
    success: { icon: 'circle-check', title: 'Email verified', body: 'Your account is active. You can now log in.', tone: 'bg-success-container text-on-success-container' },
    error: { icon: 'triangle-alert', title: 'Verification failed', body: error, tone: 'bg-error-container text-error' },
  };
  const v = view[status];

  return (
    <AuthLayout title={v.title} subtitle="Email verification">
      <div className="text-center">
        <div className={`mx-auto mb-md grid h-14 w-14 place-items-center rounded-full ${v.tone}`}>
          <Icon name={v.icon} size={26} className={status === 'loading' ? 'animate-spin' : ''} />
        </div>
        <p className="text-sm text-on-surface-variant">{v.body}</p>
        {status !== 'loading' && (
          <Link to="/login" className="mt-lg inline-block">
            <Button>Go to login</Button>
          </Link>
        )}
      </div>
    </AuthLayout>
  );
}
