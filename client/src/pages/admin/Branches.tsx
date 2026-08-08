import { useState, useEffect, type FormEvent } from 'react';
import { api } from '../../lib/api';
import type { Branch } from '../../types';

interface BranchFull extends Branch { college?: string; location?: string }

export default function Branches() {
  const [branches, setBranches] = useState<BranchFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | 'add' | BranchFull>(null);
  const [form, setForm] = useState({ branch_name: '', college: '', location: '' });
  const [saving, setSaving] = useState(false);

  const load = () => { setLoading(true); api.adminBranches().then(r => setBranches(r.data as BranchFull[])).catch(console.error).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm({ branch_name: '', college: '', location: '' }); setModal('add'); };
  const openEdit = (b: BranchFull) => { setForm({ branch_name: b.branch_name, college: b.college || '', location: b.location || '' }); setModal(b); };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (modal === 'add') await api.adminCreateBranch(form as any);
      else if (modal) await api.adminUpdateBranch(modal.id, form as any);
      setModal(null); load();
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  const inp = 'w-full px-3 py-2 bg-surface-container-lowest rounded-md border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm text-on-surface';

  return (
    <div>
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs tracking-wider font-medium text-on-surface-variant uppercase mb-1">Infrastructure</p>
          <h1 className="font-semibold text-2xl md:text-3xl text-on-surface">Library Branches</h1>
        </div>
        <button onClick={openAdd} className="bg-primary hover:bg-primary-container hover:text-on-primary-container text-on-primary font-medium text-sm px-6 py-2.5 rounded-lg shadow-sm flex items-center gap-2 transition-colors">
          <span className="material-symbols-outlined text-[20px]">add</span> Add Branch
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? <p className="text-on-surface-variant col-span-full text-center py-8">Loading...</p> :
          branches.map(b => (
            <div key={b.id} className="bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-6 flex flex-col gap-3 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-primary-container">account_balance</span>
                  </div>
                  <h3 className="font-semibold text-lg text-on-surface">{b.branch_name}</h3>
                </div>
                <button onClick={() => openEdit(b)} className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-md transition-colors">
                  <span className="material-symbols-outlined text-[20px]">edit</span>
                </button>
              </div>
              {(b as any).college && <p className="text-sm text-on-surface-variant flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">school</span>{(b as any).college}</p>}
              {(b as any).location && <p className="text-sm text-on-surface-variant flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">location_on</span>{(b as any).location}</p>}
            </div>
          ))
        }
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.1)] border border-surface-container-highest overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-container-highest bg-surface-bright flex justify-between items-center">
              <h3 className="font-semibold text-xl text-on-surface">{modal === 'add' ? 'Add Branch' : 'Edit Branch'}</h3>
              <button onClick={() => setModal(null)} className="text-on-surface-variant hover:text-on-surface"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div><label className="text-xs tracking-wider font-medium text-on-surface-variant mb-1 block">Branch Name</label><input required value={form.branch_name} onChange={e => setForm({ ...form, branch_name: e.target.value })} className={inp} /></div>
              <div><label className="text-xs tracking-wider font-medium text-on-surface-variant mb-1 block">College</label><input required value={form.college} onChange={e => setForm({ ...form, college: e.target.value })} className={inp} /></div>
              <div><label className="text-xs tracking-wider font-medium text-on-surface-variant mb-1 block">Location</label><input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className={inp} /></div>
            </form>
            <div className="px-6 py-4 border-t border-surface-container-highest bg-surface-bright flex justify-end gap-3">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-on-surface-variant hover:bg-surface-container-low rounded-md font-medium transition-colors">Cancel</button>
              <button onClick={handleSave as any} disabled={saving} className="px-4 py-2 bg-primary text-on-primary rounded-md font-medium hover:bg-primary-container hover:text-on-primary-container transition-colors disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
