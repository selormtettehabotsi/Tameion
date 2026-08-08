import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import type { AdminFine, Pagination } from '../../types';
import PaginationBar from '../../components/PaginationBar';
import EmptyState from '../../components/EmptyState';
import Icon from '../../components/Icon';
import { useToast } from '../../context/ToastContext';
import { Badge, Button, Card, CardHeader } from '../../components/ui';

export default function AdminFines() {
  const [fines, setFines] = useState<AdminFine[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const { toast } = useToast();

  const load = (page = 1) => {
    setLoading(true);
    api.adminFines({ page: String(page), limit: '20' })
      .then(r => { setFines(r.data.fines); setPagination(r.data.pagination); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handlePay = async (id: number) => {
    setBusyId(id);
    try {
      await api.adminPayFine(id);
      toast('Fine settled', 'success');
      load(pagination.page);
    } catch (e) {
      toast(e instanceof Object && 'message' in e ? String(e.message) : 'Payment failed', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const unpaid = fines.filter(f => !f.settled);
  const paid = fines.filter(f => f.settled);
  const owed = unpaid.reduce((sum, f) => sum + Number(f.amount), 0);

  return (
    <div>
      <header className="mb-lg">
        <p className="text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Finance</p>
        <h1 className="mt-3xs text-2xl font-bold text-on-surface md:text-3xl">Fines</h1>
        <p className="mt-2xs text-sm text-on-surface-variant">
          {loading ? 'Loading…' : `GH₵ ${owed.toFixed(2)} outstanding on this page`}
        </p>
      </header>

      {loading ? (
        <Card flush>
          <div className="space-y-xs p-md">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-sm bg-surface-container-high" />
            ))}
          </div>
        </Card>
      ) : fines.length === 0 ? (
        <Card flush>
          <EmptyState kind="reservations" title="No fines recorded" description="Overdue returns will generate charges here." />
        </Card>
      ) : (
        <div className="space-y-lg">
          {unpaid.length > 0 && (
            <Card flush>
              <CardHeader title={`Unpaid (${unpaid.length})`} description="Settle at the circulation desk" />
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-surface-container-high bg-surface-container-low">
                      <th scope="col" className="p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Member</th>
                      <th scope="col" className="p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Book</th>
                      <th scope="col" className="hidden p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant md:table-cell">Days</th>
                      <th scope="col" className="p-sm text-right text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Amount</th>
                      <th scope="col" className="p-sm text-right text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high text-sm">
                    {unpaid.map(f => (
                      <tr key={f.id} className="transition-colors duration-fast hover:bg-surface-bright">
                        <td className="p-sm">
                          <p className="font-semibold text-on-surface">{f.member_name}</p>
                          <p className="font-mono text-2xs text-on-surface-variant">{f.knust_id}</p>
                        </td>
                        <td className="p-sm text-xs text-on-surface">{f.title}</td>
                        <td className="hidden p-sm text-xs text-on-surface-variant md:table-cell">{f.days_overdue}</td>
                        <td className="p-sm text-right text-xs font-semibold text-error">GH₵ {Number(f.amount).toFixed(2)}</td>
                        <td className="p-sm text-right">
                          <Button size="sm" disabled={busyId === f.id} onClick={() => handlePay(f.id)}>
                            <Icon name="check" size={13} />
                            Mark paid
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {paid.length > 0 && (
            <Card flush>
              <CardHeader title={`Payment history (${paid.length})`} />
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-surface-container-high bg-surface-container-low">
                      <th scope="col" className="p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Member</th>
                      <th scope="col" className="p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Book</th>
                      <th scope="col" className="p-sm text-right text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Amount</th>
                      <th scope="col" className="hidden p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant md:table-cell">Settled</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high text-sm">
                    {paid.map(f => (
                      <tr key={f.id} className="transition-colors duration-fast hover:bg-surface-bright">
                        <td className="p-sm font-semibold text-on-surface">{f.member_name}</td>
                        <td className="p-sm text-xs text-on-surface">{f.title}</td>
                        <td className="p-sm text-right text-xs text-on-surface">GH₵ {Number(f.amount).toFixed(2)}</td>
                        <td className="hidden p-sm md:table-cell">
                          <Badge tone="success">
                            {f.settlement_date ? new Date(f.settlement_date).toLocaleDateString('en-GB') : 'Paid'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          <Card flush>
            <PaginationBar pagination={pagination} onPageChange={load} />
          </Card>
        </div>
      )}
    </div>
  );
}
