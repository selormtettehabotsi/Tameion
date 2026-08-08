import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function Register() {
  const [form, setForm] = useState({ knust_id: '', full_name: '', email: '', phone: '', programme: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await api.register({ knust_id: form.knust_id, full_name: form.full_name, email: form.email, phone: form.phone, programme: form.programme, password: form.password });
      setSuccess(true);
    } catch (err: any) { setError(err.message || 'Registration failed'); }
    finally { setLoading(false); }
  };

  const ic = 'w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-on-surface outline-none';

  if (success) return (
    <div className="bg-background min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-on-primary-container text-3xl">mark_email_read</span>
        </div>
        <h1 className="font-semibold text-2xl text-primary mb-2">Check Your Email</h1>
        <p className="text-on-surface-variant mb-6">We've sent a verification link to <strong>{form.email}</strong>. Please verify your email to activate your account.</p>
        <Link to="/login" className="text-primary font-semibold hover:underline">Go to Login</Link>
      </div>
    </div>
  );

  return (
    <div className="bg-background min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        <img src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&q=80&auto=format&fit=crop" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/85 via-[#004d21]/75 to-[#003318]/80" />
        <div className="relative z-10 text-center max-w-md p-12">
          <div className="w-24 h-24 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-8 border border-white/20">
            <span className="material-symbols-outlined text-white text-5xl" style={{fontVariationSettings:"'FILL' 1"}}>menu_book</span>
          </div>
          <h2 className="text-4xl font-bold text-white tracking-tight mb-4">Join Tameion</h2>
          <p className="text-lg text-white/80 leading-relaxed">Create your account to borrow books, track loans, and access all KNUST library branches.</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-10">
      <div className="w-full max-w-[480px]">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-on-primary-container text-3xl">person_add</span>
          </div>
          <h1 className="font-semibold text-2xl text-primary">Create Account</h1>
          <p className="text-sm text-on-surface-variant mt-1">Join Tameion Library System</p>
        </div>
        {error && (
          <div className="bg-error-container text-on-error-container p-3 rounded-lg mb-4 flex items-center gap-2 text-sm border border-error/20">
            <span className="material-symbols-outlined text-[18px]">error</span>{error}
          </div>
        )}
        <div className="bg-surface-container-lowest rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-surface-variant p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div><label className="text-xs tracking-wider font-medium text-on-surface mb-1 block">KNUST ID</label><input required value={form.knust_id} onChange={e => set('knust_id', e.target.value)} className={ic} placeholder="e.g. STU-2024001" /></div>
            <div><label className="text-xs tracking-wider font-medium text-on-surface mb-1 block">Full Name</label><input required value={form.full_name} onChange={e => set('full_name', e.target.value)} className={ic} placeholder="Your full name" /></div>
            <div><label className="text-xs tracking-wider font-medium text-on-surface mb-1 block">Email</label><input type="email" required value={form.email} onChange={e => set('email', e.target.value)} className={ic} placeholder="name@st.knust.edu.gh" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs tracking-wider font-medium text-on-surface mb-1 block">Phone</label><input value={form.phone} onChange={e => set('phone', e.target.value)} className={ic} placeholder="024xxxxxxx" /></div>
              <div><label className="text-xs tracking-wider font-medium text-on-surface mb-1 block">Programme</label><input value={form.programme} onChange={e => set('programme', e.target.value)} className={ic} placeholder="BSc Computer Science" /></div>
            </div>
            <div><label className="text-xs tracking-wider font-medium text-on-surface mb-1 block">Password</label><input type="password" required value={form.password} onChange={e => set('password', e.target.value)} className={ic} placeholder="Min 8 characters" /></div>
            <div><label className="text-xs tracking-wider font-medium text-on-surface mb-1 block">Confirm Password</label><input type="password" required value={form.confirm} onChange={e => set('confirm', e.target.value)} className={ic} /></div>
            <button type="submit" disabled={loading} className="w-full mt-2 bg-primary hover:bg-on-primary-fixed-variant text-on-primary font-semibold py-2 rounded-lg transition-colors disabled:opacity-50">
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>
        </div>
        <p className="text-sm text-on-surface-variant text-center mt-6">Already have an account? <Link to="/login" className="text-primary font-semibold hover:underline">Login</Link></p>
      </div>
      </div>
    </div>
  );
}
