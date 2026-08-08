import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import type { AdminFine, Pagination } from '../../types';
import PaginationBar from '../../components/PaginationBar';
import { useToast } from '../../context/ToastContext';

export default function AdminFines() {
  const [fines, setFines] = useState<AdminFine[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = (page = 1) => {
    setLoading(true);
    api.adminFines({ page: String(page), limit: '20' })
      .then(r => { setFines(r.data.fines); setPagination(r.data.pagination); })
      .catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handlePay = async (id: number) => {
    try { await api.adminPayFine(id); toast('Fine settled.', 'success'); load(pagination.page); }
    catch (e: any) { toast(e.message || 'Payment failed', 'error'); }
  };

  const unpaid = fines.filter(f => !f.settled);
  const paid = fines.filter(f => f.settled);

  return (
    <div>
      <header className="mb-6">
        <p className="text-xs tracking-wider font-medium text-on-surface-variant uppercase mb-1">Finance</p>
        <h1 className="font-semibold text-2xl md:text-3xl text-on-surface">Fine Management</h1>
      </header>

      {unpaid.length > 0 && (
        <>
          <h2 className="font-semibold text-lg text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-error">warning</span> Unpaid Fines ({unpaid.length})
          </h2>
          <div className="bg-surface-container-lowest rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-surface-container-highest overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-bright border-b border-surface-container-highest">
                    <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase">Member</th>
                    <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase">Book</th>
                    <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase hidden md:table-cell">Days</th>
                    <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase text-right">Amount</th>
                    <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-highest text-sm">
                  {unpaid.map(f => (
                    <tr key={f.id} className="hover:bg-surface transition-colors group">
                      <td className="py-3 px-4"><span className="font-medium text-on-surface">{f.member_name}</span><br/><span className="font-mono text-xs text-on-surface-variant">{f.knust_id}</span></td>
                      <td className="py-3 px-4 text-on-surface">{f.title}</td>
                      <td className="py-3 px-4 text-on-surface-variant hidden md:table-cell">{f.days_overdue}</td>
                      <td className="py-3 px-4 text-right font-medium text-error">GH₵ {Number(f.amount).toFixed(2)}</td>
                      <td className="py-3 px-4 text-right">
                        <button onClick={() => handlePay(f.id)} className="px-3 py-1 text-xs font-medium bg-primary text-on-primary rounded-md hover:bg-primary-container hover:text-on-primary-container transition-colors opacity-0 group-hover:opacity-100">
                          Mark Paid
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {paid.length > 0 && (
        <>
          <h2 className="font-semibold text-lg text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">check_circle</span> Payment History ({paid.length})
          </h2>
          <div className="bg-surface-container-lowest rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-surface-container-highest overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-bright border-b border-surface-container-highest">
                    <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase">Member</th>
                    <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase">Book</th>
                    <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase text-right">Amount</th>
                    <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase hidden md:table-cell">Settled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-highest text-sm">
                  {paid.map(f => (
                    <tr key={f.id} className="hover:bg-surface transition-colors">
                      <td className="py-3 px-4 font-medium text-on-surface">{f.member_name}</td>
                      <td className="py-3 px-4 text-on-surface">{f.title}</td>
                      <td className="py-3 px-4 text-right text-on-surface">GH₵ {Number(f.amount).toFixed(2)}</td>
                      <td className="py-3 px-4 text-on-surface-variant hidden md:table-cell">{f.settlement_date ? new Date(f.settlement_date).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!loading && fines.length === 0 && (
        <div className="text-center py-16 text-on-surface-variant">
          <span className="material-symbols-outlined text-5xl mb-4 block">payments</span>
          <p className="text-lg">No fines recorded.</p>
        </div>
      )}

      {loading && (
        <div className="text-center py-16 text-on-surface-variant">Loading...</div>
      )}

      <PaginationBar pagination={pagination} onPageChange={load} />
    </div>
  );
}
