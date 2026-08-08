import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError('');
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try { await api.resetPassword(token, password); setDone(true); }
    catch (err: any) { setError(err.message || 'Reset failed'); }
    finally { setLoading(false); }
  };

  const ic = 'w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-on-surface outline-none';

  return (
    <div className="bg-background min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-on-primary-container text-3xl">{done ? 'check_circle' : 'lock_reset'}</span>
        </div>
        <h1 className="font-semibold text-2xl text-primary mb-2">{done ? 'Password Reset' : 'Set New Password'}</h1>
        {done ? (
          <><p className="text-on-surface-variant mb-6">Your password has been updated.</p><Link to="/login" className="text-primary font-semibold hover:underline">Go to Login</Link></>
        ) : (
          <div className="bg-surface-container-lowest rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-surface-variant p-6 text-left mt-4">
            {error && <div className="bg-error-container text-on-error-container p-3 rounded-lg mb-4 text-sm border border-error/20">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="text-xs tracking-wider font-medium text-on-surface mb-1 block">New Password</label><input type="password" required value={password} onChange={e => setPassword(e.target.value)} className={ic} placeholder="Min 8 characters" /></div>
              <div><label className="text-xs tracking-wider font-medium text-on-surface mb-1 block">Confirm Password</label><input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} className={ic} /></div>
              <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-on-primary-fixed-variant text-on-primary font-semibold py-2 rounded-lg transition-colors disabled:opacity-50">{loading ? 'Resetting...' : 'Reset Password'}</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
