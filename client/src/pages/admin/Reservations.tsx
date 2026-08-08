import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import type { AdminReservation, Pagination } from '../../types';
import PaginationBar from '../../components/PaginationBar';
import { useToast } from '../../context/ToastContext';

export default function Reservations() {
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const { toast } = useToast();

  const load = (page = 1) => {
    setLoading(true);
    const params: Record<string, string> = { page: String(page), limit: '20' };
    if (statusFilter) params.status = statusFilter;
    api.adminReservations(params)
      .then(r => { setReservations(r.data.reservations); setPagination(r.data.pagination); })
      .catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load(1); }, [statusFilter]);

  const handleFulfill = async (id: number) => {
    try { await api.adminFulfillReservation(id); toast('Reservation fulfilled.', 'success'); load(pagination.page); }
    catch (e: any) { toast(e.message || 'Action failed', 'error'); }
  };

  const handleCancel = async (id: number) => {
    try { await api.adminCancelReservation(id); toast('Reservation cancelled.', 'success'); load(pagination.page); }
    catch (e: any) { toast(e.message || 'Action failed', 'error'); }
  };

  const statusBadge = (s: string) => {
    const cls = s === 'pending' ? 'bg-[#fef9c3] text-[#854d0e]' : s === 'fulfilled' ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#fee2e2] text-[#991b1b]';
    const dot = s === 'pending' ? 'bg-[#854d0e]' : s === 'fulfilled' ? 'bg-[#166534]' : 'bg-[#991b1b]';
    return (
      <span className={'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ' + cls}>
        <span className={'w-1.5 h-1.5 rounded-full mr-1.5 ' + dot} />
        {s.charAt(0).toUpperCase() + s.slice(1)}
      </span>
    );
  };

  const sel = 'appearance-none bg-surface border border-outline-variant rounded-md pl-3 pr-8 py-2 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary hover:bg-surface-container-low transition-colors cursor-pointer';

  return (
    <div>
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs tracking-wider font-medium text-on-surface-variant uppercase mb-1">Circulation</p>
          <h1 className="font-semibold text-2xl md:text-3xl text-on-surface">Reservations</h1>
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={sel}>
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="expired">Expired</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px]">arrow_drop_down</span>
          </div>
        </div>
      </header>

      <div className="bg-surface-container-lowest rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-surface-container-highest overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-bright border-b border-surface-container-highest">
                <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase">Patron</th>
                <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase">KNUST ID</th>
                <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase">Book</th>
                <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase hidden md:table-cell">Requested</th>
                <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase hidden lg:table-cell">Expires</th>
                <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase text-center">Status</th>
                <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-highest text-sm">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-on-surface-variant">Loading...</td></tr>
              ) : reservations.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-on-surface-variant">No reservations found.</td></tr>
              ) : reservations.map(r => (
                <tr key={r.id} className="hover:bg-surface transition-colors group">
                  <td className="py-3 px-4 font-medium text-on-surface">{r.member_name}</td>
                  <td className="py-3 px-4 font-mono text-xs text-on-surface-variant">{r.knust_id}</td>
                  <td className="py-3 px-4 text-on-surface">
                    <div>{r.title}</div>
                    <div className="text-xs text-on-surface-variant">{r.copies_available} copies available</div>
                  </td>
                  <td className="py-3 px-4 text-on-surface-variant hidden md:table-cell">{new Date(r.request_date).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-on-surface-variant hidden lg:table-cell">{new Date(r.expiry_date).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-center">{statusBadge(r.status)}</td>
                  <td className="py-3 px-4 text-right">
                    {r.status === 'pending' && (
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleFulfill(r.id)} className="px-3 py-1 text-xs font-medium bg-primary text-on-primary rounded-md hover:bg-primary-container hover:text-on-primary-container transition-colors">
                          Fulfill
                        </button>
                        <button onClick={() => handleCancel(r.id)} className="px-3 py-1 text-xs font-medium bg-surface border border-outline-variant rounded-md hover:bg-error-container hover:text-on-error-container transition-colors">
                          Cancel
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
    </div>
  );
}
