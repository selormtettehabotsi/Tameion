import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import type { AuditEntry, Pagination } from '../../types';
import PaginationBar from '../../components/PaginationBar';

const actionLabels: Record<string, { icon: string; color: string }> = {
  'loan.checkout': { icon: 'output', color: 'text-primary' },
  'loan.return': { icon: 'input', color: 'text-tertiary' },
  'loan.renew': { icon: 'update', color: 'text-secondary' },
  'book.create': { icon: 'add_circle', color: 'text-primary' },
  'book.delete': { icon: 'delete', color: 'text-error' },
  'fine.pay': { icon: 'payments', color: 'text-tertiary' },
  'staff.create': { icon: 'person_add', color: 'text-secondary' },
};

export default function AuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  const load = (page = 1) => {
    setLoading(true);
    const params: Record<string, string> = { page: String(page), limit: '20' };
    if (q) params.q = q;
    api.adminAuditLog(params)
      .then(r => { setEntries(r.data.entries); setPagination(r.data.pagination); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const fmt = (d: string) => new Date(d).toLocaleString();

  const getActionInfo = (action: string) => actionLabels[action] || { icon: 'info', color: 'text-on-surface-variant' };

  return (
    <div>
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs tracking-wider font-medium text-on-surface-variant uppercase mb-1">System</p>
          <h1 className="font-semibold text-2xl md:text-3xl text-on-surface">Audit Log</h1>
        </div>
      </header>

      <div className="flex gap-3 mb-6 bg-surface-container-lowest p-4 rounded-lg border border-surface-container-highest shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
          <input type="text" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && load(1)} placeholder="Search by actor, action, or entity..."
            className="w-full px-3 py-2 pl-10 bg-surface-container-lowest rounded-md border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm text-on-surface" />
        </div>
        <button onClick={() => load(1)} className="px-4 py-2 bg-primary text-on-primary rounded-md text-sm font-medium hover:bg-primary-container hover:text-on-primary-container transition-colors">Search</button>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-surface-container-highest overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-bright border-b border-surface-container-highest">
                <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase">Time</th>
                <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase">Actor</th>
                <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase">Action</th>
                <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase hidden md:table-cell">Entity</th>
                <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase hidden lg:table-cell">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-highest text-sm">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-on-surface-variant">Loading...</td></tr>
              ) : entries.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-on-surface-variant">No audit entries found.</td></tr>
              ) : entries.map(e => {
                const info = getActionInfo(e.action);
                return (
                  <tr key={e.id} className="hover:bg-surface transition-colors">
                    <td className="py-3 px-4 text-on-surface-variant whitespace-nowrap text-xs">{fmt(e.created_at)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">{e.actor_type === 'staff' ? 'badge' : 'person'}</span>
                        <span className="text-on-surface font-medium">{e.actor_name || 'System'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`material-symbols-outlined text-[18px] ${info.color}`}>{info.icon}</span>
                        <span className="font-mono text-xs bg-surface-container px-2 py-0.5 rounded">{e.action}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell text-on-surface-variant">
                      {e.entity_type && <span className="text-xs">{e.entity_type} #{e.entity_id}</span>}
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell text-on-surface-variant text-xs max-w-xs truncate">
                      {e.details && Object.entries(e.details).map(([k, v]) => `${k}: ${v}`).join(', ')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <PaginationBar pagination={pagination} onPageChange={load} />
      </div>
    </div>
  );
}
