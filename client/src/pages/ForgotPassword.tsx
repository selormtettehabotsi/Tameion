import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import AuthLayout from '../components/AuthLayout';
import Icon from '../components/Icon';
import { Alert, Button, Input } from '../components/ui';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.forgotPassword(email);
      setSent(true);
    } catch (err) {
      const message = err instanceof Object && 'message' in err ? String(err.message) : 'Request failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout title="Check your email" subtitle="Password reset requested">
        <div className="text-center">
          <div className="mx-auto mb-md grid h-14 w-14 place-items-center rounded-full bg-success-container text-on-success-container">
            <Icon name="mail-check" size={26} />
          </div>
          <p className="text-sm text-on-surface-variant">
            If an account exists for <strong className="text-on-surface">{email}</strong>, a reset link is on its way.
          </p>
          <Link to="/login" className="mt-lg inline-block">
            <Button variant="secondary">Back to login</Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We will email you a reset link"
      footer={
        <Link to="/login" className="text-sm font-semibold text-primary hover:underline">Back to login</Link>
      }
    >
      {error && (
        <div className="mb-md">
          <Alert tone="danger" title="Request failed">{error}</Alert>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-md">
        <Input
          label="Email address"
          type="email"
          icon="mail-check"
          required
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="name@st.knust.edu.gh"
        />
        <Button type="submit" size="lg" disabled={loading} className="w-full">
          {loading ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>
    </AuthLayout>
  );
}
