import { useState, useEffect, type FormEvent } from 'react';
import { api } from '../../lib/api';
import type { Member, Pagination } from '../../types';
import PaginationBar from '../../components/PaginationBar';
import { useToast } from '../../context/ToastContext';

export default function Members() {
  const [members, setMembers] = useState<Member[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<Member | null>(null);
  const [form, setForm] = useState({ account_status: '', user_type: '' });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    try {
      const blob = await api.adminExportMembers();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'members.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch { toast('Export failed', 'error'); }
  };

  const load = (page = 1) => {
    setLoading(true);
    const params: Record<string, string> = { page: String(page), limit: '20' };
    if (q) params.q = q;
    api.adminMembers(params)
      .then(r => { setMembers(r.data.members); setPagination(r.data.pagination); })
      .catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleSearch = (e: FormEvent) => { e.preventDefault(); load(1); };
  const openEdit = (m: Member) => { setEditing(m); setForm({ account_status: m.account_status, user_type: m.user_type }); };
  const handleSave = async (e: FormEvent) => {
    e.preventDefault(); if (!editing) return; setSaving(true);
    try { await api.adminUpdateMember(editing.id, form); setEditing(null); load(pagination.page); }
    catch (e) { console.error(e); } finally { setSaving(false); }
  };

  const inp = 'w-full px-3 py-2 bg-surface-container-lowest rounded-md border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm text-on-surface';

  return (
    <div>
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs tracking-wider font-medium text-on-surface-variant uppercase mb-1">User Management</p>
          <h1 className="font-semibold text-2xl md:text-3xl text-on-surface">Members</h1>
        </div>
        <button onClick={handleExport} className="bg-surface border border-outline-variant hover:bg-surface-container-low text-on-surface font-medium text-sm px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors">
          <span className="material-symbols-outlined text-[20px]">download</span> Export CSV
        </button>
      </header>

      <form onSubmit={handleSearch} className="flex gap-3 mb-6 bg-surface-container-lowest p-4 rounded-lg border border-surface-container-highest shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
          <input type="text" value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name, KNUST ID, or email..." className={inp + ' pl-10'} />
        </div>
        <button type="submit" className="px-4 py-2 bg-primary text-on-primary rounded-md text-sm font-medium hover:bg-primary-container hover:text-on-primary-container transition-colors">Search</button>
      </form>

      <div className="bg-surface-container-lowest rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-surface-container-highest overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-bright border-b border-surface-container-highest">
                <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase">KNUST ID</th>
                <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase">Name</th>
                <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase hidden md:table-cell">Email</th>
                <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase hidden lg:table-cell">Type</th>
                <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase text-center">Status</th>
                <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase text-right">Fine</th>
                <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-highest text-sm">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-on-surface-variant">Loading...</td></tr>
              ) : members.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-on-surface-variant">No members found.</td></tr>
              ) : members.map(m => (
                <tr key={m.id} className="hover:bg-surface transition-colors group">
                  <td className="py-3 px-4 font-mono text-xs text-on-surface-variant">{m.knust_id}</td>
                  <td className="py-3 px-4 font-medium text-on-surface">{m.full_name}</td>
                  <td className="py-3 px-4 text-on-surface-variant hidden md:table-cell">{m.email}</td>
                  <td className="py-3 px-4 text-on-surface hidden lg:table-cell capitalize">{m.user_type}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ' +
                      (m.account_status === 'active' ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#fee2e2] text-[#991b1b]')}>
                      {m.account_status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-on-surface-variant">GH₵ {Number(m.fine_balance).toFixed(2)}</td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => openEdit(m)} className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-md transition-colors opacity-0 group-hover:opacity-100" title="Edit">
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

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.1)] border border-surface-container-highest overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-container-highest bg-surface-bright flex justify-between items-center">
              <h3 className="font-semibold text-xl text-on-surface">Edit Member</h3>
              <button onClick={() => setEditing(null)} className="text-on-surface-variant hover:text-on-surface"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="text-sm text-on-surface-variant"><strong>{editing.full_name}</strong> ({editing.knust_id})</div>
              <div>
                <label className="text-xs tracking-wider font-medium text-on-surface-variant mb-1 block">Account Status</label>
                <select value={form.account_status} onChange={e => setForm({ ...form, account_status: e.target.value })} className={inp}>
                  <option value="active">Active</option><option value="suspended">Suspended</option><option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="text-xs tracking-wider font-medium text-on-surface-variant mb-1 block">User Type</label>
                <select value={form.user_type} onChange={e => setForm({ ...form, user_type: e.target.value })} className={inp}>
                  <option value="student">Student</option><option value="faculty">Faculty</option>
                </select>
              </div>
            </form>
            <div className="px-6 py-4 border-t border-surface-container-highest bg-surface-bright flex justify-end gap-3">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-on-surface-variant hover:bg-surface-container-low rounded-md transition-colors font-medium">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-primary text-on-primary rounded-md font-medium hover:bg-primary-container hover:text-on-primary-container transition-colors disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
