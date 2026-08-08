import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import AuthLayout from '../components/AuthLayout';
import Icon from '../components/Icon';
import { Alert, Button, Input, Select } from '../components/ui';

const USER_TYPES = [
  { value: 'student', label: 'Student' },
  { value: 'postgraduate', label: 'Postgraduate' },
  { value: 'faculty', label: 'Faculty' },
];

export default function Register() {
  const [form, setForm] = useState({
    knust_id: '',
    full_name: '',
    email: '',
    phone: '',
    user_type: 'student',
    programme: '',
    password: '',
    confirm: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await api.register({
        knust_id: form.knust_id,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        user_type: form.user_type,
        programme: form.programme,
        password: form.password,
      });
      setSuccess(true);
    } catch (err) {
      const message = err instanceof Object && 'message' in err ? String(err.message) : 'Registration failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout title="Check your email" subtitle="One more step to activate your account">
        <div className="text-center">
          <div className="mx-auto mb-md grid h-14 w-14 place-items-center rounded-full bg-success-container text-on-success-container">
            <Icon name="mail-check" size={26} />
          </div>
          <p className="text-sm text-on-surface-variant">
            We sent a verification link to <strong className="text-on-surface">{form.email}</strong>.
            Follow it to activate your library account.
          </p>
          <Link to="/login" className="mt-lg inline-block">
            <Button variant="secondary">Go to login</Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join the Tameion library system"
      footer={
        <p className="text-sm text-on-surface-variant">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">Log in</Link>
        </p>
      }
    >
      {error && (
        <div className="mb-md">
          <Alert tone="danger" title="Registration failed">{error}</Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-sm">
        <Input label="KNUST ID" required value={form.knust_id} onChange={e => set('knust_id', e.target.value)} placeholder="STU-2024001" autoComplete="username" />
        <Input label="Full name" required value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Your full name" autoComplete="name" />
        <Input label="Email" type="email" required value={form.email} onChange={e => set('email', e.target.value)} placeholder="name@st.knust.edu.gh" autoComplete="email" />

        <div className="grid grid-cols-1 gap-sm sm:grid-cols-2">
          <Select label="Member type" value={form.user_type} onChange={e => set('user_type', e.target.value)} options={USER_TYPES} />
          <Input label="Phone" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="024xxxxxxx" autoComplete="tel" />
        </div>

        <Input label="Programme" value={form.programme} onChange={e => set('programme', e.target.value)} placeholder="BSc Computer Science" />

        <div className="grid grid-cols-1 gap-sm sm:grid-cols-2">
          <Input label="Password" type="password" required value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 8 characters" autoComplete="new-password" />
          <Input label="Confirm password" type="password" required value={form.confirm} onChange={e => set('confirm', e.target.value)} autoComplete="new-password" />
        </div>

        <Button type="submit" size="lg" disabled={loading} className="mt-xs w-full">
          {loading ? 'Creating account…' : 'Register'}
        </Button>
      </form>
    </AuthLayout>
  );
}
