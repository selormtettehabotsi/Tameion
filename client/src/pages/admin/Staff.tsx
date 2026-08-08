import { useState, useEffect, type FormEvent } from 'react';
import { api } from '../../lib/api';
import type { StaffMember, Branch, Pagination } from '../../types';
import PaginationBar from '../../components/PaginationBar';

type Modal = null | { mode: 'add' } | { mode: 'edit'; staff: StaffMember };

export default function Staff() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Modal>(null);
  const [form, setForm] = useState({ knust_staff_id: '', full_name: '', email: '', password: '', role: 'librarian', branch_id: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const load = (page = 1) => {
    setLoading(true);
    Promise.all([
      api.adminStaff({ page: String(page), limit: '20' }),
      api.adminBranches(),
    ]).then(([s, b]) => {
      setStaff(s.data.staff);
      setPagination(s.data.pagination);
      setBranches(b.data);
    }).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setForm({ knust_staff_id: '', full_name: '', email: '', password: '', role: 'librarian', branch_id: '' });
    setErr(''); setModal({ mode: 'add' });
  };
  const openEdit = (s: StaffMember) => {
    setForm({ knust_staff_id: s.knust_staff_id, full_name: s.full_name, email: s.email, password: '', role: s.role, branch_id: s.branch_id ? String(s.branch_id) : '' });
    setErr(''); setModal({ mode: 'edit', staff: s });
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault(); setSaving(true); setErr('');
    try {
      if (modal?.mode === 'add') {
        await api.adminCreateStaff({
          knust_staff_id: form.knust_staff_id, full_name: form.full_name, email: form.email,
          password: form.password, role: form.role, branch_id: form.branch_id ? Number(form.branch_id) : undefined,
        });
      } else if (modal?.mode === 'edit') {
        await api.adminUpdateStaff(modal.staff.id, {
          full_name: form.full_name, email: form.email, role: form.role as any,
          branch_id: form.branch_id ? Number(form.branch_id) : null,
        });
      }
      setModal(null); load(pagination.page);
    } catch (e: any) { setErr(e.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const inp = 'w-full px-3 py-2 bg-surface-container-lowest rounded-md border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm text-on-surface';

  return (
    <div>
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs tracking-wider font-medium text-on-surface-variant uppercase mb-1">Administration</p>
          <h1 className="font-semibold text-2xl md:text-3xl text-on-surface">Staff Management</h1>
        </div>
        <button onClick={openAdd} className="bg-primary hover:bg-primary-container hover:text-on-primary-container text-on-primary font-medium text-sm px-6 py-2.5 rounded-lg shadow-sm flex items-center gap-2 transition-colors">
          <span className="material-symbols-outlined text-[20px]">person_add</span> Add Staff
        </button>
      </header>

      <div className="bg-surface-container-lowest rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-surface-container-highest overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-bright border-b border-surface-container-highest">
                <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase">Staff ID</th>
                <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase">Name</th>
                <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase hidden md:table-cell">Email</th>
                <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase text-center">Role</th>
                <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase hidden lg:table-cell">Branch</th>
                <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-highest text-sm">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-on-surface-variant">Loading...</td></tr>
              ) : staff.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-on-surface-variant">No staff members found.</td></tr>
              ) : staff.map(s => (
                <tr key={s.id} className="hover:bg-surface transition-colors group">
                  <td className="py-3 px-4 font-mono text-xs text-on-surface-variant">{s.knust_staff_id}</td>
                  <td className="py-3 px-4 font-medium text-on-surface">{s.full_name}</td>
                  <td className="py-3 px-4 text-on-surface-variant hidden md:table-cell">{s.email}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ' +
                      (s.role === 'admin' ? 'bg-primary-container text-on-primary-container' : 'bg-tertiary-fixed text-on-tertiary-fixed')}>
                      {s.role.charAt(0).toUpperCase() + s.role.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-on-surface-variant hidden lg:table-cell">{s.branch_name || '—'}</td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => openEdit(s)} className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-md transition-colors opacity-0 group-hover:opacity-100" title="Edit">
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PaginationBar pagination={pagination} onPageChange={load} />
      </div>

      {modal && (
        <div role="dialog" aria-modal="true" aria-labelledby="staff-modal-title" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.1)] border border-surface-container-highest overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-container-highest bg-surface-bright flex justify-between items-center">
              <h2 id="staff-modal-title" className="font-semibold text-xl text-on-surface">{modal.mode === 'add' ? 'Add Staff Member' : 'Edit Staff Member'}</h2>
              <button onClick={() => setModal(null)} aria-label="Close dialog" className="text-on-surface-variant hover:text-on-surface"><span className="material-symbols-outlined" aria-hidden="true">close</span></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {err && <div role="alert" className="bg-error-container text-on-error-container p-3 rounded-lg text-sm">{err}</div>}
              <div>
                <label className="text-xs tracking-wider font-medium text-on-surface-variant mb-1 block">Staff ID</label>
                <input required value={form.knust_staff_id} onChange={e => setForm({ ...form, knust_staff_id: e.target.value })} readOnly={modal.mode === 'edit'} className={inp + (modal.mode === 'edit' ? ' bg-surface-container-low cursor-not-allowed' : '')} placeholder="LIB-001" />
              </div>
              <div><label className="text-xs tracking-wider font-medium text-on-surface-variant mb-1 block">Full Name</label><input required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className={inp} /></div>
              <div><label className="text-xs tracking-wider font-medium text-on-surface-variant mb-1 block">Email</label><input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inp} /></div>
              {modal.mode === 'add' && (
                <div><label className="text-xs tracking-wider font-medium text-on-surface-variant mb-1 block">Password</label><input type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className={inp} /></div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs tracking-wider font-medium text-on-surface-variant mb-1 block">Role</label>
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className={inp}>
                    <option value="librarian">Librarian</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs tracking-wider font-medium text-on-surface-variant mb-1 block">Branch</label>
                  <select value={form.branch_id} onChange={e => setForm({ ...form, branch_id: e.target.value })} className={inp}>
                    <option value="">None</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
                  </select>
                </div>
              </div>
            </form>
            <div className="px-6 py-4 border-t border-surface-container-highest bg-surface-bright flex justify-end gap-3">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-on-surface-variant hover:bg-surface-container-low rounded-md transition-colors font-medium">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-primary text-on-primary rounded-md font-medium hover:bg-primary-container hover:text-on-primary-container transition-colors disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
