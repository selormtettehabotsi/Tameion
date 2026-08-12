import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import type { AuditEntry, Pagination } from '../../types';
import PaginationBar from '../../components/PaginationBar';
import EmptyState from '../../components/EmptyState';
import Icon, { type IconName } from '../../components/Icon';
import { Button, Card, Input } from '../../components/ui';

const actionIcons: Record<string, { icon: IconName; color: string }> = {
  'loan.checkout': { icon: 'arrow-right', color: 'text-primary' },
  'loan.return': { icon: 'arrow-left', color: 'text-success' },
  'loan.renew': { icon: 'rotate-cw', color: 'text-secondary' },
  'book.create': { icon: 'plus', color: 'text-primary' },
  'book.update': { icon: 'pencil', color: 'text-secondary' },
  'book.delete': { icon: 'trash', color: 'text-error' },
  'member.update': { icon: 'user', color: 'text-secondary' },
  'fine.pay': { icon: 'banknote', color: 'text-success' },
  'staff.create': { icon: 'user-plus', color: 'text-secondary' },
};

export default function AuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');

  const load = (page = 1) => {
    setLoading(true);
    const params: Record<string, string> = { page: String(page), limit: '20' };
    if (search) params.q = search;
    api.adminAuditLog(params)
      .then(r => { setEntries(r.data.entries); setPagination(r.data.pagination); })
      .finally(() => setLoading(false));
  };

  // Re-runs when the committed filter changes; `load` is intentionally
  // excluded so that typing in the search box does not refetch.
  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const info = (action: string) => actionIcons[action] || { icon: 'info' as IconName, color: 'text-on-surface-variant' };

  return (
    <div>
      <header className="mb-lg">
        <p className="text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">System</p>
        <h1 className="mt-3xs text-2xl font-bold text-on-surface md:text-3xl">Audit log</h1>
        <p className="mt-2xs text-sm text-on-surface-variant">Every staff action, newest first.</p>
      </header>

      <form
        onSubmit={(e) => { e.preventDefault(); setSearch(q); }}
        className="mb-lg flex flex-col gap-sm rounded-lg border border-surface-container-high bg-surface-container-lowest p-md shadow-sm sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <Input label="Search" icon="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Actor, action or entity" />
        </div>
        <Button type="submit"><Icon name="search" size={16} />Search</Button>
      </form>

      <Card flush>
        {loading ? (
          <div className="space-y-xs p-md">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-sm bg-surface-container-high" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <EmptyState kind="reservations" title="No audit entries" description="Staff actions will be recorded here as they happen." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-surface-container-high bg-surface-container-low">
                    <th scope="col" className="p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Time</th>
                    <th scope="col" className="p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Actor</th>
                    <th scope="col" className="p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Action</th>
                    <th scope="col" className="hidden p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant md:table-cell">Entity</th>
                    <th scope="col" className="hidden p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant lg:table-cell">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high text-sm">
                  {entries.map(e => {
                    const meta = info(e.action);
                    return (
                      <tr key={e.id} className="transition-colors duration-fast hover:bg-surface-bright">
                        <td className="whitespace-nowrap p-sm text-2xs text-on-surface-variant">
                          {new Date(e.created_at).toLocaleString('en-GB')}
                        </td>
                        <td className="p-sm">
                          <div className="flex items-center gap-2xs">
                            <span className="text-on-surface-variant">
                              <Icon name={e.actor_type === 'staff' ? 'id-card' : 'user'} size={15} />
                            </span>
                            <span className="text-xs font-semibold text-on-surface">{e.actor_name || 'System'}</span>
                          </div>
                        </td>
                        <td className="p-sm">
                          <div className="flex items-center gap-2xs">
                            <span className={meta.color}><Icon name={meta.icon} size={15} /></span>
                            <code className="rounded-xs bg-surface-container px-2xs py-3xs font-mono text-2xs text-on-surface">{e.action}</code>
                          </div>
                        </td>
                        <td className="hidden p-sm text-2xs text-on-surface-variant md:table-cell">
                          {e.entity_type ? `${e.entity_type} #${e.entity_id}` : '—'}
                        </td>
                        <td className="hidden max-w-xs truncate p-sm text-2xs text-on-surface-variant lg:table-cell">
                          {e.details ? Object.entries(e.details).map(([k, v]) => `${k}: ${v}`).join(', ') : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <PaginationBar pagination={pagination} onPageChange={load} />
          </>
        )}
      </Card>
    </div>
  );
}
