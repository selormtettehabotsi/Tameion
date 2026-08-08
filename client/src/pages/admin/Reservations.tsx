import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import type { AdminReservation, Pagination } from '../../types';
import PaginationBar from '../../components/PaginationBar';
import EmptyState from '../../components/EmptyState';
import Icon from '../../components/Icon';
import { useToast } from '../../context/ToastContext';
import { Badge, Button, Card, Select, type BadgeTone } from '../../components/ui';

const FILTERS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'fulfilled', label: 'Fulfilled' },
  { value: 'expired', label: 'Expired' },
];

const tone = (s: string): BadgeTone =>
  s === 'pending' ? 'warning' : s === 'fulfilled' ? 'success' : 'danger';

export default function Reservations() {
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const { toast } = useToast();

  const load = (page = 1) => {
    setLoading(true);
    const params: Record<string, string> = { page: String(page), limit: '20' };
    if (statusFilter) params.status = statusFilter;
    api.adminReservations(params)
      .then(r => { setReservations(r.data.reservations); setPagination(r.data.pagination); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(1); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [statusFilter]);

  const act = async (id: number, fn: (id: number) => Promise<unknown>, label: string) => {
    setBusyId(id);
    try {
      await fn(id);
      toast(label, 'success');
      load(pagination.page);
    } catch (e) {
      toast(e instanceof Object && 'message' in e ? String(e.message) : 'Action failed', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <header className="mb-lg flex flex-col justify-between gap-md sm:flex-row sm:items-end">
        <div>
          <p className="text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Circulation</p>
          <h1 className="mt-3xs text-2xl font-bold text-on-surface md:text-3xl">Reservations</h1>
          <p className="mt-2xs text-sm text-on-surface-variant">
            {loading ? 'Loading…' : `${pagination.total} total`}
          </p>
        </div>
        <div className="sm:w-52">
          <Select label="Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} options={FILTERS} />
        </div>
      </header>

      <Card flush>
        {loading ? (
          <div className="space-y-xs p-md">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-sm bg-surface-container-high" />
            ))}
          </div>
        ) : reservations.length === 0 ? (
          <EmptyState kind="reservations" title="No reservations" description="Holds placed by patrons will appear here." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-surface-container-high bg-surface-container-low">
                    <th scope="col" className="p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Patron</th>
                    <th scope="col" className="p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Book</th>
                    <th scope="col" className="hidden p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant md:table-cell">Requested</th>
                    <th scope="col" className="hidden p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant lg:table-cell">Expires</th>
                    <th scope="col" className="p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Status</th>
                    <th scope="col" className="p-sm text-right text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high text-sm">
                  {reservations.map(r => (
                    <tr key={r.id} className="transition-colors duration-fast hover:bg-surface-bright">
                      <td className="p-sm">
                        <p className="font-semibold text-on-surface">{r.member_name}</p>
                        <p className="font-mono text-2xs text-on-surface-variant">{r.knust_id}</p>
                      </td>
                      <td className="p-sm">
                        <p className="text-xs text-on-surface">{r.title}</p>
                        <p className="text-2xs text-on-surface-variant">{r.copies_available} available</p>
                      </td>
                      <td className="hidden p-sm text-xs text-on-surface-variant md:table-cell">
                        {new Date(r.request_date).toLocaleDateString('en-GB')}
                      </td>
                      <td className="hidden p-sm text-xs text-on-surface-variant lg:table-cell">
                        {new Date(r.expiry_date).toLocaleDateString('en-GB')}
                      </td>
                      <td className="p-sm">
                        <Badge tone={tone(r.status)}>{r.status.charAt(0).toUpperCase() + r.status.slice(1)}</Badge>
                      </td>
                      <td className="p-sm">
                        {r.status === 'pending' && (
                          <div className="flex justify-end gap-2xs">
                            <Button size="sm" disabled={busyId === r.id}
                              onClick={() => act(r.id, api.adminFulfillReservation, 'Reservation fulfilled')}>
                              <Icon name="check" size={13} />Fulfil
                            </Button>
                            <Button variant="secondary" size="sm" disabled={busyId === r.id}
                              onClick={() => act(r.id, api.adminCancelReservation, 'Reservation cancelled')}>
                              <Icon name="x" size={13} />Cancel
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
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
