import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await api.forgotPassword(email); setSent(true); }
    catch (err: any) { setError(err.message || 'Request failed'); }
    finally { setLoading(false); }
  };

  const ic = 'w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-on-surface outline-none';

  return (
    <div className="bg-background min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-on-primary-container text-3xl">{sent ? 'mark_email_read' : 'lock_reset'}</span>
        </div>
        <h1 className="font-semibold text-2xl text-primary mb-2">{sent ? 'Check Your Email' : 'Reset Password'}</h1>
        {sent ? (
          <>
            <p className="text-on-surface-variant mb-6">If an account exists for <strong>{email}</strong>, we've sent a password reset link.</p>
            <Link to="/login" className="text-primary font-semibold hover:underline">Back to Login</Link>
          </>
        ) : (
          <div className="bg-surface-container-lowest rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-surface-variant p-6 text-left mt-4">
            <p className="text-sm text-on-surface-variant mb-4">Enter your email address and we'll send you a reset link.</p>
            {error && <div className="bg-error-container text-on-error-container p-3 rounded-lg mb-4 text-sm border border-error/20">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="text-xs tracking-wider font-medium text-on-surface mb-1 block">Email Address</label><input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={ic} /></div>
              <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-on-primary-fixed-variant text-on-primary font-semibold py-2 rounded-lg transition-colors disabled:opacity-50">{loading ? 'Sending...' : 'Send Reset Link'}</button>
            </form>
            <p className="text-sm text-on-surface-variant text-center mt-4"><Link to="/login" className="text-primary font-semibold hover:underline">Back to Login</Link></p>
          </div>
        )}
      </div>
    </div>
  );
}
