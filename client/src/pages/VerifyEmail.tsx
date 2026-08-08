import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); setError('No verification token provided.'); return; }
    api.verifyEmail(token).then(() => setStatus('success')).catch((e: any) => { setStatus('error'); setError(e.message || 'Verification failed'); });
  }, [token]);

  const icon = status === 'loading' ? 'hourglass_top' : status === 'success' ? 'verified' : 'error';
  const title = status === 'loading' ? 'Verifying...' : status === 'success' ? 'Email Verified' : 'Verification Failed';

  return (
    <div className="bg-background min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className={'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ' + (status === 'error' ? 'bg-error-container' : 'bg-primary-container')}>
          <span className={'material-symbols-outlined text-3xl ' + (status === 'error' ? 'text-error' : 'text-on-primary-container')}>{icon}</span>
        </div>
        <h1 className="font-semibold text-2xl text-primary mb-2">{title}</h1>
        {status === 'success' && <p className="text-on-surface-variant mb-6">Your email has been verified. You can now log in.</p>}
        {status === 'error' && <p className="text-on-surface-variant mb-6">{error}</p>}
        {status !== 'loading' && <Link to="/login" className="text-primary font-semibold hover:underline">Go to Login</Link>}
      </div>
    </div>
  );
}
