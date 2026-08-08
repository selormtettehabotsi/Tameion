import { useState, useEffect, type FormEvent } from 'react';
import { api } from '../../lib/api';
import type { AdminLoan, Pagination } from '../../types';
import PaginationBar from '../../components/PaginationBar';
import { useToast } from '../../context/ToastContext';

export default function AdminLoans() {
  const [loans, setLoans] = useState<AdminLoan[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [form, setForm] = useState({ book_isbn: '', member_knust_id: '', due_days: '14' });
  const [saving, setSaving] = useState(false);
  const [modalErr, setModalErr] = useState('');
  const { toast } = useToast();

  const load = (page = 1) => {
    setLoading(true);
    api.adminLoans({ page: String(page), limit: '20' })
      .then(r => { setLoans(r.data.loans); setPagination(r.data.pagination); })
      .catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleCheckout = async (e: FormEvent) => {
    e.preventDefault(); setSaving(true); setModalErr('');
    try { await api.adminCheckout({ book_isbn: form.book_isbn, member_knust_id: form.member_knust_id, due_days: Number(form.due_days) }); setShowCheckout(false); setForm({ book_isbn: '', member_knust_id: '', due_days: '14' }); toast('Book checked out successfully', 'success'); load(pagination.page); }
    catch (e: any) { setModalErr(e.message || 'Checkout failed'); } finally { setSaving(false); }
  };

  const handleReturn = async (id: number) => {
    try { const res = await api.adminReturn(id); toast(res.data.fineAmount > 0 ? `Returned. Fine: GH₵ ${res.data.fineAmount.toFixed(2)}` : 'Returned successfully.', 'success'); load(pagination.page); }
    catch (e: any) { toast(e.message || 'Return failed', 'error'); }
  };

  const handleRenew = async (id: number) => {
    try { const res = await api.adminRenewLoan(id, 14); toast(`Renewed — new due: ${new Date(res.data.newDueDate).toLocaleDateString()}`, 'success'); load(pagination.page); }
    catch (e: any) { toast(e.message || 'Renewal failed', 'error'); }
  };

  const inp = 'w-full px-3 py-2 bg-surface-container-lowest rounded-md border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm text-on-surface';

  return (
    <div>
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs tracking-wider font-medium text-on-surface-variant uppercase mb-1">Circulation</p>
          <h1 className="font-semibold text-2xl md:text-3xl text-on-surface">Loan Management</h1>
        </div>
        <button onClick={() => { setShowCheckout(true); setModalErr(''); }} className="bg-primary hover:bg-primary-container hover:text-on-primary-container text-on-primary font-medium text-sm px-6 py-2.5 rounded-lg shadow-sm flex items-center gap-2 transition-colors">
          <span className="material-symbols-outlined text-[20px]">add</span> New Checkout
        </button>
      </header>

      <div className="bg-surface-container-lowest rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-surface-container-highest overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-bright border-b border-surface-container-highest">
                <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase">Patron</th>
                <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase">KNUST ID</th>
                <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase">Book</th>
                <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase hidden md:table-cell">Due Date</th>
                <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase text-center">Status</th>
                <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-highest text-sm">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-on-surface-variant">Loading...</td></tr>
              ) : loans.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-on-surface-variant">No loans.</td></tr>
              ) : loans.map(loan => (
                <tr key={loan.id} className="hover:bg-surface transition-colors group">
                  <td className="py-3 px-4 font-medium text-on-surface">{loan.member_name}</td>
                  <td className="py-3 px-4 font-mono text-xs text-on-surface-variant">{loan.knust_id}</td>
                  <td className="py-3 px-4 text-on-surface">{loan.title}</td>
                  <td className="py-3 px-4 text-on-surface-variant hidden md:table-cell">{new Date(loan.due_date).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ' +
                      (loan.status === 'overdue' ? 'bg-error-container text-error' : loan.status === 'returned' ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-[#dcfce7] text-[#166534]')}>
                      <span className={'w-1.5 h-1.5 rounded-full mr-1.5 ' + (loan.status === 'overdue' ? 'bg-error' : loan.status === 'returned' ? 'bg-tertiary' : 'bg-[#166534]')} />
                      {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {loan.status !== 'returned' && (
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleRenew(loan.id)} className="px-3 py-1 text-xs font-medium bg-surface border border-outline-variant rounded-md hover:bg-surface-container-low transition-colors" title="Extend 14 days">
                          Renew
                        </button>
                        <button onClick={() => handleReturn(loan.id)} className="px-3 py-1 text-xs font-medium bg-surface border border-outline-variant rounded-md hover:bg-surface-container-low transition-colors">
                          Return
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PaginationBar pagination={pagination} onPageChange={load} />
      </div>

      {showCheckout && (
        <div role="dialog" aria-modal="true" aria-labelledby="checkout-modal-title" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.1)] border border-surface-container-highest overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-container-highest bg-surface-bright flex justify-between items-center">
              <h2 id="checkout-modal-title" className="font-semibold text-xl text-on-surface">New Checkout</h2>
              <button onClick={() => setShowCheckout(false)} aria-label="Close dialog" className="text-on-surface-variant hover:text-on-surface"><span className="material-symbols-outlined" aria-hidden="true">close</span></button>
            </div>
            <form onSubmit={handleCheckout} className="p-6 space-y-4">
              {modalErr && <div role="alert" className="bg-error-container text-on-error-container p-3 rounded-lg text-sm">{modalErr}</div>}
              <div><label className="text-xs tracking-wider font-medium text-on-surface-variant mb-1 block">Book ISBN</label><input required value={form.book_isbn} onChange={e => setForm({ ...form, book_isbn: e.target.value })} className={inp} placeholder="978-..." /></div>
              <div><label className="text-xs tracking-wider font-medium text-on-surface-variant mb-1 block">Member KNUST ID</label><input required value={form.member_knust_id} onChange={e => setForm({ ...form, member_knust_id: e.target.value })} className={inp} placeholder="STU-2024001" /></div>
              <div><label className="text-xs tracking-wider font-medium text-on-surface-variant mb-1 block">Loan Duration (days)</label><input type="number" min={1} value={form.due_days} onChange={e => setForm({ ...form, due_days: e.target.value })} className={inp} /></div>
            </form>
            <div className="px-6 py-4 border-t border-surface-container-highest bg-surface-bright flex justify-end gap-3">
              <button onClick={() => setShowCheckout(false)} className="px-4 py-2 text-on-surface-variant hover:bg-surface-container-low rounded-md font-medium transition-colors">Cancel</button>
              <button onClick={handleCheckout as any} disabled={saving} className="px-4 py-2 bg-primary text-on-primary rounded-md font-medium hover:bg-primary-container hover:text-on-primary-container transition-colors disabled:opacity-50">{saving ? 'Processing...' : 'Checkout'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
